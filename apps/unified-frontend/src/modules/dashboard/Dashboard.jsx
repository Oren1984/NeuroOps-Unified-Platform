/**
 * Dashboard.jsx — Phase 4G: Premium AI Operations Command Center
 *
 * Upgrades over Phase 2:
 *  - Animated SVG health-score ring
 *  - Pulsing status indicators per service
 *  - Live platform events mini-feed panel
 *  - Glow effects on healthy/critical cards
 *  - Immersive dark control-center styling
 */
import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, MonitorCheck, Activity,
  RefreshCcw, Briefcase, BarChart2, Package,
  Server, ShieldCheck, AlertTriangle, TrendingUp,
  TrendingDown, Minus, ArrowRight, Loader, Zap,
  GitBranch, Activity as ActivityIcon, Radio,
} from 'lucide-react'
import useGatewayData from './useGatewayData.js'
import StatusBadge from '../../components/shared/StatusBadge.jsx'
import MetricCard from '../../components/shared/MetricCard.jsx'

// ---------------------------------------------------------------------------
// Module definitions
// ---------------------------------------------------------------------------
const MODULES = [
  { id: 'control-room',     label: 'Control Room',      path: '/control-room',     icon: MonitorCheck, color: '#d29922', description: 'AI-powered incident intelligence with dependency mapping.', serviceKey: 'control_room' },
  { id: 'live-control',     label: 'Live Control',      path: '/live-control',     icon: Activity,    color: '#39c5cf', description: 'Real-time operations dashboard with live metrics.', serviceKey: 'live_control' },
  { id: 'incident-replay',  label: 'Incident Replay',   path: '/incident-replay',  icon: RefreshCcw,  color: '#bc8cff', description: 'Step through historical incidents with timeline playback.', serviceKey: 'incident_replay' },
  { id: 'career-agent',     label: 'Career Agent',      path: '/career-agent',     icon: Briefcase,   color: '#db6d28', description: 'AI-powered job discovery with semantic matching.', serviceKey: 'career_agent' },
  { id: 'insight-engine',   label: 'Insight Engine',    path: '/insight-engine',   icon: BarChart2,   color: '#1f6feb', description: 'Business intelligence with AI analytics and LLM Q&A.', serviceKey: 'insight_engine' },
  { id: 'warehouse-copilot',label: 'Warehouse Copilot', path: '/warehouse-copilot',icon: Package,     color: '#3fb950', description: 'Intelligent warehouse operations with inventory risk detection.', serviceKey: 'warehouse_copilot' },
]

// ---------------------------------------------------------------------------
// Colour helpers
// ---------------------------------------------------------------------------
function healthColor(score) {
  if (score >= 80) return '#3fb950'
  if (score >= 50) return '#d29922'
  return '#f85149'
}
function statusColor(status) {
  switch (status) {
    case 'healthy':  return '#3fb950'
    case 'degraded': return '#d29922'
    case 'offline':  return '#f85149'
    default:         return '#6e7681'
  }
}
function alertColor(level) {
  switch (level) {
    case 'critical': return 'var(--red)'
    case 'warning':  return 'var(--yellow)'
    default:         return 'var(--accent)'
  }
}
function severityColor(severity) {
  switch (severity) {
    case 'critical': return '#f85149'
    case 'error':    return '#f85149'
    case 'warning':  return '#d29922'
    default:         return '#39c5cf'
  }
}

// ---------------------------------------------------------------------------
// Phase 4G: Animated SVG health ring
// ---------------------------------------------------------------------------
function HealthRing({ score = 0, size = 96, thickness = 8 }) {
  const color   = healthColor(score)
  const r       = (size - thickness) / 2
  const circ    = 2 * Math.PI * r
  const dash    = (score / 100) * circ
  const cx      = size / 2
  const animRef = useRef(null)

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={thickness} />
        {/* Animated progress */}
        <circle
          cx={cx} cy={cx} r={r} fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ - dash}
          style={{
            filter: `drop-shadow(0 0 6px ${color}88)`,
            transition: 'stroke-dashoffset 0.8s ease, stroke 0.5s ease',
          }}
        />
      </svg>
      {/* Center label */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontSize: 20, fontWeight: 800, color, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
          {Math.round(score)}
        </div>
        <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>
          health
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Phase 4G: Pulsing status dot
// ---------------------------------------------------------------------------
function PulseDot({ color, size = 8, pulse = true }) {
  return (
    <span style={{ position: 'relative', display: 'inline-block', width: size, height: size, flexShrink: 0 }}>
      {pulse && (
        <span style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: color, opacity: 0.3,
          animation: 'pulse-dot 1.8s ease-out infinite',
        }} />
      )}
      <span style={{ position: 'absolute', inset: 1, borderRadius: '50%', background: color }} />
    </span>
  )
}

// ---------------------------------------------------------------------------
// Trend icon
// ---------------------------------------------------------------------------
function TrendIcon({ trend, size = 12 }) {
  if (trend === 'improving') return <TrendingUp size={size} color="var(--green)" />
  if (trend === 'declining') return <TrendingDown size={size} color="var(--red)" />
  return <Minus size={size} color="var(--text-muted)" />
}

// ---------------------------------------------------------------------------
// Phase 4G: Module card with glow + animated health bar
// ---------------------------------------------------------------------------
function ModuleCard({ mod, moduleInfo, navigate }) {
  const [hovered, setHovered] = useState(false)
  const Icon   = mod.icon
  const status = moduleInfo?.status     || 'unknown'
  const score  = moduleInfo?.health_score
  const rt     = moduleInfo?.response_ms
  const trend  = moduleInfo?.trend      || 'stable'
  const sColor = statusColor(status)
  const isOnline = status === 'healthy'

  return (
    <div
      className="card"
      onClick={() => navigate(mod.path)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: 'pointer',
        borderColor: hovered ? mod.color : 'var(--border)',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        boxShadow: hovered
          ? `0 0 0 1px ${mod.color}33, 0 4px 20px ${mod.color}18`
          : isOnline
            ? `0 0 0 1px ${mod.color}12`
            : 'none',
        display: 'flex', flexDirection: 'column', gap: 'var(--space-3)',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Top accent bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${mod.color}, ${mod.color}44)`,
        opacity: hovered ? 1 : 0.5,
        transition: 'opacity 0.2s ease',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: `${mod.color}22`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: isOnline ? `0 0 8px ${mod.color}44` : 'none',
            transition: 'box-shadow 0.3s ease',
          }}>
            <Icon size={15} color={mod.color} />
          </div>
          <span style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)' }}>
            {mod.label}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <PulseDot color={sColor} size={7} pulse={status === 'healthy'} />
          <TrendIcon trend={trend} />
          <StatusBadge status={status} size="xs" />
        </div>
      </div>

      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
        {mod.description}
      </p>

      {/* Health bar */}
      {score !== undefined && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Health</span>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: sColor, fontWeight: 700 }}>
              {score}%
              {rt !== null && rt !== undefined && (
                <span style={{ color: 'var(--text-muted)', marginLeft: 6, fontWeight: 400 }}>{rt}ms</span>
              )}
            </span>
          </div>
          <div style={{ height: 3, background: 'var(--bg-tertiary)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${score}%`,
              background: sColor,
              borderRadius: 2,
              boxShadow: `0 0 6px ${sColor}88`,
              transition: 'width 0.5s ease',
            }} />
          </div>
        </div>
      )}

      <div style={{
        display: 'flex', alignItems: 'center', gap: 4,
        fontSize: 'var(--text-xs)',
        color: hovered ? mod.color : 'var(--text-muted)',
        transition: 'color 0.15s ease', marginTop: 'auto',
      }}>
        <span>Open Module</span>
        <ArrowRight size={11} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Live Events Mini Feed
// ---------------------------------------------------------------------------
function EventsMiniPanel({ navigate }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const fetch_ = async () => {
      try {
        const token = localStorage.getItem('neuroops_access_token')
        const res = await fetch('/api/gateway/platform/events', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!res.ok || cancelled) return
        const data = await res.json()
        setEvents((data.events || []).slice(0, 6))
      } catch {}
      finally { if (!cancelled) setLoading(false) }
    }
    fetch_()
    const t = setInterval(fetch_, 8000)
    return () => { cancelled = true; clearInterval(t) }
  }, [])

  const formatTs = (ts) => {
    if (!ts) return ''
    try {
      const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
      if (diff < 60)   return `${diff}s ago`
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
      return `${Math.floor(diff / 3600)}h ago`
    } catch { return '' }
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Radio size={13} color="var(--cyan)" />
          Live Event Stream
        </div>
        <button
          onClick={() => navigate('/events')}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 10, color: 'var(--cyan)', cursor: 'pointer',
            background: 'none', border: 'none', padding: 0,
          }}
        >
          View all <ArrowRight size={10} />
        </button>
      </div>

      {loading && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: 8 }}>
          Loading events…
        </div>
      )}

      {!loading && events.length === 0 && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: 8 }}>
          No recent events.
        </div>
      )}

      {events.map((e, i) => {
        const ts = e.occurred_at || e.timestamp || e.time
        const sev = e.severity || 'info'
        const sColor = severityColor(sev)
        return (
          <div key={e.id || i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '7px 10px', borderRadius: 6,
            background: `${sColor}08`,
            border: `1px solid ${sColor}1a`,
          }}>
            <PulseDot color={sColor} size={6} pulse={i === 0} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 11, fontWeight: 600, color: 'var(--text-primary)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {e.payload?.message || e.event_type?.replace(/_/g, ' ') || 'event'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                {e.source_service?.replace(/_/g, ' ')} · {sev}
              </div>
            </div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0, marginTop: 2 }}>
              {formatTs(ts)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Anomaly row
// ---------------------------------------------------------------------------
function AnomalyRow({ anomaly }) {
  const severityColor_ = anomaly.severity === 'high' ? 'var(--red)' : 'var(--yellow)'
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: 'var(--space-2)', borderRadius: 'var(--radius)', background: severityColor_ + '0d', border: `1px solid ${severityColor_}22` }}>
      <Zap size={12} color={severityColor_} style={{ flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)', lineHeight: 1.4 }}>{anomaly.description}</div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
          {anomaly.type?.replace(/_/g, ' ')} · {anomaly.severity} severity
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Correlation row
// ---------------------------------------------------------------------------
function CorrelationRow({ item }) {
  if (item.type === 'nominal') return null
  return (
    <div style={{ padding: 'var(--space-3)', background: 'rgba(210,153,34,0.06)', border: '1px solid rgba(210,153,34,0.2)', borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <GitBranch size={11} color="var(--yellow)" />
        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>
          {item.services?.join(' · ')}
        </span>
      </div>
      <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>{item.insight}</p>
      <p style={{ fontSize: 10, color: 'var(--accent)', margin: 0 }}>{item.recommendation}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Dashboard
// ---------------------------------------------------------------------------
export default function Dashboard() {
  const navigate = useNavigate()
  const { data, loading, error } = useGatewayData()

  const health       = data?.health      || {}
  const services     = data?.services    || {}
  const modules      = data?.modules     || []
  const alertsData   = data?.alerts      || {}
  const anomalyData  = data?.anomalies   || {}
  const correlations = data?.correlations?.items || []

  const healthScore    = health.platform_health ?? data?.platform_health ?? 0
  const overallStatus  = health.overall_status  ?? data?.overall_status  ?? 'unknown'
  const totalServices  = health.total_services  ?? data?.summary?.total_services ?? MODULES.length + 1
  const healthySvcs    = health.healthy_services ?? data?.summary?.healthy ?? 0
  const offlineSvcs    = health.offline_services ?? data?.summary?.offline ?? 0
  const activeAlerts   = alertsData.total ?? alertsData.critical ?? 0
  const criticalAlerts = alertsData.critical ?? 0
  const alertItems     = alertsData.items || []
  const anomalyCount   = anomalyData.total ?? 0
  const anomalyItems   = anomalyData.items || []
  const avgResponseMs  = health.avg_response_ms
  const platformUptime = data?.platform?.uptime_human

  function getModuleInfo(mod) {
    const m = modules.find(x => x.key === mod.serviceKey)
    if (m) return m
    const s = services[mod.serviceKey]
    if (s) return { status: s.status, health_score: s.health_score, response_ms: s.response_ms, trend: 'stable' }
    return null
  }

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, color: 'var(--text-secondary)' }}>
        <Loader size={28} style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: 'var(--text-base)' }}>Loading platform intelligence...</span>
        <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
      </div>
    )
  }

  return (
    <div className="module-page">
      {/* Phase 4G: keyframes */}
      <style>{`
        @keyframes pulse-dot {
          0%   { transform: scale(1);   opacity: 0.45; }
          100% { transform: scale(2.6); opacity: 0; }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.7; }
          50%       { opacity: 1; }
        }
      `}</style>

      {/* ── Header ── */}
      <div className="module-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* Phase 4G: Animated health ring */}
          <HealthRing score={healthScore} size={88} thickness={7} />
          <div>
            <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
              NeuroOps Unified Platform
            </h1>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              {platformUptime ? `Uptime: ${platformUptime} · ` : ''}
              {healthySvcs}/{totalServices} services online ·{' '}
              <span style={{ color: healthColor(healthScore), fontWeight: 600 }}>
                {overallStatus}
              </span>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {error && (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--yellow)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <AlertTriangle size={12} /> Gateway offline — cached data
            </span>
          )}
          {/* Status pill */}
          <div style={{
            padding: '7px 16px',
            background: `${healthColor(healthScore)}12`,
            border: `1px solid ${healthColor(healthScore)}40`,
            borderRadius: 20,
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: `0 0 12px ${healthColor(healthScore)}18`,
          }}>
            <PulseDot color={healthColor(healthScore)} size={7} pulse={overallStatus === 'healthy'} />
            <span style={{ fontSize: 12, fontWeight: 700, color: healthColor(healthScore), fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
              {overallStatus.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* ── Top Metrics ── */}
      <div className="grid-4">
        <MetricCard label="Services Online"   value={healthySvcs}   icon={ShieldCheck} color="var(--green)"  sub={`of ${totalServices} monitored`} />
        <MetricCard label="Platform Health"   value={`${Math.round(healthScore)}%`} icon={TrendingUp} color={healthColor(healthScore)} sub="Overall score" />
        <MetricCard label="Active Alerts"     value={activeAlerts}  icon={AlertTriangle} color={criticalAlerts > 0 ? 'var(--red)' : activeAlerts > 0 ? 'var(--yellow)' : 'var(--green)'} sub={criticalAlerts > 0 ? `${criticalAlerts} critical` : 'Platform-wide'} />
        <MetricCard label="Avg Response"      value={avgResponseMs != null ? `${avgResponseMs}ms` : '—'} icon={ActivityIcon} color="var(--accent)" sub="Service latency" />
      </div>

      {/* ── Alerts + Live Events ── */}
      <div className="grid-2">

        {/* Platform Alerts */}
        <div className="card">
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Platform Alerts</span>
            {activeAlerts > 0 && (
              <span style={{ fontSize: 10, background: criticalAlerts > 0 ? 'var(--red)' : 'var(--yellow)', color: '#fff', borderRadius: 10, padding: '1px 7px', fontWeight: 700 }}>
                {activeAlerts}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {alertItems.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 'var(--space-3)', color: 'var(--green)', fontSize: 'var(--text-sm)' }}>
                <ShieldCheck size={15} /> No active alerts — all systems nominal
              </div>
            ) : alertItems.slice(0, 6).map((alert, i) => (
              <div key={alert.id || i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)',
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius)',
                background: alertColor(alert.level) + '0d',
                border: `1px solid ${alertColor(alert.level)}28`,
              }}>
                <AlertTriangle size={12} color={alertColor(alert.level)} style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>{alert.title}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{alert.message}</div>
                </div>
                <span style={{ fontSize: 10, color: alertColor(alert.level), fontWeight: 600, flexShrink: 0 }}>{alert.level}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Phase 4G + 4D: Live Events Mini Panel */}
        <EventsMiniPanel navigate={navigate} />
      </div>

      {/* ── Anomaly Detection + Correlations ── */}
      {(anomalyItems.length > 0 || correlations.filter(c => c.type !== 'nominal').length > 0) && (
        <div className="card">
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={13} color="var(--yellow)" />
              Anomaly Detection & Correlations
            </div>
            {anomalyCount > 0 && (
              <span style={{ fontSize: 10, background: 'var(--red)', color: '#fff', borderRadius: 10, padding: '1px 7px', fontWeight: 700 }}>
                {anomalyCount}
              </span>
            )}
          </div>

          {anomalyItems.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 'var(--space-3)', color: 'var(--green)', fontSize: 'var(--text-sm)' }}>
              <TrendingUp size={15} /> No anomalies detected in rolling window
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {anomalyItems.map((a, i) => <AnomalyRow key={a.id || i} anomaly={a} />)}
            </div>
          )}

          {correlations.filter(c => c.type !== 'nominal').length > 0 && (
            <>
              <div style={{ height: 1, background: 'var(--border)', margin: '12px 0' }} />
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <GitBranch size={11} /> Cross-Service Patterns
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {correlations.filter(c => c.type !== 'nominal').slice(0, 2).map((c, i) => (
                  <CorrelationRow key={c.id || i} item={c} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Module Grid ── */}
      <div>
        <div style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)' }}>Platform Modules</h2>
          <div style={{ display: 'flex', gap: 16, fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            <span>{MODULES.length} modules</span>
            <span style={{ color: 'var(--green)' }}>{healthySvcs} online</span>
            {offlineSvcs > 0 && <span style={{ color: 'var(--red)' }}>{offlineSvcs} offline</span>}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
          {MODULES.map(mod => (
            <ModuleCard key={mod.id} mod={mod} moduleInfo={getModuleInfo(mod)} navigate={navigate} />
          ))}
        </div>
      </div>

      {/* ── Module Activity Overview ── */}
      {modules.length > 0 && (
        <div className="card">
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ActivityIcon size={14} color="var(--accent)" />
            Module Activity Overview
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {modules.map(m => (
              <div key={m.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <PulseDot color={statusColor(m.status)} size={6} pulse={m.status === 'healthy'} />
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', width: 130, flexShrink: 0, fontWeight: 500 }}>{m.label}</span>
                <div style={{ flex: 1, height: 5, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${m.health_score ?? 0}%`,
                    background: statusColor(m.status),
                    boxShadow: `0 0 4px ${statusColor(m.status)}66`,
                    borderRadius: 3, transition: 'width 0.6s ease',
                  }} />
                </div>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: statusColor(m.status), width: 36, textAlign: 'right', flexShrink: 0, fontWeight: 700 }}>
                  {m.health_score ?? 0}%
                </span>
                <TrendIcon trend={m.trend} size={11} />
                <span style={{ fontSize: 10, color: statusColor(m.status), width: 52, flexShrink: 0 }}>{m.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Quick Access ── */}
      <div className="card">
        <div className="card-title">Quick Access</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
          {MODULES.map(mod => {
            const Icon = mod.icon
            const info = getModuleInfo(mod)
            const dot  = statusColor(info?.status || 'unknown')
            return (
              <button
                key={mod.id}
                onClick={() => navigate(mod.path)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s ease', fontFamily: 'var(--font-sans)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = mod.color; e.currentTarget.style.color = mod.color; e.currentTarget.style.background = mod.color + '11' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'var(--bg-tertiary)' }}
              >
                <PulseDot color={dot} size={5} pulse={info?.status === 'healthy'} />
                <Icon size={12} />
                {mod.label}
              </button>
            )
          })}
          <button
            onClick={() => navigate('/events')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(57,197,207,0.08)', border: '1px solid rgba(57,197,207,0.25)', borderRadius: 'var(--radius)', color: '#39c5cf', fontSize: 'var(--text-xs)', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s ease', fontFamily: 'var(--font-sans)' }}
          >
            <Radio size={12} />
            Platform Events
          </button>
        </div>
      </div>

    </div>
  )
}
