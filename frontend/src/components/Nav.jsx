import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.jsx'

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
  display: flex; align-items: center; gap: 2px;
}
.logo-cv { color: var(--g); }
.logo-match { color: rgba(212,245,233,0.7); }
.logo-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--g); box-shadow: 0 0 6px var(--g); margin-left: 3px; display: inline-block; animation: pdot 2s infinite; }

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

.nav-hamburger {
  display: none;
  flex-direction: column; justify-content: center; align-items: center;
  gap: 5px; width: 36px; height: 36px;
  background: transparent; border: 1px solid rgba(0,255,135,0.2);
  cursor: pointer; padding: 0; flex-shrink: 0;
  transition: border-color .2s;
}
.nav-hamburger:hover { border-color: rgba(0,255,135,0.5); }
.nav-hamburger span {
  display: block; width: 16px; height: 1.5px;
  background: var(--g); transition: all .25s; transform-origin: center;
}
.nav-hamburger.open span:nth-child(1) { transform: translateY(6.5px) rotate(45deg); }
.nav-hamburger.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
.nav-hamburger.open span:nth-child(3) { transform: translateY(-6.5px) rotate(-45deg); }

.nav-drawer {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  z-index: 490;
  background: rgba(4,10,6,0.97);
  backdrop-filter: blur(20px);
  display: flex; flex-direction: column;
  padding: 80px 24px 40px;
  transform: translateX(100%);
  transition: transform .3s cubic-bezier(0.16,1,0.3,1);
}
.nav-drawer.open { transform: translateX(0); }

.drawer-links {
  display: flex; flex-direction: column; gap: 4px;
  list-style: none; margin: 0; padding: 0;
  border-top: 1px solid rgba(0,255,135,0.08);
  padding-top: 32px;
}
.drawer-links li a,
.drawer-links li button {
  display: block; width: 100%;
  font-family: 'DM Mono', monospace; font-size: 13px;
  letter-spacing: 0.2em; text-transform: uppercase;
  color: var(--muted); text-decoration: none;
  background: none; border: none; cursor: pointer;
  padding: 16px 0;
  border-bottom: 1px solid rgba(0,255,135,0.05);
  text-align: left; transition: color .2s;
}
.drawer-links li a:hover,
.drawer-links li button:hover { color: var(--g); }

.drawer-section-label {
  font-family: 'DM Mono', monospace; font-size: 9px;
  letter-spacing: 0.4em; color: rgba(0,255,135,0.25);
  text-transform: uppercase; margin-bottom: 8px; margin-top: 24px;
}
.drawer-cta { margin-top: auto; padding-top: 32px; }

@keyframes pdot { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.4; transform:scale(0.7); } }

@media (max-width: 900px) {
  nav { padding: 16px 24px; }
  .nav-links { display: none; }
}
@media (max-width: 640px) {
  nav { padding: 14px 16px; }
  .nav-right .btn-nav-ghost { display: none; }
  .nav-hamburger { display: flex; }
}
`

export default function Nav({ links }) {
  const { isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const navLinks = links !== undefined ? links : [
    { href: '#how',      label: 'How it works' },
    { href: '#features', label: 'Features'     },
    { href: '#proof',    label: 'Results'      },
  ]

  const handleLogout = () => {
    logout()
    setDrawerOpen(false)
    navigate('/')
  }

  const closeDrawer = () => setDrawerOpen(false)

  return (
    <>
      <style>{NAV_CSS}</style>
      <nav>
        <Link to="/" className="logo">
          <span className="logo-cv">CV</span>
          <span className="logo-match">Match</span>
          <span className="logo-dot" />
        </Link>

        {navLinks.length > 0 && (
          <ul className="nav-links">
            {navLinks.map(l => (
              <li key={l.href}><a href={l.href}>{l.label}</a></li>
            ))}
          </ul>
        )}

        <div className="nav-right">
          {isAuthenticated ? (
            <>
              <Link to="/history" className="btn-nav-ghost">History</Link>
              <button className="btn-nav-ghost" onClick={handleLogout}>Sign out</button>
            </>
          ) : (
            <Link to="/login" className="btn-nav-ghost">Sign in</Link>
          )}
          <Link to="/app" className="btn-nav-solid">Analyze</Link>
          <button
            className={`nav-hamburger${drawerOpen ? ' open' : ''}`}
            onClick={() => setDrawerOpen(v => !v)}
            aria-label="Menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      <div className={`nav-drawer${drawerOpen ? ' open' : ''}`}>
        {navLinks.length > 0 && (
          <>
            <div className="drawer-section-label">Navigate</div>
            <ul className="drawer-links">
              {navLinks.map(l => (
                <li key={l.href}>
                  <a href={l.href} onClick={closeDrawer}>{l.label}</a>
                </li>
              ))}
            </ul>
          </>
        )}
        <div className="drawer-section-label">Account</div>
        <ul className="drawer-links">
          {isAuthenticated ? (
            <>
              <li><Link to="/history" onClick={closeDrawer}>History</Link></li>
              <li><button onClick={handleLogout}>Sign out</button></li>
            </>
          ) : (
            <>
              <li><Link to="/login" onClick={closeDrawer}>Sign in</Link></li>
              <li><Link to="/register" onClick={closeDrawer}>Get Started</Link></li>
            </>
          )}
        </ul>
        <div className="drawer-cta">
          <Link
            to="/app" className="btn-nav-solid" onClick={closeDrawer}
            style={{ width: '100%', justifyContent: 'center', padding: '14px 0' }}
          >
            Analyze My CV
          </Link>
        </div>
      </div>
    </>
  )
}