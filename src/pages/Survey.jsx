import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../components/ui.jsx'

// Resident survey. In this version responses are kept in this browser only,
// so a committee member can collect answers on one phone or laptop.
const STORE = 'chargeready:survey'

const EMPTY = { flat: '', vehicle: '', arrive: '20:30', leave: '08:30', km: '', parking: 'allotted' }

const VEHICLES = [
  ['car', 'Car'],
  ['scooter', 'Scooter or bike'],
  ['planning', 'Planning to buy'],
]

// Clearly labelled demo answers, so the survey → simulation link can be shown without real residents.
const DEMO = [
  ['A-101', 'car', '19:15', '08:30', 35], ['A-204', 'car', '20:45', '09:00', 50], ['A-302', 'scooter', '19:30', '08:15', 22],
  ['A-405', 'planning', '21:00', '07:45', 40], ['B-102', 'car', '22:30', '06:45', 80], ['B-201', 'scooter', '18:45', '09:15', 18],
  ['B-303', 'car', '20:00', '08:00', 30], ['B-406', 'car', '23:15', '07:30', 60], ['C-104', 'planning', '19:45', '08:45', 25],
  ['C-207', 'scooter', '21:15', '08:30', 28], ['C-301', 'car', '20:30', '09:30', 45], ['C-402', 'car', '19:00', '07:15', 55],
].map(([flat, vehicle, arrive, leave, km]) => ({ flat: `Sample ${flat}`, vehicle, arrive, leave, km: String(km), parking: 'allotted', at: '' }))

function loadAll() {
  try {
    return JSON.parse(localStorage.getItem(STORE)) || []
  } catch {
    return []
  }
}

export default function Survey() {
  const [form, setForm] = useState(EMPTY)
  const [all, setAll] = useState(loadAll)
  const [done, setDone] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(STORE, JSON.stringify(all))
    } catch {
      /* storage unavailable — fine */
    }
  }, [all])

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }))
  const valid = form.flat.trim() && form.vehicle && Number(form.km) >= 0 && form.km !== ''

  const submit = (e) => {
    e.preventDefault()
    if (!valid) return
    setAll((list) => [...list.filter((x) => x.flat.trim().toLowerCase() !== form.flat.trim().toLowerCase()), { ...form, at: new Date().toISOString() }])
    setDone(true)
  }

  const csv = () =>
    ['flat,vehicle,arrives,leaves,daily_km,parking', ...all.map((r) => [r.flat, r.vehicle, r.arrive, r.leave, r.km, r.parking].join(','))].join('\n')

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(csv())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const cars = all.filter((r) => r.vehicle === 'car').length
  const scooters = all.filter((r) => r.vehicle === 'scooter').length
  const planning = all.filter((r) => r.vehicle === 'planning').length

  return (
    <div className="app">
      <header className="app__bar">
        <div className="wrap app__bar-inner">
          <Logo />
          <span className="mono app__bar-title">Resident survey</span>
          <Link to="/" className="mono app__exit">Exit</Link>
        </div>
      </header>

      <main className="wrap survey">
        {done ? (
          <section className="survey__card">
            <p className="mono survey__kicker">Thank you</p>
            <h1 className="survey__title">Your answers are saved.</h1>
            <p className="q__help">The committee will use them to plan charging for the building.</p>
            <div className="survey__actions">
              <button className="pill pill--solid" onClick={() => { setForm(EMPTY); setDone(false) }}>Add another flat</button>
            </div>
          </section>
        ) : (
          <form className="survey__card" onSubmit={submit}>
            <p className="mono survey__kicker">2 minutes · for your society committee</p>
            <h1 className="survey__title">Help your society plan EV charging.</h1>

            <label className="field">
              <span className="mono field__label">Flat number</span>
              <input id="survey-flat" className="in in--text" value={form.flat} placeholder="e.g. B-305" onChange={(e) => set('flat')(e.target.value)} />
            </label>

            <fieldset className="field">
              <legend className="mono field__label">Your EV</legend>
              <div className="survey__chips">
                {VEHICLES.map(([v, l]) => (
                  <button type="button" key={v} className={`chip ${form.vehicle === v ? 'is-on' : ''}`} aria-pressed={form.vehicle === v} onClick={() => set('vehicle')(v)}>
                    {l}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="survey__row">
              <label className="field">
                <span className="mono field__label">Usually home by</span>
                <input id="survey-arrive" type="time" className="in in--text" value={form.arrive} onChange={(e) => set('arrive')(e.target.value)} />
              </label>
              <label className="field">
                <span className="mono field__label">Usually leave at</span>
                <input id="survey-leave" type="time" className="in in--text" value={form.leave} onChange={(e) => set('leave')(e.target.value)} />
              </label>
            </div>

            <label className="field">
              <span className="mono field__label">Daily driving (km)</span>
              <input id="survey-km" type="number" inputMode="numeric" min="0" className="in in--text" value={form.km} placeholder="e.g. 35" onChange={(e) => set('km')(e.target.value)} />
            </label>

            <label className="field">
              <span className="mono field__label">Parking</span>
              <select id="survey-parking" className="in in--text" value={form.parking} onChange={(e) => set('parking')(e.target.value)}>
                <option value="allotted">Own allotted spot</option>
                <option value="shared">Shared or floating parking</option>
                <option value="none">No parking in the society</option>
              </select>
            </label>

            <div className="survey__actions">
              <button type="submit" className="pill pill--solid" disabled={!valid}>Submit</button>
            </div>
          </form>
        )}

        <section className="survey__results">
          <p className="mono result__h">Responses on this device · {all.length}</p>
          {all.length === 0 ? (
            <>
              <p className="q__help">No responses yet. Pass this phone around, or open this page on each resident’s phone and collect the answers.</p>
              <div className="survey__actions">
                <button className="mono link-btn" onClick={() => setAll(DEMO)}>Add 12 sample answers (demo)</button>
              </div>
            </>
          ) : (
            <>
              <p className="survey__summary">{cars} cars · {scooters} scooters or bikes · {planning} planning to buy</p>
              <div className="survey__table">
                <table>
                  <thead>
                    <tr><th>Flat</th><th>EV</th><th>Home by</th><th>Leaves</th><th>km/day</th></tr>
                  </thead>
                  <tbody>
                    {all.map((r) => (
                      <tr key={r.flat}>
                        <td>{r.flat}</td>
                        <td>{VEHICLES.find(([v]) => v === r.vehicle)?.[1]}</td>
                        <td>{r.arrive}</td>
                        <td>{r.leave}</td>
                        <td>{r.km}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="survey__actions">
                <Link to="/plan?results" className="pill pill--solid"><span>Simulate tonight with these answers</span></Link>
                <button className="pill pill--outline" onClick={copy}>{copied ? 'Copied' : 'Copy as CSV'}</button>
                <button className="mono link-btn" onClick={() => setAll([])}>Clear all</button>
              </div>
            </>
          )}
          <p className="mono result__disclaimer">In this version, answers stay in this browser only.</p>
        </section>
      </main>
    </div>
  )
}
