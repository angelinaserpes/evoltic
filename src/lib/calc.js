// Evoltic capacity model.
// A planning estimate, not an electrical audit. Every assumption is exposed
// so committees can see — and adjust — how the answer is reached.

export const DEFAULTS = {
  powerFactor: 0.9, // kVA → kW
  safetyMargin: 0.8, // plan to use at most 80% of sanctioned supply
  diversity: 0.7, // share of chargers drawing full power at the evening peak
  nightLoadFactor: 0.5, // overnight building load as a share of the evening peak
  windowHours: 8, // overnight charging window (approx. 10pm–6am)
  utilisation: 0.7, // how fully a scheduler can pack that window
  dailyKWh: 7, // average energy one EV needs per day (~45 km city driving)
  scooterKWh: 1.5, // average energy one e-scooter needs per day (~30 km)
}

// Daily energy per vehicle: scooters on a small charger need far less than cars.
export const isScooter = (chargerKW) => Number(chargerKW) < 2
export const energyPerEV = (chargerKW, a = DEFAULTS) => (isScooter(chargerKW) ? a.scooterKWh : a.dailyKWh)

export const CHARGERS = [
  { kw: 1.2, label: '1.2 kW', note: 'Portable e-scooter or bike charger on a 15 A socket. About 1.5 kWh a day per scooter.' },
  { kw: 3.3, label: '3.3 kW', note: 'Standard home AC charger. Overnight top-ups for most cars.' },
  { kw: 7.4, label: '7.4 kW', note: 'Faster AC charger. Charges in half the time, needs twice the power.' },
]

export const DISCOMS = [
  'MSEDCL — Maharashtra',
  'Adani Electricity — Mumbai',
  'Tata Power — Mumbai',
  'BEST — Mumbai (island city)',
  'BESCOM — Bengaluru',
  'TNPDCL — Chennai',
  'TSSPDCL — Hyderabad',
  'BSES Rajdhani / Yamuna — Delhi',
  'Tata Power-DDL — Delhi',
  'DHBVN — Gurugram',
  'Torrent Power — Ahmedabad',
  'CESC — Kolkata',
  'Other',
]

// Rough diversified demand when the committee doesn't have a recorded maximum demand.
export function estimatePeakKVA(flats) {
  return Math.round(Number(flats || 0) * 0.75 + 20)
}

export function plan(input, a = DEFAULTS) {
  const sanctionedKVA = Number(input.sanctionedKVA) || 0
  const peakKVA = input.estimatePeak ? estimatePeakKVA(input.flats) : Number(input.peakKVA) || 0
  const chargerKW = Number(input.chargerKW) || 3.3
  const expected = Number(input.expectedEVs) || 0

  const sanctionedKW = sanctionedKVA * a.powerFactor
  const safeKW = sanctionedKW * a.safetyMargin
  const peakKW = peakKVA * a.powerFactor
  const spareKW = Math.max(0, safeKW - peakKW)

  // Today: chargers plugged in during the evening peak, no control.
  const perEV = chargerKW * a.diversity
  const today = Math.floor(spareKW / perEV)

  // With scheduling: chargers share the overnight trough, energy-limited.
  const nightSpareKW = Math.max(0, safeKW - peakKW * a.nightLoadFactor)
  const dailyKWh = energyPerEV(chargerKW, a)
  const scheduled = Math.max(
    today,
    Math.floor((nightSpareKW * a.windowHours * a.utilisation) / dailyKWh),
  )

  // Upgrade needed to serve the expected fleet with scheduling.
  const neededNightKW = (expected * dailyKWh) / (a.windowHours * a.utilisation)
  const shortfallKW = Math.max(0, neededNightKW - nightSpareKW)
  const upgradeKVA = Math.ceil(shortfallKW / a.safetyMargin / a.powerFactor / 5) * 5

  let status = 'comfortable'
  if (expected > today) status = 'schedule'
  if (expected > scheduled) status = 'upgrade'

  return {
    sanctionedKVA,
    peakKVA,
    sanctionedKW,
    safeKW,
    peakKW,
    spareKW,
    nightSpareKW,
    perEV,
    today,
    scheduled,
    expected,
    upgradeKVA,
    status,
    loadShare: sanctionedKW ? peakKW / sanctionedKW : 0,
  }
}

export const SAMPLE_INPUT = {
  societyName: 'Sample society',
  city: 'MSEDCL — Maharashtra',
  flats: 180,
  sanctionedKVA: 250,
  peakKVA: 140,
  estimatePeak: false,
  chargerKW: 3.3,
  expectedEVs: 40,
  hasDG: true,
}

export const fmt = (n, d = 0) =>
  Number(n).toLocaleString('en-IN', { maximumFractionDigits: d, minimumFractionDigits: d })

// ---------------------------------------------------------------
// Overnight simulation: 15-minute slots from 6 pm to 9 am.
// Building load follows a typical evening-peak shape scaled to the
// recorded peak. Each EV arrives, needs some energy, and leaves in
// the morning. "Smart" charging gives power first to the car with
// the least spare time (least-slack-first), never above the safe limit.
// ---------------------------------------------------------------
export const SLOT_H = 0.25
export const START_H = 18
export const SLOTS = 60

export const slotHour = (i) => (START_H + i * SLOT_H) % 24

function seeded(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function buildingShare(h, night) {
  if (h >= 18 && h < 20) return 0.75 + 0.25 * ((h - 18) / 2)
  if (h >= 20 && h < 22.5) return 1
  if (h >= 22.5) return 1 - (1 - night) * ((h - 22.5) / 1.5)
  if (h < 5.5) return night
  if (h < 7) return night + (0.75 - night) * ((h - 5.5) / 1.5)
  return 0.75
}

function runNight(base, cars, chargerKW, safeKW, smart, win = [0, SLOTS]) {
  const load = base.slice()
  const rem = cars.map((c) => c.need)
  for (let i = 0; i < SLOTS; i++) {
    const active = []
    cars.forEach((c, k) => {
      const from = smart ? Math.max(c.a, win[0]) : c.a
      const to = smart ? Math.min(c.d, win[1]) : c.d
      if (from <= i && i < to && rem[k] > 1e-6) active.push(k)
    })
    if (!smart) {
      active.forEach((k) => {
        const p = Math.min(cars[k].kw || chargerKW, rem[k] / SLOT_H)
        rem[k] -= p * SLOT_H
        load[i] += p
      })
      continue
    }
    let head = Math.max(0, safeKW - base[i])
    const end = (k) => Math.min(cars[k].d, win[1])
    const kwOf = (k) => cars[k].kw || chargerKW
    active.sort((x, y) => ((end(x) - i) * SLOT_H - rem[x] / kwOf(x)) - ((end(y) - i) * SLOT_H - rem[y] / kwOf(y)))
    active.forEach((k) => {
      // Spread each car's charge evenly over the time it has left, so the load stays flat.
      const left = Math.max(SLOT_H, (end(k) - i) * SLOT_H)
      const p = Math.max(0, Math.min(kwOf(k), rem[k] / left * 1.15, rem[k] / SLOT_H, head))
      rem[k] -= p * SLOT_H
      head -= p
      load[i] += p
    })
  }
  const missed = rem.filter((x) => x > 0.05).length
  return { load, peak: Math.max(...load), missed }
}

// ---------------------------------------------------------------
// Resident survey → simulation. Each answer becomes one vehicle with
// its real arrival time, departure time and daily driving.
// ---------------------------------------------------------------
const CAR_KWH_PER_KM = 7 / 45 // matches the 7 kWh ≈ 45 km default
const SCOOTER_KWH_PER_KM = 1.5 / 30

const toHour = (t) => {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(t || ''))
  return m ? Number(m[1]) + Number(m[2]) / 60 : null
}

export function surveyProfiles(rows = [], a = DEFAULTS) {
  return rows
    .filter((x) => ['car', 'scooter', 'planning'].includes(x.vehicle))
    .map((x) => {
      const scooter = x.vehicle === 'scooter'
      const km = Number(x.km)
      const kwh = km > 0 ? km * (scooter ? SCOOTER_KWH_PER_KM : CAR_KWH_PER_KM) : scooter ? a.scooterKWh : a.dailyKWh
      return { arrive: toHour(x.arrive) ?? 20.5, leave: toHour(x.leave) ?? 8.5, kwh, scooter, planning: x.vehicle === 'planning' }
    })
}

// Slot index for an evening arrival / morning departure, clamped to the 6 pm – 9 am chart.
const arriveSlot = (h) => Math.min(SLOTS - 1, Math.max(0, Math.round(((h < 12 ? h + 24 : h) - START_H) / SLOT_H)))
const leaveSlot = (h) => (h >= 12 ? SLOTS : Math.min(SLOTS, Math.max(1, Math.round((h + 24 - START_H) / SLOT_H))))

export function simulateNight(input, a = DEFAULTS, evCount, profiles = null) {
  const r = plan(input, a)
  const chargerKW = Number(input.chargerKW) || 3.3
  const rand = seeded(42)
  const base = Array.from({ length: SLOTS }, (_, i) => r.peakKW * buildingShare(slotHour(i), a.nightLoadFactor))
  // Smart charging only runs inside the overnight window, starting at 10 pm.
  const winStart = (22 - START_H) / SLOT_H
  const win = [winStart, Math.min(SLOTS, winStart + Math.round(a.windowHours / SLOT_H))]
  if (profiles && profiles.length) {
    const carKW = isScooter(chargerKW) ? 3.3 : chargerKW
    const cars = profiles.map((p) => {
      const ai = arriveSlot(p.arrive)
      return { a: ai, d: Math.max(ai + 1, leaveSlot(p.leave)), need: p.kwh, kw: p.scooter ? 1.2 : carKW }
    })
    return {
      r,
      n: cars.length,
      chargerKW,
      base,
      fromSurvey: true,
      uncontrolled: runNight(base, cars, chargerKW, r.safeKW, false),
      smart: runNight(base, cars, chargerKW, r.safeKW, true, win),
      win,
    }
  }
  const n = Math.max(0, Math.round(Number(evCount) || 0))
  const cars = Array.from({ length: n }, () => {
    const arrive = 18.5 + rand() * 4 // 6:30 pm to 10:30 pm
    const leave = 6.5 + rand() * 3 // 6:30 am to 9:30 am
    const need = energyPerEV(chargerKW, a) * (0.6 + rand() * 0.8)
    return {
      a: Math.round((arrive - START_H) / SLOT_H),
      d: Math.min(SLOTS, Math.round((leave + 24 - START_H) / SLOT_H)),
      need,
    }
  })
  return {
    r,
    n,
    chargerKW,
    base,
    uncontrolled: runNight(base, cars, chargerKW, r.safeKW, false),
    smart: runNight(base, cars, chargerKW, r.safeKW, true, win),
    win,
  }
}

// Largest number of EVs that smart scheduling can fully charge without crossing the safe limit.
export function smartCapacity(input, a = DEFAULTS, cap = 400) {
  let best = 0
  for (let n = 1; n <= cap; n++) {
    if (simulateNight(input, a, n).smart.missed > 0) break
    best = n
  }
  return best
}
