import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Bot, MonitorCheck, Activity,
  RefreshCcw, Briefcase, BarChart2, Package,
  Server, ShieldCheck, AlertTriangle, TrendingUp,
  TrendingDown, Minus, ArrowRight, Loader, Zap,
  GitBranch, Activity as ActivityIcon,
} from 'lucide-react'
import useGatewayData from './useGatewayData.js'
import StatusBadge from '../../components/shared/StatusBadge.jsx'
import MetricCard from '../../components/shared/MetricCard.jsx'

// ---------------------------------------------------------------------------
// Module definitions
// ---------------------------------------------------------------------------
const MODULES = [
  { id: 'autopilot',        label: 'AI Autopilot',      path: '/autopilot',        icon: Bot,         color: '#3fb950', description: 'Autonomous operations monitoring & AI decision engine.', serviceKey: 'autopilot' },
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
function eventColor(type) {
  switch (type) {
    case 'critical': return 'var(--red)'
    case 'warning':  return 'var(--yellow)'
    case 'success':  return 'var(--green)'
    default:         return 'var(--accent)'
  }
}
function alertColor(level) {
  switch (level) {
    case 'critical': return 'var(--red)'
    case 'warning':  return 'var(--yellow)'
    default:         return 'var(--accent)'
  }
}
function statusColor(status) {
  switch (status) {
    case 'healthy':  return 'var(--green)'
    case 'degraded': return 'var(--yellow)'
    case 'offline':  return 'var(--red)'
    default:         return 'var(--text-muted)'
  }
}

// ---------------------------------------------------------------------------
// Trend icon helper
// ---------------------------------------------------------------------------
function TrendIcon({ trend, size = 12 }) {
  if (trend === 'improving') return <TrendingUp size={size} color="var(--green)" />
  if (trend === 'declining') return <TrendingDown size={size} color="var(--red)" />
  return <Minus size={size} color="var(--text-muted)" />
}

// ---------------------------------------------------------------------------
// Module card
// ---------------------------------------------------------------------------
function ModuleCard({ mod, moduleInfo, navigate }) {
  const [hovered, setHovered] = React.useState(false)
  const Icon = mod.icon
  const status     = moduleInfo?.status     || 'unknown'
  const score      = moduleInfo?.health_score
  const responseMs = moduleInfo?.response_ms
  const trend      = moduleInfo?.trend      || 'stable'

  return (
    <div
      className="card"
      onClick={() => navigate(mod.path)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: 'pointer',
        borderColor: hovered ? mod.color : 'var(--border)',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        boxShadow: hovered ? `0 0 0 1px ${mod.color}33, var(--shadow)` : 'none',
        display: 'flex', flexDirection: 'column', gap: 'var(--space-3)',
        position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: mod.color, opacity: hovered ? 1 : 0.4, transition: 'opacity 0.15s ease' }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: mod.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={15} color={mod.color} />
          </div>
          <span style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)' }}>
            {mod.label}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <TrendIcon trend={trend} />
          <StatusBadge status={status} size="xs" />
        </div>
      </div>

      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
        {mod.description}
      </p>

      {/* Score bar + meta */}
      {score !== undefined && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Health</span>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: statusColor(status), fontWeight: 700 }}>
              {score}%
              {responseMs !== null && responseMs !== undefined && (
                <span style={{ color: 'var(--text-muted)', marginLeft: 6, fontWeight: 400 }}>{responseMs}ms</span>
              )}
            </span>
          </div>
          <div style={{ height: 3, background: 'var(--bg-tertiary)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${score}%`, background: statusColor(status), borderRadius: 2, transition: 'width 0.4s ease' }} />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-xs)', color: hovered ? mod.color : 'var(--text-muted)', transition: 'color 0.15s ease', marginTop: 'auto' }}>
        <span>Open Module</span>
        <ArrowRight size={11} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Anomaly badge
// ---------------------------------------------------------------------------
function AnomalyRow({ anomaly }) {
  const severityColor = anomaly.severity === 'high' ? 'var(--red)' : 'var(--yellow)'
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: 'var(--space-2)', borderRadius: 'var(--radius)', background: severityColor + '0d', border: `1px solid ${severityColor}22` }}>
      <Zap size={12} color={severityColor} style={{ flexShrink: 0, marginTop: 2 }} />
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
// Correlation card
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

  // -- Data extraction (supports both /intelligence and /status shapes) --
  const health       = data?.health      || {}
  const services     = data?.services    || {}
  const modules      = data?.modules     || []
  const alertsData   = data?.alerts      || {}
  const anomalyData  = data?.anomalies   || {}
  const correlations = data?.correlations?.items || []

  const healthScore     = health.platform_health ?? data?.platform_health ?? 82
  const overallStatus   = health.overall_status  ?? data?.overall_status  ?? 'unknown'
  const totalServices   = health.total_services  ?? data?.summary?.total_services ?? MODULES.length + 1
  const healthySvcs     = health.healthy_services ?? data?.summary?.healthy ?? 0
  const offlineSvcs     = health.offline_services ?? data?.summary?.offline ?? 0
  const activeAlerts    = alertsData.total ?? alertsData.critical ?? 0
  const criticalAlerts  = alertsData.critical ?? 0
  const alertItems      = alertsData.items || []
  const anomalyCount    = anomalyData.total ?? 0
  const anomalyItems    = anomalyData.items || []
  const avgResponseMs   = health.avg_response_ms
  const platformUptime  = data?.platform?.uptime_human

  function getModuleInfo(mod) {
    // Try from modules array first (enriched with trend), then services dict
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

      {/* ── Header ── */}
      <div className="module-header">
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)' }}>
            NeuroOps Unified Platform
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 4 }}>
            {platformUptime ? `Uptime: ${platformUptime} · ` : ''}
            Centralized operations hub — all systems monitored, controlled, and optimized by AI
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {error && (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--yellow)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <AlertTriangle size={12} /> Gateway offline — showing cached data
            </span>
          )}
          {/* Overall status badge */}
          <div style={{
            padding: '6px 14px',
            background: healthScore >= 80 ? 'rgba(63,185,80,0.1)' : healthScore >= 60 ? 'rgba(210,153,34,0.1)' : 'rgba(248,81,73,0.1)',
            border: `1px solid ${healthScore >= 80 ? 'rgba(63,185,80,0.3)' : healthScore >= 60 ? 'rgba(210,153,34,0.3)' : 'rgba(248,81,73,0.3)'}`,
            borderRadius: 'var(--radius)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <ShieldCheck size={14} color={healthScore >= 80 ? 'var(--green)' : healthScore >= 60 ? 'var(--yellow)' : 'var(--red)'} />
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: healthScore >= 80 ? 'var(--green)' : healthScore >= 60 ? 'var(--yellow)' : 'var(--red)', fontFamily: 'var(--font-mono)' }}>
              {Math.round(healthScore)}% · {overallStatus}
            </span>
          </div>
        </div>
      </div>

      {/* ── Top Metrics Row ── */}
      <div className="grid-4">
        <MetricCard label="Services Online"   value={healthySvcs}   icon={ShieldCheck} color="var(--green)"  sub={`of ${totalServices} monitored`} />
        <MetricCard label="Platform Health"   value={`${Math.round(healthScore)}%`} icon={TrendingUp} color={healthScore >= 80 ? 'var(--green)' : healthScore >= 60 ? 'var(--yellow)' : 'var(--red)'} sub="Overall score" />
        <MetricCard label="Active Alerts"     value={activeAlerts}  icon={AlertTriangle} color={criticalAlerts > 0 ? 'var(--red)' : activeAlerts > 0 ? 'var(--yellow)' : 'var(--green)'} sub={criticalAlerts > 0 ? `${criticalAlerts} critical` : 'Platform-wide'} />
        <MetricCard label="Avg Response"      value={avgResponseMs !== null && avgResponseMs !== undefined ? `${avgResponseMs}ms` : '—'} icon={ActivityIcon} color="var(--accent)" sub="Service latency" />
      </div>

      {/* ── Alerts + Anomalies Row ── */}
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

        {/* Anomaly Detection */}
        <div className="card">
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Anomaly Detection</span>
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

          {/* Correlations sub-section */}
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
      </div>

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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {modules.map(m => (
              <div key={m.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', width: 130, flexShrink: 0, fontWeight: 500 }}>{m.label}</span>
                <div style={{ flex: 1, height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${m.health_score ?? 0}%`, background: statusColor(m.status), borderRadius: 3, transition: 'width 0.5s ease' }} />
                </div>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: statusColor(m.status), width: 36, textAlign: 'right', flexShrink: 0 }}>
                  {m.health_score ?? 0}%
                </span>
                <TrendIcon trend={m.trend} size={11} />
                <span style={{ fontSize: 10, color: statusColor(m.status), width: 52, flexShrink: 0, fontWeight: 500 }}>{m.status}</span>
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
            const dot  = info?.status === 'healthy' ? 'var(--green)' : info?.status === 'offline' ? 'var(--red)' : 'var(--text-muted)'
            return (
              <button
                key={mod.id}
                onClick={() => navigate(mod.path)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s ease', fontFamily: 'var(--font-sans)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = mod.color; e.currentTarget.style.color = mod.color; e.currentTarget.style.background = mod.color + '11' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'var(--bg-tertiary)' }}
              >
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: dot, flexShrink: 0 }} />
                <Icon size={12} />
                {mod.label}
              </button>
            )
          })}
        </div>
      </div>

    </div>
  )
}
