import { useEffect, useId, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { ProjectId } from './useProjectDrawer.ts'
import { portfolioNavItems, type PortfolioNavItem } from './navContent.ts'
import './portfolio-nav.css'

type PortfolioNavProps = {
  activeProject?: ProjectId | null
  onOpenProject?: (id: ProjectId) => void
  onCloseProject?: () => void
}

/** Open stagger from the Framer source: 0.10 / 0.15 / 0.20 / 0.25s */
const openDelays = ['0.1s', '0.15s', '0.2s', '0.25s'] as const
/** Close stagger from the Framer source: 0.15 / 0.10 / 0.05 / 0s */
const closeDelays = ['0.15s', '0.1s', '0.05s', '0s'] as const

function NavItemIcon({ id }: { id: string }) {
  if (id === 'about') {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
        <circle
          cx="10"
          cy="7"
          r="3.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M3.5 17.2c1.4-3 3.7-4.5 6.5-4.5s5.1 1.5 6.5 4.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  if (id === 'designer-os') {
    return (
      <svg width="20" height="17" viewBox="0 0 20 17" aria-hidden="true">
        <path
          d="M19.65 9.25 12.45 16.45a1.2 1.2 0 0 1-1.7-1.7L14.75 10.75H1.2a1.2 1.2 0 1 1 0-2.4h13.55L10.75 2.35a1.2 1.2 0 0 1 1.7-1.7l7.2 7.2a1.2 1.2 0 0 1 0 1.7Z"
          fill="currentColor"
        />
      </svg>
    )
  }

  if (id === 'gen-z-learning') {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
        <path
          d="M20 10c0 .66-.54 1.2-1.2 1.2h-7.6v7.6A1.2 1.2 0 0 1 10 20a1.2 1.2 0 0 1-1.2-1.2v-7.6H1.2A1.2 1.2 0 0 1 0 10c0-.66.54-1.2 1.2-1.2h7.6V1.2A1.2 1.2 0 0 1 10 0c.66 0 1.2.54 1.2 1.2v7.6h7.6c.66 0 1.2.54 1.2 1.2Z"
          fill="currentColor"
        />
      </svg>
    )
  }

  return (
    <svg width="21" height="16" viewBox="0 0 21 16" aria-hidden="true">
      <path
        d="M18.4 0H2.4C1.08 0 0 1.08 0 2.4v11.2C0 14.92 1.08 16 2.4 16h16c1.32 0 2.4-1.08 2.4-2.4V2.4C20.8 1.08 19.72 0 18.4 0Zm0 2.4v2.4H2.4V2.4h16ZM2.4 13.6V7.2h16v6.4H2.4Z"
        fill="currentColor"
      />
    </svg>
  )
}

function isItemActive(item: PortfolioNavItem, activeProject?: ProjectId | null) {
  return (
    item.destination.kind === 'project' &&
    activeProject === item.destination.projectId
  )
}

export function PortfolioNav({
  activeProject = null,
  onOpenProject,
  onCloseProject,
}: PortfolioNavProps) {
  const [open, setOpen] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        setOpen(false)
        toggleRef.current?.focus()
      }
    }

    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [open])

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  const closeMenu = () => setOpen(false)

  const activateItem = (item: PortfolioNavItem) => {
    closeMenu()

    const { destination } = item
    if (destination.kind === 'section') {
      onCloseProject?.()
      requestAnimationFrame(() => {
        const section = document.getElementById(destination.sectionId)
        // The phone column pans itself and cancels this; otherwise scroll.
        const unhandled = section?.dispatchEvent(
          new Event('fisheye-reveal', { bubbles: true, cancelable: true }),
        )
        if (unhandled) {
          section?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      })
      return
    }

    onOpenProject?.(destination.projectId)
  }

  return (
    <div className={open ? 'portfolio-nav is-open' : 'portfolio-nav'}>
      <div
        className="portfolio-nav-scrim"
        aria-hidden={!open}
        onClick={closeMenu}
      />

      {/*
        Desktop open layout from Unusual Navi:
        bottom bar, row, circle then cards (gap 24px), padding 44px.
      */}
      <div className="portfolio-nav-bar">
        <button
          ref={toggleRef}
          type="button"
          className="portfolio-nav-toggle"
          aria-expanded={open}
          aria-controls="portfolio-nav-panel"
          aria-label={open ? 'Close navigation' : 'Open navigation'}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="portfolio-nav-toggle-face" aria-hidden="true">
            <span className="portfolio-nav-toggle-icon">
              <svg width="12" height="12" viewBox="0 0 12 12">
                <path
                  d="M6 0c.552 0 1 .448 1 1v4h4c.552 0 1 .448 1 1s-.448 1-1 1H7v4c0 .552-.448 1-1 1s-1-.448-1-1V7H1C.448 7 0 6.552 0 6s.448-1 1-1h4V1c0-.552.448-1 1-1Z"
                  fill="currentColor"
                />
              </svg>
            </span>
          </span>
        </button>

        <nav
          id="portfolio-nav-panel"
          className="portfolio-nav-panel"
          aria-labelledby={titleId}
          aria-hidden={!open}
          {...(!open ? { inert: true } : {})}
        >
          <p id={titleId} className="visually-hidden">
            Site navigation
          </p>
          <ul className="portfolio-nav-list">
            {portfolioNavItems.map((item, index) => {
              const active = isItemActive(item, activeProject)
              return (
                <li
                  key={item.id}
                  className="portfolio-nav-item"
                  style={
                    {
                      '--nav-open-delay': openDelays[index] ?? '0.25s',
                      '--nav-close-delay': closeDelays[index] ?? '0s',
                    } as CSSProperties
                  }
                >
                  <button
                    type="button"
                    className={
                      active
                        ? 'portfolio-nav-card is-active'
                        : 'portfolio-nav-card'
                    }
                    tabIndex={open ? 0 : -1}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => activateItem(item)}
                  >
                    <span className="portfolio-nav-card-icon">
                      <NavItemIcon id={item.id} />
                    </span>
                    <span className="portfolio-nav-card-label">
                      {item.label}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </div>
  )
}
