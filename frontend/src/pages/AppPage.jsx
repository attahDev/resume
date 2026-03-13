import { useState } from 'react'
import Nav            from '../components/Nav.jsx'
import UploadZone     from '../components/UploadZone.jsx'
import JobInput       from '../components/JobInput.jsx'
import StatusPoller   from '../components/StatusPoller.jsx'
import ScoreDashboard from '../components/ScoreDashboard.jsx'
import { useAuth }    from '../auth/useAuth.jsx'

const STEPS = ['Upload', 'Describe Job', 'Analyzing', 'Results']

export default function AppPage() {
  const { user, isAuthenticated, refreshUser } = useAuth()
  const [step,       setStep]       = useState(1)
  const [resumeId,   setResumeId]   = useState(null)
  const [analysisId, setAnalysisId] = useState(null)
  const [result,     setResult]     = useState(null)

  function handleUploadSuccess(data) {
    setResumeId(data.resume_id)
    setStep(2)
  }

  function handleAnalysisStarted(id) {
    setAnalysisId(id)
    setStep(3)
    if (isAuthenticated) refreshUser()
  }

  function handleComplete(data) {
    setResult(data)
    setStep(4)
  }

  function handleReset() {
    setStep(1)
    setResumeId(null)
    setAnalysisId(null)
    setResult(null)
  }

  const dailyLeft = isAuthenticated && user
    ? Math.max(0, 50 - (user.daily_analyses_count || 0))
    : null

  return (
    <div className="page">
      {/* Inner page — hide landing anchors, keep ANALYZE/HISTORY/auth */}
      <Nav links={[]} />

      <div className="container" style={{ paddingTop: 80, paddingBottom: 80 }}>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 44, overflowX: 'auto' }}>
          {STEPS.map((s, i) => {
            const n      = i + 1
            const done   = step > n
            const active = step === n
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 24, height: 24,
                    border: `1px solid ${done || active ? 'var(--green)' : 'var(--border)'}`,
                    background: done ? 'var(--green)' : 'transparent',
                    color: done ? '#000' : active ? 'var(--green)' : 'var(--text-ghost)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, flexShrink: 0,
                  }}>
                    {done ? '✓' : n}
                  </span>
                  <span style={{
                    fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: active ? 'var(--text)' : done ? 'var(--text-dim)' : 'var(--text-ghost)',
                    whiteSpace: 'nowrap',
                  }}>
                    {s}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ width: 28, height: 1, background: 'var(--border)', margin: '0 10px' }} />
                )}
              </div>
            )
          })}

          {dailyLeft !== null && (
            <span style={{ marginLeft: 'auto', paddingLeft: 16, fontSize: 11, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
              {dailyLeft}/10 left today
            </span>
          )}
        </div>

        {/* Step content */}
        <div key={step} className="animate-fade-in">

          {step === 1 && (
            <>
              <h2 style={{ fontSize: 26, marginBottom: 6 }}>Upload Your Resume</h2>
              <p style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 24 }}>
                PDF or DOCX · Analyzed locally · PII never stored in plain text
              </p>
              <UploadZone onSuccess={handleUploadSuccess} />
            </>
          )}

          {step === 2 && (
            <>
              <h2 style={{ fontSize: 26, marginBottom: 6 }}>Describe the Role</h2>
              <p style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 24 }}>
                Paste the full job description for the most accurate match score
              </p>
              <JobInput resumeId={resumeId} onAnalysisStarted={handleAnalysisStarted} />
              <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={() => setStep(1)}>← Back</button>
            </>
          )}

          {step === 3 && (
            <>
              <h2 style={{ fontSize: 26, marginBottom: 6 }}>Running Analysis</h2>
              <p style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 8 }}>
                Scoring your resume against the job description
              </p>
              <StatusPoller analysisId={analysisId} onComplete={handleComplete} />
            </>
          )}

          {step === 4 && result && (
            <>
              <h2 style={{ fontSize: 26, marginBottom: 24 }}>Your Match Score</h2>
              <ScoreDashboard result={result} onReset={handleReset} />
            </>
          )}

        </div>
      </div>
    </div>
  )
}