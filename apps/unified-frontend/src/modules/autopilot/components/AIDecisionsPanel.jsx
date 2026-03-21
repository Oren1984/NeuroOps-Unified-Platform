import React from 'react'
import { Brain, CheckCircle, Clock, XCircle } from 'lucide-react'

const DECISION_TYPE_CONFIG = {
  scale_up: { label: 'Scale Up', color: 'var(--cyan)' },
  scale_down: { label: 'Scale Down', color: 'var(--accent)' },
  restart: { label: 'Restart', color: 'var(--yellow)' },
  alert: { label: 'Alert', color: 'var(--orange)' },
  block: { label: 'Block', color: 'var(--red)' },
  heal: { label: 'Heal', color: 'var(--green)' },
  throttle: { label: 'Throttle', color: 'var(--purple)' },
}

const STATUS_ICON = {
  executed: { Icon: CheckCircle, color: 'var(--green)' },
  pending: { Icon: Clock, color: 'var(--yellow)' },
  failed: { Icon: XCircle, color: 'var(--red)' },
}

function getDecisionConfig(type) {
  const key = (type || '').toLowerCase().replace(/\s+/g, '_')
  return DECISION_TYPE_CONFIG[key] || { label: type || 'Decision', color: 'var(--text-muted)' }
}

function ConfidenceBar({ value = 0 }) {
  const pct = Math.min(Math.max(value * 100, 0), 100)
  const color = pct >= 80 ? 'var(--green)' : pct >= 60 ? 'var(--yellow)' : 'var(--red)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, height: 4, background: 'var(--bg-primary)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: color, borderRadius: 2,
          transition: 'width 0.4s ease',
        }} />
      </div>
      <span style={{ fontSize: 10, color, fontFamily: 'var(--font-mono)', width: 30, textAlign: 'right' }}>
        {pct.toFixed(0)}%
      </span>
    </div>
  )
}

export default function AIDecisionsPanel({ decisions = [] }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Brain size={14} color="var(--purple)" />
        <div className="card-title" style={{ marginBottom: 0 }}>AI Decisions</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 340, overflowY: 'auto' }}>
        {decisions.length === 0 ? (
          <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
            No decisions recorded
          </div>
        ) : (
          decisions.map((dec, i) => {
            const typeConfig = getDecisionConfig(dec.type || dec.decision_type || dec.action)
            const statusKey = (dec.status || 'pending').toLowerCase()
            const statusConfig = STATUS_ICON[statusKey] || STATUS_ICON.pending
            const StatusIcon = statusConfig.Icon
            const confidence = dec.confidence ?? dec.confidence_score ?? 0.75

            return (
              <div key={dec.id || i} style={{
                padding: 'var(--space-3)',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius)',
                border: `1px solid ${typeConfig.color}33`,
                display: 'flex', flexDirection: 'column', gap: 6,
              }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      fontSize: 10, padding: '2px 7px',
                      background: typeConfig.color + '22', color: typeConfig.color,
                      border: `1px solid ${typeConfig.color}44`,
                      borderRadius: 'var(--radius-sm)', fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>
                      {typeConfig.label}
                    </span>
                    {dec.service && (
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                        → {dec.service || dec.target_service}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <StatusIcon size={12} color={statusConfig.color} />
                    <span style={{ fontSize: 10, color: statusConfig.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {dec.status || 'pending'}
                    </span>
                  </div>
                </div>

                {/* Action description */}
                {(dec.action || dec.description || dec.reasoning) && (
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    {dec.action || dec.description || dec.reasoning}
                  </span>
                )}

                {/* Confidence */}
                <div>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Confidence</span>
                  <ConfidenceBar value={confidence} />
                </div>
              </div>
            )
          })
        )}
      </div>

      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
        {decisions.length} decisions logged
      </div>
    </div>
  )
}
