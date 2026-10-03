import { useEffect, useRef, useState } from 'react'
import { MARK } from '../lib/mark.js'
import { Link } from 'react-router-dom'
import { IMAGES } from '../images.js'
import { fmt } from '../lib/calc.js'

/* ---------- Hero video: muted looping background, falls back to a still frame ---------- */
export function HeroVideo({ sources = [], poster, className = '' }) {
  const [failed, setFailed] = useState(false)
  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  return (
    <div className={`img img--dark ${className}`}>
      {failed || reduceMotion ? (
        <img src={poster} alt="" />
      ) : (
        <video
          className="img__video"
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
        >
          {sources.map((s, i) => (
            <source
              key={s.src}
              src={s.src}
              type={s.type}
              onError={i === sources.length - 1 ? () => setFailed(true) : undefined}
            />
          ))}
        </video>
      )}
    </div>
  )
}

/* ---------- Image slot: shows the real file, or a labelled placeholder ---------- */
export function Img({ slot, className = '', alt = '', eager = false }) {
  const img = IMAGES[slot]
  const [failed, setFailed] = useState(!img?.src)
  return (
    <div className={`img img--${img?.tone ?? 'light'} ${className}`}>
      {!failed && (
        <img
          src={img.src}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => setFailed(true)}
        />
      )}
      {failed && (
        <div className="img__ph" aria-hidden="true">
          <svg preserveAspectRatio="none" viewBox="0 0 100 100">
            <line x1="0" y1="0" x2="100" y2="100" />
            <line x1="100" y1="0" x2="0" y2="100" />
          </svg>
          <span className="mono">
            {img?.label}
            <br />
            <em>{img?.note}</em>
          </span>
        </div>
      )}
    </div>
  )
}

/* ---------- Section label: EVOLTIC / 02 — HOW IT WORKS ---------- */
export function Label({ index, children, dark }) {
  return (
    <p className={`label mono ${dark ? 'label--dark' : ''}`}>
      <span>Evoltic</span>
      <span className="label__sep">/</span>
      {index && <span>{index} —</span>}
      <span>{children}</span>
    </p>
  )
}

/* ---------- Reveal on scroll ---------- */
export function useInView(options = { threshold: 0.2 }) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!('IntersectionObserver' in window)) return setInView(true)
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setInView(true)
        io.disconnect()
      }
    }, options)
    io.observe(el)
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return [ref, inView]
}

export function Reveal({ as: Tag = 'div', delay = 0, className = '', children, ...rest }) {
  const [ref, inView] = useInView({ threshold: 0.15 })
  return (
    <Tag
      ref={ref}
      className={`reveal ${inView ? 'is-in' : ''} ${className}`}
      style={{ '--d': `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  )
}

/* ---------- Marquee ---------- */
export function Marquee({ items, className = '', speed = 40 }) {
  const row = (
    <div className="marquee__row">
      {items.map((t, i) => (
        <span key={i}>
          {t}
          <i aria-hidden="true">•</i>
        </span>
      ))}
    </div>
  )
  return (
    <div className={`marquee ${className}`} style={{ '--speed': `${speed}s` }} aria-label={items.join(', ')}>
      <div className="marquee__track" aria-hidden="true">
        {row}
        {row}
      </div>
    </div>
  )
}

/* ---------- Buttons ---------- */
export function Arrow() {
  return (
    <svg className="arrow" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <path d="M2 7h10M8 3l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
}

export function Pill({ to, href, variant = 'solid', children, arrow, ...rest }) {
  const cls = `pill pill--${variant}`
  const inner = (
    <>
      <span>{children}</span>
      {arrow && <Arrow />}
    </>
  )
  if (to) return <Link to={to} className={cls} {...rest}>{inner}</Link>
  if (href) return <a href={href} className={cls} {...rest}>{inner}</a>
  return <button className={cls} {...rest}>{inner}</button>
}

/* ---------- Capacity bars: the signature visual ---------- */
export function CapacityBars({ r, caption }) {
  const [ref, inView] = useInView({ threshold: 0.3 })
  const max = r.sanctionedKW || 1
  const bars = [
    { key: 'sanctioned', label: 'Sanctioned supply', sub: `${fmt(r.sanctionedKVA)} kVA on your bill`, kw: r.sanctionedKW },
    { key: 'safe', label: 'Safe planning limit', sub: 'Never plan beyond 80%', kw: r.safeKW },
    { key: 'peak', label: 'Peak use today', sub: 'Highest recorded demand', kw: r.peakKW },
    { key: 'spare', label: 'Spare for EVs', sub: 'Safe headroom at the evening peak', kw: r.spareKW },
  ]
  return (
    <div ref={ref} className={`bars ${inView ? 'is-in' : ''}`}>
      <div className="bars__watermark" aria-hidden="true">{r.today}</div>
      <div className="bars__grid">
        {bars.map((b, i) => (
          <div key={b.key} className={`bars__col bars__col--${b.key}`} style={{ '--i': i }}>
            <div className="bars__value">
              <span className="bars__num">{fmt(b.kw)}</span>
              <span className="mono bars__unit">kW</span>
            </div>
            <div className="bars__track">
              <div className="bars__fill" style={{ '--h': Math.max(0.04, b.kw / max) }} />
            </div>
            <div className="bars__meta">
              <p className="bars__label">{b.label}</p>
              <p className="bars__sub">{b.sub}</p>
            </div>
          </div>
        ))}
      </div>
      {caption && <p className="bars__caption">{caption}</p>}
    </div>
  )
}

/* ---------- Logo ---------- */
export function Logo({ light }) {
  return (
    <Link to="/" className={`logo ${light ? 'logo--light' : ''}`} aria-label="Evoltic home">
      <Mark />
      <span className="logo__word">Evoltic</span>
    </Link>
  )
}

export function Mark({ className = 'logo__mark' }) {
  return (
    <svg className={className} viewBox={`0 0 ${MARK.w} ${MARK.h}`} aria-hidden="true">
      <path fill="currentColor" fillRule="evenodd" d={MARK.dark} />
      <path fill="#8fe03a" d={MARK.green} />
    </svg>
  )
}

/* ---------- Overnight load chart: building load vs safe limit, 6 pm to 9 am ---------- */
export function NightChart({ sim }) {
  const [mode, setMode] = useState('smart')
  const { r, base, uncontrolled, smart, win, n } = sim
  const shown = mode === 'smart' ? smart : uncontrolled
  const other = mode === 'smart' ? uncontrolled : smart
  const boxRef = useRef(null)
  const [W, setW] = useState(800)
  useEffect(() => {
    const el = boxRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const narrow = W < 560
  const H = narrow ? 240 : 320, l = 40, rt = 8, t = 16, b = 28
  const top = Math.max(uncontrolled.peak, r.sanctionedKW, 1) * 1.08
  const X = (i) => l + (i / (base.length - 1)) * (W - l - rt)
  const Y = (v) => t + (1 - v / top) * (H - t - b)
  const path = (arr) => arr.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(' ')
  const step = top > 400 ? 100 : top > 160 ? 50 : top > 60 ? 20 : 10
  const ticks = []
  for (let v = 0; v <= top; v += step) ticks.push(v)
  const hours = narrow ? ['6 pm', '', '10 pm', '', '2 am', '', '6 am', ''] : ['6 pm', '8 pm', '10 pm', '12 am', '2 am', '4 am', '6 am', '8 am']
  const over = shown.peak > r.safeKW + 0.5
  const stroke = mode === 'smart' ? 'var(--amber)' : '#c4553a'
  return (
    <div className="night">
      <div className="night__bar">
        <div className="night__toggle" role="group" aria-label="Charging mode">
          <button className={mode === 'uncontrolled' ? 'is-on' : ''} onClick={() => setMode('uncontrolled')}>Everyone charges on arrival</button>
          <button className={mode === 'smart' ? 'is-on' : ''} onClick={() => setMode('smart')}>Smart scheduling</button>
        </div>
        <span className="mono night__note">{n} EVs · 15-minute steps</span>
      </div>
      <div ref={boxRef}>
      <svg className="night__svg" width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Building load tonight with ${n} EVs, peak ${fmt(shown.peak)} kW against a safe limit of ${fmt(r.safeKW)} kW`}>
        <rect x={X(win[0])} y={t} width={X(win[1] - 1) - X(win[0])} height={H - t - b} fill="var(--paper-2)" />
        <text x={X(win[0]) + 6} y={t + 14} className="night__lbl">Overnight window</text>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={l} x2={W - rt} y1={Y(v)} y2={Y(v)} stroke="var(--rule)" />
            <text x={l - 8} y={Y(v) + 4} textAnchor="end" className="night__lbl">{v}</text>
          </g>
        ))}
        {hours.map((h, k) => h && (
          <text key={h} x={X(k * 8)} y={H - 10} textAnchor="middle" className="night__lbl">{h}</text>
        ))}
        <text x={8} y={t + 4} className="night__lbl">kW</text>
        <path d={path(other.load)} fill="none" stroke="var(--stone)" strokeWidth="1.5" strokeDasharray="4 4" />
        <path d={`${path(shown.load)} L${X(base.length - 1)} ${Y(0)} L${X(0)} ${Y(0)} Z`} fill={stroke} opacity="0.12" />
        <path d={path(shown.load)} fill="none" stroke={stroke} strokeWidth="2.5" />
        <path d={path(base)} fill="none" stroke="var(--concrete)" strokeWidth="1.5" />
        <line x1={l} x2={W - rt} y1={Y(r.safeKW)} y2={Y(r.safeKW)} stroke="var(--ink)" strokeWidth="1.5" />
        <text x={W - rt - 4} y={Y(r.safeKW) - 6} textAnchor="end" className="night__lbl night__lbl--strong">Safe limit {fmt(r.safeKW)} kW</text>
      </svg>
      </div>
      <div className="night__legend mono">
        <span><i style={{ background: stroke }} />{mode === 'smart' ? 'Smart scheduling' : 'Everyone charges on arrival'}</span>
        <span><i style={{ background: 'var(--stone)' }} />{mode === 'smart' ? 'Everyone charges on arrival' : 'Smart scheduling'}</span>
        <span><i style={{ background: 'var(--concrete)' }} />Building without EVs</span>
      </div>
      <div className="night__stats">
        <div className="night__stat">
          <span className="mono">Peak load tonight</span>
          <b className={over ? 'is-bad' : ''}>{fmt(shown.peak)} kW</b>
          <span className="night__sub">{over ? `${fmt(shown.peak - r.safeKW)} kW over the safe limit` : 'Within the safe limit'}</span>
        </div>
        <div className="night__stat">
          <span className="mono">Cars full by morning</span>
          <b className={shown.missed ? 'is-bad' : ''}>{n - shown.missed} / {n}</b>
          <span className="night__sub">{shown.missed ? 'Some cars leave partly charged' : 'Every car meets its departure time'}</span>
        </div>
        <div className="night__stat">
          <span className="mono">Without scheduling</span>
          <b className={uncontrolled.peak > r.safeKW + 0.5 ? 'is-bad' : ''}>{fmt(uncontrolled.peak)} kW</b>
          <span className="night__sub">Peak if every car charges as soon as it arrives</span>
        </div>
      </div>
    </div>
  )
}
