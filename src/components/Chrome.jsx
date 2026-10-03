import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Logo, Marquee, Pill } from './ui.jsx'

const LINKS = [
  { href: '/#how', label: 'How it works' },
  { href: '/#answer', label: 'The answer' },
  { href: '/#neutral', label: 'Why neutral' },
  { href: '/#faq', label: 'FAQ' },
]

export function Nav({ overHero = false }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
  }, [open])

  const light = overHero && !scrolled && !open
  return (
    <header className={`nav ${light ? 'nav--light' : 'nav--solid'} ${open ? 'nav--open' : ''}`}>
      <div className="wrap nav__inner">
        <Logo light={light} />
        <nav className="nav__links" aria-label="Primary">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href}>{l.label}</a>
          ))}
        </nav>
        <div className="nav__cta">
          <Pill to="/plan" variant={light ? 'light' : 'solid'}>Check your building</Pill>
        </div>
        <button
          className="nav__toggle"
          aria-expanded={open}
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((o) => !o)}
        >
          <span />
          <span />
        </button>
      </div>
      <div className="nav__sheet" hidden={!open}>
        <div className="wrap">
          {LINKS.map((l, i) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
              <span className="mono">0{i + 1}</span>
              {l.label}
            </a>
          ))}
          <Pill to="/plan" arrow>Check your building</Pill>
        </div>
      </div>
    </header>
  )
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer__top">
          <div className="footer__intro">
            <p className="footer__line">
              Neutral EV-readiness planning for India’s housing societies.
            </p>
            <Pill to="/plan" variant="light" arrow>Check your building</Pill>
          </div>
          <div className="footer__cols">
            <div>
              <p className="mono footer__h">Product</p>
              <Link to="/plan">Planner</Link>
              <Link to="/survey">Resident survey</Link>
              <a href="/#answer">Sample result</a>
              <a href="/#how">How it works</a>
            </div>
            <div>
              <p className="mono footer__h">For committees</p>
              <a href="/#faq">FAQ</a>
              <a href="/#neutral">Our neutrality</a>
              <a href="/#why-now">Why now</a>
            </div>
            <div>
              <p className="mono footer__h">Project</p>
              <span>Built for SPARK-A-THON 2026</span>
              <span>FCRIT, Vashi · Navi Mumbai</span>
            </div>
          </div>
        </div>
      </div>
      <Marquee className="marquee--giant" items={['Evoltic', 'Plan before you plug in']} speed={60} />
      <div className="wrap footer__bottom mono">
        <span>© {new Date().getFullYear()} Evoltic</span>
        <span>Planning estimates only — not a substitute for a licensed electrical audit.</span>
      </div>
    </footer>
  )
}
