import React from 'react'
import StatusBadge from '../../../components/shared/StatusBadge.jsx'

function getStatusBorderColor(status) {
  switch ((status || '').toLowerCase()) {
    case 'healthy': return 'var(--status-healthy)'
    case 'warning': return 'var(--status-warning)'
    case 'critical': return 'var(--status-critical)'
    case 'degraded': return 'var(--status-degraded)'
    case 'offline': return 'var(--status-offline)'
    default: return 'var(--border)'
  }
}

function Bar({ value = 0, color }) {
  const pct = Math.min(Math.max(value, 0), 100)
  const barColor = pct > 85 ? 'var(--red)' : pct > 70 ? 'var(--yellow)' : color || 'var(--accent)'
  return (
    <div style={{ flex: 1, height: 4, background: 'var(--bg-primary)', borderRadius: 2, overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${pct}%`,
        background: barColor, borderRadius: 2,
        transition: 'width 0.5s ease',
      }} />
    </div>
  )
}

export default function ServiceStatusGrid({ services = [] }) {
  if (services.length === 0) {
    return (
      <div className="card">
        <div className="card-title">Service Status</div>
        <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
          No services available
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-title">Service Status Grid</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 'var(--space-3)' }}>
        {services.map((svc, i) => {
          const status = (svc.status || svc.health || 'unknown').toLowerCase()
          const isCritical = status === 'critical'
          const borderColor = getStatusBorderColor(status)
          const cpu = svc.cpu ?? svc.cpu_usage ?? 0
          const mem = svc.memory ?? svc.memory_usage ?? 0
          const rps = svc.requests_per_second ?? svc.rps ?? 0
          const errRate = svc.error_rate ?? 0
          const uptime = svc.uptime ?? '—'

          return (
            <div key={svc.name || svc.service_name || i} style={{
              padding: 'var(--space-3)',
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius)',
              border: `1px solid ${borderColor}`,
              display: 'flex', flexDirection: 'column', gap: 'var(--space-2)',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Critical pulse */}
              {isCritical && (
                <div style={{
                  position: 'absolute', top: 6, right: 6,
                  width: 8, height: 8, borderRadius: '50%',
                  background: 'var(--red)',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }} />
              )}

              {/* Service name + status */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: isCritical ? 16 : 0 }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {svc.name || svc.service_name || `Service ${i + 1}`}
                </span>
                <StatusBadge status={status} size="xs" />
              </div>

              {/* CPU */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', width: 28, flexShrink: 0 }}>CPU</span>
                <Bar value={cpu} />
                <span style={{ fontSize: 10, color: 'var(--text-muted)', width: 32, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                  {typeof cpu === 'number' ? `${cpu.toFixed(0)}%` : cpu}
                </span>
              </div>

              {/* MEM */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', width: 28, flexShrink: 0 }}>MEM</span>
                <Bar value={mem} color="var(--purple)" />
                <span style={{ fontSize: 10, color: 'var(--text-muted)', width: 32, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                  {typeof mem === 'number' ? `${mem.toFixed(0)}%` : mem}
                </span>
              </div>

              {/* Metrics row */}
              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 2 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>RPS</span>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                    {typeof rps === 'number' ? rps.toFixed(1) : rps}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>ERR%</span>
                  <span style={{
                    fontSize: 'var(--text-xs)', fontWeight: 600, fontFamily: 'var(--font-mono)',
                    color: errRate > 5 ? 'var(--red)' : errRate > 1 ? 'var(--yellow)' : 'var(--green)',
                  }}>
                    {typeof errRate === 'number' ? `${errRate.toFixed(1)}%` : errRate}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Uptime</span>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                    {uptime}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <style>{`@keyframes pulse { 0%,100% { opacity:1; box-shadow: 0 0 4px var(--red); } 50% { opacity:0.4; box-shadow: none; } }`}</style>
    </div>
  )
}
