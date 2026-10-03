import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Logo, Pill, CapacityBars, NightChart, Arrow } from '../components/ui.jsx'
import { plan, simulateNight, surveyProfiles, SAMPLE_INPUT, isScooter, DEFAULTS, CHARGERS, DISCOMS, estimatePeakKVA, fmt } from '../lib/calc.js'

const STEPS = ['Building', 'Supply', 'Peak use', 'Charging', 'Backup']
const STORE = 'chargeready:input'

const EMPTY = {
  societyName: '',
  city: DISCOMS[0],
  flats: '',
  sanctionedKVA: '',
  peakKVA: '',
  estimatePeak: false,
  chargerKW: 3.3,
  expectedEVs: '',
  hasDG: null,
}

// Same sample building as the landing page, so the demo numbers match.
const SAMPLE = { ...SAMPLE_INPUT, societyName: 'Sample society, Navi Mumbai' }

function loadSurvey() {
  try {
    return JSON.parse(localStorage.getItem('chargeready:survey')) || []
  } catch {
    return []
  }
}

const hasParam = (k) => {
  try {
    return new URLSearchParams(window.location.search).has(k)
  } catch {
    return false
  }
}

const isComplete = (v) =>
  Number(v.flats) > 0 && Number(v.sanctionedKVA) > 0 && (v.estimatePeak || Number(v.peakKVA) > 0) && v.expectedEVs !== '' && v.hasDG !== null

const wantsSample = () => {
  try {
    return new URLSearchParams(window.location.search).has('sample')
  } catch {
    return false
  }
}

function load() {
  if (wantsSample()) return SAMPLE
  try {
    const v = JSON.parse(localStorage.getItem(STORE))
    return v ? { ...EMPTY, ...v } : EMPTY
  } catch {
    return EMPTY
  }
}

export default function Planner() {
  const [input, setInput] = useState(load)
  const [step, setStep] = useState(0)
  const [showResult, setShowResult] = useState(() => wantsSample() || (hasParam('results') && isComplete(input)))
  const topRef = useRef(null)

  const set = (k) => (v) => setInput((s) => ({ ...s, [k]: v }))

  useEffect(() => {
    try {
      localStorage.setItem(STORE, JSON.stringify(input))
    } catch {
      /* storage unavailable — fine */
    }
  }, [input])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [step, showResult])

  const valid = [
    Number(input.flats) > 0,
    Number(input.sanctionedKVA) > 0,
    input.estimatePeak || Number(input.peakKVA) > 0,
    input.expectedEVs !== '' && Number(input.expectedEVs) >= 0,
    input.hasDG !== null,
  ]

  const next = () => {
    if (!valid[step]) return
    if (step < STEPS.length - 1) setStep(step + 1)
    else setShowResult(true)
  }

  const onKey = (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') {
      e.preventDefault()
      next()
    }
  }

  return (
    <div className="app" ref={topRef}>
      <header className="app__bar">
        <div className="wrap app__bar-inner">
          <Logo />
          <span className="mono app__bar-title">{showResult ? 'Your result' : 'Building check'}</span>
          <Link to="/" className="mono app__exit">Exit</Link>
        </div>
        {!showResult && (
          <div className="app__progress" aria-hidden="true">
            <span style={{ '--p': (step + 1) / STEPS.length }} />
          </div>
        )}
      </header>

      {showResult ? (
        <Result
          input={input}
          onEdit={() => {
            setShowResult(false)
            setStep(0)
          }}
          onReset={() => {
            setInput(EMPTY)
            setShowResult(false)
            setStep(0)
          }}
        />
      ) : (
        <main className="wrap flow ruled-app" onKeyDown={onKey}>
          <aside className="flow__steps">
            <p className="mono flow__count">
              Step {String(step + 1).padStart(2, '0')} / {String(STEPS.length).padStart(2, '0')}
            </p>
            <ol>
              {STEPS.map((s, i) => (
                <li key={s} className={i === step ? 'is-current' : i < step ? 'is-done' : ''}>
                  <button disabled={i > step} onClick={() => setStep(i)}>
                    <span className="mono">0{i + 1}</span>
                    {s}
                  </button>
                </li>
              ))}
            </ol>
            <button className="mono flow__sample" onClick={() => { setInput(SAMPLE); setShowResult(true) }}>
              Try a sample building →
            </button>
          </aside>

          <section className="flow__q" key={step}>
            {step === 0 && (
              <>
                <h1 className="q__title">Tell us about your society.</h1>
                <p className="q__help">This helps us size the estimate and label your report.</p>
                <Field label="Society name (optional)">
                  <input
                    className="in in--text"
                    value={input.societyName}
                    placeholder="e.g. Green Meadows CHS"
                    onChange={(e) => set('societyName')(e.target.value)}
                  />
                </Field>
                <Field label="Electricity supplier (DISCOM)">
                  <select className="in in--text" value={input.city} onChange={(e) => set('city')(e.target.value)}>
                    {DISCOMS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </Field>
                <Field label="Number of flats">
                  <NumberInput value={input.flats} onChange={set('flats')} unit="flats" autoFocus />
                </Field>
              </>
            )}

            {step === 1 && (
              <>
                <h1 className="q__title">What is your building’s sanctioned load?</h1>
                <p className="q__help">
                  The maximum supply your DISCOM has approved for the society’s common connection. Sometimes printed as “contract demand”.
                </p>
                <Field label="Sanctioned load">
                  <NumberInput value={input.sanctionedKVA} onChange={set('sanctionedKVA')} unit="kVA" autoFocus />
                </Field>
                <BillHelp highlight="sanctioned" />
              </>
            )}

            {step === 2 && (
              <>
                <h1 className="q__title">How much of it do you use at peak?</h1>
                <p className="q__help">
                  The highest “recorded maximum demand” on your bills over the last 12 months. Use the highest month — usually summer.
                </p>
                {!input.estimatePeak && (
                  <Field label="Highest recorded maximum demand">
                    <NumberInput value={input.peakKVA} onChange={set('peakKVA')} unit="kVA" autoFocus />
                  </Field>
                )}
                <label className="check">
                  <input
                    type="checkbox"
                    checked={input.estimatePeak}
                    onChange={(e) => set('estimatePeak')(e.target.checked)}
                  />
                  <span className="check__box" aria-hidden="true" />
                  <span>
                    I don’t have this — estimate it from the number of flats
                    {input.estimatePeak && Number(input.flats) > 0 && (
                      <em className="mono"> ≈ {estimatePeakKVA(input.flats)} kVA, marked as estimated</em>
                    )}
                  </span>
                </label>
                {!input.estimatePeak && <BillHelp highlight="peak" />}
              </>
            )}

            {step === 3 && (
              <>
                <h1 className="q__title">How will residents charge?</h1>
                <p className="q__help">Most societies start with 3.3 kW chargers for cars. Choose 1.2 kW if most of your EVs are scooters or bikes.</p>
                <div className="choices choices--three">
                  {CHARGERS.map((c) => (
                    <button
                      key={c.kw}
                      className={`choice ${input.chargerKW === c.kw ? 'is-on' : ''}`}
                      onClick={() => set('chargerKW')(c.kw)}
                      aria-pressed={input.chargerKW === c.kw}
                    >
                      <span className="choice__k">{c.label}</span>
                      <span className="choice__d">{c.note}</span>
                    </button>
                  ))}
                </div>
                <Field label="EVs you expect in the next 3 years">
                  <NumberInput value={input.expectedEVs} onChange={set('expectedEVs')} unit="EVs" />
                </Field>
              </>
            )}

            {step === 4 && (
              <>
                <h1 className="q__title">Does the society have DG backup?</h1>
                <p className="q__help">We’ll add guidance on keeping chargers off the generator circuit.</p>
                <div className="choices choices--row">
                  {[['Yes', true], ['No', false]].map(([l, v]) => (
                    <button
                      key={l}
                      className={`choice ${input.hasDG === v ? 'is-on' : ''}`}
                      onClick={() => set('hasDG')(v)}
                      aria-pressed={input.hasDG === v}
                    >
                      <span className="choice__k">{l}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className="q__nav">
              {step > 0 ? (
                <button className="pill pill--outline" onClick={() => setStep(step - 1)}>Back</button>
              ) : (
                <span />
              )}
              <button className="pill pill--solid" disabled={!valid[step]} onClick={next}>
                <span>{step === STEPS.length - 1 ? 'See the result' : 'Continue'}</span>
                <Arrow />
              </button>
            </div>
          </section>
        </main>
      )}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span className="mono field__label">{label}</span>
      {children}
    </label>
  )
}

function NumberInput({ value, onChange, unit, autoFocus }) {
  return (
    <span className="num">
      <input
        className="in in--num"
        type="number"
        inputMode="numeric"
        min="0"
        value={value}
        placeholder="0"
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
      />
      <span className="mono num__unit">{unit}</span>
    </span>
  )
}

function BillHelp({ highlight }) {
  const [open, setOpen] = useState(false)
  const rows = [
    ['Consumer no.', '1700 2345 6789'],
    ['Tariff category', 'LT — Residential (common)'],
    ['Sanctioned load', '250 kVA', 'sanctioned'],
    ['Contract demand', '250 kVA', 'sanctioned'],
    ['Recorded max. demand', '140 kVA', 'peak'],
    ['Units consumed', '18,420 kWh'],
  ]
  return (
    <div className="billhelp">
      <button className="billhelp__toggle mono" onClick={() => setOpen(!open)} aria-expanded={open}>
        {open ? '— Hide' : '+ Where do I find this?'}
      </button>
      {open && (
        <div className="bill">
          <p className="mono bill__head">Illustrative bill · labels vary by DISCOM</p>
          {rows.map(([k, v, h]) => (
            <div key={k} className={`bill__row ${h === highlight ? 'is-hl' : ''}`}>
              <span>{k}</span>
              <span className="mono">{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ---------------------------- Result ---------------------------- */

const SLIDERS = [
  { k: 'safetyMargin', label: 'Safe planning limit', min: 0.6, max: 0.9, step: 0.05, show: (v) => `${Math.round(v * 100)}%`, help: 'Share of sanctioned supply you allow yourselves to use.' },
  { k: 'diversity', label: 'Chargers on at the same time', min: 0.4, max: 1, step: 0.05, show: (v) => `${Math.round(v * 100)}%`, help: 'At the evening peak, without any scheduling.' },
  { k: 'dailyKWh', label: 'Energy per car per day', min: 4, max: 14, step: 1, show: (v) => `${v} kWh`, help: '7 kWh ≈ 45 km of city driving. Scooters on a 1.2 kW charger use 1.5 kWh.' },
  { k: 'windowHours', label: 'Overnight charging window', min: 5, max: 10, step: 1, show: (v) => `${v} hrs`, help: 'Hours when scheduled charging is allowed.' },
]

const SAFETY = [
  { t: 'Installed by a licensed electrical contractor', why: 'Required by the Maharashtra EV charging safety advisory.' },
  { t: 'Overload protection on every charger circuit', why: 'Trips the circuit before cables overheat.' },
  { t: 'Charging outlet at least 800 mm above the highest flood level', why: 'Basements and stilt parking flood in the monsoon.' },
  { t: 'Vehicle connection within 5 m of the charging point', why: 'No extension cables across the parking floor.' },
  { t: 'Child-proof, and away from play areas', why: 'Common areas are shared with children.' },
  { t: 'Not on the DG backup circuit', why: 'A power cut should never run cars on diesel.' },
]

function Result({ input, onEdit, onReset }) {
  const [a, setA] = useState(DEFAULTS)
  const r = useMemo(() => plan(input, a), [input, a])
  const [evs, setEvs] = useState(() => Number(input.expectedEVs) || Math.max(1, r.today))
  const profiles = useMemo(() => surveyProfiles(loadSurvey(), a), [a])
  const [useSurvey, setUseSurvey] = useState(profiles.length > 0)
  const surveyOn = useSurvey && profiles.length > 0
  const sim = useMemo(() => simulateNight(input, a, evs, surveyOn ? profiles : null), [input, a, evs, surveyOn, profiles])
  const surveyCounts = {
    cars: profiles.filter((p) => !p.scooter && !p.planning).length,
    scooters: profiles.filter((p) => p.scooter).length,
    planning: profiles.filter((p) => p.planning).length,
  }
  const evMax = Math.max(20, Math.ceil((r.scheduled * 1.6) / 10) * 10)
  const name = input.societyName?.trim() || 'Your society'
  const overLimit = r.peakKW >= r.safeKW

  const verdict = overLimit
    ? { tag: 'Above safe limit', text: 'Your building already runs close to its safe limit at peak. Plan a load enhancement before adding chargers.' }
    : r.status === 'comfortable'
      ? { tag: 'Comfortable', text: `Your expected ${r.expected} EVs fit within today’s supply, with room to spare.` }
      : r.status === 'schedule'
        ? { tag: 'Schedule charging', text: `${r.expected} EVs are possible on your current supply — if chargers are scheduled overnight.` }
        : { tag: 'Plan an upgrade', text: `For ${r.expected} EVs, apply for roughly +${fmt(r.upgradeKVA)} kVA of additional sanctioned load.` }

  const scooters = isScooter(input.chargerKW)
  const vehicle = scooters ? 'e-scooters and e-bikes' : 'electric cars'
  const policy = [
    ['Purpose', `To let members charge ${vehicle} at the society safely, within the building’s electrical capacity, and fairly for all members.`],
    ['Capacity', `Based on a Evoltic planning estimate, the common supply (${fmt(input.sanctionedKVA)} kVA sanctioned) can support about ${r.today} EVs charging at the evening peak, or about ${r.scheduled} with overnight scheduling. The committee will review this when requests pass ${r.today}.`],
    ['Chargers', `Members may install a ${input.chargerKW} kW charger in their allotted parking at their own cost. Chargers on the common supply must support load management so the society can cap total EV power.`],
    ['Scheduling', `Above ${r.today} EVs, chargers on the common supply will charge overnight, within the ${a.windowHours}-hour window from 10 pm.`],
    ['Metering and billing', 'Each charger is metered. Members pay for their units at the common-area tariff plus a small maintenance charge, billed monthly with maintenance.'],
    ['Safety', 'Every installation is done by a licensed electrical contractor and follows the state safety advisory and the checklist attached to this policy.'],
    ...(input.hasDG ? [['Backup power', 'EV chargers are not connected to the DG backup circuit.']] : []),
    ['Approvals', 'The committee will respond to a member’s NOC request within 7 days, as advised by the Registrar of Cooperative Societies.'],
  ]
  const [copied, setCopied] = useState(false)
  const copyPolicy = async () => {
    const text = `${name} — Draft EV charging policy\n\n` + policy.map(([h, t], i) => `${i + 1}. ${h}. ${t}`).join('\n\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const notes = [
    input.estimatePeak && 'Peak demand was estimated from the number of flats. Replace it with the recorded figure from your bill for a firmer answer.',
    input.hasDG && 'Keep EV chargers off the DG backup circuit, so a power cut never runs cars on diesel.',
    r.status !== 'comfortable' && 'Ask vendors for chargers with load management (OCPP support), so the society can cap total EV power.',
    'Meter each charger and bill residents for their units at the common-area tariff.',
    'Share the resident survey link to learn when people arrive, leave and how far they drive.',
    'Before installation, have a licensed electrical contractor verify panels, cabling and earthing on site.',
  ].filter(Boolean)

  return (
    <main className="result">
      <div className="wrap print-only report-head">
        <span>Evoltic · EV readiness report</span>
        <span>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
      </div>
      <section className="wrap result__hero ruled-app">
        <p className="mono result__meta">
          {name} · {fmt(input.flats)} flats · {input.city}
        </p>
        <div className="result__headline">
          <span className="result__num">{r.today}</span>
          <h1 className="result__title">
            EVs can charge safely at today’s evening peak.
            <span className="muted"> {r.scheduled} with overnight scheduling.</span>
          </h1>
        </div>
        <div className={`verdict verdict--${overLimit ? 'upgrade' : r.status}`}>
          <span className="mono tag"><i />{verdict.tag}</span>
          <p>{verdict.text}</p>
        </div>
      </section>

      <section className="wrap result__section">
        <p className="mono result__h">01 — Your supply, at a glance</p>
        <CapacityBars
          r={r}
          caption={
            <>
              Each EV on a {input.chargerKW} kW charger needs about {fmt(r.perEV, 1)} kW of headroom at peak.{' '}
              <strong>{fmt(r.spareKW)} kW ÷ {fmt(r.perEV, 1)} kW = {r.today} EVs.</strong>
            </>
          }
        />
      </section>

      <section className="wrap result__section">
        <p className="mono result__h">02 — Tonight, simulated</p>
        <p className="result__lede no-print">
          Every 15 minutes from 6 pm to 9 am, against your safe limit. Switch between everyone charging on arrival and smart scheduling{surveyOn ? '.' : ', and drag the slider to add EVs.'}
        </p>
        {profiles.length > 0 && (
          <div className="night__source no-print" role="group" aria-label="Simulation data">
            <button className={surveyOn ? 'chip is-on' : 'chip'} onClick={() => setUseSurvey(true)}>
              Resident survey · {profiles.length}
            </button>
            <button className={surveyOn ? 'chip' : 'chip is-on'} onClick={() => setUseSurvey(false)}>
              Typical evening
            </button>
          </div>
        )}
        {surveyOn ? (
          <p className="night__survey">
            Using {profiles.length} resident {profiles.length === 1 ? 'answer' : 'answers'} ({surveyCounts.cars} cars, {surveyCounts.scooters} scooters or bikes
            {surveyCounts.planning ? `, ${surveyCounts.planning} planning to buy` : ''}): each vehicle arrives and leaves when its owner said, and needs the energy for their daily driving.
          </p>
        ) : (
        <label className="slider night__controls no-print">
          <span className="slider__top">
            <span>EVs plugging in tonight</span>
            <span className="mono">{evs}</span>
          </span>
          <input
            id="night-evs"
            type="range"
            min="1"
            max={evMax}
            step="1"
            value={Math.min(evs, evMax)}
            onChange={(e) => setEvs(Number(e.target.value))}
            style={{ '--v': (Math.min(evs, evMax) - 1) / (evMax - 1) }}
          />
          <span className="slider__help">Arrivals spread from 6:30 to 10:30 pm, departures from 6:30 to 9:30 am. Smart charging uses the {a.windowHours}-hour window from 10 pm.</span>
        </label>
        )}
        <NightChart sim={sim} />
      </section>

      <section className="wrap result__section">
        <p className="mono result__h">03 — Three answers</p>
        <div className="answers">
          <div className="answer">
            <span className="mono">Today</span>
            <span className="answer__n">{r.today}</span>
            <p>EVs charging freely at the evening peak, no controls needed.</p>
          </div>
          <div className="answer">
            <span className="mono">With scheduling</span>
            <span className="answer__n">{r.scheduled}</span>
            <p>EVs when chargers share the {a.windowHours}-hour overnight window, when the building is quiet.</p>
          </div>
          <div className="answer answer--accent">
            <span className="mono">Upgrade point</span>
            <span className="answer__n">{r.scheduled + 1}+</span>
            <p>
              {r.upgradeKVA > 0
                ? `For your expected ${r.expected} EVs: apply for about +${fmt(r.upgradeKVA)} kVA.`
                : `Your expected ${r.expected} EVs stay below this point — no upgrade needed yet.`}
            </p>
          </div>
        </div>
      </section>

      <section className="wrap result__section result__split">
        <div>
          <p className="mono result__h">04 — Assumptions</p>
          <p className="result__lede">
            Every number above comes from these. Adjust them to match your building — the result updates instantly.
          </p>
          <button className="pill pill--outline no-print" onClick={() => setA(DEFAULTS)}>Reset to defaults</button>
        </div>
        <div className="sliders">
          {SLIDERS.map((s) => (
            <label key={s.k} className="slider">
              <span className="slider__top">
                <span>{s.label}</span>
                <span className="mono">{s.show(a[s.k])}</span>
              </span>
              <input
                type="range"
                min={s.min}
                max={s.max}
                step={s.step}
                value={a[s.k]}
                onChange={(e) => setA({ ...a, [s.k]: Number(e.target.value) })}
                style={{ '--v': (a[s.k] - s.min) / (s.max - s.min) }}
              />
              <span className="slider__help">{s.help}</span>
            </label>
          ))}
          <div className="slider slider--static">
            <span className="slider__top">
              <span>Power factor</span>
              <span className="mono">{a.powerFactor}</span>
            </span>
            <span className="slider__help">Converts kVA on your bill to usable kW.</span>
          </div>
        </div>
      </section>

      <section className="wrap result__section result__split">
        <div>
          <p className="mono result__h">05 — Next steps for the committee</p>
        </div>
        <ol className="steps-list">
          {notes.map((n, i) => (
            <li key={i}>
              <span className="mono">0{i + 1}</span>
              <p>{n}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="wrap result__section result__split">
        <div>
          <p className="mono result__h">06 — Draft society EV policy</p>
          <p className="result__lede">
            A starting draft for the general body meeting. Edit it with your committee before the vote.
          </p>
          <button className="pill pill--outline no-print" onClick={copyPolicy}>{copied ? 'Copied' : 'Copy policy text'}</button>
        </div>
        <ol className="policy">
          {policy.map(([h, t]) => (
            <li key={h}>
              <p className="policy__h">{h}</p>
              <p>{t}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="wrap result__section result__split">
        <div>
          <p className="mono result__h">07 — Safety checklist</p>
          <p className="result__lede">
            Check each proposed charger location against these points before approving it.
          </p>
        </div>
        <ul className="checklist">
          {SAFETY.map((c) => (
            <li key={c.t}>
              <label className="check">
                <input type="checkbox" />
                <span className="check__box" aria-hidden="true" />
                <span>
                  {c.t}
                  <em className="checklist__why">{c.why}</em>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="wrap result__actions no-print">
        <Pill onClick={() => window.print()} arrow>Download report (PDF)</Pill>
        <Pill variant="outline" onClick={onEdit}>Edit answers</Pill>
        <Pill variant="outline" to="/survey">Ask residents (survey)</Pill>
        <button className="mono link-btn" onClick={onReset}>Start a new building</button>
      </section>

      <p className="wrap mono result__disclaimer">
        Evoltic provides a planning estimate, not an electrical audit. Figures assume a power factor of {a.powerFactor} and the assumptions shown above.
      </p>
    </main>
  )
}
