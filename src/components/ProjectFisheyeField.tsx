/**
 * Page-wide infinite fisheye card field.
 * Interaction inspired by Componentry Fisheye Infinite Grid (MIT).
 * Reference default lensStrength = 0.24; this field uses exactly 50% (0.12).
 *
 * Each unique card is mounted once and repositioned with wrapped coordinates
 * (no cloned page text, no per-pointer React renders, rAF only while moving).
 */
import {
  Children,
  useEffect,
  useMemo,
  useRef,
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

/** Visual response curves calibrated so REFERENCE_LENS_STRENGTH ≈ the demo. */
const SCALE_FACTOR = 0.55
const ROT_FACTOR = 55
const PUSH_FACTOR = 48

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const wrapInto = (value: number, min: number, max: number) => {
  const span = max - min
  if (span <= 0) return value
  let next = value
  while (next < min) next += span
  while (next >= max) next -= span
  return next
}

export type ProjectFisheyeLink = {
  href: string
  label: string
  onOpen?: (opener: HTMLAnchorElement) => void
}

type ProjectFisheyeFieldProps = {
  children: ReactNode
  links?: readonly ProjectFisheyeLink[]
  columns?: number
  'aria-label'?: string
}

export function ProjectFisheyeField({
  children,
  links = [],
  columns: columnsProp,
  'aria-label': ariaLabel = 'Portfolio cards — drag to explore',
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

  const cardCount = Math.max(1, faces.length)
  const gridCols = Math.max(
    2,
    columnsProp ?? Math.ceil(Math.sqrt(cardCount)),
  )
  const gridRows = Math.max(1, Math.ceil(cardCount / gridCols))

  useEffect(() => {
    const root = rootRef.current
    const plane = planeRef.current
    if (!root || !plane) return

    const tiles = [
      ...plane.querySelectorAll<HTMLElement>('[data-fisheye-tile]'),
    ]
    if (tiles.length === 0) return

    // Keep recycled / panned anchors out of tab order; use the accessible nav.
    plane.querySelectorAll('a').forEach((anchor) => {
      anchor.tabIndex = -1
    })

    const position = { x: 0, y: 0 }
    const velocity = { x: 0, y: 0 }
    const pointer = { x: 0, y: 0, inside: false }
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
    let cellW = 280
    let cellH = 240
    let gap = 16
    let periodX = 1
    let periodY = 1
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
      gap = viewW < 640 ? 12 : 18

      // Prefer ~3 visible columns; ensure the wrap period covers the viewport.
      const visibleCols = viewW < 640 ? 2 : viewW < 1100 ? 3 : 3.25
      cellW = Math.max(160, viewW / visibleCols - gap)
      cellH = Math.max(150, cellW * 0.88)
      periodX = gridCols * (cellW + gap)
      periodY = gridRows * (cellH + gap)

      if (periodX < viewW) {
        cellW = viewW / gridCols - gap
        periodX = gridCols * (cellW + gap)
      }
      if (periodY < viewH) {
        cellH = viewH / gridRows - gap
        periodY = gridRows * (cellH + gap)
      }

      root.style.setProperty('--fisheye-cell-w', `${cellW}px`)
      root.style.setProperty('--fisheye-cell-h', `${cellH}px`)
      root.style.setProperty('--fisheye-gap', `${gap}px`)
    }

    const paint = () => {
      const lensX = pointer.inside ? pointer.x : viewW * 0.5
      const lensY = pointer.inside ? pointer.y : viewH * 0.5
      const maxR = Math.hypot(viewW, viewH) * 0.55 || 1
      const strength = reducedMotion ? 0 : LENS_STRENGTH
      const strideX = cellW + gap
      const strideY = cellH + gap

      tiles.forEach((tile, index) => {
        if (index >= cardCount) {
          tile.style.visibility = 'hidden'
          return
        }

        const col = index % gridCols
        const row = Math.floor(index / gridCols)
        let x = position.x + col * strideX
        let y = position.y + row * strideY

        // Wrap each card into one period so the field loops without clones.
        x = wrapInto(x, -cellW, -cellW + periodX)
        y = wrapInto(y, -cellH, -cellH + periodY)

        const centerX = x + cellW * 0.5
        const centerY = y + cellH * 0.5
        const dx = centerX - lensX
        const dy = centerY - lensY
        const dist = Math.hypot(dx, dy)
        const t = clamp(dist / maxR, 0, 1)
        const falloff = (1 - t) * (1 - t)
        const bulge = strength * falloff
        const scale = 1 + bulge * SCALE_FACTOR
        const rotY = reducedMotion ? 0 : (dx / maxR) * ROT_FACTOR * strength
        const rotX = reducedMotion ? 0 : (-dy / maxR) * ROT_FACTOR * strength
        const push = bulge * PUSH_FACTOR
        const nx = dist > 0.001 ? dx / dist : 0
        const ny = dist > 0.001 ? dy / dist : 0

        tile.style.visibility = 'visible'
        tile.style.width = `${cellW}px`
        tile.style.height = `${cellH}px`
        tile.style.transform = `translate3d(${x + nx * push}px, ${y + ny * push}px, 0) perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${scale})`
        tile.style.zIndex = String(Math.round(2000 - dist))
      })
    }

    const tick = (time: number) => {
      const delta = Math.min(32, time - previous)
      previous = time

      if (!drag.active && !reducedMotion) {
        position.x += velocity.x * delta
        position.y += velocity.y * delta
        const decay = Math.pow(INERTIA, delta / 16.667)
        velocity.x *= decay
        velocity.y *= decay
        if (Math.hypot(velocity.x, velocity.y) < 0.006) {
          velocity.x = 0
          velocity.y = 0
        }
      } else if (!drag.active) {
        velocity.x = 0
        velocity.y = 0
      }

      // Keep pan bounded to one period (content wraps via wrapInto).
      position.x = ((position.x % periodX) + periodX) % periodX
      position.y = ((position.y % periodY) + periodY) % periodY

      paint()

      if (drag.active || Math.hypot(velocity.x, velocity.y) > 0.006) {
        frame = requestAnimationFrame(tick)
      } else {
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
    layoutMetrics()
    position.x = gap
    position.y = gap
    paint()

    const onPointerEnter = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      pointer.inside = true
      const rect = root.getBoundingClientRect()
      pointer.x = event.clientX - rect.left
      pointer.y = event.clientY - rect.top
      requestRender()
    }

    const onPointerLeave = () => {
      if (drag.active) return
      pointer.inside = false
      requestRender()
    }

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || !event.isPrimary) return
      const rect = root.getBoundingClientRect()
      pointer.inside = true
      pointer.x = event.clientX - rect.left
      pointer.y = event.clientY - rect.top
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
      root.dataset.dragging = 'true'
      root.setPointerCapture(event.pointerId)
      requestRender()
    }

    const onPointerMove = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect()
      pointer.x = event.clientX - rect.left
      pointer.y = event.clientY - rect.top
      pointer.inside = true

      if (!drag.active || drag.pointerId !== event.pointerId) {
        if (!reducedMotion) requestRender()
        return
      }

      if (
        Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) >
        DRAG_CLICK_THRESHOLD_PX
      ) {
        drag.moved = true
      }

      const time = performance.now()
      const deltaTime = Math.max(8, time - drag.time)
      const deltaX = event.clientX - drag.x
      const deltaY = event.clientY - drag.y
      position.x += deltaX
      position.y += deltaY
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
      position.x += delta[0]
      position.y += delta[1]
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
        position.x -= event.deltaX * mode * Math.max(0, WHEEL_SENSITIVITY)
        position.y -= event.deltaY * mode * Math.max(0, WHEEL_SENSITIVITY)
        velocity.x = 0
        velocity.y = 0
        paint()
        return
      }

      const impulse = Math.max(0, WHEEL_SENSITIVITY) * 0.003
      velocity.x = clamp(
        velocity.x - event.deltaX * mode * impulse,
        -1.25,
        1.25,
      )
      velocity.y = clamp(
        velocity.y - event.deltaY * mode * impulse,
        -1.25,
        1.25,
      )
      requestRender()
    }

    root.addEventListener('pointerenter', onPointerEnter)
    root.addEventListener('pointerleave', onPointerLeave)
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
      motionQuery.removeEventListener('change', syncMotion)
      root.removeEventListener('pointerenter', onPointerEnter)
      root.removeEventListener('pointerleave', onPointerLeave)
      root.removeEventListener('pointerdown', onPointerDown)
      root.removeEventListener('pointermove', onPointerMove)
      root.removeEventListener('pointerup', endDrag)
      root.removeEventListener('pointercancel', endDrag)
      window.removeEventListener('blur', cancelDrag)
      root.removeEventListener('keydown', onKeyDown)
      root.removeEventListener('wheel', onWheel)
    }
  }, [cardCount, gridCols, gridRows])

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
        Drag or use arrow keys to pan all portfolio cards. Fisheye strength is
        half of the Craftwork reference. Short clicks still open links.
      </span>

      <div ref={planeRef} className="project-fisheye-plane" aria-hidden="true">
        {faces.map((face, index) => (
          <div
            key={index}
            className="project-fisheye-tile"
            data-fisheye-tile=""
            data-fisheye-index={index}
          >
            {face}
          </div>
        ))}
      </div>

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
