import { useState } from 'react'
import { Link } from 'react-router-dom'
import Nav from '../components/Nav.jsx'
import client from '../api/client.js'

export default function ForgotPasswordPage() {
  const [email,     setEmail]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [sent,      setSent]      = useState(false)
  const [error,     setError]     = useState(null)

  async function handleSubmit() {
    if (!email) return
    setError(null)
    setLoading(true)
    try {
      await client.post('/auth/forgot-password', { email })
      setSent(true)
    } catch {
      setError('Something went wrong — please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <Nav links={[]} />
      <div className="container" style={{ paddingTop: 100, maxWidth: 420 }}>

        {sent ? (
          /* ── Success state ── */
          <div>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              border: '2px solid var(--green)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 24,
              boxShadow: '0 0 16px #00FF8730',
            }}>
              <span style={{ color: 'var(--green)', fontSize: 20 }}>✓</span>
            </div>
            <h1 style={{ fontSize: 28, marginBottom: 12 }}>Check your inbox</h1>
            <p style={{ color: 'var(--text-dim)', fontSize: 14, lineHeight: 1.7, marginBottom: 32 }}>
              If <strong style={{ color: 'var(--text)' }}>{email}</strong> is registered,
              you'll receive a reset link within a minute.
              The link expires in <strong style={{ color: 'var(--text)' }}>15 minutes</strong>.
            </p>
            <p style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 6 }}>
              Didn't get it? Check your spam folder or{' '}
              <button
                onClick={() => { setSent(false); setError(null) }}
                style={{
                  background: 'none', border: 'none', padding: 0,
                  color: 'var(--green)', cursor: 'pointer', fontSize: 13,
                }}
              >
                try again
              </button>.
            </p>
            <Link to="/login" style={{ fontSize: 13, color: 'var(--text-dim)', textDecoration: 'none' }}>
              ← Back to login
            </Link>
          </div>
        ) : (
          /* ── Form state ── */
          <div>
            <h1 style={{ fontSize: 32, marginBottom: 8 }}>Forgot password?</h1>
            <p style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 36, lineHeight: 1.6 }}>
              Enter your account email and we'll send you a reset link.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="label">Email</label>
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  placeholder="you@example.com"
                  autoComplete="email"
                  autoFocus
                />
              </div>

              {error && (
                <div className="banner banner-error"><span>⚠</span><span>{error}</span></div>
              )}

              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={loading || !email}
                style={{ padding: '12px', marginTop: 4 }}
              >
                {loading ? <><span className="spinner" /> Sending…</> : 'Send Reset Link →'}
              </button>

              <Link
                to="/login"
                style={{ fontSize: 13, color: 'var(--text-dim)', textDecoration: 'none', textAlign: 'center' }}
              >
                ← Back to login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}