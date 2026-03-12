/**
 * DeltaView.jsx — Phase 9A Delta Scoring Component
 *
 * Usage (inside HistoryPage or ScoreDashboard):
 *
 *   import DeltaView from '../components/DeltaView.jsx'
 *
 *   <DeltaView
 *     analyses={items}          // array of history items (need .analysis_id, .job_title, .overall_score)
 *     onClose={() => setMode('list')}
 *   />
 *
 * The user picks a baseline and a revised analysis from a dropdown,
 * then the component calls POST /analyze/compare and renders the delta.
 */

import { useState } from 'react'
import { compareAnalyses } from '../api/resume.js'

// ── Helpers ──────────────────────────────────────────────────────────────

function scoreColor(n) {
  if (n >= 75) return 'var(--green)'
  if (n >= 50) return 'var(--orange)'
  return 'var(--red)'
}

function DeltaBadge({ delta }) {
  const sign  = delta > 0 ? '+' : ''
  const color = delta > 0.5 ? 'var(--green)' : delta < -0.5 ? 'var(--red)' : 'var(--text-dim)'
  return (
    <span style={{
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      fontWeight: 700,
      color,
      background: delta > 0.5 ? '#00FF8715' : delta < -0.5 ? '#FF3B3B15' : 'transparent',
      padding: '2px 8px',
      borderRadius: 2,
    }}>
      {sign}{delta}
    </span>
  )
}

function ScoreCircle({ score, size = 64 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `2px solid ${scoreColor(score)}`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <span style={{ fontFamily: 'var(--font-serif)', fontSize: size * 0.4, fontWeight: 900, color: scoreColor(score), lineHeight: 1 }}>
        {Math.round(score)}
      </span>
      <span style={{ fontSize: 8, color: 'var(--text-dim)', letterSpacing: '0.08em' }}>/100</span>
    </div>
  )
}

function DimensionRow({ dim }) {
  const barW = (v) => `${Math.max(0, Math.min(100, v))}%`
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 11, letterSpacing: '0.06em', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
          {dim.dimension}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text-ghost)' }}>{dim.baseline}%</span>
          <span style={{ fontSize: 10, color: 'var(--text-ghost)' }}>→</span>
          <span style={{ fontSize: 11, color: scoreColor(dim.revised) }}>{dim.revised}%</span>
          <DeltaBadge delta={dim.delta} />
        </div>
      </div>
      {/* Stacked bar — baseline under, revised on top */}
      <div style={{ position: 'relative', height: 6, background: 'var(--surface)', borderRadius: 2 }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, height: '100%',
          width: barW(dim.baseline),
          background: 'var(--border)',
          borderRadius: 2,
          transition: 'width 0.6s ease',
        }} />
        <div style={{
          position: 'absolute', left: 0, top: 0, height: '100%',
          width: barW(dim.revised),
          background: scoreColor(dim.revised),
          borderRadius: 2,
          opacity: 0.7,
          transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────

export default function DeltaView({ analyses, onClose }) {
  const [baselineId, setBaselineId] = useState('')
  const [revisedId,  setRevisedId]  = useState('')
  const [result,     setResult]     = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState(null)

  const complete = analyses.filter(a => a.status === 'complete')

  async function handleCompare() {
    if (!baselineId || !revisedId) return
    if (baselineId === revisedId) {
      setError('Select two different analyses to compare')
      return
    }
    setError(null)
    setResult(null)
    setLoading(true)
    try {
      const data = await compareAnalyses(baselineId, revisedId)
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Comparison failed — try again')
    } finally {
      setLoading(false)
    }
  }

  const selectStyle = {
    width: '100%',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    padding: '8px 12px',
    fontSize: 12,
    fontFamily: 'var(--font-mono)',
    letterSpacing: '0.04em',
    outline: 'none',
    borderRadius: 2,
    cursor: 'pointer',
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h2 style={{ fontSize: 24, marginBottom: 4 }}>Compare Analyses</h2>
          <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>
            See how much your score improved between two submissions
          </p>
        </div>
        {onClose && (
          <button className="btn btn-ghost" style={{ padding: '6px 14px' }} onClick={onClose}>
            ← Back
          </button>
        )}
      </div>

      {complete.length < 2 && (
        <div className="banner banner-info">
          <span>ℹ</span>
          <span>You need at least 2 completed analyses to compare. Run another analysis first.</span>
        </div>
      )}

      {complete.length >= 2 && (
        <>
          {/* Selectors */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div>
              <label className="label" style={{ marginBottom: 6 }}>Baseline (before)</label>
              <select style={selectStyle} value={baselineId} onChange={e => setBaselineId(e.target.value)}>
                <option value="">Select analysis…</option>
                {complete.map(a => (
                  <option key={a.analysis_id} value={a.analysis_id}>
                    {a.job_title || 'Untitled'} — {Math.round(a.overall_score ?? 0)}/100
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" style={{ marginBottom: 6 }}>Revised (after)</label>
              <select style={selectStyle} value={revisedId} onChange={e => setRevisedId(e.target.value)}>
                <option value="">Select analysis…</option>
                {complete.map(a => (
                  <option key={a.analysis_id} value={a.analysis_id}>
                    {a.job_title || 'Untitled'} — {Math.round(a.overall_score ?? 0)}/100
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && <div className="banner banner-error" style={{ marginBottom: 16 }}><span>⚠</span><span>{error}</span></div>}

          <button
            className="btn btn-primary"
            onClick={handleCompare}
            disabled={loading || !baselineId || !revisedId}
            style={{ marginBottom: 36 }}
          >
            {loading ? <><span className="spinner" /> Comparing…</> : 'Compare →'}
          </button>
        </>
      )}

      {/* Results */}
      {result && (
        <div className="animate-fade-in">

          {/* Overall delta banner */}
          <div className="card card-glow" style={{ marginBottom: 24, padding: '24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <ScoreCircle score={result.baseline_score ?? 0} size={64} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 28,
                  fontWeight: 900,
                  color: result.direction === 'up' ? 'var(--green)' : result.direction === 'down' ? 'var(--red)' : 'var(--text-dim)',
                }}>
                  {result.overall_delta > 0 ? '+' : ''}{result.overall_delta}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-ghost)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Overall
                </div>
              </div>
              <ScoreCircle score={result.revised_score ?? 0} size={64} />
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 16, lineHeight: 1.6 }}>
              {result.summary}
            </p>
          </div>

          {/* Dimensions */}
          <div className="card" style={{ marginBottom: 20 }}>
            <p className="label" style={{ marginBottom: 20 }}>Score Breakdown</p>
            {result.dimensions.map(d => (
              <DimensionRow key={d.dimension} dim={d} />
            ))}
          </div>

          {/* Skill diffs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            {result.new_skills.length > 0 && (
              <div className="card">
                <p className="label" style={{ marginBottom: 12, color: 'var(--green)' }}>✓ New Skills Matched</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {result.new_skills.map(s => (
                    <span key={s} className="badge badge-green">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {result.resolved_gaps.length > 0 && (
              <div className="card">
                <p className="label" style={{ marginBottom: 12, color: 'var(--green)' }}>✓ Gaps Resolved</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {result.resolved_gaps.map(s => (
                    <span key={s} className="badge badge-green">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {result.remaining_gaps.length > 0 && (
            <div className="card">
              <p className="label" style={{ marginBottom: 12 }}>Remaining Gaps</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {result.remaining_gaps.map(s => (
                  <span key={s} className="badge badge-red">{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
