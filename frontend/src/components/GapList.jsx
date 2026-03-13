import { useState } from 'react'

// ── Copy button ───────────────────────────────────────────────
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
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: copied ? 'var(--green)' : 'var(--text-ghost)',
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        letterSpacing: '0.08em',
        transition: 'color 0.15s',
        flexShrink: 0,
        paddingTop: 1,
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

// ── GapList ───────────────────────────────────────────────────
export default function GapList({ criticalGaps = [], quickWins = [], atsWarning }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ATS Warning — unchanged */}
      {atsWarning && (
        <div className="banner banner-yellow">
          <span>⚠</span>
          <span>{atsWarning}</span>
        </div>
      )}

      {/* Critical Gaps — unchanged */}
      {criticalGaps.length > 0 && (
        <div>
          <p className="label" style={{ marginBottom: 12 }}>Critical Gaps</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {criticalGaps.map((gap, i) => (
              <div
                key={i}
                className="card"
                style={{
                  padding: '14px 16px',
                  animation: `fadeIn 0.3s ease ${i * 0.08}s both`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{gap.skill}</span>
                  <span className={`badge badge-${gap.importance === 'high' ? 'red' : gap.importance === 'medium' ? 'orange' : 'yellow'}`}>
                    {gap.importance}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.6 }}>
                  {gap.suggestion}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Wins — copy button added, everything else unchanged */}
      {quickWins.length > 0 && (
        <div>
          <p className="label" style={{ marginBottom: 12 }}>Quick Wins</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {quickWins.map((win, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 12,
                  padding: '10px 14px',
                  background: 'var(--surface-2)',
                  borderLeft: '2px solid var(--green)',
                  fontSize: 12,
                  lineHeight: 1.6,
                  animation: `fadeIn 0.3s ease ${i * 0.07}s both`,
                  alignItems: 'flex-start',
                }}
              >
                <span style={{ color: 'var(--green)', fontWeight: 700, flexShrink: 0 }}>
                  {i + 1}.
                </span>
                <span style={{ color: 'var(--text-dim)', flex: 1 }}>
                  {win}
                </span>
                <CopyButton text={win} />
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}