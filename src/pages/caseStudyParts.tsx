import type { ReactNode } from 'react'

/** The "Why I decided this" callout, with one decision and its reasoning. */
export function DecisionNote({
  decision,
  assumption = false,
  children,
}: {
  decision: string
  assumption?: boolean
  children: ReactNode
}) {
  const label = 'Why I decided this'
  return (
    <aside className="cs-decision" aria-label={label}>
      <p className="cs-decision-label">
        <span className="cs-marker" aria-hidden="true">
          i
        </span>
        {label}
        {assumption ? <span className="cs-tag cs-tag-soft">Assumption</span> : null}
      </p>
      <div className="cs-decision-body">
        <p className="cs-h4">{decision}</p>
        <div className="cs-decision-why">{children}</div>
      </div>
    </aside>
  )
}
