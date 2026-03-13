import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getHistory } from '../api/resume.js'
import Nav from '../components/Nav.jsx'
import DeltaView from '../components/DeltaView.jsx'

function scoreColor(n) {
  if (n >= 90) return 'var(--indigo)'
  if (n >= 75) return 'var(--green)'
  if (n >= 50) return 'var(--orange)'
  return 'var(--red)'
}

export default function HistoryPage() {
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    getHistory()
      .then(d => setItems(Array.isArray(d) ? d : d.items ?? d.analyses ?? []))
      .catch(() => setError('Failed to load history'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page">
      <Nav links={[]} />
      <div className="container" style={{ paddingTop: 80, paddingBottom: 80 }}>

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 32 }}>
          <h1 style={{ fontSize: 28 }}>Analysis History</h1>
          <Link to="/app" className="btn btn-primary" style={{ padding: '8px 18px' }}>+ New Analysis</Link>
        </div>

        {loading && <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>Loading...</p>}
        {error   && <div className="banner banner-error"><span>⚠</span><span>{error}</span></div>}
        {!loading && !error && items.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ color: 'var(--text-dim)', marginBottom: 16 }}>No analyses yet.</p>
            <Link to="/app" className="btn btn-primary">Run your first analysis →</Link>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map((item, i) => (
            <div
              key={item.analysis_id}
              className="card"
              style={{
                display: 'grid',
                gridTemplateColumns: '56px 1fr auto',
                gap: 16,
                alignItems: 'center',
                animation: `fadeIn 0.3s ease ${i * 0.05}s both`,
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <span style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 22,
                  fontWeight: 900,
                  color: scoreColor(item.overall_score),
                }}>
                  {item.overall_score ?? '—'}
                </span>
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{item.job_title || 'Untitled Role'}</p>
                <p style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                  {item.company || 'Unknown'} · {new Date(item.created_at).toLocaleDateString()}
                </p>
              </div>
              <span className={`badge badge-${item.status === 'complete' ? 'green' : item.status === 'failed' ? 'red' : 'dim'}`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}