import React from 'react'

const STATUS_CONFIG = {
  healthy: { color: 'var(--status-healthy)', label: 'Healthy' },
  warning: { color: 'var(--status-warning)', label: 'Warning' },
  critical: { color: 'var(--status-critical)', label: 'Critical' },
  degraded: { color: 'var(--status-degraded)', label: 'Degraded' },
  offline: { color: 'var(--status-offline)', label: 'Offline' },
  unknown: { color: 'var(--status-unknown)', label: 'Unknown' },
  running: { color: 'var(--status-healthy)', label: 'Running' },
  stopped: { color: 'var(--status-offline)', label: 'Stopped' },
  optimal: { color: 'var(--status-healthy)', label: 'Optimal' },
}

export default function StatusBadge({ status, size = 'sm' }) {
  const cfg = STATUS_CONFIG[status?.toLowerCase()] || STATUS_CONFIG.unknown
  const fontSize = size === 'xs' ? '10px' : size === 'sm' ? '11px' : '13px'
  const padding = size === 'xs' ? '2px 6px' : '3px 8px'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      fontSize, padding, borderRadius: 'var(--radius-sm)',
      background: cfg.color + '22', color: cfg.color,
      border: '1px solid ' + cfg.color + '44',
      fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
      whiteSpace: 'nowrap',
    }}>
      <span style={{
        width: size === 'xs' ? 5 : 6,
        height: size === 'xs' ? 5 : 6,
        borderRadius: '50%',
        background: cfg.color,
        flexShrink: 0,
      }} />
      {cfg.label}
    </span>
  )
}
