import { useState } from 'react'
import { useAuth } from '../auth/useAuth.jsx'
import GapList from './GapList.jsx'

function scoreColor(n) {
  if (n >= 90) return 'var(--indigo)'
  if (n >= 75) return 'var(--green)'
  if (n >= 50) return 'var(--orange)'
  return 'var(--red)'
}

function ScoreBar({ label, value, delay }) {
  return (
    <div className="score-bar-row" style={{ animation: `fadeIn 0.4s ease ${delay}s both` }}>
      <span className="score-bar-label">{label}</span>
      <div className="score-bar-track">
        <div className="score-bar-fill" style={{ width: `${value ?? 0}%` }} />
      </div>
      <span className="score-bar-val" style={{ color: scoreColor(value ?? 0) }}>{value ?? '—'}</span>
    </div>
  )
}

export default function ScoreDashboard({ result, onReset }) {
  const { isGuest } = useAuth()
  const [tab, setTab] = useState('gaps')

  const {
    overall_score:    overall    = 0,
    skills_score:     skills     = 0,
    experience_score: exp        = 0,
    keywords_score:   kw         = 0,
    overall_assessment: assessment,
    top_strengths:    strengths  = [],
    critical_gaps:    gaps       = [],
    quick_wins:       wins       = [],
    ats_warning:      atsWarn,
    score_explanation: explanation,
    matched_skills:   matched    = [],
    missing_skills:   missing    = [],
  } = result

  const color = scoreColor(overall)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeIn 0.4s ease' }}>

      {/* ── Score header ── */}
      <div className="card card-glow" style={{ display: 'flex', gap: 28, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div
          className="score-circle"
          style={{ borderColor: color, boxShadow: `0 0 28px ${color}44`, flexShrink: 0 }}
        >
          <span className="score-num" style={{ color }}>{overall}</span>
          <span className="score-label">/ 100</span>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          {assessment && (
            <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.8, marginBottom: 18 }}>
              {assessment}
            </p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <ScoreBar label="Skills"     value={skills} delay={0.1} />
            <ScoreBar label="Experience" value={exp}    delay={0.2} />
            <ScoreBar label="Keywords"   value={kw}     delay={0.3} />
          </div>
        </div>
      </div>

      {/* ── Score explanation ── */}
      {explanation && (
        <div style={{
          padding: '12px 16px', background: 'var(--surface-2)',
          borderLeft: '2px solid var(--text-ghost)', fontSize: 12,
          color: 'var(--text-dim)', lineHeight: 1.7,
        }}>
          {explanation}
        </div>
      )}

      {/* ── Skill chips ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <p className="label" style={{ marginBottom: 10 }}>Matched Skills</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {matched.length > 0
              ? matched.map((s, i) => (
                  <span key={s} className="badge badge-green" style={{ animation: `tagBounce 0.3s ease ${i * 0.04}s both` }}>
                    {s}
                  </span>
                ))
              : <span style={{ fontSize: 11, color: 'var(--text-ghost)' }}>None detected</span>
            }
          </div>
        </div>
        <div>
          <p className="label" style={{ marginBottom: 10 }}>Missing Skills</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {missing.length > 0
              ? missing.map((s, i) => (
                  <span key={s} className="badge badge-red" style={{ animation: `tagBounce 0.3s ease ${i * 0.04}s both` }}>
                    {s}
                  </span>
                ))
              : <span style={{ fontSize: 11, color: 'var(--text-ghost)' }}>None — great match!</span>
            }
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
          {[['gaps', 'Gaps & Actions'], ['strengths', 'Strengths']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                padding: '8px 20px', background: 'none', border: 'none',
                borderBottom: tab === key ? '2px solid var(--green)' : '2px solid transparent',
                color: tab === key ? 'var(--green)' : 'var(--text-dim)',
                fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                cursor: 'pointer', marginBottom: -1, transition: 'color 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'gaps' && (
          <GapList criticalGaps={gaps} quickWins={wins} atsWarning={atsWarn} />
        )}
        {tab === 'strengths' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {strengths.length > 0
              ? strengths.map((s, i) => (
                  <span key={i} className="badge badge-green" style={{ fontSize: 12, padding: '4px 12px', animation: `tagBounce 0.3s ease ${i * 0.08}s both` }}>
                    ✓ {s}
                  </span>
                ))
              : <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>No strengths data available.</span>
            }
          </div>
        )}
      </div>

      {/* ── Guest upgrade banner ── */}
      {isGuest && (
        <div className="banner banner-info" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span>Create a free account to compare resume versions and track your progress.</span>
          <a href="/register" className="btn btn-primary" style={{ padding: '6px 16px', whiteSpace: 'nowrap' }}>
            Free Account →
          </a>
        </div>
      )}

      {/* ── Reset ── */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
        <button className="btn" onClick={onReset}>↩ Analyze Another Job</button>
      </div>
    </div>
  )
}