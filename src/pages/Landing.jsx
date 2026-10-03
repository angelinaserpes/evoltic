import { useState } from 'react'
import { Nav, Footer } from '../components/Chrome.jsx'
import { Img, HeroVideo, Label, Reveal, Marquee, Pill, CapacityBars, Arrow } from '../components/ui.jsx'
import { plan, SAMPLE_INPUT, fmt } from '../lib/calc.js'

const sample = plan(SAMPLE_INPUT)

const STEPS = [
  { n: '01', t: 'Share three numbers from your bill', d: 'Sanctioned load, recorded maximum demand and the number of flats. We show you exactly where each one sits on the bill.' },
  { n: '02', t: 'We model your spare capacity', d: 'Your building’s real peak use is set against a safe planning limit, the way an electrical engineer would.' },
  { n: '03', t: 'See how many EVs fit', d: 'One clear number for today, a second with overnight scheduling, and the point where an upgrade becomes necessary.' },
  { n: '04', t: 'Take it to your AGM', d: 'Download a plain-language report the committee can share with residents, vendors and your DISCOM.' },
]

const SCENARIOS = [
  { slot: 'scenarioToday', k: 'Today', n: sample.today, t: 'EVs charging at the evening peak', d: 'Chargers on, no controls. The safe number with your current supply.' },
  { slot: 'scenarioNight', k: 'With scheduling', n: sample.scheduled, t: 'EVs with overnight smart charging', d: 'Spread across 10pm–6am, when the building is quiet.' },
  { slot: 'scenarioUpgrade', k: 'Upgrade point', n: `${sample.scheduled}+`, t: 'When to apply for more load', d: 'Beyond this, plan a load enhancement with your DISCOM — sized, not guessed.' },
]

const NEUTRAL = [
  { slot: 'neutral1', t: 'We sell no hardware', d: 'No chargers, no cables, no installation packages. Our only product is the answer.' },
  { slot: 'neutral2', t: 'No vendor commissions', d: 'We are not paid by charging companies, so the number we show you is never shaped by a sale.' },
  { slot: 'neutral3', t: 'Every assumption is visible', d: 'Safety margin, charger size, how many cars charge at once — shown, explained, and adjustable.' },
  { slot: 'neutral4', t: 'Built for Indian buildings', d: 'Sanctioned load, maximum demand and DISCOM processes — modelled the way Indian supply actually works.' },
  { slot: 'neutral5', t: 'Committee-ready reports', d: 'A clear document for your AGM, written for residents, not engineers.' },
]

const QUOTES = [
  'Our electrical infrastructure is not future ready.',
  '400 charging points in the basement is not possible.',
  'We have no policy to allow individual chargers.',
]

const FACTS = [
  { n: '50%', t: 'of members must approve shared charging in an existing society under Maharashtra’s EV Policy 2025.', src: 'EVreporter · Maharashtra EV Policy 2025', href: 'https://evreporter.com/maharashtra-electric-vehicle-policy-2025/' },
  { n: '30%', t: 'of new vehicle registrations in Maharashtra should be electric by 2030, the state’s target.', src: 'EVreporter · Maharashtra EV Policy 2025', href: 'https://evreporter.com/maharashtra-electric-vehicle-policy-2025/' },
  { n: '2025', t: 'The Bombay High Court told the state to finalise EV charging rules and societies to update their bye-laws.', src: 'IndiaLaw · Bombay HC ruling', href: 'https://www.indialaw.in/blog/civil/bombay-hc-ev-charging-station-housing-societies/' },
]

const FAQ = [
  { q: 'Is this the same as an electrical audit?', a: 'No. Evoltic is a planning estimate that tells you whether chargers are realistic and roughly how many. Before installation, a licensed electrical contractor should verify the wiring, panels and earthing on site.' },
  { q: 'What if we don’t know our maximum demand?', a: 'Most HT and many LT bills print a “recorded maximum demand” every month. If yours doesn’t, we estimate it from the number of flats — and clearly mark the result as estimated.' },
  { q: 'Should EV chargers run on DG backup?', a: 'Generally no. Most societies keep EV chargers off the DG circuit so a power cut never drains diesel into car batteries. We flag this in your report if you have DG backup.' },
  { q: 'Common-area meter or individual meters?', a: 'Both work. Chargers on the common meter are simpler to approve but need a fair billing method; individual-meter connections keep billing clean but depend on each flat’s own sanctioned load.' },
  { q: 'How do residents get billed?', a: 'Smart chargers measure each car’s units, which the society can bill monthly at the common-area tariff plus a small maintenance charge. The report includes a simple billing note.' },
  { q: 'Who is Evoltic for?', a: 'Society committees, secretaries and facility managers who need a neutral answer before talking to vendors — and residents who want to make the case for chargers.' },
]

export default function Landing() {
  const [active, setActive] = useState(0)
  const [openFaq, setOpenFaq] = useState(0)

  return (
    <>
      <Nav overHero />
      <main>
        {/* ---------------- Hero ---------------- */}
        <section className="hero">
          <HeroVideo
            className="hero__img"
            poster="/videos/hero-poster.jpg"
            sources={[
              { src: '/videos/hero.webm', type: 'video/webm' },
              { src: '/videos/hero.mp4', type: 'video/mp4' },
            ]}
          />
          <div className="hero__scrim" />
          <div className="wrap hero__inner">
            <p className="mono hero__kicker">EV readiness for housing societies</p>
            <h1 className="display hero__title">
              Know how many EVs your building can safely charge.
            </h1>
            <div className="hero__foot">
              <p className="hero__lede">
                A neutral planner that reads your society’s electricity supply and gives the committee one clear, defensible number — before anyone installs a charger.
              </p>
              <div className="hero__actions">
                <Pill to="/plan" variant="light" arrow>Check your building</Pill>
                <Pill to="/plan?sample" variant="ghost-light">Try a sample building</Pill>
              </div>
            </div>
            <a href="#intro" className="mono hero__scroll">Scroll <span aria-hidden="true">↓</span></a>
          </div>
          <a href="#answer" className="hero__card">
            <span className="mono hero__card-tag"><i />Sample result</span>
            <span className="hero__card-num">{sample.today}<small> EVs today</small></span>
            <span className="hero__card-sub">{fmt(SAMPLE_INPUT.flats)}-flat society, Navi Mumbai · {sample.scheduled} with overnight scheduling</span>
          </a>
        </section>

        <Marquee
          className="marquee--band"
          items={['Sanctioned load', 'Maximum demand', 'Safe headroom', 'Smart scheduling', 'Neutral advice', 'Committee-ready reports']}
        />

        {/* ---------------- Intro ---------------- */}
        <section id="intro" className="section ruled">
          <div className="wrap">
            <Label index="01">Who it’s for</Label>
            <Reveal as="h2" className="statement">
              Residents are asking for chargers.{' '}
              <span className="muted">Committees need a clear answer before saying yes — not a sales pitch, not a guess.</span>
            </Reveal>
            <div className="notes">
              <Reveal className="note" delay={100}>
                <span className="tag mono"><i />The problem</span>
                <p>Every new EV adds load to a supply that was sized years ago. Too many chargers trips breakers, stresses the transformer and invites penalties.</p>
              </Reveal>
              <Reveal className="note note--offset" delay={200}>
                <span className="tag mono"><i />The promise</span>
                <p>Evoltic turns your electricity bill into a safe EV limit — today, with scheduling, and when to upgrade — in about two minutes.</p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ---------------- How it works ---------------- */}
        <section id="how" className="section section--tint ruled">
          <div className="wrap">
            <div className="section__head">
              <Label index="02">How it works</Label>
              <Reveal as="h2" className="h2 section__title">Four steps to a clear answer.</Reveal>
            </div>
            <div className="how">
              <Reveal className="how__media">
                <Img slot="howItWorks" alt="Wall charger in a residential parking level" />
              </Reveal>
              <ol className="how__grid">
                {STEPS.map((s, i) => (
                  <Reveal as="li" key={s.n} className="how__cell" delay={i * 90}>
                    <span className="mono how__n">{s.n}</span>
                    <h3 className="h3">{s.t}</h3>
                    <p>{s.d}</p>
                  </Reveal>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* ---------------- The answer ---------------- */}
        <section id="answer" className="section ruled">
          <div className="wrap">
            <div className="section__head">
              <Label index="03">The answer, visualised</Label>
              <Reveal as="h2" className="h2 section__title">
                Your supply, your peak, your headroom. <span className="muted">One picture the whole committee understands.</span>
              </Reveal>
            </div>
            <CapacityBars
              r={sample}
              caption={
                <>
                  <span className="mono tag"><i />Sample · {fmt(SAMPLE_INPUT.flats)} flats · {SAMPLE_INPUT.sanctionedKVA} kVA</span>
                  {fmt(sample.spareKW)} kW of safe headroom ={' '}
                  <strong>{sample.today} EVs</strong> charging at the evening peak, with no changes to your supply.
                </>
              }
            />
          </div>
        </section>

        {/* ---------------- Scenarios ---------------- */}
        <section className="section section--dark">
          <div className="wrap">
            <div className="section__head">
              <Label index="04" dark>Three answers, not one</Label>
              <Reveal as="h2" className="h2 section__title">
                Today, tomorrow, and the point where you’ll need more.
              </Reveal>
            </div>
            <div className="scenes">
              {SCENARIOS.map((s, i) => (
                <Reveal key={s.k} className="scene" delay={i * 100}>
                  <Img slot={s.slot} />
                  <div className="scene__body">
                    <span className="mono scene__k">{s.k}</span>
                    <span className="scene__n">{s.n}</span>
                    <p className="scene__t">{s.t}</p>
                    <p className="scene__d">{s.d}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- Why neutral ---------------- */}
        <section id="neutral" className="section ruled">
          <div className="wrap">
            <div className="section__head">
              <Label index="05">Why neutral</Label>
              <Reveal as="h2" className="h2 section__title">
                An answer you can trust, because we have nothing to sell you.
              </Reveal>
            </div>
            <div className="neutral">
              <ul className="neutral__list">
                {NEUTRAL.map((n, i) => (
                  <li
                    key={n.t}
                    className={`neutral__row ${active === i ? 'is-active' : ''}`}
                    onMouseEnter={() => setActive(i)}
                  >
                    <button onClick={() => setActive(i)} aria-expanded={active === i}>
                      <span className="mono">0{i + 1}</span>
                      <span className="neutral__t">{n.t}</span>
                      <Arrow />
                    </button>
                    <div className="neutral__d">
                      <p>{n.d}</p>
                      <Img slot={n.slot} className="neutral__inline" />
                    </div>
                  </li>
                ))}
              </ul>
              <div className="neutral__media" aria-hidden="true">
                {NEUTRAL.map((n, i) => (
                  <Img key={n.slot} slot={n.slot} className={active === i ? 'is-active' : ''} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- Why now ---------------- */}
        <section id="why-now" className="section section--tint ruled">
          <div className="wrap">
            <div className="section__head">
              <Label index="06">Why now</Label>
              <Reveal as="h2" className="h2 section__title">
                Societies are being asked to decide. <span className="muted">Most have nothing to decide with.</span>
              </Reveal>
            </div>
            <div className="evidence">
              {QUOTES.map((q, i) => (
                <Reveal as="figure" key={q} delay={i * 90}>
                  <blockquote>“{q}”</blockquote>
                  <figcaption>A Mumbai housing society, reported by the Free Press Journal</figcaption>
                </Reveal>
              ))}
            </div>
            <div className="facts">
              {FACTS.map((f, i) => (
                <Reveal key={f.n} className="fact" delay={i * 90}>
                  <span className="fact__n">{f.n}</span>
                  <p>{f.t}</p>
                  <a href={f.href} target="_blank" rel="noreferrer">{f.src}</a>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- FAQ ---------------- */}
        <section id="faq" className="section ruled">
          <div className="wrap faq">
            <div>
              <Label index="07">Questions committees ask</Label>
              <Reveal as="h2" className="h2">Plainly answered.</Reveal>
            </div>
            <ul className="faq__list">
              {FAQ.map((f, i) => (
                <li key={f.q} className={`faq__row ${openFaq === i ? 'is-open' : ''}`}>
                  <button onClick={() => setOpenFaq(openFaq === i ? -1 : i)} aria-expanded={openFaq === i}>
                    <span>{f.q}</span>
                    <span className="faq__icon" aria-hidden="true" />
                  </button>
                  <div className="faq__a">
                    <div><p>{f.a}</p></div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ---------------- CTA ---------------- */}
        <section className="cta">
          <Img slot="cta" className="cta__img" alt="" />
          <div className="cta__scrim" />
          <div className="wrap cta__inner">
            <h2 className="display cta__title">
              <Reveal as="span">Plan before</Reveal>
              <Reveal as="span" delay={120} className="cta__indent">you plug in.</Reveal>
            </h2>
            <div className="cta__actions">
              <Pill to="/plan" variant="light" arrow>Check your building</Pill>
              <Pill href="#how" variant="ghost-light">See how it works</Pill>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
