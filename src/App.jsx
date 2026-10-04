import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import Planner from './pages/Planner.jsx'
import Survey from './pages/Survey.jsx'

function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    // Newer Chrome returns a Promise from scrollIntoView/scrollTo. Never return it
    // from the effect, or React calls it as a cleanup function and the app crashes.
    if (hash) {
      let el = null
      try { el = document.querySelector(hash) } catch { el = null }
      if (el) { el.scrollIntoView(); return }
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollManager />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/plan" element={<Planner />} />
        <Route path="/survey" element={<Survey />} />
        <Route path="*" element={<Landing />} />
      </Routes>
    </BrowserRouter>
  )
}
