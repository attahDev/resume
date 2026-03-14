import { useState } from 'react'

// ── Severity config ───────────────────────────────────────
const SEVERITY = {
  high:   { color: 'var(--red)',      bg: 'rgba(255,59,59,0.06)',   label: 'HIGH'   },
  medium: { color: 'var(--orange)',   bg: 'rgba(251,146,60,0.06)',  label: 'MEDIUM' },
  low:    { color: 'var(--green)',    bg: 'rgba(0,255,135,0.06)',   label: 'LOW'    },
}

// ── Section icons ─────────────────────────────────────────
const ICONS = {
  'First Impression': (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  'Work Experience': (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
    </svg>
  ),
  'Skills': (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  'Summary Statement': (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  'Contact Info': (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  'Education': (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  ),
  'Formatting': (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="21" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/>
      <line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="3" y2="18"/>
    </svg>
  ),
}

// ── Single section card ───────────────────────────────────
function SectionCard({ section, index }) {
  const [open, setOpen] = useState(index === 0) // first card open by default
  const sev = SEVERITY[section.severity?.toLowerCase()] || SEVERITY.medium
  const icon = ICONS[section.title]

  return (
    <div
      style={{
        border: `1px solid var(--border)`,
        borderLeft: `2px solid ${open ? sev.color : 'var(--border)'}`,
        borderRadius: 4,
        overflow: 'hidden',
        transition: 'border-color 0.2s',
        animation: `fadeIn 0.3s ease ${index * 0.06}s both`,
      }}
    >
      {/* Header — always visible */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 16px',
          background: open ? sev.bg : 'var(--surface-2)',
          border: 'none',
          cursor: 'pointer',
          transition: 'background 0.2s',
        }}
      >
        {/* Icon */}
        <span style={{ color: open ? sev.color : 'var(--text-ghost)', flexShrink: 0, transition: 'color 0.2s' }}>
          {icon}
        </span>

        {/* Title */}
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: open ? 'var(--text)' : 'var(--text-dim)',
          flex: 1,
          textAlign: 'left',
          transition: 'color 0.2s',
        }}>
          {section.title}
        </span>

        {/* Severity badge */}
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.1em',
          color: sev.color,
          border: `1px solid ${sev.color}`,
          borderRadius: 2,
          padding: '2px 8px',
          textTransform: 'uppercase',
          flexShrink: 0,
        }}>
          {sev.label}
        </span>

        {/* Chevron */}
        <span style={{
          color: 'var(--text-ghost)',
          fontSize: 10,
          flexShrink: 0,
          transition: 'transform 0.2s',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          marginLeft: 4,
        }}>
          ▾
        </span>
      </button>

      {/* Body — collapses */}
      {open && (
        <div style={{
          padding: '16px 18px 20px',
          background: 'var(--surface)',
          borderTop: `1px solid var(--border)`,
          animation: 'fadeIn 0.2s ease',
        }}>

          {/* Analysis paragraph */}
          {section.analysis && (
            <p style={{
              fontSize: 13,
              color: 'var(--text-dim)',
              lineHeight: 1.8,
              marginBottom: section.suggestions?.length > 0 ? 16 : 0,
              fontFamily: 'var(--font-mono)',
            }}>
              {section.analysis}
            </p>
          )}

          {/* Suggestions box */}
          {section.suggestions?.length > 0 && (
            <div style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderLeft: `2px solid ${sev.color}`,
              borderRadius: 3,
              padding: '12px 14px',
            }}>
              <p style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                letterSpacing: '0.2em',
                color: sev.color,
                textTransform: 'uppercase',
                marginBottom: 10,
              }}>
                💡 Suggestions
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {section.suggestions.map((s, i) => (
                  <li
                    key={i}
                    style={{
                      display: 'flex',
                      gap: 10,
                      fontSize: 12,
                      color: 'var(--text-dim)',
                      lineHeight: 1.7,
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    <span style={{ color: sev.color, flexShrink: 0, marginTop: 2 }}>→</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main export ───────────────────────────────────────────
export default function SectionBreakdown({ sections = [] }) {
  if (!sections || sections.length === 0) {
    return (
      <p style={{
        fontSize: 12,
        color: 'var(--text-dim)',
        fontFamily: 'var(--font-mono)',
      }}>
        Detailed analysis not available for this result.
      </p>
    )
  }

  // Sort by severity — high first
  const order = { high: 0, medium: 1, low: 2 }
  const sorted = [...sections].sort(
    (a, b) => (order[a.severity?.toLowerCase()] ?? 1) - (order[b.severity?.toLowerCase()] ?? 1)
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {sorted.map((section, i) => (
        <SectionCard key={section.title} section={section} index={i} />
      ))}
    </div>
  )
}