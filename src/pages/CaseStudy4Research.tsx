import { useId, useState } from 'react'
import { DecisionNote } from './caseStudyParts.tsx'

const flow = [
  { title: 'What I know', value: '1', unit: 'finding', text: 'Published research and 3 informal calls', link: 'the gaps' },
  { title: 'What I assume', value: '14', unit: 'bets', text: '3 matter most, starred', link: 'top 3 first' },
  { title: 'What we test first', value: '90%', unit: 'rep agreement', text: 'Needed before a category goes live', link: 'what passes' },
  { title: 'How we know', value: '300', unit: 'agent orders', text: 'Read against the pass marks' },
]

type Confidence = 'High' | 'Medium' | 'Low'

const assumptions: { text: string; confidence: Confidence; test: string; key?: boolean }[] = [
  { key: true, text: 'Most urgent orders still arrive by phone or WhatsApp rather than the webshop', confidence: 'High', test: 'Workshop visits, 2-week call count' },
  { key: true, text: 'The fit score’s weights and its threshold of 85 for ordering alone are right', confidence: 'Medium', test: 'Threshold replay' },
  { key: true, text: 'Merchants will let an agent sell once they’ve seen a replay of their own past orders', confidence: 'Medium', test: 'Merchant interviews, threshold replay' },
  { text: 'Buyers will speak to a voice agent in a noisy workshop', confidence: 'Low', test: 'Voice test' },
  { text: 'Buyers will let their own agent order within company rules', confidence: 'Medium', test: 'Workshop visits, pilot' },
  { text: 'Workshops have an owner who approves orders over a set limit', confidence: 'Medium', test: 'Workshop visits with owners' },
  { text: 'Approvers trust a one-tap approval on WhatsApp', confidence: 'Medium', test: 'Workshop visits with owners, pilot' },
  { text: 'Buyers accept an agent once it identifies itself', confidence: 'Medium', test: 'Voice test, pilot' },
  { text: 'A buyer with an urgent need orders from whoever answers first', confidence: 'Medium', test: 'Workshop visits' },
  { text: 'A photo of the plate or VIN is enough to identify the car', confidence: 'Medium', test: 'Workshop visits' },
  { text: 'Buyers will trust an equivalent part chosen by the agent', confidence: 'Medium', test: 'Workshop visits, pilot' },
  { text: '10 minutes is long enough to undo', confidence: 'Medium', test: 'Pilot, undo rate' },
  { text: 'Merchant data is clean enough to replay and match', confidence: 'Medium', test: 'Threshold replay with 3 merchants' },
  { text: 'Sales reps can reply within 5 minutes', confidence: 'Medium', test: 'Rep queue pilot' },
]

const numbers = [
  { value: '85', suffix: '/100', title: 'The threshold', scope: 'Set per category, checked on every part', text: 'The fit score a part needs for the agent to order it alone.' },
  { value: '90%', title: 'Rep agreement', scope: 'Per category, in replay and then live', text: 'How often the agent chose the same part as the sales rep. A category goes live only from 90%.' },
]

const firstSteps = [
  { when: 'From week 1', title: 'Replay', text: 'Run a year of past orders through the rules, and see whether the agent picks the rep’s part.', gate: 'Moves on at 90% agreement' },
  { when: 'Before go-live', title: 'Shadow', text: 'On live calls the agent suggests, the rep decides, and the two get compared.', gate: 'Moves on if 90% holds live' },
  { when: 'Category by category', title: 'Go live', text: 'Only what the results support. Each category gets its own threshold, and those that pass go first.' },
]

const studies = [
  { key: true, title: 'Visits to 8 to 10 workshops', when: 'Weeks 1 to 4', decides: 'Shows how urgent parts get ordered today, and shapes the journey.', gate: 'For 2 weeks at 1 branch, reps tag every same-day order. If under half come by phone or WhatsApp, the journey starts in the webshop, and the visits explain why.' },
  { key: true, title: 'Threshold replay on past orders', when: 'Weeks 1 to 8', decides: 'Finds the fit score where the rep would agree, which sets the threshold per category.', gate: 'A category goes live only at 90% rep agreement. Disagreements are read with the rep’s reason, since reps can be wrong too. Below 90%, the agent only asks. Without clean order history, shadow mode becomes the gate.' },
  { key: true, title: 'Merchant interviews', when: 'Weeks 2 to 4 and 9', decides: 'What a merchant needs to see before letting an agent sell.', gate: 'In week 9, each of the 3 replay merchants sees its own replay. If one still refuses, its agent only asks, in every category.' },
  { title: '5 calls to workshop leads', when: 'Week 1', decides: 'The buyer’s own words for an urgent order, which shape the visit guide.', gate: '20-minute phone calls, recruited through the pilot merchant’s workshop accounts. Not a study: if the calls contradict the journey, the visits test that first.' },
  { title: 'Voice test in a real workshop', when: 'Weeks 6 to 8', decides: 'Where calls break in real noise, and what to fix first.', gate: '6 buyers, the real speech service, and a person playing the agent’s decisions. It finds failures, not rates. If any buyer gets a wrong part, or 2 fail the same way, we fix it or try another service, with voice notes as the backup.' },
  { title: 'Rep queue pilot', when: 'Weeks 9 to 12', decides: 'The handover case card, the 5-minute answer target, and the lock that stops 2 reps taking one case.', gate: 'At 1 branch, in the reps’ real queue. If reps miss 5 minutes on more than 1 case in 5, the target or the staffing changes before launch.' },
]

const measures = [
  { title: 'Minutes from first message to order placed', pass: '5 minutes or less', note: 'the median, beside the sales rep’s time on orders with no approval' },
  { title: 'Wrong-part returns and undo, by fit score band', pass: 'Returns don’t double', note: 'the goal: within 1 percentage point of a sales rep’s' },
  { title: 'Share of urgent orders through the agent', note: 'should grow' },
  { title: 'Handover rate and rep answer time', note: 'answer within 5 minutes' },
  { title: 'Override rate per category, when a rep changes the agent’s pick', note: 'should fall over time' },
  { title: 'Days from signup to live, and categories live per merchant', note: 'should fall' },
  { title: 'Threshold reviewed per category', note: 'every month' },
  { title: '20 agent conversations read in full', note: 'every week' },
  { title: 'The reason behind each override, coded', note: 'every week' },
  { title: 'Interviews with 5 buyers who undid or returned an order, and 5 who didn’t', note: 'every month' },
  { title: 'Workshops ordering again within 30 days', note: 'should hold or grow' },
  { title: 'Saga’s margin per conversation, after shadow mode', note: 'should stay above 0' },
  { title: 'Approver answer time', note: 'instant approvals every time are a warning' },
  { title: 'Buyers who check the part before fitting it', note: 'asked in the monthly buyer interviews' },
]

function ShowAll({
  open,
  label,
  controls,
  onToggle,
}: {
  open: boolean
  label: string
  controls: string
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      className="cs-show-all"
      aria-expanded={open}
      aria-controls={controls}
      onClick={onToggle}
    >
      {open ? 'Show fewer' : label}
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
        <path
          d={open ? 'M2 6.5 5 3.5 8 6.5' : 'M2 3.5 5 6.5 8 3.5'}
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}

function Star() {
  return (
    <span className="cs-star" role="img" aria-label="Most important">
      ★
    </span>
  )
}

export function CaseStudy4Research({ id }: { id: string }) {
  const [allBets, setAllBets] = useState(false)
  const [allPlans, setAllPlans] = useState(false)
  const uid = useId()
  const betsId = `${uid}-bets`
  const plansId = `${uid}-plans`
  const shownBets = allBets ? assumptions : assumptions.filter((row) => row.key)
  const shownStudies = allPlans ? studies : studies.filter((row) => row.key)
  const shownMeasures = allPlans ? measures : measures.slice(0, 3)

  return (
    <div id={id} className="cs-chapter">
      <section className="cs-block" aria-labelledby={`${id}-title`}>
        <div className="cs-block-head">
          <p className="cs-chapter-label">02 Research</p>
          <h2 id={`${id}-title`} className="cs-h1">
            The evidence so far, and what’s left to test.
          </h2>
          <p className="cs-b1 cs-block-summary">
            What the evidence shows, which bets remain, and how the 3 biggest get tested
            before any agent orders alone.
          </p>
        </div>

        <div className="cs-summary">
          <p className="cs-tag">How the research works</p>
          <p className="cs-b2">
            Evidence comes first, then the bets it can’t settle, then the key tests, until
            the pilot proves the case.
          </p>
          <ol className="cs-flow">
            {flow.map((step) => (
              <li key={step.title} className="cs-flow-step">
                <div className="cs-flow-card">
                  <p className="cs-card-label">{step.title}</p>
                  <p className="cs-flow-value">{step.value}</p>
                  <p className="cs-flow-unit">{step.unit}</p>
                  <p className="cs-b3">{step.text}</p>
                </div>
                {step.link ? <p className="cs-flow-link">{step.link}</p> : null}
              </li>
            ))}
          </ol>
          <p className="cs-flow-loop">What the pilot learns goes back into the bets</p>
        </div>
      </section>

      <section className="cs-block" aria-labelledby={`${id}-know`}>
        <div className="cs-block-head">
          <h3 id={`${id}-know`} className="cs-h2">
            What I know
          </h3>
          <p className="cs-b1 cs-block-summary">
            From published research, on the buyer side only so far. Everything else is still
            a bet, listed below.
          </p>
        </div>
        <div className="cs-block-body">
          <div className="cs-finding">
            <div className="cs-finding-side">
              <p className="cs-tag">Finding</p>
              <p className="cs-step-title">The buyer side</p>
              <p className="cs-b2">
                61% prefer a rep-free experience overall, yet still want a rep’s input when
                checking that a product suits their company.
              </p>
              <p className="cs-b3 cs-source">Source: Gartner sales survey, June 2025, 632 buyers</p>
            </div>
            <div className="cs-finding-side is-design">
              <p className="cs-tag">What the design does</p>
              <p className="cs-h4">
                A sales rep is one tap away on every order, and decides any part the rules
                can’t confirm.
              </p>
            </div>
          </div>
          <div className="cs-notes">
            <p className="cs-small cs-note-text">
              As reported by the source. I haven’t re-run the study, and it may not apply to
              every merchant. Checked 22 Oct 2026.
            </p>
            <p className="cs-callout">
              No formal interviews yet. 3 informal calls to workshop managers in Mohali, India,
              found some still order parts from a mobile, mostly by calling. That’s a different
              market, so 5 calls in week 1 and the visits check it in the pilot market, the
              Netherlands. Everything else here is published research or a labelled assumption.
            </p>
          </div>
        </div>
      </section>

      <section className="cs-block" aria-labelledby={`${id}-assume`}>
        <div className="cs-block-head">
          <h3 id={`${id}-assume`} className="cs-h2">
            What I still assume
          </h3>
          <p className="cs-b1 cs-block-summary">
            Not yet tested in the pilot market. Confidence is my reading of the evidence so far.
          </p>
        </div>
        <div className="cs-block-body">
          <p className="cs-small">
            <Star /> Most important. If wrong, the design changes, so these get checked first.
          </p>
          <div className="cs-table-card">
            <table id={betsId} className="cs-table">
              <caption className="visually-hidden">What I still assume</caption>
              <thead>
                <tr>
                  <th scope="col">Assumption</th>
                  <th scope="col">Confidence</th>
                  <th scope="col">Tested by</th>
                </tr>
              </thead>
              <tbody>
                {shownBets.map((row) => (
                  <tr key={row.text}>
                    <th scope="row">
                      {row.key ? <Star /> : null} {row.text}
                    </th>
                    <td>
                      <span className={`cs-confidence is-${row.confidence.toLowerCase()}`}>
                        {row.confidence}
                      </span>
                    </td>
                    <td>{row.test}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ShowAll
            open={allBets}
            label="Show all 14 assumptions"
            controls={betsId}
            onToggle={() => setAllBets((open) => !open)}
          />
        </div>
      </section>

      <section className="cs-block" aria-labelledby={`${id}-first`}>
        <div className="cs-block-head">
          <h3 id={`${id}-first`} className="cs-h2">
            What we test first
          </h3>
          <p className="cs-b1 cs-block-summary">
            The threshold replay. It uses past orders rather than participants, so recruiting
            can’t delay it. Saga already reads those orders from each merchant’s ERP, which
            turns the design’s key assumption into each merchant’s own evidence.
          </p>
        </div>
        <div className="cs-summary">
          <p className="cs-tag">Why first</p>
          <p className="cs-b2">
            The threshold, starting at a fit score of 85 out of 100, carries the whole design.
            Set too low, the Golf in bay 2 gets the wrong pump. Set too high, the agent asks
            about parts it could have ordered itself.
          </p>
          <ul className="cs-numbers">
            {numbers.map((number) => (
              <li key={number.title} className="cs-summary-fact">
                <p className="cs-flow-value">
                  {number.value}
                  {number.suffix ? <span className="cs-flow-suffix">{number.suffix}</span> : null}
                </p>
                <h4 className="cs-card-label">{number.title}</h4>
                <p className="cs-b3 cs-source">{number.scope}</p>
                <p className="cs-b3">{number.text}</p>
              </li>
            ))}
          </ul>
          <ol className="cs-first-steps">
            {firstSteps.map((step, index) => (
              <li key={step.title} className="cs-summary-fact">
                <span className="cs-marker" aria-hidden="true">
                  {index + 1}
                </span>
                <p className="cs-b3 cs-source">{step.when}</p>
                <h4 className="cs-card-label">{step.title}</h4>
                <p className="cs-b3">{step.text}</p>
                {step.gate ? <p className="cs-gate">{step.gate}</p> : null}
              </li>
            ))}
          </ol>
          <p className="cs-callout">
            <strong>Stop rule.</strong> Below 90% agreement with reps, the agent only asks the
            buyer to confirm in that category, and never orders alone.
          </p>
        </div>
      </section>

      <div id={plansId} className="cs-plans">
        <section className="cs-block" aria-labelledby={`${id}-before`}>
          <div className="cs-block-head">
            <h3 id={`${id}-before`} className="cs-h2">
              Before launch
            </h3>
            <p className="cs-b1">
              The first 12 weeks: what each study decides and what stops it. A star marks the 3
              testing the most important bets.
            </p>
          </div>
          <ol className="cs-plan-list">
            {shownStudies.map((study) => (
              <li key={study.title} className="cs-plan-row">
                <div className="cs-plan-top">
                  <h4 className="cs-card-label">
                    {study.key ? <Star /> : null} {study.title}
                  </h4>
                  <p className="cs-b3 cs-source cs-plan-when">{study.when}</p>
                </div>
                <p className="cs-b3">{study.decides}</p>
                <p className="cs-b3 cs-source">
                  <strong>Go or stop:</strong> {study.gate}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section className="cs-block" aria-labelledby={`${id}-after`}>
          <div className="cs-block-head">
            <h3 id={`${id}-after`} className="cs-h2">
              After launch
            </h3>
            <p className="cs-b1">
              What the pilot measures. It passes only if the pass marks hold after 300 agent
              orders and their return window.
            </p>
          </div>
          <ul className="cs-plan-list">
            <li className="cs-plan-row is-star">
              <p className="cs-tag">North star</p>
              <p className="cs-h4">Faster urgent orders, with no rise in wrong parts.</p>
            </li>
            {shownMeasures.map((measure) => (
              <li key={measure.title} className="cs-plan-row">
                <h4 className="cs-card-label">{measure.title}</h4>
                {measure.pass ? (
                  <p className="cs-pass">
                    <span className="cs-source">Pass mark</span> {measure.pass}
                  </p>
                ) : null}
                <p className="cs-b3 cs-source">{measure.note}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <ShowAll
        open={allPlans}
        label="Show all 6 studies and 14 measures"
        controls={plansId}
        onToggle={() => setAllPlans((open) => !open)}
      />
      <p className="cs-small cs-note-text">
        I assume the pilot’s first 2 categories, filters and cooling, bring about 280 agent
        orders a month, so it runs 6 to 10 weeks. 300 orders is a harm check rather than proof:
        it catches real failure but can’t show the agent equals a rep. Published wrong-order
        rates vary, so the baseline is the merchant’s own. 66% of German workshops put theirs
        under 5% (AUTO SERVICE PRAXIS survey, 2024, 500+ workshops).
      </p>

      <DecisionNote decision="Voice ships from day one, refined in a real workshop." assumption>
        <p className="cs-b2">
          Urgent orders often come with busy hands and no screen. Bays are loud, so calls get
          tested and tuned there. If one speech service fails, we try another, with voice notes
          as the backup. The test shapes how calls work, not whether they exist.
        </p>
      </DecisionNote>
      <p className="cs-small cs-note-text">
        AI drafts the synthesis. A researcher checks every quote against the recording before it
        counts as a finding.
      </p>
    </div>
  )
}
