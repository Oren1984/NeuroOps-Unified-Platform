import React from 'react'
import { Zap, Brain, Bot, Activity } from 'lucide-react'

const EVENT_TYPES = [
  { key: 'anomaly', label: 'Anomaly', color: 'var(--red)' },
  { key: 'scaling', label: 'Scaling', color: 'var(--accent)' },
  { key: 'recovery', label: 'Recovery', color: 'var(--green)' },
  { key: 'alert', label: 'Alert', color: 'var(--yellow)' },
  { key: 'info', label: 'Info', color: 'var(--text-muted)' },
]

function getSeverityColor(sev) {
  switch ((sev || '').toLowerCase()) {
    case 'critical': return 'var(--red)'
    case 'warning': return 'var(--yellow)'
    case 'info': return 'var(--accent)'
    case 'success': return 'var(--green)'
    default: return 'var(--text-muted)'
  }
}

function countByType(events, typeKey) {
  return events.filter(e =>
    (e.type || e.event_type || e.severity || '').toLowerCase().includes(typeKey)
  ).length
}

export default function SummaryCard({ events = [], decisions = [], agentActions = [], summary, health }) {
  const totalEvents = summary?.total_events ?? events.length
  const totalDecisions = summary?.total_decisions ?? decisions.length
  const totalActions = summary?.total_actions ?? agentActions.length
  const healthScore = health?.health_score ?? 0

  const recentIncidents = events
    .filter(e => {
      const sev = (e.severity || e.type || '').toLowerCase()
      return sev === 'critical' || sev === 'warning' || sev === 'anomaly'
    })
    .slice(0, 5)

  const maxCount = Math.max(...EVENT_TYPES.map(t => countByType(events, t.key)), 1)

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div className="card-title">Operations Summary</div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3)' }}>
        {[
          { label: 'Total Events', value: totalEvents, icon: Zap, color: 'var(--accent)' },
          { label: 'AI Decisions', value: totalDecisions, icon: Brain, color: 'var(--purple)' },
          { label: 'Agent Actions', value: totalActions, icon: Bot, color: 'var(--cyan)' },
          { label: 'Health Score', value: `${Math.round(healthScore)}%`, icon: Activity, color: healthScore >= 80 ? 'var(--green)' : healthScore >= 60 ? 'var(--yellow)' : 'var(--red)' },
        ].map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.label} style={{
              padding: 'var(--space-3)',
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {stat.label}
                </span>
                <Icon size={12} color={stat.color} />
              </div>
              <span style={{
                fontSize: 'var(--text-2xl)', fontWeight: 700,
                color: stat.color,
                fontFamily: 'var(--font-mono)',
              }}>
                {stat.value}
              </span>
            </div>
          )
        })}
      </div>

      {/* Events by type */}
      <div>
        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--space-2)' }}>
          Events by Type
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {EVENT_TYPES.map(t => {
            const count = countByType(events, t.key)
            const pct = maxCount > 0 ? (count / maxCount) * 100 : 0
            return (
              <div key={t.key} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', width: 52, flexShrink: 0 }}>{t.label}</span>
                <div style={{ flex: 1, height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${pct}%`,
                    background: t.color, borderRadius: 3,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', width: 20, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                  {count}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent incidents */}
      {recentIncidents.length > 0 && (
        <div>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--space-2)' }}>
            Recent Incidents
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {recentIncidents.map((ev, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-tertiary)',
                borderLeft: `2px solid ${getSeverityColor(ev.severity || ev.type)}`,
              }}>
                <div style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: getSeverityColor(ev.severity || ev.type),
                  flexShrink: 0,
                }} />
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ev.message || ev.description || 'Event occurred'}
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>
                  {ev.service || ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
