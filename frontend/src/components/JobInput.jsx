import { useState } from 'react'
import { analyzeResume } from '../api/resume.js'

export default function JobInput({ resumeId, onAnalysisStarted }) {
  const [jd,      setJd]      = useState('')
  const [title,   setTitle]   = useState('')
  const [company, setCompany] = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [modal,   setModal]   = useState(null)  // null | 'guest' | 'daily'

  const canSubmit = jd.trim().length >= 100 && !loading

  async function handleSubmit() {
    setError(null)
    setLoading(true)
    try {
      const data = await analyzeResume({
        resume_id:       resumeId,
        job_description: jd,
        job_title:       title   || 'Untitled Role',
        company:         company || 'Unknown Company',
      })
      onAnalysisStarted(data.analysis_id)
    } catch (err) {
      const status = err.response?.status
      const body   = err.response?.data
      if (status === 429) {
        if (body?.action === 'register')  setModal('guest')
        else if (body?.action === 'upgrade') setModal('daily')
        else setError(body?.error || 'Too many requests — please wait')
      } else {
        setError(body?.detail || 'Analysis failed — please retry')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      <div>
        <label className="label">Job Description *</label>
        <textarea
          className="input"
          value={jd}
          onChange={e => setJd(e.target.value)}
          placeholder="Paste the full job description here..."
          style={{ minHeight: 180 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontSize: 10, color: 'var(--text-ghost)' }}>Minimum 100 characters</span>
          <span style={{ fontSize: 10, color: jd.length < 100 ? 'var(--red)' : 'var(--green)' }}>
            {jd.length} chars
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label className="label">Job Title</label>
          <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Backend Engineer" />
        </div>
        <div>
          <label className="label">Company</label>
          <input className="input" value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Flutterwave" />
        </div>
      </div>

      {error && <div className="banner banner-error"><span>⚠</span><span>{error}</span></div>}

      <button
        className={`btn btn-primary${canSubmit ? ' pulse' : ''}`}
        disabled={!canSubmit}
        onClick={handleSubmit}
        style={{ alignSelf: 'flex-start', padding: '12px 28px' }}
      >
        {loading ? <><span className="spinner" /> Analyzing...</> : '▶ Analyze Match'}
      </button>

      {/* ── Limit modals ── */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            {modal === 'guest' ? (
              <>
                <p style={{ fontSize: 11, color: 'var(--green)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                  Guest Limit Reached
                </p>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, marginBottom: 12 }}>
                  You've used all 5 free analyses
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 24, lineHeight: 1.7 }}>
                  Create a free account for 50 analyses per day. No credit card needed.
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <a href="/register" className="btn btn-primary" style={{ padding: '10px 20px' }}>
                    Create Free Account
                  </a>
                  <button className="btn btn-ghost" onClick={() => setModal(null)}>Maybe Later</button>
                </div>
              </>
            ) : (
              <>
                <p style={{ fontSize: 11, color: 'var(--orange)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                  Daily Limit Reached
                </p>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, marginBottom: 12 }}>
                  50/50 analyses used today
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 24 }}>
                  Your limit resets at midnight UTC. Pro plan coming soon.
                </p>
                <button className="btn btn-primary" onClick={() => setModal(null)}>Got it</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}