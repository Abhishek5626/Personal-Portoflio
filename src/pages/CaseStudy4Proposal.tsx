import { useId, useState } from 'react'
import { DecisionNote, ShowAll } from './caseStudyParts.tsx'

const map = [
  {
    tone: 'a',
    title: 'The workshop',
    nodes: [
      { name: 'Buyer', text: 'Workshop lead, with a Golf on the lift' },
      { name: 'Buyer’s agent', text: 'Follows the buyer company’s rules' },
      { name: 'Approver', text: 'Signs off anything over the limit' },
    ],
  },
  {
    tone: 'neutral',
    title: 'The merchant’s 4 agents, on Saga',
    nodes: [
      { name: 'Setup agent', text: 'Turns the catalogue and past orders into rules and thresholds' },
      { name: 'Ordering agent', text: 'Talks to the buyer and decides within the merchant’s rules' },
      { name: 'Fulfilment agent', text: 'Holds stock, books the van and writes the order' },
      { name: 'Review agent', text: 'Sums up the month and suggests changes' },
    ],
  },
  {
    tone: 'b',
    title: 'The merchant',
    nodes: [
      { name: 'Merchant admin', text: 'The only person who changes the merchant’s rules' },
      { name: 'Sales rep', text: 'Takes every case the agents stop on' },
      { name: 'Merchant’s ERP', text: 'Live stock and contract prices' },
    ],
  },
]

const route = [
  'The buyer asks for the part by voice, WhatsApp or email.',
  'Each pick goes to the buyer’s agent, which checks it against the buyer company’s rules.',
  'A part that fits and sits within both sides’ rules goes to the fulfilment agent as an order.',
  'The fulfilment agent holds the stock, books the van and writes the order to the ERP.',
  'Over the limit, the buyer’s agent sends the exact amount to the approver.',
  'Below 70, or on a hard rule such as a safety part, the ordering agent stops and passes the case to a sales rep.',
  'Every decision goes in the log for the review agent.',
  'Each month the review agent proposes threshold changes to the setup agent.',
  'Only the merchant admin can apply a change.',
  'The setup agent gives the ordering agent the rules and thresholds it works within.',
]

const buyerAgent = {
  name: 'Buyer’s agent',
  value: 'The buyer stays in control without watching every order.',
  test: 'Tested by the workshop visits and the pilot',
  does: 'Applies the company’s rules on who may order, the spend limit and the approver. It checks each pick against them, asks the approver when needed, and keeps the buyer’s record.',
  worksFor: 'The buyer’s company, inside the store of the merchant offering it.',
  channels: 'Voice, WhatsApp, email and the buyer’s webshop account.',
  never: 'Spends over the limit without the approver, or moves the order to another merchant.',
}

const merchantAgents = [
  {
    name: 'Setup agent',
    value: 'A merchant fills in one template rather than running a setup project.',
    test: 'Tested by the replay and the days from signup to live',
    does: 'Replays past orders and suggests a threshold for each category, 85 to start.',
    worksFor: 'The merchant admin, during setup.',
    channels: 'Merchant settings.',
    never: 'Applies a setting. A person approves each one.',
  },
  {
    name: 'Ordering agent',
    value: 'The buyer gets an answer without waiting for a sales rep.',
    test: 'Tested by the pilot’s 5-minute pass mark',
    does: 'Identifies the car and asks one question if two versions of a part fit. Then it orders, asks the buyer to confirm, or hands over, and explains why.',
    worksFor: 'The merchant, as its voice and chat.',
    channels: 'Voice, WhatsApp, email and the webshop.',
    never: 'Decides on a safety part.',
  },
  {
    name: 'Fulfilment agent',
    value: 'Nothing gets retyped, so no typing errors reach the ERP.',
    test: 'Checked in the pilot against the ERP log',
    does: 'Holds stock, books the van and writes the order to the ERP. During the pilot, a sales rep books the van.',
    worksFor: 'The merchant, inside its ERP and van planning.',
    channels: 'ERP, sales rep chat, and updates on WhatsApp or email.',
    never: 'Changes a price outside the contract.',
  },
  {
    name: 'Review agent',
    value: 'The merchant can see, with numbers, where to trust the agent more.',
    test: 'Tested by the override rate and the monthly threshold review',
    does: 'Summarises each category and suggests threshold changes.',
    worksFor: 'The merchant admin, every month.',
    channels: 'Merchant settings and a monthly email.',
    never: 'Applies a rule change.',
  },
]

const alwaysPerson = [
  'Safety parts: brakes, steering, airbags',
  'Weak matches under 70',
  'Spend over the buyer’s limit',
  'Credit hold',
  'Missing contract price',
  'No fit data for the part',
  'Data older than the merchant allows',
  'ERP not reachable',
  'Any change to the rules',
]

const roles = [
  { name: 'Buyer', text: 'The workshop lead. Can undo for 10 minutes or until the van leaves, and can ask for a person at any step.' },
  { name: 'Approver', text: 'The workshop owner. Signs off the exact amount over the limit.' },
  { name: 'Merchant admin', text: 'Sets and changes the merchant’s rules. Nobody else can.' },
  { name: 'Sales rep', text: 'Takes each case the agents shouldn’t decide, with overrides logged.' },
]

type Agent = typeof buyerAgent

function AgentCard({ agent, details }: { agent: Agent; details: boolean }) {
  return (
    <article className="cs-agent">
      <h4 className="cs-card-label">{agent.name}</h4>
      <div className="cs-agent-field">
        <p className="cs-agent-label">
          Value <span className="cs-tag cs-tag-soft">Assumption</span>
        </p>
        <p className="cs-h4">{agent.value}</p>
        <p className="cs-b3 cs-source">{agent.test}</p>
      </div>
      <div className="cs-agent-field">
        <p className="cs-agent-label">Does</p>
        <p className="cs-b3">{agent.does}</p>
      </div>
      {details ? (
        <>
          <div className="cs-agent-field">
            <p className="cs-agent-label">Works for</p>
            <p className="cs-b3">{agent.worksFor}</p>
          </div>
          <div className="cs-agent-field">
            <p className="cs-agent-label">Channels</p>
            <p className="cs-b3">{agent.channels}</p>
          </div>
        </>
      ) : null}
      <div className="cs-agent-field cs-agent-never">
        <p className="cs-agent-label">Never</p>
        <p className="cs-b3">{agent.never}</p>
      </div>
    </article>
  )
}

export function CaseStudy4Proposal({ id }: { id: string }) {
  const [details, setDetails] = useState(false)
  const agentsId = `${useId()}-agents`

  return (
    <div id={id} className="cs-chapter">
      <section className="cs-block" aria-labelledby={`${id}-title`}>
        <div className="cs-block-head">
          <p className="cs-chapter-label">03 Proposal</p>
          <h2 id={`${id}-title`} className="cs-h1">
            One agent for the buyer, 4 for the merchant.
          </h2>
          <p className="cs-b1 cs-block-summary">
            Each buyer gets an agent that follows their company’s rules, and each merchant gets 4
            single-purpose agents. They meet on Saga, and an order only goes through when both
            sides’ rules agree.
          </p>
        </div>
      </section>

      <section className="cs-block" aria-labelledby={`${id}-who`}>
        <div className="cs-block-head">
          <h3 id={`${id}-who`} className="cs-h2">
            Who acts, and for whom
          </h3>
          <p className="cs-b1 cs-block-summary">
            Follow the water pump for the Golf in bay 2: one agent for the buyer, 4 for the
            merchant, a single job each, and the people they hand over to.
          </p>
        </div>
        <div className="cs-block-body">
          <div className="cs-agent-map">
            {map.map((group) => (
              <div key={group.title} className={`cs-role-side is-${group.tone}`}>
                <p className="cs-role-header">{group.title}</p>
                <ul className="cs-role-cards cs-map-nodes">
                  {group.nodes.map((node) => (
                    <li key={node.name} className="cs-map-node">
                      <h4 className="cs-card-label">{node.name}</h4>
                      <p className="cs-b3">{node.text}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="cs-summary">
            <p className="cs-tag">How an order moves</p>
            <ol className="cs-route">
              {route.map((step, index) => (
                <li key={step} className="cs-route-step">
                  <span className="cs-marker" aria-hidden="true">
                    {index + 1}
                  </span>
                  <p className="cs-b3">{step}</p>
                </li>
              ))}
            </ol>
          </div>
          <DecisionNote decision="One job per agent.">
            <p className="cs-b2">
              Each agent’s limits match its job. The one talking to buyers never writes rules, and
              the one reviewing never touches an order. The buyer’s agent never sells, and the
              merchant’s agents never approve for the buyer. That lets each side trust its own
              agent, and a fault stays inside one job.
            </p>
          </DecisionNote>
          <DecisionNote decision="Each side gets its own agent.">
            <p className="cs-b2">
              The buyer’s agent follows the buyer company’s rules, and the merchant’s agents follow
              the merchant’s. Every Saga merchant offers the buyer’s agent to its buyers by default,
              so each order stays within both sets of rules, at the merchant’s prices.
            </p>
          </DecisionNote>
        </div>
      </section>

      <section className="cs-block" aria-labelledby={`${id}-detail`}>
        <div className="cs-block-head">
          <h3 id={`${id}-detail`} className="cs-h2">
            The agents in detail
          </h3>
          <p className="cs-b1 cs-block-summary">
            What each is worth and how that gets tested, what it does, and what it never does.
          </p>
        </div>
        <div id={agentsId} className="cs-block-body">
          <p className="cs-agent-side">For the buyer</p>
          <AgentCard agent={buyerAgent} details={details} />
          <DecisionNote decision="The merchant hosts the buyer’s agent. The buyer owns its rules." assumption>
            <p className="cs-b2">
              The merchant offers the agent because Saga is the merchant’s store, and Saga pays to
              run it from the merchant’s fee. The rules on who may order, the limit and the approver
              belong to the buyer’s company, which can take them back at any time. The merchant’s
              agents only see whether an order is inside the limit, never the figure.
            </p>
            <p className="cs-b2">
              At first, a workshop buying from 4 merchants keeps its rules in 4 accounts. With the
              buyer’s consent, that can become one set of rules read by every Saga merchant it buys
              from. Prices and stock never pass between merchants.
            </p>
            <p className="cs-small">
              Whether workshops trust an agent their merchant hosts is still an assumption, tested
              by the workshop visits and the pilot.
            </p>
          </DecisionNote>
          <p className="cs-agent-side">For the merchant</p>
          <div className="cs-agent-grid">
            {merchantAgents.map((agent) => (
              <AgentCard key={agent.name} agent={agent} details={details} />
            ))}
          </div>
        </div>
        <ShowAll
          open={details}
          label="Show who each works for and where"
          controls={agentsId}
          onToggle={() => setDetails((open) => !open)}
        />
      </section>

      <section className="cs-block" aria-labelledby={`${id}-data`}>
        <div className="cs-block-head">
          <h3 id={`${id}-data`} className="cs-h2">
            Data and decisions
          </h3>
          <p className="cs-b1 cs-block-summary">
            Where things live, and where the language model stops.
          </p>
        </div>
        <div className="cs-summary-facts cs-two-up">
          <div className="cs-summary-fact">
            <h4 className="cs-card-label">Data stays with the merchant</h4>
            <p className="cs-b3">
              Orders, stock and prices stay in the merchant’s ERP. Agents read them live and write
              orders back through the SAP and Microsoft Dynamics connection Saga webshops already
              use. Per-car fit data comes from a licensed catalogue.
            </p>
          </div>
          <div className="cs-summary-fact">
            <h4 className="cs-card-label">Rules decide, not the model</h4>
            <p className="cs-b3">
              The language model only understands the request and words the reply. Rules and a score
              make the decision.
            </p>
          </div>
        </div>
      </section>

      <section className="cs-block" aria-labelledby={`${id}-people`}>
        <div className="cs-block-head">
          <h3 id={`${id}-people`} className="cs-h2">
            Where people decide
          </h3>
          <p className="cs-b1 cs-block-summary">
            A merchant can add to this list, but never remove from it.
          </p>
        </div>
        <div className="cs-people">
          <div className="cs-people-always">
            <p className="cs-tag">Always a person</p>
            <ul className="cs-always-list">
              {alwaysPerson.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="cs-small">
              A wrong decision here costs more than the time an agent would save.
            </p>
          </div>
          <ul className="cs-people-roles">
            {roles.map((role) => (
              <li key={role.name} className="cs-summary-fact">
                <h4 className="cs-card-label">{role.name}</h4>
                <p className="cs-b3">{role.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="cs-block" aria-labelledby={`${id}-open`}>
        <div className="cs-block-head">
          <h3 id={`${id}-open`} className="cs-h2">
            Open to any buyer’s agent
          </h3>
          <p className="cs-b1 cs-block-summary">
            The same rules, plus a check on who it is. That check gets built after the pilot.
          </p>
        </div>
        <p className="cs-callout">
          An agent from another provider first proves who it is and that the buyer’s company allows
          it. It then reads the same rules, contract prices and live stock as the buyer’s agent on
          Saga, and each order lands in the same log and review.
        </p>
      </section>
    </div>
  )
}
