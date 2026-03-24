import { Component } from 'react'
import { Link } from 'react-router-dom'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('Nestly ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '80vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: '2rem', background: 'var(--cream)',
        }}>
          <div style={{ textAlign: 'center', maxWidth: 480 }}>
            <div style={{
              fontFamily: 'DM Serif Display, serif',
              fontSize: 'clamp(4rem, 10vw, 7rem)',
              color: 'var(--teal-mid)', lineHeight: 1, marginBottom: '1rem',
            }}>
              Oops
            </div>
            <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.75rem', color: 'var(--text)', marginBottom: '.75rem' }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: 15, color: 'var(--text-light)', lineHeight: 1.7, marginBottom: '2rem' }}>
              An unexpected error occurred. Try refreshing the page or heading back home.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                style={{ padding: '.75rem 1.5rem', border: '1.5px solid var(--border)', borderRadius: 9, background: '#fff', color: 'var(--text-mid)', fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
              >
                Try again
              </button>
              <Link to="/" style={{ padding: '.75rem 1.5rem', background: 'var(--teal)', color: '#fff', borderRadius: 9, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
                Go to homepage
              </Link>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
