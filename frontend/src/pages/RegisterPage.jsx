import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.jsx'
import Nav from '../components/Nav.jsx'

function PasswordStrength({ password }) {
  if (!password) return null
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ]
  const score  = checks.filter(Boolean).length
  const colors = ['', 'var(--red)', 'var(--red)', 'var(--orange)', 'var(--green)']
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', gap: 3, marginBottom: 6 }}>
        {[1,2,3,4].map(i => (
          <div
            key={i}
            style={{
              flex: 1, height: 3,
              background: i <= score ? colors[score] : 'var(--border)',
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {[['8+ chars', 0], ['Uppercase', 1], ['Number', 2], ['Special char', 3]].map(([label, idx]) => (
          <span key={label} style={{ fontSize: 10, color: checks[idx] ? 'var(--green)' : 'var(--text-ghost)' }}>
            {checks[idx] ? '✓' : '○'} {label}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate     = useNavigate()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [apiErrors, setApiErrors] = useState([])

  async function handleSubmit() {
    setError(null)
    setApiErrors([])
    if (password !== confirm) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      await register(email, password)
      navigate('/login', { state: { registered: true } })
    } catch (err) {
      const status = err.response?.status
      const data   = err.response?.data
      if (status === 409)              setError('An account with this email already exists')
      else if (status === 400 && data?.errors) setApiErrors(data.errors)
      else                             setError('Registration failed — please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <Nav />
      <div className="container" style={{ paddingTop: 80, maxWidth: 420 }}>

        <h1 style={{ fontSize: 32, marginBottom: 8 }}>Create free account</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 36 }}>
          Already have one?{' '}
          <Link to="/login" style={{ color: 'var(--green)' }}>Login →</Link>
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
            <PasswordStrength password={password} />
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
            />
          </div>

          {error && <div className="banner banner-error"><span>⚠</span><span>{error}</span></div>}
          {apiErrors.length > 0 && (
            <div className="banner banner-error" style={{ flexDirection: 'column', gap: 4 }}>
              {apiErrors.map((e, i) => <span key={i}>⚠ {e}</span>)}
            </div>
          )}

          <div className="banner banner-info" style={{ fontSize: 11 }}>
            <span>ℹ</span>
            <span>50 analyses per day · No credit card · Free forever</span>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading || !email || !password || !confirm}
            style={{ padding: '12px', marginTop: 4 }}
          >
            {loading ? <><span className="spinner" /> Creating account...</> : 'Create Account →'}
          </button>
        </div>
      </div>
    </div>
  )
}