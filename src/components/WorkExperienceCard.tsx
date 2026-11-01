import { useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent, MouseEvent, PointerEvent } from 'react'
import {
  employment,
  statedExperienceYears,
  timelineEnd,
} from './workExperienceContent.ts'
import './work-experience.css'

const presentYears = Number(statedExperienceYears)
const yearMs = 365.25 * 24 * 60 * 60 * 1000
const careerStart = Date.UTC(2021, 4, 1)
const pxPerYear = 60
const maxLabel = 11
const tickCount = maxLabel * 10 + 1
const presentTick = presentYears * 10

type Span = {
  company: string
  role: string
  start: number
  end: number
}

const spans: Span[] = employment.map((span) => ({
  company: span.company,
  role: span.role,
  start: Date.parse(`${span.start}T00:00:00Z`),
  end: Date.parse(`${span.end}T00:00:00Z`),
}))

type Position = {
  years: number
  amount: string
  year: number
  company: string
  role: string
  summary: string
  atPresent: boolean
}

const ticks = Array.from({ length: tickCount }, (_, index) => {
  const yearMark = index % 10 === 0
  const half = index % 5 === 0 && !yearMark
  return {
    index,
    label: yearMark ? String(index / 10) : '',
    kind: yearMark ? 'year' : half ? 'half' : 'minor',
    future: index > presentTick,
  }
})

function clampYears(years: number) {
  return Math.min(presentYears, Math.max(0, years))
}

function timeForYears(years: number) {
  if (years >= presentYears - 0.0005) return timelineEnd
  return careerStart + years * yearMs
}

function readYears(years: number): Position {
  const value = clampYears(years)
  const atPresent = value >= presentYears - 0.0005
  const point = timeForYears(value)
  const matches = spans.filter((span) => point >= span.start && point <= span.end)
  const year = new Date(point).getUTCFullYear()
  const amount = atPresent ? statedExperienceYears : value.toFixed(1)
  const company = matches.map((span) => span.company).join(' · ')
  const role = matches.length
    ? matches.map((span) => span.role).join(' · ')
    : 'No role listed for this date'
  const summary = matches.length
    ? `${matches.map((span) => `${span.role} at ${span.company}`).join(', ')}, ${amount} years, ${year}`
    : `No role listed for this date, ${amount} years, ${year}`
  return { years: value, amount, year, company, role, summary, atPresent }
}

export function WorkExperienceCard() {
  const scaleRef = useRef<HTMLDivElement>(null)
  const stripRef = useRef<HTMLDivElement>(null)
  const yearsRef = useRef(presentYears)
  const dragRef = useRef({
    active: false,
    pointerId: -1,
    startX: 0,
    startYears: presentYears,
    moved: false,
  })
  const [position, setPosition] = useState(() => readYears(presentYears))

  const apply = (years: number) => {
    const next = readYears(years)
    yearsRef.current = next.years
    const strip = stripRef.current
    if (strip) {
      strip.style.transform = `translateX(calc(-${next.years * pxPerYear + 3}px))`
    }
    const scale = scaleRef.current
    if (scale) {
      scale.setAttribute('aria-valuenow', String(Math.round(next.years * 10) / 10))
      scale.setAttribute('aria-valuetext', next.summary)
    }
    setPosition((current) => (current.summary === next.summary ? current : next))
    return next
  }

  useLayoutEffect(() => {
    apply(presentYears)
  }, [])

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startYears: yearsRef.current,
      moved: false,
    }
    event.currentTarget.classList.add('is-dragging')
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag.active || event.pointerId !== drag.pointerId) return
    const delta = event.clientX - drag.startX
    if (Math.abs(delta) > 4) drag.moved = true
    apply(drag.startYears - delta / pxPerYear)
  }

  const stopDrag = (event: PointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const drag = dragRef.current
    if (!drag.active || event.pointerId !== drag.pointerId) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    if (!cancelled && !drag.moved) {
      const rect = event.currentTarget.getBoundingClientRect()
      const offset = event.clientX - (rect.left + rect.width / 2)
      apply(drag.startYears + offset / pxPerYear)
    }
    drag.active = false
    event.currentTarget.classList.remove('is-dragging')
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const steps: Record<string, number | 'start' | 'end'> = {
      ArrowLeft: -0.1,
      ArrowDown: -0.1,
      ArrowRight: 0.1,
      ArrowUp: 0.1,
      PageDown: -1,
      PageUp: 1,
      Home: 'start',
      End: 'end',
    }
    const step = steps[event.key]
    if (step === undefined) return
    event.preventDefault()
    if (step === 'start') apply(0)
    else if (step === 'end') apply(presentYears)
    else apply(yearsRef.current + step)
  }

  const reset = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    apply(presentYears)
  }

  const showLogo = position.company === 'KPMG India'

  return (
    <article className="work-experience" data-hover-tile="" data-repel="">
      <div className="work-experience-surface">
        <div className="work-experience-heading">
          <span className="project-card-icon" aria-hidden="true">
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
          <h2 className="work-experience-label">Current</h2>
        </div>

        <div className="work-experience-timeline">
        <div
          ref={scaleRef}
          className="work-experience-scale"
          role="slider"
          tabIndex={0}
          aria-label="Years of experience"
          aria-orientation="horizontal"
          aria-valuemin={0}
          aria-valuemax={presentYears}
          aria-valuenow={position.years}
          aria-valuetext={position.summary}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={(event) => stopDrag(event, false)}
          onPointerCancel={(event) => stopDrag(event, true)}
          data-fisheye-drag-axis="x"
          onLostPointerCapture={(event) => {
            // The page's drag took over (a vertical drag began here): put
            // the timeline back so panning never scrubs it.
            const drag = dragRef.current
            if (!drag.active || event.pointerId !== drag.pointerId) return
            drag.active = false
            event.currentTarget.classList.remove('is-dragging')
            apply(drag.startYears)
          }}
          onKeyDown={onKeyDown}
        >
          <div ref={stripRef} className="work-experience-strip">
            {ticks.map((tick) => (
              <div
                key={tick.index}
                className={`work-experience-tick is-${tick.kind}${tick.future ? ' is-future' : ''}`}
              >
                {tick.label ? <span>{tick.label}</span> : null}
                <i />
              </div>
            ))}
          </div>
          <div className="work-experience-marker" />
        </div>
          <button
            type="button"
            className="work-experience-reset"
            hidden={position.atPresent}
            aria-label="Reset to present"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={reset}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M2.5 8a5.5 5.5 0 1 0 1.2-3.4"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <path
                d="M2.4 2.8v2.6h2.6"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className="work-experience-footer">
          <div className="work-experience-role-block">
            <div className="work-experience-identity">
              {showLogo ? (
                <img
                  className="work-experience-logo"
                  src="/landing/kpmg.svg"
                  alt={position.company}
                  width={42}
                  height={17}
                />
              ) : (
                <p className="work-experience-company">{position.company}</p>
              )}
            </div>
            <p className="work-experience-role">{position.role}</p>
          </div>
          <p className="work-experience-stat">
            <span className="work-experience-total">
              <span className="work-experience-amount">{position.amount}</span>
              <span className="work-experience-unit">yr</span>
            </span>
            <span className="work-experience-year">{position.year}</span>
          </p>
        </div>
      </div>
    </article>
  )
}
