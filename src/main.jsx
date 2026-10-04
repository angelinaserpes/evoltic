import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// If anything ever throws while rendering, show a way back instead of a blank page.
class Boundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(err) { console.error(err) }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: 'var(--paper, #F5F1EA)', color: 'var(--ink, #151413)', textAlign: 'center' }}>
        <div>
          <p style={{ fontSize: 22, marginBottom: 16 }}>Something went wrong on this page.</p>
          <a href="/" style={{ textDecoration: 'underline' }} onClick={() => this.setState({ failed: false })}>Back to Evoltic</a>
        </div>
      </div>
    )
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Boundary>
      <App />
    </Boundary>
  </StrictMode>,
)
