import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, MouseEvent, ReactNode, RefObject } from 'react'
import { createPortal } from 'react-dom'
import { AboutMeCard } from '../components/AboutMeCard.tsx'
import { DesignStrategyCard } from '../components/DesignStrategyCard.tsx'
import { ShippedBadge } from '../components/ShippedBadge.tsx'
import { MusicCard } from '../components/MusicCard.tsx'
import { TestimonialCard } from '../components/TestimonialCard.tsx'
import { WorkExperienceCard } from '../components/WorkExperienceCard.tsx'
import { PortfolioNav } from '../components/PortfolioNav.tsx'
import { ProgressiveBlur } from '../components/ProgressiveBlur.tsx'
import { ProjectDrawer } from '../components/ProjectDrawer.tsx'
import {
  projectFromHash,
  useProjectDrawer,
  type ProjectId,
} from '../components/useProjectDrawer.ts'
import { ThemeToggleVisual } from '../components/ThemeToggle.tsx'
import { useTheme } from '../theme.tsx'
import {
  ProjectFisheyeField,
  type FisheyeLayout,
} from '../components/ProjectFisheyeField.tsx'
import { aboutMeCard, heroContent, landingCards } from './landingContent.ts'
import type { LandingCardContent, LandingTool } from './landingContent.ts'
import './landing.css'

const cursorLabel = 'View project'

function ProjectCardIcon({ onMedia = false }: { onMedia?: boolean }) {
  return (
    <span
      className={onMedia ? 'project-card-icon is-on-media' : 'project-card-icon'}
      aria-hidden="true"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path
          d="M8.3475 4.66667L11.6958 10.465M5.6525 4.66667H12.3492M4.305 7L7.65333 1.20167M5.6525 9.33333L2.30417 3.535M8.3475 9.33333H1.65083M9.695 7L6.34667 12.7983M12.8333 7C12.8333 10.2217 10.2217 12.8333 7 12.8333C3.77834 12.8333 1.16667 10.2217 1.16667 7C1.16667 3.77834 3.77834 1.16667 7 1.16667C10.2217 1.16667 12.8333 3.77834 12.8333 7Z"
          stroke="currentColor"
          strokeWidth="0.583333"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}

function ProjectCardMedia({ card }: { card: LandingCardContent }) {
  if (card.imageFrame && card.imageSrc) {
    return (
      <span className="project-card-media is-fill">
        <img
          src={card.imageSrc}
          alt={card.imageAlt ?? ''}
          loading="lazy"
          decoding="async"
          style={{
            left: card.imageFrame.left,
            top: card.imageFrame.top,
            width: card.imageFrame.width,
            height: card.imageFrame.height,
            borderRadius: card.imageRadius,
          }}
        />
      </span>
    )
  }

  if (!card.mediaSlot || !card.mediaHeight) {
    return null
  }

  return (
    <span
      className="project-card-media"
      data-media-slot={card.mediaSlot}
      style={{ height: card.mediaHeight }}
    >
      {card.imageSrc ? (
        <img src={card.imageSrc} alt={card.imageAlt ?? ''} />
      ) : null}
    </span>
  )
}

/*
  Tools logos fly in from above the viewport (Butter-style void entry), then
  settle into the grid. Flight clones live in a page-level layer so travel is
  visible above the Tools card; in-grid faces stay opacity 0 until landing.
  Timing matches the homepage card entrance (soft decelerate + short stagger).
*/
const toolEnterDurationMs = 1250
const toolEnterStaggerMs = 55
const toolEnterBaseDelayMs = 40
const toolEnterEasing = 'cubic-bezier(0.16, 1, 0.3, 1)'

function settleToolMotions(root: HTMLElement) {
  root
    .querySelectorAll<HTMLElement>('[data-tool-motion]')
    .forEach((el) => el.classList.add('is-settled'))
}

function ToolGrid({ tools }: { tools: readonly LandingTool[] }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const root = rootRef.current
    if (!root || entered) return

    if (window.matchMedia(reducedMotionQuery).matches) {
      setEntered(true)
      settleToolMotions(root)
      return
    }

    const page = root.closest<HTMLElement>('.landing-page')
    const target =
      root.closest<HTMLElement>('.project-card-tools-shipped') ?? root
    let done = false
    let observer: IntersectionObserver | null = null
    let mo: MutationObserver | null = null

    const play = () => {
      if (done) return
      done = true
      setEntered(true)
      observer?.disconnect()
      mo?.disconnect()
    }

    const watch = () => {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) play()
        },
        { threshold: 0.2, rootMargin: '0px 0px -8% 0px' },
      )
      observer.observe(target)
    }

    // Page-load swoop moves cards through the viewport — wait until it settles.
    if (page?.classList.contains('is-entrance-pending')) {
      mo = new MutationObserver(() => {
        if (!page.classList.contains('is-entrance-done')) return
        mo?.disconnect()
        watch()
      })
      mo.observe(page, { attributes: true, attributeFilter: ['class'] })
    } else {
      watch()
    }

    return () => {
      observer?.disconnect()
      mo?.disconnect()
    }
  }, [entered])

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root || !entered) return

    const motions = Array.from(
      root.querySelectorAll<HTMLElement>('[data-tool-motion]'),
    )
    const faces = Array.from(
      root.querySelectorAll<HTMLElement>('.tool-tile-face'),
    )
    if (motions.length === 0 || faces.length === 0) {
      settleToolMotions(root)
      return
    }

    if (window.matchMedia(reducedMotionQuery).matches) {
      settleToolMotions(root)
      return
    }

    let cancelled = false
    let layer: HTMLDivElement | null = null
    const animations: Animation[] = []
    const failSafe = window.setTimeout(() => {
      if (cancelled) return
      settleToolMotions(root)
      layer?.remove()
      layer = null
    }, toolEnterDurationMs + toolEnterBaseDelayMs + faces.length * toolEnterStaggerMs + 400)

    try {
      layer = document.createElement('div')
      layer.className = 'tool-flight-layer'
      layer.setAttribute('aria-hidden', 'true')
      document.body.appendChild(layer)

      for (let index = 0; index < faces.length; index += 1) {
        const face = faces[index]
        const rect = face.getBoundingClientRect()
        if (rect.width < 1 || rect.height < 1) continue

        const clone = face.cloneNode(true) as HTMLElement
        clone.classList.add('tool-flight-item')
        clone.style.left = `${rect.left}px`
        clone.style.top = `${rect.top}px`
        clone.style.width = `${rect.width}px`
        clone.style.height = `${rect.height}px`
        // Start fully above the viewport — long travel through open page space.
        const startY = -rect.top - rect.height - 32
        layer.appendChild(clone)

        animations.push(
          clone.animate(
            [
              { transform: `translate3d(0, ${startY}px, 0)` },
              { transform: 'translate3d(0, 0, 0)' },
            ],
            {
              duration: toolEnterDurationMs,
              delay: toolEnterBaseDelayMs + index * toolEnterStaggerMs,
              easing: toolEnterEasing,
              fill: 'both',
            },
          ),
        )
      }

      if (animations.length === 0) {
        settleToolMotions(root)
        layer.remove()
        layer = null
        window.clearTimeout(failSafe)
        return
      }
    } catch {
      settleToolMotions(root)
      layer?.remove()
      layer = null
      window.clearTimeout(failSafe)
      return
    }

    void Promise.all(
      animations.map((anim) => anim.finished.catch(() => undefined)),
    ).then(() => {
      window.clearTimeout(failSafe)
      if (cancelled) return
      settleToolMotions(root)
      layer?.remove()
      layer = null
    })

    return () => {
      cancelled = true
      window.clearTimeout(failSafe)
      for (const anim of animations) anim.cancel()
      layer?.remove()
      layer = null
    }
  }, [entered])

  return (
    <div
      ref={rootRef}
      className={entered ? 'tool-enter is-in' : 'tool-enter'}
    >
      <ul className="tool-grid">
        {tools.map((tool, index) => (
          <li key={`${tool.name}-${index}`} className="tool-tile">
            <span className="tool-tile-motion" data-tool-motion="">
              <span className="tool-tile-face">
                {tool.logoSrc ? (
                  <img
                    className={
                      tool.preserveColor ? 'tool-logo is-color' : 'tool-logo'
                    }
                    src={tool.logoSrc}
                    alt={tool.name}
                    width={24}
                    height={24}
                  />
                ) : (
                  <span className="tool-name">{tool.name}</span>
                )}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ProjectCardHeader({ card }: { card: LandingCardContent }) {
  if (card.imageFrame) {
    const light = card.showcaseTone === 'light'
    return (
      <span className="project-card-header is-overlay">
        <span className="project-card-copy">
          <span
            className={
              light
                ? 'project-card-label is-display is-on-light'
                : 'project-card-label is-display'
            }
          >
            <ProjectCardIcon onMedia />
            <span className="project-card-title">{card.label}</span>
          </span>
          {card.summary ? <p className="project-card-summary">{card.summary}</p> : null}
        </span>
        {card.status ? <ShippedBadge onMedia>{card.status}</ShippedBadge> : null}
      </span>
    )
  }

  return (
    <span className="project-card-header">
      <span className="project-card-label">
        <ProjectCardIcon />
        {card.label}
      </span>
      {card.status ? <ShippedBadge>{card.status}</ShippedBadge> : null}
    </span>
  )
}

function projectIdFromHref(href: string): ProjectId | null {
  return projectFromHash(`#${href.replace(/^\//, '')}`)
}

function ProjectCard({
  card,
  activeProject,
  onOpenProject,
}: {
  card: LandingCardContent
  activeProject?: ProjectId | null
  onOpenProject?: (id: ProjectId, opener: HTMLAnchorElement) => void
}) {
  const projectId = card.href ? projectIdFromHref(card.href) : null
  const showcase = Boolean(card.imageFrame)
  const showcaseTone = card.showcaseTone ?? (showcase ? 'dark' : undefined)
  const className = [
    'project-card',
    `project-card-${card.id}`,
    card.href ? 'project-card-link' : '',
    card.statement ? 'project-card-statement-layout' : '',
    showcase ? 'is-showcase' : '',
    showcaseTone ? `is-showcase-${showcaseTone}` : '',
  ]
    .filter(Boolean)
    .join(' ')

  const style = !showcase && card.height ? { height: card.height } : undefined
  const surfaceClass = showcase
    ? showcaseTone === 'light'
      ? 'project-card-surface is-media is-light'
      : 'project-card-surface is-media is-dark'
    : card.surfacePadding === 14
      ? 'project-card-surface is-spacious'
      : 'project-card-surface'

  const openProject = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!projectId || !onOpenProject) return
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
    onOpenProject(projectId, event.currentTarget)
  }

  const body = (
    <span className={surfaceClass}>
      <ProjectCardHeader card={card} />
      {card.statement ? (
        <p className="project-card-statement">{card.statement}</p>
      ) : card.tools ? (
        <ToolGrid tools={card.tools} />
      ) : (
        <ProjectCardMedia card={card} />
      )}
      {card.href ? <span className="visually-hidden">{cursorLabel}</span> : null}
    </span>
  )

  return (
    <HoverCard
      className={className}
      href={card.href}
      style={style}
      ariaExpanded={projectId ? activeProject === projectId : undefined}
      ariaControls={projectId ? 'project-drawer' : undefined}
      onClick={projectId ? openProject : undefined}
    >
      {body}
    </HoverCard>
  )
}

function HeroIntroduction() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  const themeLabel = isDark ? 'Dark Mode' : heroContent.themeLabel

  return (
    <header className="hero-introduction" data-repel="">
      <div className="hero-heading-block">
        <h1 className="hero-headline">{heroContent.headline}</h1>
        <div className="hero-role-row">
          <p className="hero-role">
            <span className="hero-role-design">{heroContent.roleDesign}</span>{' '}
            <span className="hero-role-engineer">{heroContent.roleEngineer}</span>
          </p>
          <HoverCard className="theme-status" tag="div">
            <button
              type="button"
              className="theme-status-surface"
              aria-pressed={isDark}
              aria-label={themeLabel}
              onClick={toggleTheme}
            >
              <span className="theme-status-label">{themeLabel}</span>
              <ThemeToggleVisual />
            </button>
          </HoverCard>
        </div>
      </div>
      <p className="hero-summary">{heroContent.summary}</p>
    </header>
  )
}

/**
 * Hero and theme switch for assistive tech and keyboard users; the visible
 * copies live inside the aria-hidden fisheye field.
 */
function AccessibleHero() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <header>
      <h1 className="visually-hidden">{heroContent.headline}</h1>
      <p className="visually-hidden">
        {heroContent.roleDesign} {heroContent.roleEngineer}.{' '}
        {heroContent.summary}
      </p>
      <button
        type="button"
        className="skip-link"
        aria-pressed={isDark}
        onClick={toggleTheme}
      >
        {isDark ? 'Dark Mode' : heroContent.themeLabel}
      </button>
    </header>
  )
}

/**
 * Figma "Portfolio 2026", node 2-14 (Desktop 1440 × 1313): card rects in
 * design px, relative to the content frame at gutters 35 / 34. Item numbers
 * follow the field's child order (0 is the hero). The left group and the
 * case-study column loop vertically on their own heights.
 */
const fisheyeLayout: FisheyeLayout = {
  width: 1370,
  gutterX: 35,
  gutterY: 34,
  minScale: 0.85,
  maxScale: 1.2,
  strips: [
    {
      height: 1245,
      items: [
        { item: 0, x: 0, y: 0, w: 584, h: 173 },
        { item: 1, x: 0, y: 197, w: 584, h: 297 },
        { item: 2, x: 0, y: 518, w: 281, h: 297 },
        { item: 3, x: 303, y: 518, w: 281, h: 297 },
        { item: 4, x: 608, y: 0, w: 315, h: 351 },
        { item: 5, x: 608, y: 375, w: 315, h: 209 },
        { item: 6, x: 608, y: 608, w: 315, h: 207 },
        { item: 7, x: 0, y: 839, w: 449.5, h: 191 },
        { item: 8, x: 473.5, y: 839, w: 449.5, h: 191 },
        { item: 9, x: 0, y: 1054, w: 923, h: 191 },
      ],
    },
    {
      height: 1128,
      items: [
        { item: 10, x: 947, y: 0, w: 423, h: 360 },
        { item: 11, x: 947, y: 384, w: 423, h: 360 },
        { item: 12, x: 947, y: 768, w: 423, h: 360 },
      ],
    },
  ],
}

const badgeSize = 96
const finePointerQuery = '(hover: hover) and (pointer: fine)'
const reducedMotionQuery = '(prefers-reduced-motion: reduce)'
const followStiffness = 800
const followDamping = 35
const fadeStiffness = 500
const fadeDamping = 30

function stepSpring(
  value: number,
  velocity: number,
  target: number,
  stiffness: number,
  damping: number,
  dt: number,
) {
  const acceleration = stiffness * (target - value) - damping * velocity
  return [value + (velocity + acceleration * dt) * dt, velocity + acceleration * dt] as const
}

function ProjectPointerBadge() {
  const badgeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const badge = badgeRef.current
    if (!badge) return

    const finePointer = window.matchMedia(finePointerQuery)
    const reducedMotion = window.matchMedia(reducedMotionQuery)
    if (!finePointer.matches) return

    const half = badgeSize / 2
    const edge = 10
    let x = -100
    let y = -100
    let velocityX = 0
    let velocityY = 0
    let opacity = 0
    let velocityOpacity = 0
    let scale = 0.8
    let velocityScale = 0
    let targetX = -100
    let targetY = -100
    let shown = false
    let frame = 0
    let last = performance.now()

    const clampToViewport = (clientX: number, clientY: number) => ({
      x: Math.min(window.innerWidth - half - edge, Math.max(half + edge, clientX)),
      y: Math.min(window.innerHeight - half - edge, Math.max(half + edge, clientY)),
    })

    const cardFrom = (target: EventTarget | null) =>
      target instanceof Element
        ? target.closest<HTMLElement>('.project-card-link')
        : null

    const paint = (now: number) => {
      const dt = Math.min(0.032, (now - last) / 1000)
      last = now
      const targetOpacity = shown ? 1 : 0
      const targetScale = shown ? 1 : 0.8

      if (reducedMotion.matches) {
        x = targetX
        y = targetY
        opacity = targetOpacity
        scale = targetScale
        velocityX = 0
        velocityY = 0
        velocityOpacity = 0
        velocityScale = 0
      } else {
        ;[x, velocityX] = stepSpring(x, velocityX, targetX, followStiffness, followDamping, dt)
        ;[y, velocityY] = stepSpring(y, velocityY, targetY, followStiffness, followDamping, dt)
        ;[opacity, velocityOpacity] = stepSpring(
          opacity,
          velocityOpacity,
          targetOpacity,
          fadeStiffness,
          fadeDamping,
          dt,
        )
        ;[scale, velocityScale] = stepSpring(
          scale,
          velocityScale,
          targetScale,
          fadeStiffness,
          fadeDamping,
          dt,
        )
      }

      badge.style.opacity = String(Math.max(0, Math.min(1, opacity)))
      badge.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${scale})`

      const settled =
        Math.hypot(x - targetX, y - targetY) < 0.4 &&
        Math.abs(opacity - targetOpacity) < 0.01 &&
        Math.abs(scale - targetScale) < 0.01 &&
        Math.hypot(velocityX, velocityY) < 0.4
      frame = settled ? 0 : requestAnimationFrame(paint)
    }

    const ensureFrame = () => {
      if (!frame) {
        last = performance.now()
        frame = requestAnimationFrame(paint)
      }
    }

    const place = (clientX: number, clientY: number) => {
      const next = clampToViewport(clientX, clientY)
      targetX = next.x
      targetY = next.y
      ensureFrame()
    }

    const revealAt = (clientX: number, clientY: number) => {
      const wasHidden = !shown
      shown = true
      place(clientX, clientY)
      if (wasHidden && Math.hypot(targetX - x, targetY - y) > 48) {
        x = targetX
        y = targetY
        velocityX = 0
        velocityY = 0
        badge.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${scale})`
      }
    }

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || !finePointer.matches) return
      const card = cardFrom(event.target)
      if (card && !shown) {
        revealAt(event.clientX, event.clientY)
        return
      }
      shown = Boolean(card)
      place(event.clientX, event.clientY)
    }

    const onPointerOut = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      const card = cardFrom(event.target)
      if (!card || cardFrom(event.relatedTarget)) return
      if (card.matches(':focus-visible')) return
      shown = false
      ensureFrame()
    }

    const onFocusIn = (event: FocusEvent) => {
      const card = cardFrom(event.target)
      const target = event.target
      if (!card || !(target instanceof Element) || !card.matches(':focus-visible')) return
      const rect = card.getBoundingClientRect()
      revealAt(rect.left + rect.width / 2, rect.top + rect.height / 2)
    }

    const onFocusOut = (event: FocusEvent) => {
      if (cardFrom(event.relatedTarget)) return
      shown = Boolean(document.querySelector('.project-card-link:hover'))
      ensureFrame()
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerout', onPointerOut)
    window.addEventListener('focusin', onFocusIn)
    window.addEventListener('focusout', onFocusOut)

    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerout', onPointerOut)
      window.removeEventListener('focusin', onFocusIn)
      window.removeEventListener('focusout', onFocusOut)
    }
  }, [])

  return createPortal(
    <div ref={badgeRef} className="view-project-badge" aria-hidden="true">
      <span className="view-project-badge-label">
        <span>View</span>
        <span>project</span>
      </span>
    </div>,
    document.body,
  )
}

/*
  dousanmiao.com entrance (from their bundle):
  ox/oy = (cardCenter - viewportCenter) * 0.6
  soft decelerate; delay = 0.25s + index * 0.04s
  Animates the fisheye field's [data-entrance] layers only: the tile above
  keeps the lens transform and the card below keeps hover/repel, so the three
  transforms never overwrite each other.
*/
const entranceOffsetFactor = 0.6
const entranceBaseDelayMs = 250
const entranceStaggerMs = 40
const entranceDurationMs = 1150
const entranceEasing = 'cubic-bezier(0.16, 1, 0.3, 1)'

function entranceOffset(
  rect: DOMRect,
  cx: number,
  cy: number,
  factor: number,
  maxTravel: number,
  minTravel: number,
) {
  const dx = rect.left + rect.width / 2 - cx
  const dy = rect.top + rect.height / 2 - cy
  let ox = dx * factor
  let oy = dy * factor
  const mag = Math.hypot(ox, oy)
  if (mag > maxTravel && mag > 0) {
    const scale = maxTravel / mag
    ox *= scale
    oy *= scale
  } else if (mag < minTravel) {
    const dir = Math.hypot(dx, dy) || 1
    ox = (dx / dir) * minTravel
    oy = (dy / dir) * minTravel
  }
  return [ox, oy] as const
}

/** Cards render hidden behind this class until the swoop starts. */
const entrancePendingOnLoad = () =>
  !window.matchMedia(reducedMotionQuery).matches

function useCardEntrance(rootRef: RefObject<HTMLElement | null>) {
  // A passive effect runs after the fisheye field has painted its tiles, so
  // every card is measured at its real (lens-warped) Figma position.
  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const stage = root.closest<HTMLElement>('.landing-stage')
    const reducedMotion = window.matchMedia(reducedMotionQuery)
    const viewW = window.innerWidth
    const viewH = window.innerHeight
    // Only cards on screen at load swoop; off-screen copies just appear.
    const tiles = Array.from(
      root.querySelectorAll<HTMLElement>('[data-entrance]'),
    ).filter((el) => {
      const rect = el.getBoundingClientRect()
      return (
        rect.right > 0 && rect.bottom > 0 && rect.left < viewW && rect.top < viewH
      )
    })

    const markDone = () => {
      root.classList.remove('is-entrance-pending')
      root.classList.add('is-entrance-done')
      stage?.classList.remove('is-entrance-pending')
    }

    // Windows "Animation effects" off → prefers-reduced-motion: reduce → skip swoop.
    if (reducedMotion.matches || tiles.length === 0) {
      markDone()
      return
    }

    const cx = viewW / 2
    const cy = viewH / 2
    const narrow = window.innerWidth < 768
    const factor = narrow ? 0.55 : entranceOffsetFactor
    const maxTravel = narrow
      ? Math.min(window.innerWidth, window.innerHeight) * 0.55
      : Math.max(window.innerWidth, window.innerHeight) * 0.7
    const minTravel = narrow ? 96 : 160

    root.classList.remove('is-entrance-done')
    root.classList.add('is-entrance-pending')
    stage?.classList.add('is-entrance-pending')

    const animations: Animation[] = tiles.map((el, index) => {
      const rect = el.getBoundingClientRect()
      const [ox, oy] = entranceOffset(rect, cx, cy, factor, maxTravel, minTravel)
      el.getAnimations().forEach((anim) => anim.cancel())
      return el.animate(
        [
          { transform: `translate3d(${ox}px, ${oy}px, 0)`, opacity: 0 },
          { transform: 'translate3d(0px, 0px, 0)', opacity: 1 },
        ],
        {
          duration: entranceDurationMs,
          delay: entranceBaseDelayMs + index * entranceStaggerMs,
          easing: entranceEasing,
          fill: 'both',
        },
      )
    })

    let cancelled = false
    const finish = () => {
      if (cancelled) return
      cancelled = true
      window.clearTimeout(failsafe)
      // Final keyframe is identity, so cancelling lands exactly in place.
      for (const anim of animations) anim.cancel()
      markDone()
    }
    // Never leave cards hidden if an animation stalls (e.g. a hidden tab).
    const failsafe = window.setTimeout(
      finish,
      entranceBaseDelayMs +
        tiles.length * entranceStaggerMs +
        entranceDurationMs +
        800,
    )
    void Promise.all(
      animations.map((anim) => anim.finished.catch(() => undefined)),
    ).then(finish)

    return () => {
      // Strict Mode remount: cancel and let the next run replay from hidden
      // (the pending class keeps the final layout from flashing early).
      cancelled = true
      window.clearTimeout(failsafe)
      for (const anim of animations) anim.cancel()
    }
  }, [rootRef])
}

function useTileHover(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current
    if (!root) {
      return
    }

    const finePointer = window.matchMedia(finePointerQuery)
    const reducedMotion = window.matchMedia(reducedMotionQuery)
    let pointerTile: HTMLElement | null = null
    let focusTile: HTMLElement | null = null
    let activeTile: HTMLElement | null = null

    const tileOf = (node: EventTarget | null) =>
      node instanceof Element
        ? node.closest<HTMLElement>('[data-hover-tile]')
        : null

    const centerOf = (tile: HTMLElement) => {
      const rect = tile.getBoundingClientRect()
      return [rect.left + rect.width / 2, rect.top + rect.height / 2]
    }

    const clearRepel = () => {
      root.querySelectorAll<HTMLElement>('[data-repel]').forEach((tile) => {
        tile.style.removeProperty('--repel-x')
        tile.style.removeProperty('--repel-y')
      })
    }

    const sync = () => {
      const next = focusTile ?? pointerTile
      if (next === activeTile) {
        return
      }
      activeTile?.classList.remove('is-tile-active')
      activeTile = next

      // Prefer CSS transitions driven by custom props — never React state per move.
      // Skip decorative repel/scale work when the OS asks for reduced motion.
      if (reducedMotion.matches) {
        clearRepel()
        next?.classList.add('is-tile-active')
        return
      }

      const tiles = root.querySelectorAll<HTMLElement>('[data-repel]')
      const origin = next ? centerOf(next) : null

      tiles.forEach((tile) => {
        if (!origin || !next || tile.contains(next)) {
          tile.style.removeProperty('--repel-x')
          tile.style.removeProperty('--repel-y')
          return
        }
        const [x, y] = centerOf(tile)
        const dx = x - origin[0]
        const dy = y - origin[1]
        const distance = Math.hypot(dx, dy)
        if (!distance) {
          return
        }
        const push = Math.min(5000 / distance, 30)
        tile.style.setProperty('--repel-x', `${(dx / distance) * push}px`)
        tile.style.setProperty('--repel-y', `${(dy / distance) * push}px`)
      })

      next?.classList.add('is-tile-active')
    }

    const onPointerOver = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || !finePointer.matches) {
        return
      }
      pointerTile = tileOf(event.target)
      sync()
    }

    const onPointerOut = (event: PointerEvent) => {
      if (event.pointerType === 'touch') {
        return
      }
      const next = tileOf(event.relatedTarget)
      if (next !== pointerTile) {
        pointerTile = next
        sync()
      }
    }

    const onFocusIn = (event: FocusEvent) => {
      const target = event.target
      if (target instanceof Element && target.matches(':focus-visible')) {
        focusTile = tileOf(target)
        sync()
      }
    }

    const onFocusOut = () => {
      focusTile = null
      sync()
    }

    const onMotionChange = () => {
      clearRepel()
      activeTile?.classList.remove('is-tile-active')
      activeTile = null
      sync()
    }

    root.addEventListener('pointerover', onPointerOver)
    root.addEventListener('pointerout', onPointerOut)
    root.addEventListener('focusin', onFocusIn)
    root.addEventListener('focusout', onFocusOut)
    reducedMotion.addEventListener('change', onMotionChange)

    return () => {
      root.removeEventListener('pointerover', onPointerOver)
      root.removeEventListener('pointerout', onPointerOut)
      root.removeEventListener('focusin', onFocusIn)
      root.removeEventListener('focusout', onFocusOut)
      reducedMotion.removeEventListener('change', onMotionChange)
      activeTile?.classList.remove('is-tile-active')
      clearRepel()
    }
  }, [rootRef])
}

function HoverCard({
  className,
  href,
  style,
  tag = 'article',
  ariaExpanded,
  ariaControls,
  onClick,
  children,
}: {
  className: string
  href?: string
  style?: CSSProperties
  tag?: 'article' | 'div'
  ariaExpanded?: boolean
  ariaControls?: string
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void
  children: ReactNode
}) {
  const surfaceProps = {
    className,
    style,
    'data-hover-tile': '',
    'data-repel': tag === 'div' ? undefined : '',
    children,
  }

  if (href) {
    return (
      <a
        href={href}
        aria-haspopup={onClick ? 'dialog' : undefined}
        aria-expanded={ariaExpanded}
        aria-controls={ariaControls}
        onClick={onClick}
        {...surfaceProps}
      />
    )
  }

  if (tag === 'div') {
    return <div {...surfaceProps} />
  }

  return <article {...surfaceProps} />
}

export function LandingPage() {
  const pageRef = useRef<HTMLDivElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const { projectId, open, close } = useProjectDrawer()
  const [drawerPresent, setDrawerPresent] = useState(
    () => projectFromHash(window.location.hash) !== null,
  )
  useTileHover(pageRef)
  const [entrancePending] = useState(entrancePendingOnLoad)
  useCardEntrance(pageRef)

  useEffect(() => {
    if (drawerPresent) return
    const opener = openerRef.current
    openerRef.current = null
    if (opener?.isConnected) {
      opener.focus({ preventScroll: true })
    }
  }, [drawerPresent])

  const openProject = (id: ProjectId, opener: HTMLAnchorElement) => {
    openerRef.current = opener
    open(id)
  }

  return (
    <>
      <div className="landing-stage">
        <div
          className={[
            'landing-stage-canvas',
            projectId ? 'is-covered' : drawerPresent ? 'is-revealing' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          inert={drawerPresent}
        >
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div
        ref={pageRef}
        className={
          entrancePending
            ? 'landing-page is-fisheye-page is-entrance-pending'
            : 'landing-page is-fisheye-page'
        }
      >
        <AccessibleHero />
        <main
          id={drawerPresent ? undefined : 'main'}
          className="landing-fisheye-main"
        >
          <ProjectFisheyeField
            aria-label="Portfolio — drag to explore"
            layout={fisheyeLayout}
            links={[
              {
                href: landingCards.titleColumnTop.href!,
                label: landingCards.titleColumnTop.label,
                onOpen: (opener) => openProject('case-study-1', opener),
              },
              {
                href: landingCards.titleColumnMiddle.href!,
                label: landingCards.titleColumnMiddle.label,
                onOpen: (opener) => openProject('case-study-2', opener),
              },
              {
                href: landingCards.titleColumnBottom.href!,
                label: landingCards.titleColumnBottom.label,
                onOpen: (opener) => openProject('case-study-3', opener),
              },
            ]}
          >
            <div className="fisheye-hero-tile">
              <HeroIntroduction />
            </div>
            <DesignStrategyCard />
            <ProjectCard card={landingCards.buildingInCode} />
            <ProjectCard card={landingCards.designingAiProduct} />
            <div id="about">
              <AboutMeCard content={aboutMeCard} />
            </div>
            <ProjectCard card={landingCards.toolsShipped} />
            <ProjectCard card={landingCards.storytellingPlay} />
            <WorkExperienceCard />
            <MusicCard />
            <TestimonialCard />
            <ProjectCard
              card={landingCards.titleColumnTop}
              activeProject={projectId}
              onOpenProject={openProject}
            />
            <ProjectCard
              card={landingCards.titleColumnMiddle}
              activeProject={projectId}
              onOpenProject={openProject}
            />
            <ProjectCard
              card={landingCards.titleColumnBottom}
              activeProject={projectId}
              onOpenProject={openProject}
            />
          </ProjectFisheyeField>
        </main>
      </div>
        </div>
      </div>
      <ProjectPointerBadge />
      {!drawerPresent ? <ProgressiveBlur mode="fixed" /> : null}
      <PortfolioNav
        activeProject={projectId}
        onOpenProject={open}
        onCloseProject={close}
      />
      <ProjectDrawer
        projectId={projectId}
        onClose={close}
        onSelect={open}
        onPresenceChange={setDrawerPresent}
      />
    </>
  )
}
