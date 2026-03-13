export default function GapList({ criticalGaps = [], quickWins = [], atsWarning }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {atsWarning && (
        <div className="banner banner-yellow">
          <span>⚠</span>
          <span>{atsWarning}</span>
        </div>
      )}

      {criticalGaps.length > 0 && (
        <div>
          <p className="label" style={{ marginBottom: 12 }}>Critical Gaps</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {criticalGaps.map((gap, i) => (
              <div key={i} className="card" style={{ padding: '14px 16px', animation: `fadeIn 0.3s ease ${i * 0.08}s both` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{gap.skill}</span>
                  <span className={`badge badge-${gap.importance === 'high' ? 'red' : gap.importance === 'medium' ? 'orange' : 'yellow'}`}>
                    {gap.importance}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.6 }}>{gap.suggestion}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {quickWins.length > 0 && (
        <div>
          <p className="label" style={{ marginBottom: 12 }}>Quick Wins</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {quickWins.map((win, i) => (
              <div key={i} style={{
                display: 'flex', gap: 12, padding: '10px 14px',
                background: 'var(--surface-2)', borderLeft: '2px solid var(--green)',
                fontSize: 12, lineHeight: 1.6,
                animation: `fadeIn 0.3s ease ${i * 0.07}s both`,
              }}>
                <span style={{ color: 'var(--green)', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                <span style={{ color: 'var(--text-dim)' }}>{win}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}