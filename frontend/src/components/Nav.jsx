import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.jsx'

/* ─────────────────────────────────────────────
   Shared Nav — used by LandingPage, AppPage,
   LoginPage, RegisterPage, HistoryPage
   
   Styles injected once via <style> tag.
   Safe to render on multiple pages — the style
   tag is deduplicated by the browser.
───────────────────────────────────────────── */

const NAV_CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@400;600;700;800&display=swap');

:root {
  --g:      #00FF87;
  --g2:     rgba(0,255,135,0.12);
  --g3:     rgba(0,255,135,0.05);
  --bg:     #040a06;
  --bg2:    #060e08;
  --text:   #d4f5e9;
  --muted:  rgba(212,245,233,0.38);
  --border: rgba(0,255,135,0.12);
}

nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 500;
  padding: 20px 56px;
  display: flex; align-items: center; justify-content: space-between;
  border-bottom: 1px solid rgba(0,255,135,0.07);
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  background: rgba(4,10,6,0.7);
}
.logo {
  font-family: 'DM Mono', monospace; font-size: 16px; font-weight: 500;
  color: var(--g); letter-spacing: 0.08em; text-decoration: none;
}
.logo sup { font-size: 9px; opacity: 0.5; letter-spacing: 0.3em; }
.nav-links { display: flex; gap: 36px; list-style: none; margin: 0; padding: 0; }
.nav-links a {
  font-size: 12px; letter-spacing: 0.15em; color: var(--muted);
  text-decoration: none; text-transform: uppercase; transition: color .2s;
  font-family: 'DM Mono', monospace;
}
.nav-links a:hover { color: var(--g); }
.nav-right { display: flex; gap: 10px; align-items: center; }
.btn-nav-ghost {
  font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.2em;
  color: var(--g); background: transparent; border: 1px solid rgba(0,255,135,0.3);
  padding: 9px 20px; text-transform: uppercase; cursor: pointer;
  transition: all .25s; text-decoration: none; display: inline-flex; align-items: center;
}
.btn-nav-ghost:hover { background: var(--g2); }
.btn-nav-solid {
  font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.2em;
  color: var(--bg); background: var(--g); border: none;
  padding: 9px 20px; text-transform: uppercase; cursor: pointer;
  transition: all .25s; text-decoration: none; display: inline-flex; align-items: center;
}
.btn-nav-solid:hover { box-shadow: 0 0 32px rgba(0,255,135,0.4); }

@media (max-width: 900px) {
  nav { padding: 16px 24px; }
  .nav-links { display: none; }
}
@media (max-width: 640px) {
  nav { padding: 14px 16px; }
  .btn-nav-ghost { display: none; }
}
`

/* Nav accepts an optional `links` prop for page-specific anchor links.
   Defaults to the landing page section anchors.
   Pass links={[]} on inner pages to hide the section links. */
export default function Nav({ links }) {
  const { isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  const navLinks = links !== undefined ? links : [
    { href: '#how',      label: 'How it works' },
    { href: '#features', label: 'Features'     },
    { href: '#proof',    label: 'Results'      },
  ]

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <>
      <style>{NAV_CSS}</style>
      <nav>
        <Link to="/" className="logo">Resume<sup>AI</sup></Link>

        {navLinks.length > 0 && (
          <ul className="nav-links">
            {navLinks.map(l => (
              <li key={l.href}>
                <a href={l.href}>{l.label}</a>
              </li>
            ))}
          </ul>
        )}

        <div className="nav-right">
          {isAuthenticated ? (
            <>
              <Link to="/history" className="btn-nav-ghost">History</Link>
              <button className="btn-nav-ghost" onClick={handleLogout}>Sign out</button>
              <Link to="/app" className="btn-nav-solid">Analyze</Link>
            </>
          ) : (
            <>
              <Link to="/login"    className="btn-nav-ghost">Sign in</Link>
              <Link to="/register" className="btn-nav-solid">Get Started</Link>
            </>
          )}
        </div>
      </nav>
    </>
  )
}