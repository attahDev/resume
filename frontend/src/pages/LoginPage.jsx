import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.jsx'
import Nav from '../components/Nav.jsx'

export default function LoginPage() {
  const { login }  = useAuth()
  const navigate   = useNavigate()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)

  async function handleSubmit() {
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      navigate('/app')
    } catch {
      setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <Nav links={[]} />
      <div className="container" style={{ paddingTop: 100, maxWidth: 420 }}>

        <h1 style={{ fontSize: 32, marginBottom: 8 }}>Welcome back</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 36 }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--green)' }}>Register free →</Link>
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
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          <div style={{ textAlign: 'right', marginTop: -8, marginBottom: 16 }}>
            <Link
              to="/forgot-password"
              style={{ fontSize: 11, color: 'var(--text-dim)', textDecoration: 'none', letterSpacing: '0.05em' }}
            >
              Forgot password?
            </Link>
          </div>
          {error && (
            <div className="banner banner-error"><span>⚠</span><span>{error}</span></div>
          )}

          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading || !email || !password}
            style={{ padding: '12px', marginTop: 4 }}
          >
            {loading ? <><span className="spinner" /> Logging in...</> : 'Login →'}
          </button>
        </div>
      </div>
    </div>
  )
}