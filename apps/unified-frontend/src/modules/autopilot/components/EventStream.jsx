import React, { useEffect, useRef } from 'react'
import { AlertTriangle, Info, CheckCircle, XCircle, Zap } from 'lucide-react'

function getSeverityConfig(severity) {
  switch ((severity || '').toLowerCase()) {
    case 'critical': return { color: 'var(--red)', Icon: XCircle }
    case 'warning': return { color: 'var(--yellow)', Icon: AlertTriangle }
    case 'success': return { color: 'var(--green)', Icon: CheckCircle }
    case 'anomaly': return { color: 'var(--red)', Icon: Zap }
    default: return { color: 'var(--accent)', Icon: Info }
  }
}

function formatTime(ts) {
  if (!ts) return ''
  try {
    const d = new Date(ts)
    if (isNaN(d)) return ts
    return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch {
    return ts
  }
}

export default function EventStream({ events = [] }) {
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [events])

  const visible = events.slice(-30)

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="card-title" style={{ marginBottom: 0 }}>Event Stream</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--red)',
            animation: 'livePulse 1.2s ease-in-out infinite',
          }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--red)', letterSpacing: '0.08em' }}>LIVE</span>
        </div>
      </div>

      <div ref={scrollRef} style={{
        height: 320,
        overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 3,
      }}>
        {visible.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
            Waiting for events...
          </div>
        ) : (
          visible.map((ev, i) => {
            const sev = ev.severity || ev.type || ev.level || 'info'
            const { color, Icon } = getSeverityConfig(sev)
            return (
              <div key={ev.id || i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                padding: '5px 8px',
                borderRadius: 'var(--radius-sm)',
                background: i === visible.length - 1 ? color + '11' : 'transparent',
                borderLeft: `2px solid ${i === visible.length - 1 ? color : 'transparent'}`,
                transition: 'background 0.3s ease',
              }}>
                <Icon size={11} color={color} style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 1 }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                      {formatTime(ev.timestamp || ev.time)}
                    </span>
                    {ev.service && (
                      <span style={{
                        fontSize: 9, padding: '1px 5px',
                        background: 'var(--bg-tertiary)',
                        borderRadius: 2, color: 'var(--text-muted)',
                        border: '1px solid var(--border)',
                        maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {ev.service}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)', lineHeight: 1.4, display: 'block' }}>
                    {ev.message || ev.description || JSON.stringify(ev)}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
          Showing last {visible.length} of {events.length} events
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
          Auto-scrolling
        </span>
      </div>

      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 4px var(--red); }
          50% { opacity: 0.4; box-shadow: none; }
        }
      `}</style>
    </div>
  )
}
