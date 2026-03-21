import React, { useState, useEffect, useRef } from 'react'
import { AlertTriangle, MonitorCheck, GitBranch, Clock, TrendingUp, Zap } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import cytoscape from 'cytoscape'
import { api } from './api.js'
import StatusBadge from '../../components/shared/StatusBadge.jsx'

const POLL_MS = 5000

function usePoll(fn, interval) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    const fetch = async () => {
      try {
        const result = await fn()
        if (mounted.current) { setData(result); setError(null) }
      } catch (e) {
        if (mounted.current) setError(e.message)
      }
    }
    fetch()
    const id = setInterval(fetch, interval)
    return () => { mounted.current = false; clearInterval(id) }
  }, [])

  return { data, error }
}

// Dependency graph component using cytoscape
function DependencyGraph({ graphData }) {
  const containerRef = useRef(null)
  const cyRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current || !graphData) return

    const nodes = Array.isArray(graphData.nodes) ? graphData.nodes : []
    const edges = Array.isArray(graphData.edges) ? graphData.edges : []

    if (cyRef.current) cyRef.current.destroy()

    cyRef.current = cytoscape({
      container: containerRef.current,
      elements: {
        nodes: nodes.map(n => ({ data: { id: n.id || n.name, label: n.label || n.name || n.id, ...n } })),
        edges: edges.map(e => ({ data: { id: e.id || `${e.source}-${e.target}`, source: e.source, target: e.target, ...e } })),
      },
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#1f6feb',
            'label': 'data(label)',
            'color': '#e6edf3',
            'font-size': 11,
            'text-valign': 'center',
            'text-halign': 'center',
            'width': 60,
            'height': 30,
            'shape': 'roundrectangle',
            'border-width': 1,
            'border-color': '#30363d',
          },
        },
        {
          selector: 'node[status = "healthy"]',
          style: { 'background-color': '#3fb950' },
        },
        {
          selector: 'node[status = "warning"]',
          style: { 'background-color': '#d29922' },
        },
        {
          selector: 'node[status = "critical"]',
          style: { 'background-color': '#f85149' },
        },
        {
          selector: 'edge',
          style: {
            'width': 1,
            'line-color': '#30363d',
            'target-arrow-color': '#30363d',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
          },
        },
      ],
      layout: { name: 'breadthfirst', directed: true, padding: 20 },
    })

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy()
        cyRef.current = null
      }
    }
  }, [graphData])

  return (
    <div ref={containerRef} style={{
      width: '100%', height: 280,
      background: 'var(--bg-secondary)',
      borderRadius: 'var(--radius)',
    }} />
  )
}

// Ticker for story mode narrative
function StoryTicker({ text }) {
  if (!text) return null
  return (
    <div style={{
      overflow: 'hidden',
      background: 'var(--bg-tertiary)',
      borderTop: '1px solid var(--border)',
      padding: '8px var(--space-6)',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <span style={{
        fontSize: 10, fontWeight: 700, color: 'var(--cyan)',
        textTransform: 'uppercase', letterSpacing: '0.08em',
        flexShrink: 0,
      }}>
        STORY
      </span>
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <div style={{
          whiteSpace: 'nowrap',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-secondary)',
          animation: `ticker ${Math.max(15, text.length / 5)}s linear infinite`,
        }}>
          {text}
        </div>
      </div>
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  )
}

function HealthGauge({ score = 0 }) {
  const color = score >= 80 ? 'var(--green)' : score >= 60 ? 'var(--yellow)' : score >= 40 ? 'var(--orange)' : 'var(--red)'
  const r = 50
  const circumference = 2 * Math.PI * r
  const offset = circumference - (score / 100) * circumference

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <svg width="130" height="130">
        <circle cx="65" cy="65" r={r} fill="none" stroke="var(--bg-tertiary)" strokeWidth="10" />
        <circle
          cx="65" cy="65" r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 65 65)"
          style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease', filter: `drop-shadow(0 0 4px ${color}88)` }}
        />
        <text x="65" y="60" textAnchor="middle" fill={color} fontSize="22" fontWeight="700" fontFamily="monospace">
          {Math.round(score)}
        </text>
        <text x="65" y="76" textAnchor="middle" fill="var(--text-muted)" fontSize="10">
          / 100
        </text>
      </svg>
      <StatusBadge status={score >= 80 ? 'healthy' : score >= 60 ? 'warning' : score >= 40 ? 'degraded' : 'critical'} />
    </div>
  )
}

function AnomalyBar({ score = 0, service }) {
  const color = score > 0.7 ? 'var(--red)' : score > 0.4 ? 'var(--yellow)' : 'var(--green)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', width: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>
        {service}
      </span>
      <div style={{ flex: 1, height: 6, background: 'var(--bg-primary)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${score * 100}%`,
          background: color, borderRadius: 3,
          transition: 'width 0.4s ease',
        }} />
      </div>
      <span style={{ fontSize: 10, color, fontFamily: 'var(--font-mono)', width: 35, textAlign: 'right' }}>
        {(score * 100).toFixed(0)}%
      </span>
    </div>
  )
}

export default function ControlRoomPage() {
  const { data: health } = usePoll(api.health, POLL_MS)
  const { data: events } = usePoll(api.events, POLL_MS)
  const { data: anomalies } = usePoll(api.anomalies, POLL_MS)
  const { data: graphData } = usePoll(api.dependencyGraph, POLL_MS * 2)
  const { data: services } = usePoll(api.services, POLL_MS)
  const { data: investigation } = usePoll(api.investigation, POLL_MS)
  const { data: deployImpact } = usePoll(api.deployImpact, POLL_MS)
  const { data: incidentTimeline } = usePoll(api.incidentTimeline, POLL_MS)
  const { data: incidents } = usePoll(api.incidents, POLL_MS)

  const healthScore = health?.health_score ?? health?.score ?? 75
  const narrative = investigation?.narrative || investigation?.story || health?.narrative || ''
  const anomalyList = Array.isArray(anomalies) ? anomalies : anomalies?.anomalies || []
  const eventList = Array.isArray(events) ? events : events?.events || []
  const serviceList = Array.isArray(services) ? services : services?.services || []
  const timelineList = Array.isArray(incidentTimeline) ? incidentTimeline : incidentTimeline?.timeline || []
  const deployData = Array.isArray(deployImpact) ? deployImpact : deployImpact?.data || []
  const incidentList = Array.isArray(incidents) ? incidents : incidents?.incidents || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="module-page" style={{ flex: 1, overflowY: 'auto' }}>
        {/* Header */}
        <div className="module-header">
          <div>
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)' }}>Control Room</h1>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 4 }}>
              AI-powered incident intelligence & dependency analysis
            </p>
          </div>
          <StatusBadge status={healthScore >= 80 ? 'healthy' : healthScore >= 60 ? 'warning' : 'critical'} size="sm" />
        </div>

        {/* Top row: Health + Services + Alert Banner */}
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 'var(--space-4)', alignItems: 'start' }}>
          {/* Health gauge */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div className="card-title">System Health</div>
            <HealthGauge score={healthScore} />
          </div>

          {/* Services table */}
          <div className="card">
            <div className="card-title">Services ({serviceList.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 180, overflowY: 'auto' }}>
              {serviceList.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', padding: 'var(--space-3)' }}>
                  No service data
                </div>
              ) : (
                serviceList.slice(0, 10).map((svc, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '4px 8px', borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-tertiary)',
                  }}>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>
                      {svc.name || svc.service_name || `Service ${i + 1}`}
                    </span>
                    <StatusBadge status={svc.status || svc.health || 'unknown'} size="xs" />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Alert banner */}
          <div className="card" style={{ minWidth: 200 }}>
            <div className="card-title">Active Incidents</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {incidentList.slice(0, 4).map((inc, i) => (
                <div key={i} style={{
                  padding: '6px 8px',
                  background: 'rgba(248,81,73,0.08)',
                  border: '1px solid rgba(248,81,73,0.25)',
                  borderRadius: 'var(--radius-sm)',
                }}>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--red)' }}>
                    {inc.title || inc.name || `Incident ${i + 1}`}
                  </div>
                  {inc.description && (
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                      {inc.description}
                    </div>
                  )}
                </div>
              ))}
              {incidentList.length === 0 && (
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MonitorCheck size={13} />
                  All clear
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Middle row: Dependency Graph + Event Stream */}
        <div className="grid-2">
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-3)' }}>
              <GitBranch size={13} color="var(--cyan)" />
              <div className="card-title" style={{ marginBottom: 0 }}>Dependency Graph</div>
            </div>
            {graphData ? (
              <DependencyGraph graphData={graphData} />
            ) : (
              <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                Loading dependency data...
              </div>
            )}
          </div>

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-3)' }}>
              <Zap size={13} color="var(--yellow)" />
              <div className="card-title" style={{ marginBottom: 0 }}>Event Stream</div>
            </div>
            <div style={{ height: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {eventList.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                  No events
                </div>
              ) : (
                eventList.slice(0, 30).map((ev, i) => {
                  const sev = (ev.severity || ev.type || 'info').toLowerCase()
                  const color = sev === 'critical' ? 'var(--red)' : sev === 'warning' ? 'var(--yellow)' : sev === 'success' ? 'var(--green)' : 'var(--accent)'
                  return (
                    <div key={i} style={{
                      display: 'flex', gap: 8, padding: '4px 6px',
                      borderRadius: 'var(--radius-sm)',
                      borderLeft: `2px solid ${color}`,
                      background: 'var(--bg-tertiary)',
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ev.message || ev.description}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                          {ev.service} · {ev.timestamp || ev.time}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Anomaly scores */}
        {anomalyList.length > 0 && (
          <div className="card">
            <div className="card-title">Anomaly Scores</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {anomalyList.map((a, i) => (
                <AnomalyBar
                  key={i}
                  service={a.service || a.name || `Service ${i + 1}`}
                  score={a.score ?? a.anomaly_score ?? 0}
                />
              ))}
            </div>
          </div>
        )}

        {/* Bottom row: Investigator + Timeline + Deploy Impact */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
          {/* Investigator */}
          <div className="card">
            <div className="card-title">Investigation Panel</div>
            {investigation ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {investigation.root_cause && (
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Root Cause</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)', lineHeight: 1.5 }}>{investigation.root_cause}</div>
                  </div>
                )}
                {investigation.recommendation && (
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Recommendation</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--cyan)', lineHeight: 1.5 }}>{investigation.recommendation}</div>
                  </div>
                )}
                {investigation.affected_services && (
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Affected Services</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {investigation.affected_services.map((s, i) => (
                        <span key={i} style={{ fontSize: 10, padding: '2px 6px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)' }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {!investigation.root_cause && !investigation.recommendation && (
                  <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                    {JSON.stringify(investigation, null, 2).slice(0, 300)}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>No investigation data</div>
            )}
          </div>

          {/* Incident timeline */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-3)' }}>
              <Clock size={12} color="var(--purple)" />
              <div className="card-title" style={{ marginBottom: 0 }}>Incident Timeline</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
              {timelineList.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>No timeline data</div>
              ) : (
                timelineList.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
                      {i < timelineList.length - 1 && <div style={{ width: 1, height: 20, background: 'var(--border)' }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{item.timestamp || item.time}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)', marginTop: 1 }}>{item.event || item.message || item.description}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Deploy impact chart */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-3)' }}>
              <TrendingUp size={12} color="var(--orange)" />
              <div className="card-title" style={{ marginBottom: 0 }}>Deploy Impact</div>
            </div>
            {deployData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={deployData}>
                  <XAxis dataKey="time" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 }}
                    labelStyle={{ color: 'var(--text-muted)' }}
                  />
                  <Line type="monotone" dataKey="error_rate" stroke="var(--red)" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="latency" stroke="var(--yellow)" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="health" stroke="var(--green)" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                No deploy data
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Story mode ticker */}
      <StoryTicker text={narrative} />
    </div>
  )
}
