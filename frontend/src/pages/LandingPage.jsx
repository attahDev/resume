import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Nav from '../components/Nav.jsx'

/* ─────────────────────────────────────────────
   DATA
───────────────────────────────────────────── */
const TICKER_ITEMS = [
  'ATS Optimisation', 'Keyword Extraction', 'Job Match Scoring',
  'Skill Gap Analysis', 'Role Benchmarking', 'Real-time Feedback',
  'Semantic Scoring', 'LLM-Powered Coaching', 'PDF & DOCX Support',
  'Privacy First',
]

const STEPS = [
  {
    n: '01 / 03',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 16l4-8 4 6 3-4 5 6"/><rect x="3" y="3" width="18" height="18" rx="1"/>
      </svg>
    ),
    title: 'Upload Your Resume',
    desc: 'Drop your PDF or DOCX. Our parser handles any format — one-pager to a decade-long career. OCR included for scanned docs.',
  },
  {
    n: '02 / 03',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
      </svg>
    ),
    title: 'Paste the Job Description',
    desc: 'Copy the full JD — role, requirements, everything. The more context you give our AI, the sharper the match score.',
  },
  {
    n: '03 / 03',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
    title: 'Get Your Score + Fixes',
    desc: 'Receive a precision match score, ranked skill gaps, keyword suggestions, and LLM coaching — ready to apply.',
  },
]

const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 12l2 2 4-4"/><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    ),
    title: 'Semantic Job Matching',
    desc: 'spaCy NLP + sentence-transformers compute deep semantic similarity between your resume and any job description — not just keyword overlap.',
    tag: 'Core feature',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/>
        <polyline points="13 2 13 9 20 9"/>
      </svg>
    ),
    title: 'LLM Coaching',
    desc: 'Groq-powered Llama analysis reads your resume like a senior recruiter — giving you specific rewrite suggestions, not generic tips.',
    tag: 'Most used',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    title: 'Multi-format Parsing',
    desc: 'PDF, DOCX, and scanned documents via OCR. SHA-256 deduplication means we never parse the same file twice — instant results on re-upload.',
    tag: 'Reliable',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
      </svg>
    ),
    title: 'Privacy First',
    desc: 'Your resume content is Fernet AES-256 encrypted at rest. Guest sessions tracked by anonymous cookie — no account required to start.',
    tag: 'Secure',
  },
]

const TESTIMONIALS = [
  {
    initials: 'CE',
    name: 'Chukwuemeka A.',
    role: 'Backend Engineer · Paystack',
    city: 'Lagos',
    before: 34, after: 79,
    text: "I had no idea my resume was so weak on keywords. The tool showed me exactly what to add. Got the Paystack role 3 weeks later — same resume, different targeting.",
  },
  {
    initials: 'AO',
    name: 'Amara O.',
    role: 'DevOps Engineer · Remote',
    city: 'Nairobi',
    before: 41, after: 73,
    text: "Was applying to US remote roles and kept failing ATS screening. This explained why in plain language. The LLM coaching section alone changed how I write bullet points.",
  },
  {
    initials: 'KM',
    name: 'Kofi M.',
    role: 'Full Stack Developer',
    city: 'Accra',
    before: 52, after: 88,
    text: "Applied to Andela three times. Used this on the fourth attempt. Finally got through screening. The skill gap view showed me what they were actually looking for.",
  },
]

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */
export default function LandingPage() {
  const canvasRef  = useRef(null)
  const cardRef    = useRef(null)
  const holoRef    = useRef(null)
  const sceneRef   = useRef(null)
  const atsRef     = useRef(null)

  /* ── Particle canvas ─────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const hero = canvas.parentElement
    const ctx  = canvas.getContext('2d')
    let animId

    const resize = () => {
      canvas.width  = hero.offsetWidth
      canvas.height = hero.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const COUNT = window.innerWidth < 640 ? 55 : 110
    const particles = Array.from({ length: COUNT }, () => ({
      x:  Math.random() * canvas.width,
      y:  Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r:  Math.random() * 1.6 + 0.4,
      a:  Math.random() * 0.7 + 0.15,
    }))

    let mx = -9999, my = -9999
    const onMove = (e) => {
      const r = hero.getBoundingClientRect()
      mx = e.clientX - r.left
      my = e.clientY - r.top
    }
    document.addEventListener('mousemove', onMove)

    const LINK_DIST = 120

    const draw = () => {
      animId = requestAnimationFrame(draw)
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const p of particles) {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width)  p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0

        const dx = p.x - mx, dy = p.y - my
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 90) {
          const f = (90 - dist) / 90 * 0.6
          p.x += dx / dist * f
          p.y += dy / dist * f
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(0,255,135,${p.a})`
        ctx.fill()
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const d  = Math.sqrt(dx * dx + dy * dy)
          if (d < LINK_DIST) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(0,255,135,${(1 - d / LINK_DIST) * 0.18})`
            ctx.lineWidth   = 0.6
            ctx.stroke()
          }
        }
      }
    }
    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
      document.removeEventListener('mousemove', onMove)
    }
  }, [])

  /* ── Card tilt ───────────────────────────────────────── */
  useEffect(() => {
    const scene = sceneRef.current
    const card  = cardRef.current
    const holo  = holoRef.current
    if (!scene || !card || !holo) return
    if (window.innerWidth < 900) return  // disable on mobile

    let tRX = 0, tRY = 0, cRX = 0, cRY = 0
    let animId

    const onMove = (e) => {
      const r   = scene.getBoundingClientRect()
      const dcx = r.left + r.width  / 2
      const dcy = r.top  + r.height / 2
      const dx  = (e.clientX - dcx) / (window.innerWidth  / 2)
      const dy  = (e.clientY - dcy) / (window.innerHeight / 2)
      const dist = Math.sqrt(dx * dx + dy * dy)
      const str  = Math.min(1, 1.3 - dist * 0.45)
      tRY = dx * 24 * str
      tRX = -dy * 18 * str
      const sx = ((e.clientX - r.left) / r.width)  * 100
      const sy = ((e.clientY - r.top)  / r.height) * 100
      holo.style.background = `radial-gradient(circle at ${sx}% ${sy}%,rgba(0,255,135,0.14) 0%,rgba(0,255,200,0.05) 35%,transparent 65%)`
    }
    const onLeave = () => { tRX = 0; tRY = 0 }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseleave', onLeave)

    const loop = () => {
      animId = requestAnimationFrame(loop)
      cRX += (tRX - cRX) * 0.08
      cRY += (tRY - cRY) * 0.08
      const sc = 1 + Math.abs(cRX + cRY) * 0.0007
      card.style.transform = `rotateX(${cRX}deg) rotateY(${cRY}deg) scale(${sc})`
    }
    loop()

    return () => {
      cancelAnimationFrame(animId)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  /* ── Custom cursor ───────────────────────────────────── */
  useEffect(() => {
    if (window.innerWidth < 900) return
    const cur  = curRef.current
    const curR = curRRef.current
    if (!cur || !curR) return

    let cx = 0, cy = 0, rx = 0, ry = 0, animId

    const onMove = (e) => { cx = e.clientX; cy = e.clientY }
    document.addEventListener('mousemove', onMove)

    const loop = () => {
      animId = requestAnimationFrame(loop)
      rx += (cx - rx) * 0.13
      ry += (cy - ry) * 0.13
      cur.style.left  = cx + 'px'
      cur.style.top   = cy + 'px'
      curR.style.left = rx + 'px'
      curR.style.top  = ry + 'px'
    }
    loop()

    return () => {
      cancelAnimationFrame(animId)
      document.removeEventListener('mousemove', onMove)
    }
  }, [])

  /* ── ATS count-up ────────────────────────────────────── */
  useEffect(() => {
    const el = atsRef.current
    if (!el) return
    const target = 87, duration = 2200, delay = 900
    let started = false

    const runCount = () => {
      if (started) return
      started = true
      const start = performance.now() + delay
      const step  = (now) => {
        const elapsed  = Math.max(0, now - start)
        const progress = Math.min(elapsed / duration, 1)
        const ease     = 1 - Math.pow(1 - progress, 3)
        el.textContent = Math.round(ease * target)
        if (progress < 1) requestAnimationFrame(step)
        else el.textContent = target
      }
      requestAnimationFrame(step)
    }

    const scene = sceneRef.current
    if (!scene) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) runCount() },
      { threshold: 0.3 }
    )
    obs.observe(scene)
    setTimeout(() => {
      const r = scene.getBoundingClientRect()
      if (r.top < window.innerHeight) runCount()
    }, 300)

    return () => obs.disconnect()
  }, [])

  /* ── Scroll reveal ───────────────────────────────────── */
  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.12 }
    )
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  return (
    <>
      {/* Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@300;400;600;700;800&display=swap" rel="stylesheet"/>

      <style>{CSS}</style>



      {/* Noise overlay */}
      <div className="noise" />

      {/* ── NAV ───────────────────────────────────────────── */}
      <Nav />

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="hero">
        <canvas ref={canvasRef} id="hero-canvas" />

        {/* Left */}
        <div className="hero-left">
          <div className="hero-eyebrow">
            <span className="eyebrow-dot" />
            AI-Powered Resume Intelligence
          </div>
          <h1>
            Your resume.<br />
            <span className="line2">Decoded.</span><br />
            <span className="line3">Perfected.</span>
          </h1>
          <p className="hero-desc">
            ResumeAI cross-references every line of your resume against real job signals —
            giving you a precise, actionable match score before you ever hit send.
          </p>
          <div className="hero-actions">
            <Link to="/app"      className="btn-hero">Analyze My Resume</Link>
            <Link to="/register" className="btn-outline">Start Free</Link>
          </div>
          <div className="hero-stats">
            <div className="hstat">
              <span className="hstat-val">91%</span>
              <span className="hstat-label">Match Accuracy</span>
            </div>
            <div className="hstat">
              <span className="hstat-val">~15s</span>
              <span className="hstat-label">Avg Scan Time</span>
            </div>
            <div className="hstat">
              <span className="hstat-val">5 Free</span>
              <span className="hstat-label">No Account Needed</span>
            </div>
          </div>
        </div>

        {/* Right — holographic card */}
        <div className="hero-right">
          <div className="scene" id="scene" ref={sceneRef}>
            <div className="card-wrap" ref={cardRef}>
              <div className="card-glow" />
              <div className="card-outer">
                <div className="holo-layer" ref={holoRef} />
                <div className="scanline" />
                <div className="scanline2" />
                <div className="lines-tex" />
                <div className="ca tl" /><div className="ca tr" />
                <div className="ca bl" /><div className="ca br" />
                <div className="card-body">
                  <div className="card-top-row">
                    <div className="card-badge">Resume · Analyzed</div>
                    <div className="ats-block">
                      <span className="ats-label">Match Score</span>
                      <div className="ats-val">
                        <span ref={atsRef}>0</span>
                        <span style={{ fontSize: 14, color: 'rgba(0,255,135,0.5)' }}>%</span>
                      </div>
                      <span className="ats-sub">TOP 8%</span>
                    </div>
                  </div>

                  <div className="av-row">
                    <div className="av">
                      <svg viewBox="0 0 24 24" fill="none" stroke="#00FF87" strokeWidth="1.5">
                        <circle cx="12" cy="8" r="4"/>
                        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                      </svg>
                    </div>
                    <div>
                      <div className="nm">Chukwuemeka A.</div>
                      <div className="rl">Backend Engineer · Lagos NG</div>
                    </div>
                  </div>

                  <div className="div" />
                  <div className="sl">Skill Analysis</div>

                  {[
                    { name: 'Python',      w: '91%', delay: '.2s'  },
                    { name: 'FastAPI',     w: '87%', delay: '.35s' },
                    { name: 'PostgreSQL',  w: '82%', delay: '.5s'  },
                    { name: 'Docker',      w: '74%', delay: '.65s' },
                    { name: 'AWS',         w: '58%', delay: '.8s'  },
                  ].map(s => (
                    <div className="skrow" key={s.name}>
                      <span className="skn">{s.name}</span>
                      <div className="skt"><div className="skf" style={{ '--w': s.w, animationDelay: s.delay }} /></div>
                      <span className="skp">{s.w}</span>
                    </div>
                  ))}

                  <div className="tags">
                    <span className="tg">5 yrs exp</span>
                    <span className="tg">Remote</span>
                    <span className="tg">Open Source</span>
                    <span className="tg">Agile</span>
                    <span className="tg">Full-Time</span>
                  </div>

                  <div className="card-foot">
                    <div className="prow"><div className="pdot" />AI Processing</div>
                    <div className="cid">ID · 0xCE4F</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TICKER ────────────────────────────────────────── */}
      <div className="ticker-wrap">
        <div className="ticker">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((t, i) => (
            <div className="ticker-item" key={i}>{t} <span>✦</span></div>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ──────────────────────────────────── */}
      <section className="how" id="how">
        <div className="reveal"><div className="section-tag">Process</div></div>
        <div className="reveal">
          <h2 className="section-title">Three steps to your<br /><span>dream role</span></h2>
        </div>
        <div className="how-grid reveal">
          {STEPS.map((s) => (
            <div className="how-step" key={s.n}>
              <div className="step-line" />
              <div className="step-num">{s.n}</div>
              <div className="step-icon">{s.icon}</div>
              <div className="step-title">{s.title}</div>
              <div className="step-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────── */}
      <section id="features" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="reveal"><div className="section-tag">Capabilities</div></div>
        <div className="reveal">
          <h2 className="section-title">Everything your resume<br /><span>needs to win</span></h2>
        </div>
        <div className="features-grid">
          {FEATURES.map((f) => (
            <div className="feat-card reveal" key={f.title}>
              <div className="feat-icon">{f.icon}</div>
              <div className="feat-title">{f.title}</div>
              <div className="feat-desc">{f.desc}</div>
              <div className="feat-tag">{f.tag}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────── */}
      <section id="proof">
        <div className="reveal"><div className="section-tag">Social Proof</div></div>
        <div className="reveal">
          <h2 className="section-title">African devs who<br /><span>landed their roles</span></h2>
        </div>
        <div className="testi-grid">
          {TESTIMONIALS.map((t) => (
            <div className="testi-card reveal" key={t.name}>
              <div className="stars">★★★★★</div>
              <p className="testi-text">"{t.text}"</p>
              <div className="testi-author">
                <div className="testi-av">{t.initials}</div>
                <div>
                  <div className="testi-name">{t.name}</div>
                  <div className="testi-role">{t.role} · {t.city}</div>
                </div>
                <div className="testi-score">
                  <span className="score-before">{t.before}</span>
                  <span className="score-arrow">→</span>
                  <span className="score-after">{t.after}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── VALUE STRIP ───────────────────────────────────── */}
      <div className="value-strip reveal">
        {['Free to use', 'No account needed', 'Results in ~15 seconds', 'AES-256 encrypted', 'Built for African professionals'].map(v => (
          <span key={v}><span className="v-check">✓</span> {v}</span>
        ))}
      </div>

      {/* ── CTA BAND ──────────────────────────────────────── */}
      <section className="cta-band">
        <div className="cta-big reveal">
          Stop guessing.<br />
          <span className="ghost-text">Start winning.</span>
        </div>
        <p className="cta-sub reveal">
          Your next role is one optimised resume away.<br />
          5 free analyses. No account. No credit card.
        </p>
        <div className="cta-actions reveal">
          <Link to="/app"      className="btn-hero">Analyze My Resume Free</Link>
          <Link to="/register" className="btn-outline">Create Account</Link>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer>
        <div className="foot-brand">
          <div className="foot-logo">ResumeAI<span style={{ opacity: 0.4 }}>_</span></div>
          <p className="foot-desc">
            AI-powered resume intelligence for African tech professionals.
            Decode your resume. Land your role.
          </p>
          <div className="foot-cities">Lagos · Nairobi · Accra · Kigali · Johannesburg</div>
        </div>
        <div>
          <div className="foot-col-title">Product</div>
          <ul className="foot-links">
            <li><a href="#how">How it Works</a></li>
            <li><a href="#features">Features</a></li>
            <li><Link to="/app">Analyze Free</Link></li>
            <li><Link to="/register">Create Account</Link></li>
          </ul>
        </div>
        <div>
          <div className="foot-col-title">Account</div>
          <ul className="foot-links">
            <li><Link to="/login">Sign In</Link></li>
            <li><Link to="/register">Register</Link></li>
            <li><Link to="/history">History</Link></li>
          </ul>
        </div>
      </footer>

      <div className="foot-bottom">
        <div className="foot-copy">© {new Date().getFullYear()} ResumeAI · Built for African tech professionals</div>
        <div className="foot-status">
          <div className="pdot" />
          All systems operational
        </div>
      </div>
    </>
  )
}

/* ─────────────────────────────────────────────
   CSS — full template styles in JS string
   (avoids needing a separate .css file)
───────────────────────────────────────────── */
const CSS = `
:root {
  --g:    #00FF87;
  --g2:   rgba(0,255,135,0.12);
  --g3:   rgba(0,255,135,0.05);
  --bg:   #040a06;
  --bg2:  #060e08;
  --text: #d4f5e9;
  --muted: rgba(212,245,233,0.38);
  --border: rgba(0,255,135,0.12);
}

*, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
html { scroll-behavior: smooth; }

body {
  background: var(--bg);
  color: var(--text);
  font-family: 'Syne', sans-serif;
  overflow-x: hidden;
}



/* ── NOISE ── */
.noise {
  position: fixed; inset: 0; pointer-events: none; z-index: 1; opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 180px;
}

/* ── HERO ── */
.hero {
  min-height: 100vh; padding: 90px 56px 60px;
  display: grid; grid-template-columns: 1fr 1fr;
  align-items: center; gap: 64px;
  position: relative; overflow: hidden;
}
.hero::before {
  content: ''; position: absolute; top: -200px; left: -200px;
  width: 700px; height: 700px; border-radius: 50%;
  background: radial-gradient(circle, rgba(0,255,135,0.055) 0%, transparent 65%);
  pointer-events: none;
}
.hero::after {
  content: ''; position: absolute; bottom: -100px; right: -100px;
  width: 500px; height: 500px; border-radius: 50%;
  background: radial-gradient(circle, rgba(0,255,135,0.03) 0%, transparent 65%);
  pointer-events: none;
}
#hero-canvas {
  position: absolute; inset: 0; width: 100%; height: 100%;
  pointer-events: none; z-index: 0; opacity: 0.85;
}
.hero-left { z-index: 2; }
.hero-eyebrow {
  display: inline-flex; align-items: center; gap: 10px;
  font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.4em;
  color: var(--g); text-transform: uppercase; margin-bottom: 28px;
  opacity: 0; animation: fadeUp .8s .2s forwards;
}
.eyebrow-dot {
  width: 5px; height: 5px; border-radius: 50%; background: var(--g);
  box-shadow: 0 0 8px var(--g); animation: pdot 2s infinite; display: inline-block;
}
.hero h1 {
  font-size: clamp(44px, 5.5vw, 76px); font-weight: 800;
  line-height: 1.0; letter-spacing: -0.03em;
  opacity: 0; animation: fadeUp .8s .4s forwards;
}
.hero h1 .line2 { color: var(--g); }
.hero h1 .line3 {
  -webkit-text-stroke: 1px rgba(0,255,135,0.4);
  color: transparent; font-weight: 800;
}
.hero-desc {
  margin-top: 24px; font-size: 16px; line-height: 1.75;
  color: var(--muted); max-width: 440px; font-weight: 300;
  opacity: 0; animation: fadeUp .8s .6s forwards;
}
.hero-actions {
  margin-top: 40px; display: flex; gap: 14px; align-items: center; flex-wrap: wrap;
  opacity: 0; animation: fadeUp .8s .8s forwards;
}
.btn-hero {
  font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 0.25em;
  color: var(--bg); background: var(--g); border: none;
  padding: 16px 40px; text-transform: uppercase; cursor: pointer;
  transition: all .3s; position: relative; overflow: hidden; text-decoration: none;
  display: inline-flex; align-items: center;
}
.btn-hero::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
  transform: translateX(-100%); transition: transform .5s;
}
.btn-hero:hover::after { transform: translateX(100%); }
.btn-hero:hover { box-shadow: 0 0 48px rgba(0,255,135,0.5); transform: translateY(-2px); }
.btn-outline {
  font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 0.25em;
  color: var(--g); background: transparent;
  border: 1px solid rgba(0,255,135,0.3);
  padding: 16px 40px; text-transform: uppercase; cursor: pointer;
  transition: all .25s; text-decoration: none; display: inline-flex; align-items: center;
}
.btn-outline:hover { background: var(--g2); border-color: var(--g); }
.hero-stats {
  margin-top: 56px; display: flex; gap: 40px; flex-wrap: wrap;
  opacity: 0; animation: fadeUp .8s 1s forwards;
}
.hstat { display: flex; flex-direction: column; gap: 4px; }
.hstat-val { font-family: 'DM Mono', monospace; font-size: 26px; color: var(--g); font-weight: 500; }
.hstat-label { font-size: 11px; letter-spacing: 0.15em; color: var(--muted); text-transform: uppercase; }

/* ── HERO RIGHT (card) ── */
.hero-right {
  display: flex; align-items: center; justify-content: center;
  z-index: 2; opacity: 0; animation: fadeRight .9s .5s forwards;
}
.scene { perspective: 900px; width: 340px; height: 480px; position: relative; }
.card-wrap { width: 100%; height: 100%; transform-style: preserve-3d; transition: transform .08s ease-out; }
.card-outer {
  position: absolute; inset: 0; border-radius: 6px;
  background: linear-gradient(145deg, #071a10 0%, #030d07 60%, #071408 100%);
  border: 1px solid rgba(0,255,135,0.22); overflow: hidden;
  box-shadow: 0 0 0 1px rgba(0,255,135,0.06), 0 40px 100px rgba(0,0,0,0.9),
    0 0 80px rgba(0,255,135,0.07), inset 0 1px 0 rgba(0,255,135,0.18);
}
.holo-layer {
  position: absolute; inset: 0; pointer-events: none; z-index: 10;
  border-radius: 6px; transition: background .05s;
}
.scanline {
  position: absolute; left: 0; right: 0; height: 2px; z-index: 12;
  background: linear-gradient(90deg, transparent, rgba(0,255,135,0.7) 50%, transparent);
  animation: scan 3.2s linear infinite; filter: blur(1px);
}
.scanline2 {
  position: absolute; left: 0; right: 0; height: 1px; z-index: 12;
  background: linear-gradient(90deg, transparent, rgba(0,255,135,0.3) 50%, transparent);
  animation: scan 3.2s linear infinite 1.6s; opacity: 0.5;
}
@keyframes scan {
  0%   { top: -2px; opacity: 0; }
  5%   { opacity: 1; }
  95%  { opacity: 1; }
  100% { top: 482px; opacity: 0; }
}
.lines-tex {
  position: absolute; inset: 0; pointer-events: none; z-index: 2;
  background: repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.12) 3px, rgba(0,0,0,0.12) 4px);
}
.ca { position: absolute; width: 16px; height: 16px; z-index: 15; }
.ca.tl { top: 12px; left: 12px; border-top: 1.5px solid var(--g); border-left: 1.5px solid var(--g); }
.ca.tr { top: 12px; right: 12px; border-top: 1.5px solid var(--g); border-right: 1.5px solid var(--g); }
.ca.bl { bottom: 12px; left: 12px; border-bottom: 1.5px solid var(--g); border-left: 1.5px solid var(--g); }
.ca.br { bottom: 12px; right: 12px; border-bottom: 1.5px solid var(--g); border-right: 1.5px solid var(--g); }
.card-body {
  position: relative; z-index: 8; padding: 30px 28px;
  height: 100%; display: flex; flex-direction: column; gap: 0;
}
.card-top-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.card-badge {
  font-family: 'DM Mono', monospace; font-size: 8px; letter-spacing: 0.35em; color: var(--g);
  text-transform: uppercase; border: 1px solid rgba(0,255,135,0.3); padding: 4px 10px;
  border-radius: 2px; background: rgba(0,255,135,0.05);
}
.ats-block { text-align: right; }
.ats-label { font-family: 'DM Mono', monospace; font-size: 8px; color: rgba(0,255,135,0.45); letter-spacing: 0.2em; display: block; }
.ats-val { font-family: 'DM Mono', monospace; font-size: 28px; color: var(--g); font-weight: 500; line-height: 1; }
.ats-sub { font-family: 'DM Mono', monospace; font-size: 8px; color: rgba(0,255,135,0.35); letter-spacing: 0.1em; }
.av-row { display: flex; align-items: center; gap: 14px; margin-bottom: 18px; }
.av {
  width: 46px; height: 46px; border-radius: 50%;
  border: 1.5px solid rgba(0,255,135,0.3);
  background: radial-gradient(circle at 35% 35%, rgba(0,255,135,0.15), rgba(0,255,135,0.03));
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  box-shadow: 0 0 18px rgba(0,255,135,0.1);
}
.av svg { width: 22px; height: 22px; opacity: 0.55; }
.nm { font-size: 15px; font-weight: 700; color: #e8fff4; letter-spacing: 0.01em; }
.rl { font-family: 'DM Mono', monospace; font-size: 8px; color: rgba(0,255,135,0.45); letter-spacing: 0.12em; margin-top: 2px; text-transform: uppercase; }
.div { height: 1px; margin-bottom: 16px; background: linear-gradient(90deg, var(--g), rgba(0,255,135,0.1), transparent); opacity: 0.3; }
.sl { font-family: 'DM Mono', monospace; font-size: 8px; letter-spacing: 0.3em; color: rgba(0,255,135,0.4); text-transform: uppercase; margin-bottom: 10px; }
.skrow { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.skn { font-family: 'DM Mono', monospace; font-size: 9px; color: rgba(212,245,233,0.55); width: 82px; flex-shrink: 0; }
.skt { flex: 1; height: 2.5px; background: rgba(0,255,135,0.08); border-radius: 2px; overflow: hidden; }
.skf {
  height: 100%; border-radius: 2px;
  background: linear-gradient(90deg, var(--g), rgba(0,255,135,0.6));
  box-shadow: 0 0 5px rgba(0,255,135,0.5);
  animation: fillBar 1.8s cubic-bezier(0.16,1,0.3,1) forwards; width: 0%;
}
@keyframes fillBar { from { width: 0%; opacity: 0; } to { width: var(--w); opacity: 1; } }
.skp { font-family: 'DM Mono', monospace; font-size: 8px; color: rgba(0,255,135,0.4); width: 26px; text-align: right; }
.tags { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 14px; }
.tg {
  font-family: 'DM Mono', monospace; font-size: 8px; letter-spacing: 0.12em;
  color: rgba(0,255,135,0.55); border: 1px solid rgba(0,255,135,0.16);
  padding: 3px 9px; border-radius: 2px; background: rgba(0,255,135,0.03); text-transform: uppercase;
}
.card-foot {
  margin-top: auto; padding-top: 14px; border-top: 1px solid rgba(0,255,135,0.08);
  display: flex; justify-content: space-between; align-items: center;
}
.prow {
  display: flex; align-items: center; gap: 6px; font-family: 'DM Mono', monospace;
  font-size: 8px; color: rgba(0,255,135,0.4); letter-spacing: 0.15em; text-transform: uppercase;
}
.pdot {
  width: 5px; height: 5px; border-radius: 50%; background: var(--g);
  box-shadow: 0 0 6px var(--g); animation: pdot 2s infinite; flex-shrink: 0;
}
@keyframes pdot { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.4; transform:scale(0.7); } }
.cid { font-family: 'DM Mono', monospace; font-size: 8px; color: rgba(0,255,135,0.2); letter-spacing: 0.1em; }
.card-glow {
  position: absolute; inset: -60px; pointer-events: none; z-index: -1; border-radius: 50%;
  background: radial-gradient(ellipse at center, rgba(0,255,135,0.08) 0%, transparent 60%);
  transition: opacity .3s;
}

/* ── TICKER ── */
.ticker-wrap {
  overflow: hidden; padding: 20px 0;
  border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
  background: var(--bg2);
}
.ticker { display: flex; gap: 0; animation: tick 28s linear infinite; white-space: nowrap; }
.ticker-item {
  font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 0.3em;
  color: rgba(0,255,135,0.3); text-transform: uppercase;
  padding: 0 40px; display: flex; align-items: center; gap: 20px;
}
.ticker-item span { color: var(--g); opacity: 0.6; }
@keyframes tick { from { transform: translateX(0); } to { transform: translateX(-50%); } }

/* ── SECTIONS ── */
section { padding: 120px 56px; position: relative; }
.section-tag {
  font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 0.45em;
  color: var(--g); text-transform: uppercase; margin-bottom: 20px;
  display: inline-flex; align-items: center; gap: 10px;
}
.section-tag::before { content: ''; width: 24px; height: 1px; background: var(--g); opacity: 0.5; }
.section-title { font-size: clamp(32px,4vw,54px); font-weight: 800; letter-spacing: -0.02em; line-height: 1.1; }
.section-title span { color: var(--g); }

/* ── HOW ── */
.how { background: var(--bg2); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
.how-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 2px; margin-top: 64px; border: 1px solid var(--border); }
.how-step {
  padding: 48px 36px; position: relative;
  border-right: 1px solid var(--border); transition: background .3s;
}
.how-step:last-child { border-right: none; }
.how-step:hover { background: var(--g3); }
.step-num { font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 0.3em; color: rgba(0,255,135,0.25); margin-bottom: 32px; }
.step-icon {
  width: 52px; height: 52px; border: 1px solid rgba(0,255,135,0.2);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 24px; background: var(--g3); transition: border-color .3s, box-shadow .3s;
}
.how-step:hover .step-icon { border-color: rgba(0,255,135,0.5); box-shadow: 0 0 24px rgba(0,255,135,0.1); }
.step-icon svg { width: 24px; height: 24px; color: var(--g); }
.step-title { font-size: 20px; font-weight: 700; margin-bottom: 12px; letter-spacing: -0.01em; }
.step-desc { font-size: 14px; line-height: 1.7; color: var(--muted); font-weight: 300; }
.step-line {
  position: absolute; top: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, var(--g), transparent);
  transform: scaleX(0); transform-origin: left;
  transition: transform .4s cubic-bezier(0.16,1,0.3,1);
}
.how-step:hover .step-line { transform: scaleX(1); }

/* ── FEATURES ── */
.features-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 24px; margin-top: 64px; }
.feat-card {
  padding: 40px; border: 1px solid var(--border);
  position: relative; overflow: hidden;
  transition: border-color .3s, transform .3s;
  background: linear-gradient(145deg, rgba(0,255,135,0.03), transparent);
}
.feat-card:hover { border-color: rgba(0,255,135,0.35); transform: translateY(-4px); }
.feat-card::after {
  content: ''; position: absolute; inset: 0;
  background: radial-gradient(circle at top left, rgba(0,255,135,0.06), transparent 60%);
  opacity: 0; transition: opacity .3s;
}
.feat-card:hover::after { opacity: 1; }
.feat-icon {
  width: 44px; height: 44px; border: 1px solid rgba(0,255,135,0.2);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 20px; background: var(--g3);
}
.feat-icon svg { width: 20px; height: 20px; color: var(--g); }
.feat-title { font-size: 20px; font-weight: 700; margin-bottom: 10px; letter-spacing: -0.01em; }
.feat-desc { font-size: 14px; line-height: 1.7; color: var(--muted); font-weight: 300; }
.feat-tag {
  margin-top: 20px; display: inline-block;
  font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 0.2em;
  color: var(--g); text-transform: uppercase;
  border-bottom: 1px solid rgba(0,255,135,0.3); padding-bottom: 2px;
}

/* ── TESTIMONIALS ── */
.testi-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; margin-top: 64px; }
.testi-card {
  padding: 36px; border: 1px solid var(--border);
  position: relative; transition: border-color .3s;
}
.testi-card:hover { border-color: rgba(0,255,135,0.3); }
.testi-card::before {
  content: '"'; position: absolute; top: 24px; right: 28px;
  font-size: 80px; color: rgba(0,255,135,0.06); font-family: 'Syne', sans-serif;
  font-weight: 800; line-height: 1; pointer-events: none;
}
.stars { display: flex; gap: 4px; margin-bottom: 18px; color: var(--g); font-size: 12px; }
.testi-text { font-size: 14px; line-height: 1.75; color: var(--muted); font-weight: 300; margin-bottom: 24px; }
.testi-author { display: flex; align-items: center; gap: 12px; }
.testi-av {
  width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
  border: 1px solid rgba(0,255,135,0.25);
  background: radial-gradient(circle at 35% 35%, rgba(0,255,135,0.2), rgba(0,255,135,0.05));
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700; color: var(--g); font-family: 'DM Mono', monospace;
}
.testi-name { font-size: 13px; font-weight: 600; color: var(--text); }
.testi-role { font-family: 'DM Mono', monospace; font-size: 9px; color: var(--muted); letter-spacing: 0.1em; text-transform: uppercase; margin-top: 1px; }
.testi-score { margin-left: auto; display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.score-before { font-family: 'DM Mono', monospace; font-size: 12px; color: rgba(212,245,233,0.25); }
.score-arrow  { font-size: 10px; color: var(--g); }
.score-after  { font-family: 'DM Mono', monospace; font-size: 20px; font-weight: 700; color: var(--g); }

/* ── VALUE STRIP ── */
.value-strip {
  display: flex; flex-wrap: wrap; gap: 24px; justify-content: center;
  padding: 18px 56px;
  border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
  background: var(--bg2);
  font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 0.06em; color: var(--muted);
}
.v-check { color: var(--g); margin-right: 4px; }

/* ── CTA BAND ── */
.cta-band {
  padding: 120px 56px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  text-align: center; position: relative; overflow: hidden;
  border-top: 1px solid var(--border);
}
.cta-band::before {
  content: ''; position: absolute; top: 50%; left: 50%;
  transform: translate(-50%,-50%);
  width: 800px; height: 400px; border-radius: 50%;
  background: radial-gradient(ellipse, rgba(0,255,135,0.07), transparent 65%);
  pointer-events: none;
}
.cta-big { font-size: clamp(40px,6vw,88px); font-weight: 800; letter-spacing: -0.03em; line-height: 1; margin-bottom: 24px; }
.ghost-text { -webkit-text-stroke: 1px rgba(0,255,135,0.35); color: transparent; }
.cta-sub { font-size: 16px; color: var(--muted); max-width: 480px; line-height: 1.7; font-weight: 300; margin-bottom: 40px; }
.cta-actions { display: flex; gap: 14px; flex-wrap: wrap; justify-content: center; }

/* ── FOOTER ── */
footer {
  padding: 56px 56px 40px;
  border-top: 1px solid var(--border);
  display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 48px;
}
.foot-brand { display: flex; flex-direction: column; gap: 12px; }
.foot-logo { font-family: 'DM Mono', monospace; font-size: 18px; font-weight: 500; color: var(--g); letter-spacing: 0.08em; }
.foot-desc { font-size: 13px; color: var(--muted); line-height: 1.7; font-weight: 300; max-width: 280px; }
.foot-cities { font-family: 'DM Mono', monospace; font-size: 10px; color: rgba(0,255,135,0.25); letter-spacing: 0.12em; }
.foot-col-title { font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 0.3em; color: rgba(0,255,135,0.4); text-transform: uppercase; margin-bottom: 16px; }
.foot-links { list-style: none; display: flex; flex-direction: column; gap: 10px; }
.foot-links a { font-size: 13px; color: var(--muted); text-decoration: none; transition: color .2s; font-weight: 300; }
.foot-links a:hover { color: var(--g); }
.foot-bottom {
  padding: 24px 56px; border-top: 1px solid rgba(0,255,135,0.06);
  display: flex; justify-content: space-between; align-items: center;
}
.foot-copy { font-family: 'DM Mono', monospace; font-size: 10px; color: rgba(0,255,135,0.2); letter-spacing: 0.15em; }
.foot-status { display: flex; align-items: center; gap: 8px; font-family: 'DM Mono', monospace; font-size: 10px; color: rgba(0,255,135,0.3); letter-spacing: 0.15em; }

/* ── SCROLL REVEAL ── */
.reveal { opacity: 0; transform: translateY(28px); transition: opacity .7s, transform .7s; }
.reveal.visible { opacity: 1; transform: translateY(0); }

/* ── ANIMATIONS ── */
@keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
@keyframes fadeRight { from { opacity:0; transform:translateX(32px); } to { opacity:1; transform:translateX(0); } }

/* ── RESPONSIVE ── */
@media (max-width: 1024px) {
  .testi-grid { grid-template-columns: repeat(2,1fr); }
  .testi-grid .testi-card:last-child { display: none; }
  .features-grid { grid-template-columns: 1fr; }
}

@media (max-width: 900px) {
  .hero { grid-template-columns: 1fr; padding: 100px 24px 60px; gap: 48px; }
  .hero-right { order: -1; }
  .scene { width: 300px; height: 420px; }
  section { padding: 80px 24px; }
  .how-grid { grid-template-columns: 1fr; }
  .how-step { border-right: none; border-bottom: 1px solid var(--border); }
  .features-grid { grid-template-columns: 1fr; }
  .testi-grid { grid-template-columns: 1fr; }
  .testi-grid .testi-card:last-child { display: block; }
  footer { grid-template-columns: 1fr 1fr; padding: 48px 24px 32px; }
  .foot-bottom { padding: 20px 24px; flex-direction: column; gap: 12px; }
  .cta-band { padding: 80px 24px; }
  .cta-actions { flex-direction: column; align-items: center; }
  .value-strip { padding: 16px 24px; gap: 16px; font-size: 10px; }
  .hero-stats { gap: 24px; }
}

@media (max-width: 640px) {
  .hero { padding: 90px 16px 48px; gap: 36px; }
  .hero h1 { font-size: clamp(36px, 10vw, 56px); }
  .hero-desc { font-size: 14px; }
  .hero-actions { flex-direction: column; align-items: flex-start; }
  .btn-hero, .btn-outline { width: 100%; justify-content: center; padding: 14px 24px; }
  .scene { width: 280px; height: 390px; }
  section { padding: 60px 16px; }
  .how-step { padding: 32px 24px; }
  .feat-card { padding: 28px 24px; }
  .testi-card { padding: 28px 20px; }
  footer { grid-template-columns: 1fr; padding: 40px 16px 24px; gap: 32px; }
  .foot-bottom { padding: 16px; }
  .cta-band { padding: 60px 16px; }
  .cta-big { font-size: clamp(36px, 9vw, 60px); }
  .value-strip { padding: 14px 16px; justify-content: flex-start; }
}
`