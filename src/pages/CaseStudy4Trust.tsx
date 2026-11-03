import { useId, useState } from 'react'
import { ThresholdFlow } from './ThresholdFlow.tsx'

type Outcome = 'Acts' | 'Asks' | 'Hands over' | 'Stops'

const limitWords = ['Act', 'Ask', 'Explain', 'Stop or fall back', 'Hand over to', 'Be undone']

const limits = [
  {
    agent: 'Buyer’s agent',
    role: 'For the buyer',
    cells: [
      'Lets an order through when it’s inside the buyer’s rules',
      'The approver, for the exact amount over €300',
      'Says what it is, and why an order is waiting',
      'Keeps the part held while it reminds the approver. No agent ever approves',
      'Approver',
      'By the approver, who declines in one tap',
    ],
  },
  {
    agent: 'Setup agent',
    role: 'For the merchant admin',
    cells: [
      'Never applies a setting, only suggests',
      'The merchant admin, to approve each value',
      'Shows the replay, including where the sales rep disagreed',
      'Below 90% rep agreement, the category only asks the buyer to confirm',
      'Merchant admin',
      'By the merchant admin, who can reject any value',
    ],
  },
  {
    agent: 'Ordering agent',
    role: 'For the merchant',
    cells: [
      'Orders at or above the threshold, 85 to start',
      'The buyer: which version if two fit, and to confirm a part from 70 up to the threshold',
      'Gives the fit score, the ERP source and its age',
      'On a hard rule such as a safety part, or a fit below 70',
      'Sales rep, with a 5-minute answer target',
      'By the buyer, for 10 minutes or until the van leaves',
    ],
  },
  {
    agent: 'Fulfilment agent',
    role: 'For the merchant',
    cells: [
      'Holds stock, books the van and writes the order. During the pilot, a sales rep books the van',
      'Never asks, as it only handles decided orders',
      'Tells the buyer first if the van runs late',
      'If the ERP is unreachable, a sales rep checks stock by phone',
      'Sales rep',
      'By the buyer, for 10 minutes or until the van leaves, then by a return',
    ],
  },
  {
    agent: 'Review agent',
    role: 'For the merchant admin',
    cells: [
      'Never touches a live order',
      'The merchant admin, with the evidence for a change',
      'Shows undo, return and override rates per category',
      'Never changes a safety category, whatever the numbers show',
      'Merchant admin',
      'By the merchant admin, who can reject any change',
    ],
  },
]

const parts = {
  pump: {
    label: 'Water pump',
    safety: false,
    options: [
      { name: 'Original part', fit: 100, note: 'not in stock', inStock: false },
      { name: 'Hollen', fit: 90, note: 'arrives 10:45', inStock: true },
      { name: 'Vantor', fit: 70, note: 'arrives 13:30, not listed for this VIN', inStock: true },
    ],
  },
  brakes: {
    label: 'Brake pads',
    safety: true,
    options: [
      { name: 'Original part', fit: 100, note: 'in stock', inStock: true },
    ],
  },
}

type PartKey = keyof typeof parts

const REP_FIT = 70

/** The dial's rule: a safety part stops; otherwise the best part in stock meets the threshold. */
function decide(part: PartKey, threshold: number): { outcome: Outcome; text: string; pick?: string } {
  if (parts[part].safety) {
    return { outcome: 'Stops', text: 'Brake pads are a safety part, so a sales rep decides whatever the threshold.' }
  }
  const best = parts[part].options
    .filter((option) => option.inStock)
    .reduce((top, option) => (option.fit > top.fit ? option : top))
  if (best.fit >= threshold) {
    return { outcome: 'Acts', pick: best.name, text: `${best.name} scores ${best.fit}, which meets the threshold of ${threshold}. The agent orders it, and the buyer can undo.` }
  }
  if (best.fit >= REP_FIT) {
    return { outcome: 'Asks', pick: best.name, text: `Nothing in stock reaches ${threshold}. ${best.name} scores ${best.fit}, so the agent asks the buyer first.` }
  }
  return { outcome: 'Hands over', text: `Nothing in stock scores ${REP_FIT} or more, so a sales rep decides.` }
}

const decideSteps = [
  { title: 'Hard rules first', text: 'Safety part, credit hold, no contract price, no fit data, old data or the ERP being down. A person decides.' },
  { title: 'Fit score, 0 to 100', text: 'An exact OE part scores 100. A part not listed for the VIN never acts alone. Cross-reference counts for 50, fitting the VIN for 30 and key specs for 20.' },
  { title: 'The merchant’s threshold', text: '85 to start, set per category. At or above it, the agent orders with undo. From 70 it asks, and below 70 it hands over.' },
  { title: 'Then preference', text: 'Earliest delivery, lowest return rate and brands bought before only rank parts that already fit.' },
]

const failures = [
  { what: 'ERP not reachable', then: 'A sales rep checks stock by phone' },
  { what: 'Approver silent', then: 'A reminder goes out, and no agent ever approves' },
  { what: 'AI or speech down', then: 'WhatsApp and a sales rep take over' },
  { what: 'No stock', then: 'A backorder date, or a sales rep sources it' },
  { what: 'No sales rep free', then: 'The buyer hears when, and stock stays held' },
  { what: 'Misheard', then: 'The agent reads it back and asks' },
]

const always = [
  {
    title: 'The buyer always',
    items: [
      'Can undo for 10 minutes, or until the van leaves',
      'Can ask for a person at any step',
      'Sees the ERP source and age of every number',
      'Has its own agent, and each agent says what it is',
    ],
  },
  {
    title: 'The merchant always',
    items: [
      'Is the only one who changes the threshold',
      'Sells only at its contract prices, read live from its ERP',
      'Can pause any category in one click',
      'Sees a full log, including every override',
    ],
  },
]

const privacy = [
  { text: 'The car owner’s name and contact details never leave the workshop. Each side’s agent uses only what the order needs. Returns affect brand scores only as totals, and no buyer sees another’s orders.' },
  {
    text: 'On WhatsApp’s Cloud API, Meta processes messages for the business, so the order and its history live in the merchant’s ERP and webshop.',
    source: 'Meta',
    href: 'https://developers.facebook.com/documentation/business-messaging/whatsapp/data-privacy-and-security',
  },
  {
    text: 'Callers must hear up front that a call is recorded, why, and who receives it, so the agent says so in its first line.',
    source: 'EDPB guide for small businesses',
    href: 'https://www.edpb.europa.eu/sme/find-practical-info/faq_en',
  },
  {
    text: 'A licence plate or VIN can identify a person, so the agent uses them only to find the car and keeps them with the order. For the replay, each is matched to a car model and then pseudonymised.',
    source: 'EDPB guidelines on connected vehicles',
    href: 'https://www.edpb.europa.eu/system/files/documents/2021-03/edpb_guidelines_202001_connected_vehicles_v2.0_adopted_en.pdf',
  },
]

function OutcomePill({ outcome }: { outcome: Outcome }) {
  return (
    <span className={`cs-outcome is-${outcome.toLowerCase().replace(' ', '-')}`}>{outcome}</span>
  )
}

function ThresholdDial() {
  const [part, setPart] = useState<PartKey>('pump')
  const [threshold, setThreshold] = useState(85)
  const sliderId = useId()
  const result = decide(part, threshold)

  return (
    <div className="cs-dial">
      <div className="cs-dial-switch" role="group" aria-label="Part to test">
        {(Object.keys(parts) as PartKey[]).map((key) => (
          <button
            key={key}
            type="button"
            className="cs-dial-part"
            aria-pressed={part === key}
            onClick={() => setPart(key)}
          >
            {parts[key].label}
          </button>
        ))}
      </div>
      <div className="cs-dial-control">
        <label className="cs-agent-label" htmlFor={sliderId}>
          Threshold
        </label>
        <output className="cs-flow-value" htmlFor={sliderId}>
          {threshold}
        </output>
      </div>
      <input
        id={sliderId}
        className="cs-dial-slider"
        type="range"
        min={70}
        max={100}
        step={1}
        value={threshold}
        onChange={(event) => setThreshold(Number(event.target.value))}
      />
      <div className="cs-dial-scale" aria-hidden="true">
        <span>70</span>
        <span>80</span>
        <span>90</span>
        <span>100</span>
      </div>
      <ul className="cs-dial-options">
        {parts[part].options.map((option) => (
          <li
            key={option.name}
            className={option.name === result.pick ? 'cs-dial-option is-picked' : 'cs-dial-option'}
          >
            <span className="cs-card-label">{option.name}</span>
            <span className="cs-b3">fit {option.fit}</span>
            <span className="cs-b3 cs-source">{option.note}</span>
          </li>
        ))}
      </ul>
      <p className="cs-dial-result" role="status">
        <OutcomePill outcome={result.outcome} /> {result.text}
      </p>
    </div>
  )
}

export function CaseStudy4Trust({ id }: { id: string }) {
  return (
    <div id={id} className="cs-chapter">
      <section className="cs-block" aria-labelledby={`${id}-title`}>
        <div className="cs-block-head">
          <p className="cs-chapter-label">04 Trust</p>
          <h2 id={`${id}-title`} className="cs-h1">
            When an agent can act on its own.
          </h2>
          <p className="cs-b1 cs-block-summary">
            Each part gets a fit score out of 100. At or above the merchant’s threshold, the agent
            orders alone. From 70 up to it, the agent asks the buyer to confirm. Below 70, or on a
            hard rule, a sales rep decides.
          </p>
        </div>
      </section>

      <section className="cs-block" aria-labelledby={`${id}-work`}>
        <div className="cs-block-head">
          <h3 id={`${id}-work`} className="cs-h2">
            Threshold at work
          </h3>
          <p className="cs-b1 cs-block-summary">
            5 orders meet 3 checks, and the fulfilment agent writes the one that passes. Each of the
            others stops where a rule says so.
          </p>
        </div>
        <div className="cs-block-body">
          <ThresholdFlow />
          <div className="cs-notes">
            <p className="cs-h4">
              Only an order passing every check gets ordered alone. Every other order stops, asks or
              hands over, and says why.
            </p>
            <p className="cs-small cs-note-text">
              Example orders from the prototype’s mock ERP. The checks follow the engine’s own rules
              and order.
            </p>
          </div>
        </div>
      </section>

      <section className="cs-block" aria-labelledby={`${id}-limits`}>
        <div className="cs-block-head">
          <h3 id={`${id}-limits`} className="cs-h2">
            Each agent’s limits
          </h3>
          <p className="cs-b1 cs-block-summary">
            The same 6 words for every agent, so their limits compare at a glance.
          </p>
        </div>
        <div className="cs-block-body">
          <div className="cs-table-card cs-limits-table">
            <table className="cs-table">
              <caption className="visually-hidden">Each agent’s limits</caption>
              <thead>
                <tr>
                  <td />
                  {limits.map((agent) => (
                    <th key={agent.agent} scope="col">
                      <span className="cs-limit-agent">{agent.agent}</span>
                      <span className="cs-limit-role">{agent.role}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {limitWords.map((word, row) => (
                  <tr key={word}>
                    <th scope="row">{word}</th>
                    {limits.map((agent) => (
                      <td key={agent.agent}>{agent.cells[row]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="cs-limits-cards">
            {limits.map((agent) => (
              <li key={agent.agent} className="cs-agent">
                <h4 className="cs-card-label">
                  {agent.agent}
                  <span className="cs-limit-role">{agent.role}</span>
                </h4>
                <dl className="cs-limit-list">
                  {limitWords.map((word, row) => (
                    <div key={word}>
                      <dt className="cs-agent-label">{word}</dt>
                      <dd className="cs-b3">{agent.cells[row]}</dd>
                    </div>
                  ))}
                </dl>
              </li>
            ))}
          </ul>
          <p className="cs-h4">
            A person can undo or overrule every agent. No agent approves a spend, changes a rule or
            decides on a safety part.
          </p>
        </div>
      </section>

      <section className="cs-block" aria-labelledby={`${id}-try`}>
        <div className="cs-block-head">
          <h3 id={`${id}-try`} className="cs-h2">
            Try the threshold
          </h3>
          <p className="cs-b1 cs-block-summary">
            Fit scores stay fixed, and only the threshold moves. Take it past 90 and the water pump
            goes from ordered to asked.
          </p>
        </div>
        <div className="cs-try">
          <ThresholdDial />
          <div className="cs-summary">
            <h4 className="cs-card-label">How the agent decides</h4>
            <ol className="cs-decide">
              {decideSteps.map((step, index) => (
                <li key={step.title} className="cs-route-step">
                  <span className="cs-marker" aria-hidden="true">
                    {index + 1}
                  </span>
                  <div>
                    <p className="cs-step-title">{step.title}</p>
                    <p className="cs-b3">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="cs-small">
              <span className="cs-tag cs-tag-soft">Assumption</span> 85 is a starting point. The
              replay sets each category’s own before go-live, a category orders alone only at 90%
              rep agreement, and a person reviews it monthly.
            </p>
          </div>
        </div>
      </section>

      <section className="cs-block" aria-labelledby={`${id}-holds`}>
        <div className="cs-block-head">
          <h3 id={`${id}-holds`} className="cs-h2">
            What always holds
          </h3>
          <p className="cs-b1 cs-block-summary">
            Whatever fails, a person takes over, and both sides keep control.
          </p>
        </div>
        <div className="cs-block-body">
          <div className="cs-table-card">
            <table className="cs-table">
              <caption className="visually-hidden">If something fails</caption>
              <thead>
                <tr>
                  <th scope="col">What fails</th>
                  <th scope="col">What happens</th>
                </tr>
              </thead>
              <tbody>
                {failures.map((failure) => (
                  <tr key={failure.what}>
                    <th scope="row">{failure.what}</th>
                    <td>{failure.then}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="cs-summary-facts cs-two-up">
            {always.map((side) => (
              <div key={side.title} className="cs-summary-fact">
                <h4 className="cs-card-label">{side.title}</h4>
                <ul className="cs-always-list">
                  {side.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="cs-summary-fact">
            <h4 className="cs-card-label">Privacy</h4>
            <ul className="cs-privacy">
              {privacy.map((item) => (
                <li key={item.text} className="cs-b3">
                  {item.text}{' '}
                  {item.href ? (
                    <a className="cs-link" href={item.href} target="_blank" rel="noreferrer">
                      {item.source}
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
