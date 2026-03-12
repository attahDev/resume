import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Nav from '../components/Nav.jsx'
import client from '../api/client.js'

function StrengthBar({ password }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ]
  const score  = checks.filter(Boolean).length
  const colors = ['var(--red)', 'var(--red)', 'var(--orange)', 'var(--yellow)', 'var(--green)']

  if (!password) return null
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{
            flex: 1, height: 3,
            background: i <= score ? colors[score] : 'var(--border)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        {['8+ chars', 'Uppercase', 'Number', 'Special char'].map((c, i) => (
          <span key={c} style={{ fontSize: 10, color: checks[i] ? 'var(--green)' : 'var(--text-ghost)' }}>
            {checks[i] ? '✓' : '○'} {c}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  const [searchParams]              = useSearchParams()
  const navigate                    = useNavigate()
  const token                       = searchParams.get('token')

  const [password,  setPassword]   = useState('')
  const [confirm,   setConfirm]    = useState('')
  const [loading,   setLoading]    = useState(false)
  const [done,      setDone]       = useState(false)
  const [error,     setError]      = useState(null)
  const [apiErrors, setApiErrors]  = useState([])

  // No token in URL — show error immediately
  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new one.')
    }
  }, [token])

  async function handleSubmit() {
    setError(null)
    setApiErrors([])

    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await client.post('/auth/reset-password', { token, password })
      setDone(true)
      // Auto-redirect to login after 3s
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      const data = err.response?.data
      if (data?.detail?.errors) {
        setApiErrors(data.detail.errors)
      } else if (typeof data?.detail === 'string') {
        setError(data.detail)
      } else {
        setError('Something went wrong — please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <Nav links={[]} />
      <div className="container" style={{ paddingTop: 100, maxWidth: 420 }}>

        {done ? (
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
            <h1 style={{ fontSize: 28, marginBottom: 12 }}>Password updated</h1>
            <p style={{ color: 'var(--text-dim)', fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
              Your password has been changed successfully.
              Redirecting you to login in a moment…
            </p>
            <Link to="/login" className="btn btn-primary" style={{ padding: '12px 24px' }}>
              Go to Login →
            </Link>
          </div>
        ) : (
          /* ── Form state ── */
          <div>
            <h1 style={{ fontSize: 32, marginBottom: 8 }}>Set new password</h1>
            <p style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 36 }}>
              Choose a strong password for your account.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="label">New Password</label>
                <input
                  className="input"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  autoFocus
                  disabled={!token}
                />
                <StrengthBar password={password} />
              </div>

              <div>
                <label className="label">Confirm Password</label>
                <input
                  className="input"
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={!token}
                />
              </div>

              {error && (
                <div className="banner banner-error"><span>⚠</span><span>{error}</span></div>
              )}
              {apiErrors.length > 0 && (
                <div className="banner banner-error" style={{ flexDirection: 'column', gap: 4 }}>
                  {apiErrors.map((e, i) => <span key={i}>⚠ {e}</span>)}
                </div>
              )}

              {error?.includes('Invalid reset link') && (
                <Link to="/forgot-password" className="btn btn-primary" style={{ padding: '12px', textAlign: 'center' }}>
                  Request New Reset Link →
                </Link>
              )}

              {!error?.includes('Invalid reset link') && (
                <button
                  className="btn btn-primary"
                  onClick={handleSubmit}
                  disabled={loading || !password || !confirm || !token}
                  style={{ padding: '12px', marginTop: 4 }}
                >
                  {loading ? <><span className="spinner" /> Updating…</> : 'Update Password →'}
                </button>
              )}

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