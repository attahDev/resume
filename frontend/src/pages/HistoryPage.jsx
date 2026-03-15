import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getHistory, getResult, deleteAnalysis } from '../api/resume.js'
import Nav from '../components/Nav.jsx'
import DeltaView from '../components/DeltaView.jsx'
import ScoreDashboard from '../components/ScoreDashboard.jsx'

function scoreColor(n) {
  if (n >= 90) return 'var(--indigo)'
  if (n >= 75) return 'var(--green)'
  if (n >= 50) return 'var(--orange)'
  return 'var(--red)'
}

// ── Delete button with inline confirm ────────────────────────
function DeleteButton({ onConfirm, disabled }) {
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    return (
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <button
          onClick={(e) => { e.stopPropagation(); onConfirm() }}
          disabled={disabled}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em',
            color: 'var(--red)', background: 'rgba(255,59,59,0.1)',
            border: '1px solid var(--red)', padding: '4px 10px',
            cursor: 'pointer', borderRadius: 2,
          }}
        >
          Confirm
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setConfirming(false) }}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em',
            color: 'var(--text-ghost)', background: 'none',
            border: '1px solid var(--border)', padding: '4px 10px',
            cursor: 'pointer', borderRadius: 2,
          }}
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={(e) => { e.stopPropagation(); setConfirming(true) }}
      title="Delete analysis"
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--text-ghost)', padding: '4px 6px',
        transition: 'color 0.15s', borderRadius: 2,
        display: 'flex', alignItems: 'center',
      }}
      onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-ghost)'}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
        <path d="M10 11v6M14 11v6"/>
        <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
      </svg>
    </button>
  )
}

// ── Main ─────────────────────────────────────────────────────
export default function HistoryPage() {
  const [items,       setItems]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [mode,        setMode]        = useState('list')   // 'list' | 'detail' | 'compare'
  const [activeItem,  setActiveItem]  = useState(null)     // history row being viewed
  const [result,      setResult]      = useState(null)     // full analysis result
  const [resultLoading, setResultLoading] = useState(false)
  const [resultError,   setResultError]   = useState(null)
  const [deletingId,  setDeletingId]  = useState(null)

  useEffect(() => {
    getHistory()
      .then(d => setItems(Array.isArray(d) ? d : d.items ?? d.analyses ?? []))
      .catch(() => setError('Failed to load history'))
      .finally(() => setLoading(false))
  }, [])

  // ── Open full analysis ──────────────────────────────────
  async function handleOpenDetail(item) {
    setActiveItem(item)
    setResult(null)
    setResultError(null)
    setResultLoading(true)
    setMode('detail')
    try {
      const data = await getResult(item.analysis_id)
      setResult(data)
    } catch {
      setResultError('Failed to load analysis — try again')
    } finally {
      setResultLoading(false)
    }
  }

  // ── Delete ──────────────────────────────────────────────
  async function handleDelete(analysisId) {
    setDeletingId(analysisId)
    try {
      await deleteAnalysis(analysisId)
      setItems(prev => prev.filter(i => i.analysis_id !== analysisId))
      // If currently viewing the deleted item, go back to list
      if (activeItem?.analysis_id === analysisId) {
        setMode('list')
        setActiveItem(null)
        setResult(null)
      }
    } catch {
      // Silently fail — item stays in list
    } finally {
      setDeletingId(null)
    }
  }

  const complete = items.filter(a => a.status === 'complete')
  const canCompare = complete.length >= 2

  // ── Detail view ─────────────────────────────────────────
  if (mode === 'detail') {
    return (
      <div className="page">
        <Nav links={[]} />
        <div className="container" style={{ paddingTop: 80, paddingBottom: 80 }}>

          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'flex-start',
            justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12,
          }}>
            <div>
              <button
                className="btn"
                style={{ marginBottom: 12, padding: '6px 14px', fontSize: 11 }}
                onClick={() => { setMode('list'); setResult(null); setActiveItem(null) }}
              >
                ← Back to History
              </button>
              <h1 style={{ fontSize: 22, marginBottom: 2 }}>
                {activeItem?.job_title || 'Untitled Role'}
              </h1>
              <p style={{ fontSize: 12, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                {activeItem?.company || 'Unknown Company'} · {activeItem?.created_at ? new Date(activeItem.created_at).toLocaleDateString() : ''}
              </p>
            </div>
            <DeleteButton
              onConfirm={() => handleDelete(activeItem?.analysis_id)}
              disabled={deletingId === activeItem?.analysis_id}
            />
          </div>

          {/* Loading */}
          {resultLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '40px 0' }}>
              <span className="spinner" />
              <p style={{ fontSize: 13, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                Loading analysis...
              </p>
            </div>
          )}

          {/* Error */}
          {resultError && (
            <div className="banner banner-error">
              <span>⚠</span><span>{resultError}</span>
            </div>
          )}

          {/* Full analysis */}
          {result && !resultLoading && (
            <ScoreDashboard
              result={result}
              onReset={() => { setMode('list'); setResult(null); setActiveItem(null) }}
            />
          )}
        </div>
      </div>
    )
  }

  // ── Compare view ─────────────────────────────────────────
  if (mode === 'compare') {
    return (
      <div className="page">
        <Nav links={[]} />
        <div className="container" style={{ paddingTop: 80, paddingBottom: 80 }}>
          <DeltaView analyses={items} onClose={() => setMode('list')} />
        </div>
      </div>
    )
  }

  // ── List view ────────────────────────────────────────────
  return (
    <div className="page">
      <Nav links={[]} />
      <div className="container" style={{ paddingTop: 80, paddingBottom: 80 }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'baseline',
          justifyContent: 'space-between', marginBottom: 32,
          flexWrap: 'wrap', gap: 12,
        }}>
          <h1 style={{ fontSize: 28 }}>Analysis History</h1>
          <div style={{ display: 'flex', gap: 10 }}>
            {canCompare && (
              <button className="btn" style={{ padding: '8px 18px' }} onClick={() => setMode('compare')}>
                ⇄ Compare Versions
              </button>
            )}
            <Link to="/app" className="btn btn-primary" style={{ padding: '8px 18px' }}>
              + New Analysis
            </Link>
          </div>
        </div>

        {/* States */}
        {loading && <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>Loading...</p>}
        {error   && <div className="banner banner-error"><span>⚠</span><span>{error}</span></div>}
        {!loading && !error && items.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ color: 'var(--text-dim)', marginBottom: 16 }}>No analyses yet.</p>
            <Link to="/app" className="btn btn-primary">Run your first analysis →</Link>
          </div>
        )}

        {/* List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map((item, i) => (
            <div
              key={item.analysis_id}
              onClick={() => item.status === 'complete' && handleOpenDetail(item)}
              className="card"
              style={{
                display: 'grid',
                gridTemplateColumns: '56px 1fr auto',
                gap: 16,
                alignItems: 'center',
                animation: `fadeIn 0.3s ease ${i * 0.05}s both`,
                cursor: item.status === 'complete' ? 'pointer' : 'default',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={e => { if (item.status === 'complete') e.currentTarget.style.borderColor = 'rgba(0,255,135,0.3)' }}
              onMouseLeave={e => e.currentTarget.style.borderColor = ''}
            >
              {/* Score */}
              <div style={{ textAlign: 'center' }}>
                <span style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 22, fontWeight: 900,
                  color: scoreColor(item.overall_score),
                }}>
                  {item.overall_score ?? '—'}
                </span>
              </div>

              {/* Info */}
              <div>
                <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>
                  {item.job_title || 'Untitled Role'}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                  {item.company || 'Unknown'} · {new Date(item.created_at).toLocaleDateString()}
                </p>
                {item.status === 'complete' && (
                  <p style={{
                    fontSize: 10, color: 'var(--green)',
                    fontFamily: 'var(--font-mono)', marginTop: 4,
                    letterSpacing: '0.06em',
                  }}>
                    Click to view full analysis →
                  </p>
                )}
              </div>

              {/* Right side — status badge + delete */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className={`badge badge-${item.status === 'complete' ? 'green' : item.status === 'failed' ? 'red' : 'dim'}`}>
                  {item.status}
                </span>
                <DeleteButton
                  onConfirm={() => handleDelete(item.analysis_id)}
                  disabled={deletingId === item.analysis_id}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Hint */}
        {!loading && !error && items.length === 1 && (
          <p style={{
            fontSize: 11, color: 'var(--text-ghost)',
            fontFamily: 'var(--font-mono)', marginTop: 20,
            letterSpacing: '0.06em',
          }}>
            Run one more analysis to unlock version comparison →
          </p>
        )}
      </div>
    </div>
  )
}