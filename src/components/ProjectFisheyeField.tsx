/**
 * Page-wide infinite fisheye field.
 * Port of Componentry's Fisheye Infinite Grid (MIT, Harsh Jadhav —
 * https://github.com/harshjdhv/componentry) for live DOM instead of a WebGL
 * image atlas. The reference warps the whole viewport as one continuous lens
 * surface in a fragment shader; here the same lens curve is applied to every
 * tile's four corners and each tile is projected with a matrix3d homography,
 * so neighbouring tiles bend together as one surface.
 *
 * Reference default lensStrength = 0.24; this field uses exactly 50% (0.12).
 *
 * `layout` is the Figma frame as fixed rects. Its columns are grouped into
 * strips that loop vertically on their own period, and the whole block loops
 * horizontally, so the field is infinite with no holes and the first paint is
 * the Figma arrangement. Heights are always the Figma heights; only x
 * positions and widths adapt to the viewport. Live copies are mounted only as
 * far as the viewport needs them.
 */
import {
  Children,
  cloneElement,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
  isValidElement,
} from 'react'
import './project-fisheye-field.css'

/** Componentry / Craftwork default. */
const REFERENCE_LENS_STRENGTH = 0.24
/** Exactly 50% of the reference effect. */
const LENS_STRENGTH = REFERENCE_LENS_STRENGTH * 0.5

const DRAG_CLICK_THRESHOLD_PX = 8
const INERTIA = 0.94
const WHEEL_SENSITIVITY = 0.42

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const wrapInto = (value: number, min: number, max: number) => {
  const span = max - min
  if (span <= 0) return value
  return min + ((((value - min) % span) + span) % span)
}

/**
 * Screen → world mapping from the reference shader, inverted so world
 * points can be placed on screen. Lens space is centred on the viewport and
 * normalised by half its height.
 */
const lensCurve = (lx: number, ly: number, aspectTerm: number, k: number) => {
  // Radius 1 is the viewport corner. Capping it keeps the inverse stable for
  // the off-screen corners of edge tiles without changing anything visible.
  const radius = Math.min(4, (lx * lx + ly * ly) / aspectTerm)
  return k * (0.34 * radius + 0.12 * radius * radius)
}

const warpPoint = (
  wx: number,
  wy: number,
  halfW: number,
  halfH: number,
  aspectTerm: number,
  k: number,
): [number, number] => {
  if (k === 0) return [wx, wy]
  const ux = (wx - halfW) / halfH
  const uy = (wy - halfH) / halfH
  let sx = ux
  let sy = uy
  for (let i = 0; i < 6; i += 1) {
    const scale = 1 + lensCurve(sx, sy, aspectTerm, k)
    sx = ux * scale
    sy = uy * scale
  }
  return [halfW + sx * halfH, halfH + sy * halfH]
}

/** matrix3d that maps a w×h box onto the quad tl, tr, br, bl. */
const quadMatrix = (
  w: number,
  h: number,
  [x0, y0]: [number, number],
  [x1, y1]: [number, number],
  [x2, y2]: [number, number],
  [x3, y3]: [number, number],
) => {
  const dx1 = x1 - x2
  const dx2 = x3 - x2
  const dx3 = x0 - x1 + x2 - x3
  const dy1 = y1 - y2
  const dy2 = y3 - y2
  const dy3 = y0 - y1 + y2 - y3
  let g = 0
  let hh = 0
  const det = dx1 * dy2 - dx2 * dy1
  if (Math.abs(det) > 1e-9 && (Math.abs(dx3) > 1e-9 || Math.abs(dy3) > 1e-9)) {
    g = (dx3 * dy2 - dx2 * dy3) / det
    hh = (dx1 * dy3 - dx3 * dy1) / det
  }
  const a = x1 - x0 + g * x1
  const b = x3 - x0 + hh * x3
  const d = y1 - y0 + g * y1
  const e = y3 - y0 + hh * y3
  return `matrix3d(${a / w},${d / w},0,${g / w},${b / h},${e / h},0,${hh / h},0,0,1,0,${x0},${y0},0,1)`
}

export type FisheyeRect = {
  item: number
  x: number
  y: number
  w: number
  h: number
}

export type FisheyeStrip = {
  /** Strip content height in design px; it loops every height + 2 gutters. */
  height: number
  items: readonly FisheyeRect[]
}

export type FisheyeLayout = {
  /** Design width of the block without gutters. */
  width: number
  gutterX: number
  gutterY: number
  /** Narrowest / widest horizontal scale applied to x positions and widths. */
  minScale: number
  maxScale: number
  strips: readonly FisheyeStrip[]
}

type Copies = { x: number; y: readonly number[] }

type Placement = FisheyeRect & {
  strip: number
  copyX: number
  copyY: number
}

const scaleFor = (layout: FisheyeLayout, viewW: number) =>
  clamp(
    (viewW - layout.gutterX * 2) / layout.width,
    layout.minScale,
    layout.maxScale,
  )

const blockPeriodFor = (layout: FisheyeLayout, scale: number) =>
  layout.width * scale + layout.gutterX * 2

/** How many live copies each axis needs so wrapping never opens a hole. */
const copiesFor = (
  layout: FisheyeLayout,
  viewW: number,
  viewH: number,
): Copies => {
  const scale = scaleFor(layout, viewW)
  const widest = Math.max(
    ...layout.strips.flatMap((strip) => strip.items.map((r) => r.w * scale)),
  )
  return {
    x: Math.max(
      1,
      Math.ceil((viewW + widest) / blockPeriodFor(layout, scale)),
    ),
    y: layout.strips.map((strip) => {
      const tallest = Math.max(...strip.items.map((r) => r.h))
      return Math.max(
        1,
        Math.ceil((viewH + tallest) / (strip.height + layout.gutterY * 2)),
      )
    }),
  }
}

const sameCopies = (a: Copies, b: Copies) =>
  a.x === b.x &&
  a.y.length === b.y.length &&
  a.y.every((value, index) => value === b.y[index])

export type ProjectFisheyeLink = {
  href: string
  label: string
  onOpen?: (opener: HTMLAnchorElement) => void
}

type ProjectFisheyeFieldProps = {
  children: ReactNode
  layout: FisheyeLayout
  links?: readonly ProjectFisheyeLink[]
  'aria-label'?: string
}

export function ProjectFisheyeField({
  children,
  layout,
  links = [],
  'aria-label': ariaLabel = 'Portfolio — drag to explore',
}: ProjectFisheyeFieldProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const planeRef = useRef<HTMLDivElement>(null)

  const faces = useMemo(() => {
    const list: ReactElement[] = []
    Children.forEach(children, (child) => {
      if (isValidElement(child)) list.push(child)
    })
    return list
  }, [children])

  const [copies, setCopies] = useState<Copies>(() =>
    copiesFor(layout, window.innerWidth, window.innerHeight),
  )

  const placements = useMemo(() => {
    const list: Placement[] = []
    for (let copyX = 0; copyX < copies.x; copyX += 1) {
      layout.strips.forEach((strip, stripIndex) => {
        const copiesY = copies.y[stripIndex] ?? 1
        for (let copyY = 0; copyY < copiesY; copyY += 1) {
          strip.items.forEach((rect) => {
            if (rect.item < faces.length) {
              list.push({ ...rect, strip: stripIndex, copyX, copyY })
            }
          })
        }
      })
    }
    return list
  }, [layout, copies, faces.length])

  // Mount more copies before paint when the viewport outgrows the current set.
  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const sync = () => {
      const rect = root.getBoundingClientRect()
      const next = copiesFor(layout, rect.width, rect.height)
      setCopies((current) => (sameCopies(current, next) ? current : next))
    }
    sync()
    const observer = new ResizeObserver(sync)
    observer.observe(root)
    return () => observer.disconnect()
  }, [layout])

  // The pan offset survives copy-count changes so a resize never jumps.
  const positionRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const root = rootRef.current
    const plane = planeRef.current
    if (!root || !plane) return

    const tiles = [
      ...plane.querySelectorAll<HTMLElement>('[data-fisheye-tile]'),
    ]
    if (tiles.length === 0) return

    // Panned tiles stay out of tab order; the accessible nav covers them.
    // Cards add controls later (e.g. the music card's player), so keep
    // re-applying as the tiles change.
    const untab = () => {
      plane
        .querySelectorAll<HTMLElement>(
          'a, button, input, select, textarea, iframe, [tabindex]',
        )
        .forEach((control) => {
          if (control.tabIndex !== -1) control.tabIndex = -1
        })
    }
    untab()
    const tabObserver = new MutationObserver(untab)
    tabObserver.observe(plane, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['tabindex'],
    })

    const position = positionRef.current
    const velocity = { x: 0, y: 0 }
    const drag = {
      active: false,
      moved: false,
      pointerId: -1,
      startX: 0,
      startY: 0,
      x: 0,
      y: 0,
      time: 0,
    }

    let viewW = 1
    let viewH = 1
    let scale = 1
    let blockPeriod = 1
    let periodX = 1
    const stripPeriods = layout.strips.map(
      (strip) => strip.height + layout.gutterY * 2,
    )
    const periodY = stripPeriods.map(
      (period, index) => (copies.y[index] ?? 1) * period,
    )
    // Common multiple of the strip loops, so wrapping the pan offset by it
    // never shifts any strip.
    const panPeriodY = periodY.reduce((a, b) => a * b, 1)
    let reducedMotion = false
    let frame = 0
    let previous = performance.now()
    let disposed = false

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const syncMotion = () => {
      reducedMotion = motionQuery.matches
      if (reducedMotion) {
        velocity.x = 0
        velocity.y = 0
      }
    }
    syncMotion()
    motionQuery.addEventListener('change', syncMotion)

    const layoutMetrics = () => {
      const rect = root.getBoundingClientRect()
      viewW = Math.max(1, rect.width)
      viewH = Math.max(1, rect.height)
      scale = scaleFor(layout, viewW)
      blockPeriod = blockPeriodFor(layout, scale)
      periodX = copies.x * blockPeriod
      // Unitless, so card CSS can fit fixed-height content with calc().
      root.style.setProperty('--fisheye-scale', String(scale))
      root.style.setProperty('--fisheye-view-w', String(viewW))
    }

    const paint = () => {
      const k = reducedMotion ? 0 : LENS_STRENGTH
      const halfW = viewW * 0.5
      const halfH = viewH * 0.5
      const aspect = viewW / viewH
      const aspectTerm = aspect * aspect + 1
      // Pan is stored in design px horizontally so a resize keeps the view.
      const panX = position.x * scale

      tiles.forEach((tile, index) => {
        const placement = placements[index]
        if (!placement) return
        const w = placement.w * scale
        const h = placement.h
        const x = wrapInto(
          panX +
            layout.gutterX +
            placement.x * scale +
            placement.copyX * blockPeriod,
          -w,
          -w + periodX,
        )
        const y = wrapInto(
          position.y +
            layout.gutterY +
            placement.y +
            placement.copyY * stripPeriods[placement.strip]!,
          -h,
          -h + periodY[placement.strip]!,
        )

        // Off-screen tiles are clipped by the root; the lens only pushes
        // points outward, so they never warp back into view. (Hiding them
        // would not work: some cards force `visibility: visible` inside.)
        tile.style.width = `${w}px`
        tile.style.height = `${h}px`
        tile.style.visibility = 'visible'
        tile.style.transform = quadMatrix(
          w,
          h,
          warpPoint(x, y, halfW, halfH, aspectTerm, k),
          warpPoint(x + w, y, halfW, halfH, aspectTerm, k),
          warpPoint(x + w, y + h, halfW, halfH, aspectTerm, k),
          warpPoint(x, y + h, halfW, halfH, aspectTerm, k),
        )
      })
    }

    const panBy = (dx: number, dy: number) => {
      position.x += dx / scale
      position.y += dy
    }

    const tick = (time: number) => {
      const delta = Math.min(32, time - previous)
      previous = time

      if (!drag.active && !reducedMotion) {
        panBy(velocity.x * delta, velocity.y * delta)
        const decay = Math.pow(INERTIA, delta / 16.667)
        velocity.x *= decay
        velocity.y *= decay
      } else if (!drag.active) {
        velocity.x = 0
        velocity.y = 0
      }

      // Each tile wraps itself; this only keeps the offset from growing.
      position.x = wrapInto(position.x, 0, periodX / scale)
      position.y = wrapInto(position.y, 0, panPeriodY)

      paint()

      if (drag.active || Math.hypot(velocity.x, velocity.y) > 0.006) {
        frame = requestAnimationFrame(tick)
      } else {
        velocity.x = 0
        velocity.y = 0
        frame = 0
      }
    }

    const requestRender = () => {
      if (disposed || frame) return
      previous = performance.now()
      frame = requestAnimationFrame(tick)
    }

    const resize = () => {
      layoutMetrics()
      paint()
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(root)
    // Position 0 is the Figma origin: block copy 0 sits at the frame gutters.
    layoutMetrics()
    paint()

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || !event.isPrimary) return
      drag.active = true
      drag.moved = false
      drag.pointerId = event.pointerId
      drag.startX = event.clientX
      drag.startY = event.clientY
      drag.x = event.clientX
      drag.y = event.clientY
      drag.time = performance.now()
      velocity.x = 0
      velocity.y = 0
      requestRender()
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!drag.active || drag.pointerId !== event.pointerId) return

      if (
        !drag.moved &&
        Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) >
          DRAG_CLICK_THRESHOLD_PX
      ) {
        // Capture only once it is a real drag so short clicks reach links.
        drag.moved = true
        root.dataset.dragging = 'true'
        root.setPointerCapture(event.pointerId)
      }
      if (!drag.moved) return

      const time = performance.now()
      const deltaTime = Math.max(8, time - drag.time)
      const deltaX = event.clientX - drag.x
      const deltaY = event.clientY - drag.y
      panBy(deltaX, deltaY)
      velocity.x = clamp(deltaX / deltaTime, -2.4, 2.4)
      velocity.y = clamp(deltaY / deltaTime, -2.4, 2.4)
      drag.x = event.clientX
      drag.y = event.clientY
      drag.time = time
      requestRender()
    }

    const endDrag = (event: PointerEvent) => {
      if (!drag.active || drag.pointerId !== event.pointerId) return
      drag.active = false
      root.dataset.dragging = 'false'
      if (root.hasPointerCapture(event.pointerId)) {
        root.releasePointerCapture(event.pointerId)
      }
      if (drag.moved) {
        const suppress = (clickEvent: Event) => {
          clickEvent.preventDefault()
          clickEvent.stopPropagation()
          root.removeEventListener('click', suppress, true)
        }
        root.addEventListener('click', suppress, true)
        window.setTimeout(
          () => root.removeEventListener('click', suppress, true),
          0,
        )
      }
      requestRender()
    }

    const cancelDrag = () => {
      if (!drag.active) return
      drag.active = false
      root.dataset.dragging = 'false'
      if (root.hasPointerCapture(drag.pointerId)) {
        root.releasePointerCapture(drag.pointerId)
      }
      requestRender()
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target !== root) return
      const step = 56
      const map: Record<string, [number, number]> = {
        ArrowLeft: [step, 0],
        ArrowRight: [-step, 0],
        ArrowUp: [0, step],
        ArrowDown: [0, -step],
      }
      const delta = map[event.key]
      if (!delta) return
      event.preventDefault()
      panBy(delta[0], delta[1])
      velocity.x = 0
      velocity.y = 0
      paint()
    }

    const onWheel = (event: WheelEvent) => {
      if (drag.active) return
      event.preventDefault()
      const mode =
        event.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? 16
          : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? Math.max(viewH, 1)
            : 1

      if (reducedMotion) {
        panBy(
          -event.deltaX * mode * WHEEL_SENSITIVITY,
          -event.deltaY * mode * WHEEL_SENSITIVITY,
        )
        velocity.x = 0
        velocity.y = 0
        paint()
        return
      }

      const impulse = WHEEL_SENSITIVITY * 0.003
      velocity.x = clamp(velocity.x - event.deltaX * mode * impulse, -1.25, 1.25)
      velocity.y = clamp(velocity.y - event.deltaY * mode * impulse, -1.25, 1.25)
      requestRender()
    }

    root.addEventListener('pointerdown', onPointerDown)
    root.addEventListener('pointermove', onPointerMove)
    root.addEventListener('pointerup', endDrag)
    root.addEventListener('pointercancel', endDrag)
    window.addEventListener('blur', cancelDrag)
    root.addEventListener('keydown', onKeyDown)
    root.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      tabObserver.disconnect()
      motionQuery.removeEventListener('change', syncMotion)
      root.removeEventListener('pointerdown', onPointerDown)
      root.removeEventListener('pointermove', onPointerMove)
      root.removeEventListener('pointerup', endDrag)
      root.removeEventListener('pointercancel', endDrag)
      window.removeEventListener('blur', cancelDrag)
      root.removeEventListener('keydown', onKeyDown)
      root.removeEventListener('wheel', onWheel)
    }
  }, [placements, layout, copies])

  return (
    <div
      ref={rootRef}
      className="project-fisheye-field page-fisheye-field"
      role="region"
      tabIndex={0}
      aria-label={ariaLabel}
      data-dragging="false"
      data-lens={LENS_STRENGTH}
    >
      <span className="project-fisheye-hint">
        Drag, scroll or use arrow keys to pan the whole page in any direction.
        Short clicks still open links.
      </span>

      <div ref={planeRef} className="project-fisheye-plane" aria-hidden="true">
        {placements.map((placement) => {
          const face = faces[placement.item]!
          const props = face.props as { id?: string }
          const copy = `${placement.copyX}-${placement.copyY}`
          return (
            <div
              key={`${placement.item}-${copy}`}
              className="project-fisheye-tile"
              data-fisheye-tile=""
              data-fisheye-item={placement.item}
              data-fisheye-copy={copy}
            >
              {/* Entrance layer: the page's load swoop animates this, so it
                  never touches the tile's lens transform. */}
              <div className="project-fisheye-entrance" data-entrance="">
                {/* Copies drop the id so anchors like #about stay unique. */}
                {copy !== '0-0' && props.id
                  ? cloneElement(face, { id: undefined } as Partial<unknown>)
                  : face}
              </div>
            </div>
          )
        })}
      </div>

      <div className="project-fisheye-vignette" aria-hidden="true" />

      {links.length > 0 ? (
        <nav className="project-fisheye-links" aria-label="Projects">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(event) => {
                if (!link.onOpen) return
                if (
                  event.metaKey ||
                  event.ctrlKey ||
                  event.shiftKey ||
                  event.altKey ||
                  event.button !== 0
                ) {
                  return
                }
                event.preventDefault()
                link.onOpen(event.currentTarget)
              }}
            >
              {link.label}
            </a>
          ))}
        </nav>
      ) : null}
    </div>
  )
}
