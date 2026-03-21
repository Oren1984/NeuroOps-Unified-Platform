import React, { useState, useEffect, useRef } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Activity, AlertTriangle, Server, MessageSquare } from 'lucide-react'
import { api } from './api.js'
import StatusBadge from '../../components/shared/StatusBadge.jsx'

const POLL_MS = 3000
const MAX_HISTORY = 30

function useLivePoll(fn, interval) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    const tick = async () => {
      try {
        const result = await fn()
        if (mounted.current) { setData(result); setError(null) }
      } catch (e) {
        if (mounted.current) setError(e.message)
      }
    }
    tick()
    const id = setInterval(tick, interval)
    return () => { mounted.current = false; clearInterval(id) }
  }, [])

  return { data, error }
}

function useMetricHistory(value, key) {
  const [history, setHistory] = useState([])
  const idx = useRef(0)

  useEffect(() => {
    if (value === null || value === undefined) return
    const v = typeof value === 'object' ? (value[key] ?? 0) : value
    idx.current += 1
    setHistory(prev => {
      const next = [...prev, { t: idx.current, value: v }]
      return next.slice(-MAX_HISTORY)
    })
  }, [value])

  return history
}

function getStatusColor(status) {
  switch ((status || '').toLowerCase()) {
    case 'optimal': return 'var(--green)'
    case 'healthy': return 'var(--green)'
    case 'alert': return 'var(--red)'
    case 'critical': return 'var(--red)'
    case 'warning': return 'var(--yellow)'
    case 'degraded': return 'var(--orange)'
    default: return 'var(--text-muted)'
  }
}

function MetricTicker({ label, value, unit, color, history }) {
  return (
    <div style={{
      background: 'var(--bg-tertiary)',
      borderRadius: 'var(--radius)',
      border: '1px solid var(--border)',
      padding: 'var(--space-3)',
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </span>
        <span style={{ fontSize: 'var(--text-lg)', fontWeight: 700, fontFamily: 'var(--font-mono)', color: color || 'var(--text-primary)' }}>
          {typeof value === 'number' ? value.toFixed(1) : value ?? '—'}
          {unit && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginLeft: 2 }}>{unit}</span>}
        </span>
      </div>
      {history && history.length > 1 && (
        <ResponsiveContainer width="100%" height={40}>
          <LineChart data={history}>
            <Line type="monotone" dataKey="value" stroke={color || 'var(--accent)'} dot={false} strokeWidth={1.5} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

function ServiceMiniCard({ svc }) {
  const name = svc.name || svc.service_name || 'service'
  const status = svc.status || svc.health || 'unknown'
  const health = svc.health_score ?? svc.score ?? null
  const color = getStatusColor(status)

  return (
    <div style={{
      padding: 'var(--space-2) var(--space-3)',
      background: 'var(--bg-tertiary)',
      borderRadius: 'var(--radius)',
      border: `1px solid ${color}33`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 'var(--space-2)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {name}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {health !== null && (
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color }}>
            {Math.round(health)}%
          </span>
        )}
        <StatusBadge status={status} size="xs" />
      </div>
    </div>
  )
}

export default function LiveControlPage() {
  const { data: healthData } = useLivePoll(api.health, POLL_MS)
  const { data: metricsData } = useLivePoll(api.metricsLive, POLL_MS)
  const { data: eventsData } = useLivePoll(api.eventsLive, POLL_MS)
  const { data: alertsData } = useLivePoll(api.alertsLive, POLL_MS)
  const { data: narrativeData } = useLivePoll(api.narrative, POLL_MS)
  const { data: servicesData } = useLivePoll(api.servicesStatus, POLL_MS)

  const healthScore = healthData?.health_score ?? healthData?.score ?? 0
  const systemStatus = healthData?.status || (healthScore >= 80 ? 'HEALTHY' : healthScore >= 60 ? 'NOMINAL' : healthScore >= 40 ? 'ALERT' : 'CRITICAL')
  const uptime = healthData?.uptime || healthData?.uptime_str || '—'
  const connected = healthData !== null

  const cpu = metricsData?.cpu ?? metricsData?.cpu_usage ?? 0
  const memory = metricsData?.memory ?? metricsData?.memory_usage ?? 0
  const network = metricsData?.network ?? metricsData?.network_io ?? 0
  const disk = metricsData?.disk ?? metricsData?.disk_usage ?? 0

  const cpuHistory = useMetricHistory(cpu, 'cpu')
  const memHistory = useMetricHistory(memory, 'memory')
  const netHistory = useMetricHistory(network, 'network')
  const diskHistory = useMetricHistory(disk, 'disk')

  const events = Array.isArray(eventsData) ? eventsData : eventsData?.events || []
  const alerts = Array.isArray(alertsData) ? alertsData : alertsData?.alerts || []
  const services = Array.isArray(servicesData) ? servicesData : servicesData?.services || []
  const narrative = typeof narrativeData === 'string' ? narrativeData : narrativeData?.narrative || narrativeData?.text || ''

  const isAlert = systemStatus === 'ALERT' || systemStatus === 'CRITICAL'
  const statusColor = getStatusColor(systemStatus)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="module-page" style={{ flex: 1, overflowY: 'auto' }}>
        {/* Header */}
        <div className="module-header">
          <div>
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)' }}>Live Control</h1>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 4 }}>
              Real-time operations monitoring with AI narrative
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: connected ? 'var(--green)' : 'var(--red)',
                animation: connected ? 'livePulse 2s ease-in-out infinite' : 'none',
              }} />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                {connected ? 'Live' : 'Disconnected'}
              </span>
            </div>
            <StatusBadge status={systemStatus.toLowerCase()} />
          </div>
        </div>

        {/* Status bar */}
        <div style={{
          padding: 'var(--space-3) var(--space-4)',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius)',
          border: `1px solid ${statusColor}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Health Score</span>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, fontFamily: 'var(--font-mono)', color: statusColor }}>
                {Math.round(healthScore)}
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>/100</span>
              </div>
            </div>
            <div style={{ width: 1, height: 36, background: 'var(--border)' }} />
            <div>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</span>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: statusColor, letterSpacing: '0.04em' }}>
                {systemStatus}
              </div>
            </div>
            <div style={{ width: 1, height: 36, background: 'var(--border)' }} />
            <div>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Uptime</span>
              <div style={{ fontSize: 'var(--text-base)', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                {uptime}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              {alerts.length} active alert{alerts.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Anomaly warning banner */}
        {isAlert && (
          <div style={{
            padding: 'var(--space-3) var(--space-4)',
            background: 'rgba(248,81,73,0.1)',
            border: '1px solid rgba(248,81,73,0.35)',
            borderRadius: 'var(--radius)',
            display: 'flex', alignItems: 'center', gap: 10,
            animation: 'fadeIn 0.3s ease-out',
          }}>
            <AlertTriangle size={16} color="var(--red)" />
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--red)' }}>
              ANOMALY DETECTED — System is in {systemStatus} state. Immediate attention required.
            </span>
          </div>
        )}

        {/* Main 2x2 grid */}
        <div className="grid-2">
          {/* Top-left: Health panel */}
          <div className="card">
            <div className="card-title">System Health</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)' }}>
                {/* Big score */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: 56, fontWeight: 700, fontFamily: 'var(--font-mono)',
                    color: statusColor, lineHeight: 1,
                    textShadow: `0 0 20px ${statusColor}66`,
                  }}>
                    {Math.round(healthScore)}
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>/ 100</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: statusColor, letterSpacing: '0.04em', marginBottom: 8 }}>
                    {systemStatus}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Uptime</span>
                      <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{uptime}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Services</span>
                      <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{services.length}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Alerts</span>
                      <span style={{ color: alerts.length > 0 ? 'var(--yellow)' : 'var(--green)', fontFamily: 'var(--font-mono)' }}>
                        {alerts.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Health progress bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Overall health</span>
                  <span style={{ fontSize: 10, color: statusColor, fontFamily: 'var(--font-mono)' }}>{Math.round(healthScore)}%</span>
                </div>
                <div style={{ height: 8, background: 'var(--bg-primary)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${healthScore}%`,
                    background: statusColor, borderRadius: 4,
                    transition: 'width 0.6s ease',
                    boxShadow: `0 0 8px ${statusColor}66`,
                  }} />
                </div>
              </div>
            </div>
          </div>

          {/* Top-right: Live metrics tickers */}
          <div className="card">
            <div className="card-title">Live Metrics</div>
            <div className="grid-2">
              <MetricTicker label="CPU" value={cpu} unit="%" color="var(--cyan)" history={cpuHistory} />
              <MetricTicker label="Memory" value={memory} unit="%" color="var(--purple)" history={memHistory} />
              <MetricTicker label="Network" value={network} unit="MB/s" color="var(--accent)" history={netHistory} />
              <MetricTicker label="Disk" value={disk} unit="%" color="var(--orange)" history={diskHistory} />
            </div>
          </div>

          {/* Bottom-left: Services grid */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-3)' }}>
              <Server size={13} color="var(--accent)" />
              <div className="card-title" style={{ marginBottom: 0 }}>Services ({services.length})</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
              {services.length === 0 ? (
                <div style={{ gridColumn: '1/-1', color: 'var(--text-muted)', fontSize: 'var(--text-sm)', padding: 'var(--space-3)', textAlign: 'center' }}>
                  No service data
                </div>
              ) : (
                services.map((svc, i) => <ServiceMiniCard key={i} svc={svc} />)
              )}
            </div>
          </div>

          {/* Bottom-right: Event feed */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-3)' }}>
              <Activity size={13} color="var(--yellow)" />
              <div className="card-title" style={{ marginBottom: 0 }}>Event Feed</div>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--red)', animation: 'livePulse 1.2s ease-in-out infinite' }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--red)', letterSpacing: '0.08em' }}>LIVE</span>
              </div>
            </div>
            <div style={{ height: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
              {events.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                  No events
                </div>
              ) : (
                events.slice(-20).map((ev, i) => {
                  const sev = (ev.severity || ev.type || 'info').toLowerCase()
                  const color = sev === 'critical' ? 'var(--red)' : sev === 'warning' ? 'var(--yellow)' : sev === 'success' ? 'var(--green)' : 'var(--accent)'
                  return (
                    <div key={i} style={{
                      padding: '4px 8px', borderRadius: 'var(--radius-sm)',
                      borderLeft: `2px solid ${color}`,
                      background: 'var(--bg-tertiary)',
                      fontSize: 'var(--text-xs)', color: 'var(--text-primary)',
                    }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ev.message || ev.description}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                        {ev.service} · {ev.timestamp || ev.time}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Narrative bar */}
      {narrative && (
        <div style={{
          padding: 'var(--space-3) var(--space-6)',
          background: 'var(--bg-secondary)',
          borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 12,
          flexShrink: 0,
        }}>
          <MessageSquare size={13} color="var(--purple)" />
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>
            AI NARRATIVE
          </span>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, flex: 1 }}>
            {narrative}
          </span>
        </div>
      )}

      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}
