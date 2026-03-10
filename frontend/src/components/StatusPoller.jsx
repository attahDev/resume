import { useEffect, useRef, useState } from 'react'
import { getResult } from '../api/resume.js'

const PHASES = [
  { until: 3,  label: 'Parsing your resume...' },
  { until: 6,  label: 'Extracting skills...' },
  { until: 10, label: 'Running AI analysis...' },
  { until: 90, label: 'Finalising results...' },
]

const STEPS = ['Parsing resume', 'Extracting skills', 'Scoring match', 'AI coaching']

export default function StatusPoller({ analysisId, onComplete }) {
  const [elapsed,  setElapsed]  = useState(0)
  const [timedOut, setTimedOut] = useState(false)
  const [failed,   setFailed]   = useState(false)
  const startRef    = useRef(Date.now())
  const timerRef    = useRef(null)
  const intervalRef = useRef(null)

  useEffect(() => {
    // Elapsed ticker
    timerRef.current = setInterval(() => {
      const s = (Date.now() - startRef.current) / 1000
      setElapsed(s)
      if (s > 90) { setTimedOut(true); clearInterval(timerRef.current) }
    }, 300)

    // API poll every 2s
    intervalRef.current = setInterval(async () => {
      try {
        const data = await getResult(analysisId)
        if (data.status === 'complete') {
          clearInterval(intervalRef.current)
          clearInterval(timerRef.current)
          onComplete(data)
        } else if (data.status === 'failed') {
          clearInterval(intervalRef.current)
          clearInterval(timerRef.current)
          setFailed(true)
        }
      } catch { /* keep polling */ }
    }, 2000)

    return () => {
      clearInterval(timerRef.current)
      clearInterval(intervalRef.current)
    }
  }, [analysisId, onComplete])

  if (timedOut || failed) {
    return (
      <div style={{ padding: '48px 0', textAlign: 'center' }}>
        <p style={{ color: 'var(--red)', marginBottom: 20, fontSize: 13 }}>
          {timedOut ? 'Analysis timed out after 90 seconds.' : 'Analysis failed on the server.'}
        </p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          ↩ Start over
        </button>
      </div>
    )
  }

  const phase = PHASES.find(p => elapsed < p.until) || PHASES[PHASES.length - 1]
  const pct   = Math.min(95, (elapsed / 15) * 100)

  return (
    <div style={{ padding: '40px 0' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{phase.label}</span>
          <span style={{ fontSize: 11, color: 'var(--text-ghost)' }}>{Math.round(elapsed)}s</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {STEPS.map((step, i) => {
          const stepThreshold = i * 3
          const done   = elapsed > stepThreshold + 3
          const active = elapsed > stepThreshold && !done
          return (
            <div
              key={step}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                opacity: elapsed > stepThreshold ? 1 : 0.25,
                transition: 'opacity 0.5s ease',
              }}
            >
              <span style={{ width: 16, textAlign: 'center', fontSize: 12, color: done ? 'var(--green)' : active ? 'var(--text-dim)' : 'var(--text-ghost)' }}>
                {done ? '✓' : active ? '›' : '○'}
              </span>
              <span style={{ fontSize: 12, color: done ? 'var(--text)' : active ? 'var(--text-dim)' : 'var(--text-ghost)', transition: 'color 0.4s' }}>
                {step}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}