import { useState } from 'react'
import { useAuth } from '../auth/useAuth.jsx'
import SectionBreakdown from './SectionBreakdown.jsx'

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

// ── Copy button ───────────────────────────────────────────
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      onClick={handleCopy}
      title="Copy to clipboard"
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: copied ? 'var(--green)' : 'var(--text-ghost)',
        fontFamily: 'var(--font-mono)', fontSize: 10,
        letterSpacing: '0.08em', transition: 'color 0.15s',
        flexShrink: 0, paddingTop: 2,
      }}
    >
      {copied ? 'COPIED' : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  )
}

// ── Quick Wins ────────────────────────────────────────────
function QuickWins({ wins, atsWarning }) {
  if ((!wins || wins.length === 0) && !atsWarning) {
    return (
      <p style={{ fontSize: 12, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
        No quick wins available.
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {atsWarning && (
        <div style={{
          display: 'flex', gap: 12, alignItems: 'flex-start',
          padding: '12px 16px',
          background: 'rgba(202,138,4,0.08)',
          borderLeft: '3px solid var(--orange)',
          borderRadius: 4,
        }}>
          <span style={{ color: 'var(--orange)', fontSize: 14, flexShrink: 0 }}>⚠</span>
          <p style={{
            fontSize: 12, color: 'var(--text-dim)',
            fontFamily: 'var(--font-mono)', lineHeight: 1.75, margin: 0,
          }}>
            {atsWarning}
          </p>
        </div>
      )}

      {wins?.length > 0 && (
        <div>
          <p style={{
            fontSize: 11, color: 'var(--text-ghost)', marginBottom: 14,
            fontFamily: 'var(--font-mono)', letterSpacing: '0.06em',
          }}>
            Apply these to your resume before submitting
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {wins.map((win, i) => (
              <div
                key={i}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '12px 14px',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderLeft: '2px solid var(--green)',
                  borderRadius: 4,
                  animation: `fadeIn 0.3s ease ${i * 0.07}s both`,
                }}
              >
                <span style={{
                  color: 'var(--green)', fontFamily: 'var(--font-mono)',
                  fontSize: 12, fontWeight: 700, minWidth: 18, flexShrink: 0,
                }}>
                  {i + 1}.
                </span>
                <p style={{
                  fontSize: 12, color: 'var(--text-dim)',
                  fontFamily: 'var(--font-mono)', lineHeight: 1.75,
                  flex: 1, margin: 0,
                }}>
                  {win}
                </p>
                <CopyButton text={win} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────
export default function ScoreDashboard({ result, onReset }) {
  const { isGuest } = useAuth()
  const [tab, setTab] = useState('wins')

  const {
    overall_score:      overall    = 0,
    skills_score:       skills     = 0,
    experience_score:   exp        = 0,
    keywords_score:     kw         = 0,
    overall_assessment: assessment,
    quick_wins:         wins       = [],
    ats_warning:        atsWarn,
    matched_skills:     matched    = [],
    missing_skills:     missing    = [],
    sections:           sections   = [],
  } = result

  const color = scoreColor(overall)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeIn 0.4s ease' }}>

      {/* ── Score card ── */}
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
            <div style={{ marginBottom: 18 }}>
              <p className="label" style={{ marginBottom: 6 }}>Overall Assessment</p>
              <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.8 }}>
                {assessment}
              </p>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <ScoreBar label="Skills"     value={skills} delay={0.1} />
            <ScoreBar label="Experience" value={exp}    delay={0.2} />
            <ScoreBar label="Keywords"   value={kw}     delay={0.3} />
          </div>
        </div>
      </div>

      {/* ── Skill chips ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <p className="label" style={{ marginBottom: 10 }}>Matched Skills</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {matched.length > 0
              ? matched.map((s, i) => (
                  <span key={s} className="badge badge-green"
                    style={{ animation: `tagBounce 0.3s ease ${i * 0.04}s both` }}>
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
                  <span key={s} className="badge badge-red"
                    style={{ animation: `tagBounce 0.3s ease ${i * 0.04}s both` }}>
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
          {[
            ['wins',     'Quick Wins'],
            ['detailed', 'Detailed Analysis'],
          ].map(([key, label]) => (
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

        {tab === 'wins' && (
          <QuickWins wins={wins} atsWarning={atsWarn} />
        )}

        {tab === 'detailed' && (
          <SectionBreakdown sections={sections} />
        )}
      </div>

      {/* ── Guest upgrade banner ── */}
      {isGuest && (
        <div className="banner banner-info" style={{
          justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 12,
        }}>
          <span>Create a free account to compare resume versions and track your progress.</span>
          <a href="/register" className="btn btn-primary"
            style={{ padding: '6px 16px', whiteSpace: 'nowrap' }}>
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