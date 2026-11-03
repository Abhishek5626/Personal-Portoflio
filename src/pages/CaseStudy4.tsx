import './case-study-system.css'

/** The page's opening content; nothing else needs to change to replace it. */
const intro = {
  status: 'Case study in progress',
  title: 'Agentic AI for B2B ordering',
  summary:
    'A business case exploring AI agents for urgent B2B ordering. Buyers and merchants each get agents that work across WhatsApp, email and phone, within their own company’s rules.',
  metaTitle: 'Example case: AI agents for B2B ordering',
  metaDetail: 'Business case for Saga Commerce',
  mediaLabel: 'Placeholder: add a hero image or video',
}

const northStar = {
  label: 'North star',
  statement: 'Faster urgent orders, with no rise in wrong parts.',
  lead: 'Agents move quickly, and always stay inside the rules of both merchant and buyer.',
  facts: [
    {
      title: 'Business value',
      text: 'Urgent orders stop waiting on a sales rep, which gives reps their time back.',
    },
    {
      title: 'Trust',
      text: 'Each side’s rules hold on every single order.',
    },
    {
      title: 'Measured by',
      text: 'Time to order, with wrong-part returns staying within 1 percentage point of a sales rep’s.',
    },
  ],
}

const testCase = {
  title: 'The test case',
  summary:
    'The case follows an auto parts wholesaler on Saga and the independent garages it supplies. Urgency, exact vehicle fit and safety-critical parts make it a demanding test for agents.',
  sides: [
    {
      tone: 'a',
      title: 'Workshop side: buys from the merchant',
      roles: [
        {
          label: 'Buyer',
          title: 'Lead at an independent garage',
          points: [
            'Needs parts fast while a car waits on the lift',
            'Often has busy hands and no screen nearby',
          ],
        },
        {
          label: 'Approver',
          title: 'Garage owner',
          points: [
            'Approves orders above a limit the workshop sets, such as €300',
            'Is often away from the workshop',
          ],
        },
      ],
    },
    {
      tone: 'b',
      title: 'Merchant side: Saga’s customer',
      roles: [
        {
          label: 'Merchant admin',
          title: 'Runs the wholesaler’s Saga setup',
          points: [
            'Sets the fit score, out of 100, an agent needs to order alone',
            'Is the only role who can change the merchant’s rules',
          ],
        },
        {
          label: 'Sales rep',
          title: 'Inside sales at the merchant',
          points: [
            'Handles safety parts and matches scoring under 70',
            'Receives every handover with full context',
          ],
        },
      ],
    },
  ],
  assumption:
    'These four roles are assumptions, as no formal interviews have happened yet. Workshop visits will test the buyer and approver, and merchant interviews the other two.',
  decisionLabel: 'Why I decided this',
  decisions: [
    'Urgency, exact fit and safety rules make auto parts a hard test. What works here should suit calmer trades.',
    'The pilot stays with one auto parts merchant. A second trade follows only if it passes, though the prototype also shows a food wholesaler on the same design.',
    'Rules, agents and design stay the same for every merchant. Only trade data changes, such as car fit for parts or shelf life for food.',
    'So the case starts from an auto parts wholesaler.',
  ],
}

/** Chapters without a built section are plain text until they get one. */
const chapters = [
  { name: 'Situation', detail: 'Where B2B buying stands', href: '#cs-opening' },
  { name: 'Research' },
  { name: 'Proposal' },
  { name: 'Trust' },
  { name: 'Journeys' },
  { name: 'Prototype' },
  { name: 'System' },
  { name: 'Vision' },
]

export function CaseStudy4() {
  return (
    <div className="cs-system">
      <div className="cs-shell">
        <nav className="cs-toc" aria-label="Case study sections">
          <ol className="cs-toc-list">
            {chapters.map(({ name, detail, href }, index) => {
              const body = (
                <>
                  <span className="cs-toc-number">{index + 1}</span>
                  <span className="cs-toc-text">
                    <span className="cs-toc-name">{name}</span>
                    {detail ? <span className="cs-toc-detail">{detail}</span> : null}
                  </span>
                </>
              )
              return (
                <li key={name} className={href ? 'is-current' : undefined}>
                  {href ? (
                    <a className="cs-toc-row" href={href} aria-current="location">
                      {body}
                    </a>
                  ) : (
                    <span className="cs-toc-row">{body}</span>
                  )}
                </li>
              )
            })}
          </ol>
          <p className="cs-toc-note">Earlier work: the first proposal</p>
        </nav>

        <div className="cs-content">
          <section id="cs-opening" className="cs-opening" aria-labelledby="case-title">
            <header className="cs-opening-head">
              <div className="cs-opening-copy">
                <p className="cs-status">
                  <span className="cs-status-dot" aria-hidden="true" />
                  {intro.status}
                </p>
                <h1 id="case-title" className="cs-h1">
                  {intro.title}
                </h1>
                <p className="cs-b1 cs-opening-summary">{intro.summary}</p>
              </div>
              <div className="cs-opening-meta">
                <p className="cs-meta-title">{intro.metaTitle}</p>
                <p className="cs-meta-detail">{intro.metaDetail}</p>
              </div>
            </header>
            <figure className="cs-media">
              <figcaption className="cs-media-placeholder">{intro.mediaLabel}</figcaption>
            </figure>
          </section>

          <section className="cs-summary" aria-labelledby="cs-north-star">
            <p className="cs-tag">{northStar.label}</p>
            <div className="cs-summary-copy">
              <h2 id="cs-north-star" className="cs-h3">
                {northStar.statement}
              </h2>
              <p className="cs-b2">{northStar.lead}</p>
            </div>
            <ul className="cs-summary-facts">
              {northStar.facts.map((fact, index) => (
                <li key={fact.title} className="cs-summary-fact">
                  <span className="cs-marker" aria-hidden="true">
                    {index + 1}
                  </span>
                  <h3 className="cs-card-label">{fact.title}</h3>
                  <p className="cs-b3">{fact.text}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="cs-block" aria-labelledby="cs-test-case">
            <div className="cs-block-head">
              <h2 id="cs-test-case" className="cs-h2">
                {testCase.title}
              </h2>
              <p className="cs-b1 cs-block-summary">{testCase.summary}</p>
            </div>
            <div className="cs-block-body">
              <div className="cs-roles">
                {testCase.sides.map((side) => (
                  <div key={side.title} className={`cs-role-side is-${side.tone}`}>
                    <p className="cs-role-header">{side.title}</p>
                    <div className="cs-role-cards">
                      {side.roles.map((role) => (
                        <article key={role.label} className="cs-role-card">
                          <div className="cs-role-head">
                            <p className="cs-role-label">{role.label}</p>
                            <h3 className="cs-h4">{role.title}</h3>
                          </div>
                          <ul className="cs-role-points">
                            {role.points.map((point) => (
                              <li key={point}>{point}</li>
                            ))}
                          </ul>
                        </article>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="cs-notes">
                <p className="cs-tag">Assumption</p>
                <p className="cs-small cs-note-text">{testCase.assumption}</p>
                <aside className="cs-decision" aria-label={testCase.decisionLabel}>
                  <p className="cs-decision-label">
                    <span className="cs-marker" aria-hidden="true">
                      i
                    </span>
                    {testCase.decisionLabel}
                  </p>
                  <ul className="cs-decision-rows">
                    {testCase.decisions.map((decision) => (
                      <li key={decision}>{decision}</li>
                    ))}
                  </ul>
                </aside>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
