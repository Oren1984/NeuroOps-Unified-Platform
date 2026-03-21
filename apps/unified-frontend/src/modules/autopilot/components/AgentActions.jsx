import React from 'react'
import { Bot, CheckCircle, Clock, XCircle, RefreshCw, TrendingUp, Shield, Activity } from 'lucide-react'

const AGENT_TYPE_CONFIG = {
  recovery: { color: 'var(--green)', Icon: RefreshCw, label: 'Recovery' },
  scaling: { color: 'var(--accent)', Icon: TrendingUp, label: 'Scaling' },
  security: { color: 'var(--red)', Icon: Shield, label: 'Security' },
  monitoring: { color: 'var(--yellow)', Icon: Activity, label: 'Monitoring' },
  healing: { color: 'var(--green)', Icon: RefreshCw, label: 'Healing' },
  default: { color: 'var(--text-muted)', Icon: Bot, label: 'Agent' },
}

function getAgentConfig(type) {
  const key = (type || '').toLowerCase()
  return AGENT_TYPE_CONFIG[key] || AGENT_TYPE_CONFIG.default
}

function getStatusIcon(status) {
  switch ((status || '').toLowerCase()) {
    case 'completed':
    case 'success':
    case 'executed': return { Icon: CheckCircle, color: 'var(--green)' }
    case 'failed':
    case 'error': return { Icon: XCircle, color: 'var(--red)' }
    default: return { Icon: Clock, color: 'var(--yellow)' }
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

export default function AgentActions({ agentActions = [] }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Bot size={14} color="var(--cyan)" />
        <div className="card-title" style={{ marginBottom: 0 }}>Agent Actions</div>
        <span style={{
          marginLeft: 'auto',
          fontSize: 10, padding: '2px 7px',
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--text-muted)',
        }}>
          {agentActions.length} total
        </span>
      </div>

      {agentActions.length === 0 ? (
        <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
          No agent actions recorded
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-2)' }}>
          {agentActions.slice(0, 12).map((action, i) => {
            const agentKey = action.agent_type || action.type || action.agent || 'default'
            const agentConfig = getAgentConfig(agentKey)
            const AgentIcon = agentConfig.Icon
            const statusConfig = getStatusIcon(action.status)
            const StatusIcon = statusConfig.Icon

            return (
              <div key={action.id || i} style={{
                padding: 'var(--space-3)',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius)',
                border: `1px solid var(--border)`,
                borderLeft: `3px solid ${agentConfig.color}`,
                display: 'flex', flexDirection: 'column', gap: 6,
              }}>
                {/* Agent type badge + status */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <AgentIcon size={11} color={agentConfig.color} />
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      color: agentConfig.color,
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>
                      {agentConfig.label}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <StatusIcon size={11} color={statusConfig.color} />
                    <span style={{ fontSize: 10, color: statusConfig.color, textTransform: 'capitalize' }}>
                      {action.status || 'pending'}
                    </span>
                  </div>
                </div>

                {/* Action description */}
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {action.action || action.description || action.message || 'Action executed'}
                </span>

                {/* Footer: target + time */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  {action.service && (
                    <span style={{
                      fontSize: 10, padding: '1px 5px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border)',
                      borderRadius: 2, color: 'var(--text-muted)',
                    }}>
                      {action.service || action.target}
                    </span>
                  )}
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto', fontFamily: 'var(--font-mono)' }}>
                    {formatTime(action.timestamp || action.time)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
