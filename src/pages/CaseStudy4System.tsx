import { useState } from 'react'
import type { CSSProperties } from 'react'
import { DecisionNote } from './caseStudyParts.tsx'
import { SkillRun } from './SkillRun.tsx'
import { SystemFlow } from './SystemFlow.tsx'
import { TokenStory } from './TokenStory.tsx'

const testSteps = [
  { who: 'The researcher', title: 'Hypothesis', text: 'Each hypothesis is a bet that a test can prove wrong.', example: 'At a fit score of 85 out of 100, the agent picks the rep’s part.' },
  { who: 'Researcher and engineer', title: 'Test', text: 'The agent’s rules go through a replay and then shadow mode, with A/B where traffic allows.', example: 'A year of past orders replayed from week 1, and 5 sales reps testing the case card in weeks 2 to 4.' },
  { who: 'The designers, with AI tools', title: 'Design', text: 'Designers build from the same tokens and skills, and every fit score shows its reason.' },
  { who: 'Engineer and QA', title: 'Ship', text: 'One release reaches every channel. The build runs the checks, then QA and I sign off.' },
]

const swatches = [
  { name: 'Blue', colour: '#1f4fbf' },
  { name: 'Green', colour: '#1b6b3a' },
  { name: 'Brick red', colour: '#a33b28' },
  { name: 'Plum', colour: '#6b2d73' },
]

const states = [
  { name: 'Go', tone: 'acts' },
  { name: 'Look first', tone: 'asks' },
  { name: 'A person', tone: 'hands-over' },
  { name: 'Stop', tone: 'stops' },
  { name: 'Closed', tone: 'closed' },
  { name: 'Action', tone: 'brand' },
]

const lines = [
  { part: '1 × Water pump, metal impeller', detail: 'Hollen, fit 90, arrives 10:45', price: '€148.60' },
  { part: '1 × Timing belt kit', detail: 'Original part, fit 100, arrives 10:45', price: '€176.90' },
]

const skillParts = [
  { title: 'Use when', text: 'The agent talks to a buyer or an approver in WhatsApp.', note: 'Who reads it, and where' },
  { title: 'Limits', text: 'At most 3 reply buttons per message, a list of up to 10 rows, and templates outside the 24-hour window.', note: 'Set by the channel itself' },
  { title: 'Must show', text: 'The sender and “AI ordering agent”, one short message with the point first, and up to 4 facts with the source and age on each number. Up to 3 buttons, with a way to reach a person. A safety part gets no order button.', note: 'The same facts, in the same order' },
  { title: 'Tokens', text: 'Chat, action and agent role tokens.', note: 'Role tokens, so any brand flows in' },
  { title: 'Checked', text: 'Against the rules file, and then by a person. A Teams card also runs through a script.', note: 'By a script, then a designer' },
]

const cardChecks = [
  { rule: 'Source and age on every number', good: '7 numbers, each stamped', bad: '€176.90 has none' },
  { rule: 'At most 3 actions', good: '2 actions', bad: '4 actions' },
  { rule: 'No action on a safety part', good: 'None in the card', bad: '“Order now” sits on the brake pads' },
]

const onBrand = (colour: string) => ({ '--cs-brand': colour }) as CSSProperties

export function CaseStudy4System({ id }: { id: string }) {
  const [brand, setBrand] = useState(swatches[0])

  return (
    <div id={id} className="cs-chapter">
      <section className="cs-block" aria-labelledby={`${id}-title`}>
        <div className="cs-block-head">
          <p className="cs-chapter-label">07 System</p>
          <h2 id={`${id}-title`} className="cs-h1">
            One design system behind every channel.
          </h2>
          <p className="cs-b1 cs-block-summary">
            All channels run on one agent-first design system. AI tools and agents read it as files,
            and each build runs the checks.
          </p>
        </div>
      </section>

      <section className="cs-block" aria-labelledby={`${id}-connects`}>
        <div className="cs-block-head">
          <h3 id={`${id}-connects`} className="cs-h2">
            How it connects
          </h3>
          <p className="cs-b1 cs-block-summary">
            One doc goes in, and the same order comes out everywhere. Each need becomes a hypothesis,
            and only what passes a test goes into the system.
          </p>
        </div>
        <div className="cs-block-body">
          <SystemFlow />
          <DecisionNote decision="Source stamps in today’s webshop come first at Saga." assumption>
            <p className="cs-b2">
              Each number carries its ERP source and age, from the connection Saga webshops already
              use, and the stamps need no agent. Channels such as Teams or SMS follow once the system
              holds.
            </p>
            <p className="cs-small">
              Assumption: a new merchant needs no design hours. The pilot counts them, and times one
              channel from prompt to a passing card.
            </p>
          </DecisionNote>
        </div>
      </section>

      <section className="cs-block" aria-labelledby={`${id}-evidence`}>
        <div className="cs-block-head">
          <h3 id={`${id}-evidence`} className="cs-h2">
            Evidence first
          </h3>
          <p className="cs-b1 cs-block-summary">
            A test decides what goes live. Each change starts as a line in one requirements doc,
            which the PM and I write as the agent behaviour spec.
          </p>
        </div>
        <div className="cs-block-body">
          <ol className="cs-test-steps">
            {testSteps.map((step, index) => (
              <li key={step.title} className="cs-summary-fact">
                <span className="cs-marker" aria-hidden="true">
                  {index + 1}
                </span>
                <p className="cs-b3 cs-source">{step.who}</p>
                <h4 className="cs-card-label">{step.title}</h4>
                <p className="cs-b3">{step.text}</p>
                {step.example ? (
                  <p className="cs-b3 cs-source">
                    <strong>In this case:</strong> {step.example}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
          <p className="cs-callout">
            <strong>Agent gate.</strong> A category acts alone only at 90% agreement with the reps in
            its replay. That has to hold in shadow mode, and then a person switches it on.
          </p>
        </div>
      </section>

      <section className="cs-block" aria-labelledby={`${id}-tokens`}>
        <div className="cs-block-head">
          <h3 id={`${id}-tokens`} className="cs-h2">
            One change, everywhere
          </h3>
          <p className="cs-b1 cs-block-summary">
            Design, engineering and AI read one set of token files: primitive to semantic to role,
            plus one file per merchant.
          </p>
        </div>
        <div className="cs-block-body">
          <TokenStory />
          <div className="cs-summary">
            <p className="cs-b2">
              Each agent state is a token, so every channel says the same thing, using 5 state colours.
              The brand only marks actions.
            </p>
            <ul className="cs-journey-bands">
              {states.map((state) => (
                <li key={state.name} className={`cs-outcome is-${state.tone}`}>
                  {state.name}
                </li>
              ))}
            </ul>
            <p className="cs-small">
              Assumption: buyers read the state pills at a glance. In the workshop visits, weeks 1 to
              4, buyers say what each means. With fewer than 8 of 10 right, the words change.
            </p>
          </div>
          <DecisionNote decision="Voice gets tokens too, as speaking rules." assumption>
            <p className="cs-b2">
              Voice has no colour, so its tokens are words and order: part, price, arrival, then the
              source.
            </p>
            <p className="cs-small">
              Assumption: buyers can follow that order by ear. The voice test with 6 buyers in weeks 6
              to 8 checks it.
            </p>
          </DecisionNote>
        </div>
      </section>

      <section className="cs-block" aria-labelledby={`${id}-playground`}>
        <div className="cs-block-head">
          <h3 id={`${id}-playground`} className="cs-h2">
            The playground
          </h3>
          <p className="cs-b1 cs-block-summary">
            One order, in two channels and any brand. Each render uses the same tokens, so choosing a
            colour changes both.
          </p>
        </div>
        <div className="cs-block-body">
          <div className="cs-dial-switch cs-swatches" role="group" aria-label="Brand colour">
            {swatches.map((swatch) => (
              <button
                key={swatch.name}
                type="button"
                className="cs-dial-part"
                aria-pressed={brand.name === swatch.name}
                onClick={() => setBrand(swatch)}
              >
                <span
                  className="cs-token-swatch"
                  style={onBrand(swatch.colour)}
                  aria-hidden="true"
                />
                {swatch.name}
              </button>
            ))}
          </div>
          <div className="cs-playground" style={onBrand(brand.colour)}>
            <article className="cs-agent">
              <p className="cs-agent-label">Webshop</p>
              <div className="cs-playground-head">
                <h4 className="cs-card-label">Delta Parts, order DP-20418</h4>
                <span className="cs-outcome is-acts">Agent acted</span>
              </div>
              <ul className="cs-playground-lines">
                {lines.map((line) => (
                  <li key={line.part}>
                    <div>
                      <p className="cs-step-title">{line.part}</p>
                      <p className="cs-b3 cs-source">{line.detail}</p>
                    </div>
                    <div className="cs-playground-price">
                      <p className="cs-step-title">{line.price}</p>
                      <p className="cs-b3 cs-source">ERP, 2 min ago</p>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="cs-playground-total">
                Approved by the workshop owner <strong>€325.50</strong>
              </p>
              <span className="cs-brand-button">Undo until 07:54</span>
            </article>
            <article className="cs-agent">
              <p className="cs-agent-label">WhatsApp</p>
              <div className="cs-playground-head">
                <h4 className="cs-card-label">Delta Parts, AI ordering agent</h4>
                <span className="cs-outcome is-acts">Agent acted</span>
              </div>
              <p className="cs-b3">Your receipt.</p>
              <ul className="cs-playground-lines">
                {lines.map((line) => (
                  <li key={line.part}>
                    <p className="cs-step-title">{line.part}</p>
                    <p className="cs-step-title">{line.price}</p>
                  </li>
                ))}
              </ul>
              <p className="cs-playground-total">
                Total <strong>€325.50</strong>
              </p>
              <p className="cs-b3 cs-source">Contract prices, ERP, 2 min ago</p>
              <div className="cs-playground-actions">
                <span className="cs-brand-button">Undo order</span>
                <span className="cs-quiet-button">Track the van</span>
                <span className="cs-quiet-button">Talk to a sales rep</span>
              </div>
            </article>
          </div>
          <DecisionNote decision="A new trade means new values, not a new design." assumption>
            <p className="cs-b2">
              Lab supplies for hospitals use the same 3 rule types, with values like catalogue number,
              sterility, lot and expiry.
            </p>
            <p className="cs-small">
              The case runs 2 trades on one design. A third isn’t built yet, so its own replay would
              test it.
            </p>
          </DecisionNote>
        </div>
      </section>

      <section className="cs-block" aria-labelledby={`${id}-skill`}>
        <div className="cs-block-head">
          <h3 id={`${id}-skill`} className="cs-h2">
            Inside a skill
          </h3>
          <p className="cs-b1 cs-block-summary">
            A skill is one short file an AI tool follows to build one thing. Each channel skill has
            the same 5 parts in the same order, shown here for a WhatsApp card.
          </p>
        </div>
        <div className="cs-block-body">
          <SkillRun parts={skillParts} />
          <div className="cs-table-card">
            <table className="cs-table">
              <caption className="visually-hidden">The same script run on two Teams cards</caption>
              <thead>
                <tr>
                  <th scope="col">The script’s rule</th>
                  <th scope="col">Good card: passes 3 of 3</th>
                  <th scope="col">Bad card: fails 3 of 3</th>
                </tr>
              </thead>
              <tbody>
                {cardChecks.map((check) => (
                  <tr key={check.rule}>
                    <th scope="row">{check.rule}</th>
                    <td>{check.good}</td>
                    <td>{check.bad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="cs-small cs-note-text">
            The script checks 3 rules on each Teams card, and a person judges the rest. In production,
            a card that fails goes to a sales rep.
          </p>
        </div>
      </section>
    </div>
  )
}
