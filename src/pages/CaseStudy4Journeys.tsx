import { useState } from 'react'

type PathStep = { code: string; title: string; hint: string; text: string; person?: boolean }

const orderPath: PathStep[] = [
  { code: 'M2', title: 'Setup agent', hint: 'Rules, set once', text: 'Before any call, the merchant admin approved the rules. Cooling passed its replay, so the agent can order alone from a fit score of 85.' },
  { code: 'B1', title: 'Trigger', hint: '3 ways in', text: 'The buyer calls about the Golf in bay 2. The agent says it’s an AI, then finds the car from the plate.' },
  { code: 'B2', title: 'Identify part', hint: 'Asks', text: 'Two water pumps fit this engine, so the agent asks one question. The buyer says metal.' },
  { code: 'B3', title: 'Search network', hint: 'Live ERP', text: 'Live from the merchant’s ERP: the original is out until tomorrow, and Hollen can arrive at 10:45.' },
  { code: 'B4', title: 'Decide', hint: '2 ways', person: true, text: 'The pump clears the threshold, with Hollen scoring 90 against 85, so the agent orders it. The belt kit has no fit data, so a sales rep picks it. Both rejoin at the approval.' },
  { code: 'M5', title: 'Sales rep', hint: 'On a stop', text: 'The rep gets one case card with the car, the part and why the agent stopped, and has a 5-minute answer target. The answer returns to the buyer’s thread, and the order moves to approval.' },
  { code: 'B5', title: 'Approve', hint: 'Approver', person: true, text: '€325.50 is over the workshop’s €300 limit. The buyer’s agent asks the approver, who agrees in one tap.' },
  { code: 'B6', title: 'Delivery', hint: 'Van booked', text: 'Stock has been held since the quote, and the van is booked to arrive at 10:45.' },
  { code: 'M6', title: 'Fulfilment agent', hint: 'Holds, books, writes', text: 'The fulfilment agent books the van and writes the order to the ERP, with no retyping. During the pilot, a sales rep books the van.' },
  { code: 'B7', title: 'Confirm', hint: 'Undo', person: true, text: 'The agent reads back the part, price and arrival. Undo stays open for 10 minutes, or until the van leaves.' },
  { code: 'B8', title: 'Record and return', hint: 'Logged', text: 'Each decision lands in the webshop log, with its rule, score and source.' },
  { code: 'M7', title: 'Review agent', hint: 'Every month', text: 'Each month the review agent summarises cooling. Only the merchant admin can change the threshold.' },
]

const control = [
  { code: 'B4', title: 'Act, ask or hand over', text: 'At or above the merchant’s threshold, 85 to start, the agent orders. From 70 up to it, the agent asks the buyer to confirm and explains why. Below 70, or on a hard rule, a sales rep takes over.' },
  { code: 'B5', title: 'Ask a person', text: 'Over €300, the buyer’s agent sends the exact amount to the approver’s own phone for a one-tap decision. The part stays held meanwhile.' },
  { code: 'B7', title: 'Be undone', text: 'Undo lasts 10 minutes, or until the van leaves. After that, one message starts a return.' },
]

type Card = {
  code: string
  title: string
  channel: string
  points: string[]
  edge: string
  test?: string
  today?: boolean
  links?: string[]
  group?: string
  bands?: boolean
  why?: { title: string; decided: string; favour: string; watch: string }
}

const buyerCards: Card[] = [
  {
    code: 'B1', title: 'Trigger', channel: 'Voice, WhatsApp, Email',
    points: ['Says it’s the merchant’s AI agent, then finds the car', 'The buyer’s agent checks the caller is on the company’s list'],
    edge: 'Unknown number: the approver confirms the caller', test: 'visits, voice test', links: ['M2'],
    why: {
      title: 'The order starts where the buyer already is.',
      decided: 'Urgent parts get ordered from the workshop floor with busy hands, so a call, WhatsApp or email starts the order, and never a form.',
      favour: 'Voice and chat agents exist elsewhere, but Saga’s edge sits behind them: live ERP data and the merchant’s rules. Phone orders that bypass the webshop today end up in it.',
      watch: 'A loud bay could break a call, so calls get tested and tuned in a real workshop, with WhatsApp voice notes as the backup.',
    },
  },
  {
    code: 'B2', title: 'Identify part', channel: 'Voice, WhatsApp, Email',
    points: ['If two versions fit: one question, never a form', 'Each line of a multi-part job gets its own score'],
    edge: 'No fit data: a sales rep picks the part, as the agent never guesses', test: 'visits', links: ['M1'],
  },
  {
    code: 'B3', title: 'Search network', channel: 'Merchant ERP',
    points: ['Warehouse, branch, then equivalents, live from the ERP', 'Every number shows its source and age'],
    edge: 'ERP not reachable: a sales rep checks stock by phone', today: true, links: ['M1'],
  },
  {
    code: 'B4', title: 'Decide', channel: 'Agent', bands: true,
    points: ['Hard rules first: a safety part always goes to a person', 'Then the fit score, then preference among parts that fit'],
    edge: 'Credit hold: a sales rep decides, whatever the score', test: 'replay', links: ['M2', 'M4', 'M5'],
    why: {
      title: 'Right part first, best part second.',
      decided: 'Is this the right part, and is it the best one? The agent answers those separately, so a perfect fit never gets held back by its brand.',
      favour: 'The rules come from the merchant’s catalogue and ERP plus licensed fitment data. Each merchant tunes its own thresholds, so one design serves many businesses.',
      watch: '85 is a starting point rather than a finding. The threshold replay tests it on past orders by asking where the sales rep would agree.',
    },
  },
  {
    code: 'B5', title: 'Approve', channel: 'WhatsApp',
    points: ['Inside the limit: no approval needed', 'Over €300: the approver decides in one tap'],
    edge: 'No reply in 15 minutes: a reminder, with the part still held', test: 'visits, pilot', links: ['M6'],
    why: {
      title: 'The buyer’s own agent asks the approver.',
      decided: 'An urgent repair can’t wait in an inbox. The buyer’s agent sends one WhatsApp card with the exact part, price and reason, for a one-tap answer.',
      favour: 'Spend limits, approvals and contract prices are B2B rules that, by my reading, consumer agents and simple webshops rarely handle. Keeping them inside the order sets Saga apart.',
      watch: 'After 15 minutes with no reply, a reminder goes out and the buyer is offered a call. The agent never approves alone, and asks again if the price moves.',
    },
  },
  {
    code: 'B6', title: 'Delivery', channel: 'WhatsApp, Email',
    points: ['Stock held since the quote', 'Order in the ERP, and the van booked with its arrival time'],
    edge: 'Van late: the buyer hears the new time first', test: 'pilot', links: ['M6'],
  },
  {
    code: 'B7', title: 'Confirm', channel: 'Voice, WhatsApp, Email',
    points: ['Reads back the part, price and arrival, then sends a receipt', 'Undo for 10 minutes, or until the van leaves'],
    edge: 'Undo after the van has left: it becomes a return', test: 'pilot',
  },
  {
    code: 'B8', title: 'Record and return', channel: 'Webshop, Email',
    points: ['Each decision in the webshop log, with rule, score and source', 'A return takes one message, and only teaches preference'],
    edge: 'Merchant’s mistake: a free urgent resend', test: 'pilot', links: ['M7'],
  },
]

const merchantCards: Card[] = [
  {
    group: 'Set up once', code: 'M1', title: 'Connect', channel: 'Merchant settings',
    points: ['ERP, catalogue and cross-references connected', 'Prices and stock read live'],
    edge: 'No OE number or cross-reference: never ordered alone', test: 'replay', links: ['B2', 'B3'],
  },
  {
    code: 'M2', title: 'Set rules', channel: 'Merchant settings',
    points: ['The setup agent suggests each threshold, 85 to start, and the admin approves', 'Safety categories always go to a person'],
    edge: 'A buyer’s company can only make the rules stricter', test: 'replay', links: ['B1', 'B4'],
    why: {
      title: 'One template for every merchant.',
      decided: 'Each merchant fills the same template per category, and only the values change. The setup agent suggests them and the merchant admin approves.',
      favour: 'Three rule types suit auto parts and food alike: must match exactly, adds points, and only ranks. Safety always goes to a person, whether brakes and airbags, or allergen swaps and alcohol.',
      watch: 'Thresholds differ by category: cooling 85 and electrics 90 for parts, dry goods 85 and dairy 90 for food. A buyer’s company can only tighten them.',
    },
  },
  {
    code: 'M3', title: 'Test, then go live', channel: 'Merchant settings',
    points: ['The setup agent replays past orders and shows where the rep disagreed', 'A category goes live only at 90% rep agreement'],
    edge: 'Under 90%: adjust the threshold and replay again', test: 'replay, interviews',
    why: {
      title: 'Replay before any real order.',
      decided: 'I don’t expect any merchant to let an agent sell on day one. Replaying past orders shows where it would be right before it touches a real one.',
      favour: 'Each merchant starts from its own evidence rather than ours. Below 90% rep agreement, a category only asks the buyer to confirm.',
      watch: 'The replay needs past orders with a plate or VIN. Without them, shadow mode is the gate, with the agent suggesting and the rep deciding, so going live takes longer.',
    },
  },
  {
    group: 'Run every day', code: 'M4', title: 'Case arrives', channel: 'Chat',
    points: ['A hard rule or a fit below 70: one case card for a sales rep', 'No rep free: the buyer hears when, and stock stays held'],
    edge: 'Opening a case locks it, so 2 reps never take the same one', test: 'rep queue pilot', links: ['B4'],
  },
  {
    code: 'M5', title: 'Review and decide', channel: 'Chat',
    points: ['The card shows the car, why the agent stopped, and every option', '5-minute answer target, then the next rep'],
    edge: 'Part not confirmed: the rep swaps it or calls the buyer', test: 'rep queue pilot', links: ['B4'],
  },
  {
    code: 'M6', title: 'Quote and fulfil', channel: 'Chat, ERP',
    points: ['Quote at contract price, held for the approver over the limit', 'Stock held, van booked and order in the ERP'],
    edge: 'Price moves after approval: the approver is asked again', test: 'pilot', links: ['B5', 'B6'],
  },
  {
    group: 'Review every month', code: 'M7', title: 'Review and tune', channel: 'Webshop, Email',
    points: ['Acted, asked and handed over, with undo and return rates', 'A person changes the rules, and the agent only suggests'],
    edge: 'Returns rise in a category: pause it in one click', test: 'pilot', links: ['B8'],
    why: {
      title: 'Only a person tunes the rules.',
      decided: 'A merchant lets the agent do more only after seeing it be right.',
      favour: 'Each merchant gets its own proof, from the same view for every business.',
      watch: 'Few cases can also mean the threshold is too loose, which returns per category will show.',
    },
  },
]

const channels = [
  { name: 'Voice', who: 'Buyer', text: 'Orders hands-free and hears the read-back. Calls get refined in a real workshop, with voice notes as the backup.' },
  { name: 'WhatsApp', who: 'Buyer and approver', text: 'The approver’s one-tap approval, plus voice notes, choices, receipts and undo.' },
  { name: 'Email', who: 'Buyer, accounts team, merchant admin', text: 'An order can start and end by email, along with invoices and the monthly review.' },
  { name: 'Chat', who: 'Sales rep', text: 'Each handover arrives with the whole case, so the buyer never repeats anything.' },
  { name: 'Webshop', who: 'Everyone', text: 'The record of every order, return and rule, whichever channel it started in.' },
]

function JourneyCard({ card, id }: { card: Card; id: string }) {
  return (
    <>
      {card.group ? <p className="cs-journey-group">{card.group}</p> : null}
      <article id={`${id}-${card.code}`} className="cs-agent cs-journey-card">
        <div className="cs-journey-top">
          <span className="cs-journey-code">{card.code}</span>
          <h5 className="cs-card-label">{card.title}</h5>
          <span className="cs-b3 cs-source">{card.channel}</span>
        </div>
        <ul className="cs-role-points cs-journey-points">
          {card.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
        {card.bands ? (
          <ul className="cs-journey-bands">
            <li className="cs-outcome is-acts">From 85: orders</li>
            <li className="cs-outcome is-asks">From 70: asks</li>
            <li className="cs-outcome is-hands-over">Under 70: sales rep</li>
          </ul>
        ) : null}
        <p className="cs-b3 cs-journey-edge">
          <strong>Edge case:</strong> {card.edge}
        </p>
        <div className="cs-journey-tags">
          {card.today ? (
            <span className="cs-confidence is-high">Builds on Saga today</span>
          ) : (
            <span className="cs-confidence">Test: {card.test}</span>
          )}
          {card.links?.map((code) => (
            <a key={code} className="cs-journey-link" href={`#${id}-${code}`}>
              {code}
            </a>
          ))}
        </div>
        {card.why ? (
          <details className="cs-journey-why">
            <summary>Why</summary>
            <p className="cs-h4">{card.why.title}</p>
            <dl className="cs-limit-list">
              <div>
                <dt className="cs-agent-label">Why I decided this</dt>
                <dd className="cs-b3">{card.why.decided}</dd>
              </div>
              <div>
                <dt className="cs-agent-label">In Saga’s favour</dt>
                <dd className="cs-b3">{card.why.favour}</dd>
              </div>
              <div>
                <dt className="cs-agent-label">Watch out</dt>
                <dd className="cs-b3">{card.why.watch}</dd>
              </div>
            </dl>
          </details>
        ) : null}
      </article>
    </>
  )
}

export function CaseStudy4Journeys({ id }: { id: string }) {
  const [stepIndex, setStepIndex] = useState(1)
  const step = orderPath[stepIndex]

  return (
    <div id={id} className="cs-chapter">
      <section className="cs-block" aria-labelledby={`${id}-title`}>
        <div className="cs-block-head">
          <p className="cs-chapter-label">05 Journeys</p>
          <h2 id={`${id}-title`} className="cs-h1">
            Two journeys, one order.
          </h2>
          <p className="cs-b1 cs-block-summary">
            The buyer’s side and the merchant’s side of the same urgent order. Where the agent
            stops, a sales rep picks it up with the whole case in hand.
          </p>
        </div>
      </section>

      <section className="cs-block" aria-labelledby={`${id}-follow`}>
        <div className="cs-block-head">
          <h3 id={`${id}-follow`} className="cs-h2">
            Follow the order
          </h3>
          <p className="cs-b1 cs-block-summary">
            The Golf in bay 2 is waiting on the lift for a water pump. Choose any step. At B4 the
            order splits: the pump clears the threshold, and the belt kit stops.
          </p>
        </div>
        <div className="cs-block-body">
          <div className="cs-summary">
            <ol className="cs-path">
              {orderPath.map((item, index) => (
                <li key={item.code}>
                  <button
                    type="button"
                    className={`cs-path-step is-${item.code[0] === 'B' ? 'buyer' : 'merchant'}`}
                    aria-pressed={index === stepIndex}
                    onClick={() => setStepIndex(index)}
                  >
                    <span className="cs-journey-code">
                      {item.code}
                      {item.person ? (
                        <>
                          <span aria-hidden="true"> ★</span>
                          <span className="visually-hidden"> A person stays in control.</span>
                        </>
                      ) : null}
                    </span>
                    <span className="cs-step-title">{item.title}</span>
                    <span className="cs-b3 cs-source">{item.hint}</span>
                  </button>
                </li>
              ))}
            </ol>
            <p className="cs-path-caption" role="status">
              <span className="cs-journey-code">{step.code}</span> {step.text}
            </p>
            <div className="cs-path-keys" aria-hidden="true">
              <span className="cs-path-key is-buyer">Workshop side</span>
              <span className="cs-path-key is-merchant">Merchant side</span>
              <span>★ A person stays in control</span>
            </div>
          </div>
          <ul className="cs-checks">
            {control.map((item) => (
              <li key={item.code} className="cs-summary-fact">
                <h4 className="cs-card-label">
                  {item.code}: {item.title}
                </h4>
                <p className="cs-b3">{item.text}</p>
              </li>
            ))}
          </ul>
          <p className="cs-small cs-note-text">
            Based on the prototype’s missing-fit-data path, using its mock ERP data.
          </p>
        </div>
      </section>

      <section className="cs-block" aria-labelledby={`${id}-steps`}>
        <div className="cs-block-head">
          <h3 id={`${id}-steps`} className="cs-h2">
            Step by step
          </h3>
          <p className="cs-b1 cs-block-summary">
            Both sides in full. Each card notes the study testing it, and links to the other side
            of any handover.
          </p>
        </div>
        <div className="cs-roles">
          <div className="cs-role-side is-a">
            <div className="cs-journey-head">
              <p className="cs-role-label">Workshop side, B1 to B8</p>
              <h4 className="cs-h3">Buyer journey</h4>
              <p className="cs-b3">
                A part fails with the car on the lift. The buyer orders by voice, WhatsApp or email,
                with an agent of its own.
              </p>
            </div>
            <div className="cs-role-cards">
              {buyerCards.map((card) => (
                <JourneyCard key={card.code} card={card} id={id} />
              ))}
            </div>
          </div>
          <div className="cs-role-side is-b">
            <div className="cs-journey-head">
              <p className="cs-role-label">Merchant side, M1 to M7</p>
              <h4 className="cs-h3">Merchant journey</h4>
              <p className="cs-b3">
                The merchant sets the rules once, takes the cases the agent shouldn’t decide, and
                tunes things each month.
              </p>
            </div>
            <div className="cs-role-cards">
              {merchantCards.map((card) => (
                <JourneyCard key={card.code} card={card} id={id} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="cs-block" aria-labelledby={`${id}-channels`}>
        <div className="cs-block-head">
          <h3 id={`${id}-channels`} className="cs-h2">
            Channel map
          </h3>
          <p className="cs-b1 cs-block-summary">
            Who uses each channel, and for what. Every order lands in the webshop, wherever it
            started.
          </p>
        </div>
        <div className="cs-block-body">
          <ul className="cs-channels">
            {channels.map((channel) => (
              <li key={channel.name} className="cs-summary-fact">
                <h4 className="cs-card-label">{channel.name}</h4>
                <p className="cs-b3 cs-source">{channel.who}</p>
                <p className="cs-b3">{channel.text}</p>
              </li>
            ))}
          </ul>
          <p className="cs-small cs-note-text">
            The same two journeys work for a food wholesaler. Only the trade data changes, with
            allergens and pack sizes replacing car fit.
          </p>
        </div>
      </section>
    </div>
  )
}
