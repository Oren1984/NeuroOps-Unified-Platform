import React, { useState, useEffect, useRef, useCallback } from 'react'
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Clock, AlertTriangle, CheckCircle, Activity } from 'lucide-react'

const BASE = '/api/incident-replay'

function getNodeStyle(state) {
  switch ((state || 'healthy').toLowerCase()) {
    case 'critical': return { background: '#f85149', color: 'white' }
    case 'warning': return { background: '#d29922', color: 'white' }
    case 'recovering': return { background: '#39c5cf', color: 'white' }
    default: return { background: '#3fb950', color: 'white' }
  }
}

function getSeverityColor(sev) {
  switch ((sev || 'info').toLowerCase()) {
    case 'critical': return 'var(--red)'
    case 'high': return 'var(--red)'
    case 'warning': return 'var(--yellow)'
    case 'medium': return 'var(--yellow)'
    case 'info': return 'var(--accent)'
    case 'success': return 'var(--green)'
    default: return 'var(--text-muted)'
  }
}

function formatTime(ts) {
  if (!ts) return ''
  try {
    const d = new Date(ts)
    if (isNaN(d)) return ts
    return d.toLocaleTimeString('en-US', { hour12: false })
  } catch { return ts }
}

const SAMPLE_INCIDENTS = [
  { id: 'sample-1', title: 'Database Connection Cascade', duration: '45 min', severity: 'critical' },
  { id: 'sample-2', title: 'Memory Leak in API Service', duration: '22 min', severity: 'high' },
]

const SAMPLE_SERVICES = ['api-gateway', 'auth-service', 'user-service', 'db-primary', 'cache-service', 'notification-service']

export default function IncidentReplayPage() {
  const [incidents, setIncidents] = useState([])
  const [selectedIncidentId, setSelectedIncidentId] = useState(null)
  const [incidentData, setIncidentData] = useState(null)
  const [currentEventIndex, setCurrentEventIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [serviceStates, setServiceStates] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const playRef = useRef(null)

  // Fetch incidents list
  useEffect(() => {
    fetch(`${BASE}/incidents`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        const list = Array.isArray(data) ? data : data?.incidents || SAMPLE_INCIDENTS
        setIncidents(list.length > 0 ? list : SAMPLE_INCIDENTS)
        if (list.length > 0) setSelectedIncidentId(list[0].id || list[0].incident_id)
      })
      .catch(() => {
        setIncidents(SAMPLE_INCIDENTS)
        setSelectedIncidentId(SAMPLE_INCIDENTS[0].id)
      })
      .finally(() => setLoading(false))
  }, [])

  // Fetch incident detail when selected
  useEffect(() => {
    if (!selectedIncidentId) return
    setCurrentEventIndex(0)
    setIsPlaying(false)
    setIncidentData(null)

    fetch(`${BASE}/incidents/${selectedIncidentId}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        setIncidentData(data)
        // Init service states
        const initialStates = {}
        const services = data.services || SAMPLE_SERVICES
        services.forEach(s => { initialStates[s] = 'healthy' })
        setServiceStates(initialStates)
      })
      .catch(() => {
        // Use sample data
        const sample = generateSampleIncident(selectedIncidentId)
        setIncidentData(sample)
        const states = {}
        sample.services.forEach(s => { states[s] = 'healthy' })
        setServiceStates(states)
      })
  }, [selectedIncidentId])

  function generateSampleIncident(id) {
    return {
      id,
      title: SAMPLE_INCIDENTS.find(i => i.id === id)?.title || 'Sample Incident',
      services: SAMPLE_SERVICES,
      events: [
        { id: 1, timestamp: new Date(Date.now() - 2700000).toISOString(), service: 'db-primary', severity: 'warning', impact: 'warning', message: 'Database connection latency increasing — p99 at 450ms', explanation: 'The database is experiencing elevated connection wait times, likely due to increased load or a slow query.' },
        { id: 2, timestamp: new Date(Date.now() - 2640000).toISOString(), service: 'api-gateway', severity: 'warning', impact: 'warning', message: 'API response times degrading — timeout errors beginning', explanation: 'The API gateway is propagating the database slowness to upstream clients, causing request timeouts.' },
        { id: 3, timestamp: new Date(Date.now() - 2580000).toISOString(), service: 'db-primary', severity: 'critical', impact: 'critical', message: 'Database connection pool exhausted — all 100 connections used', explanation: 'The connection pool is completely saturated. No new database queries can be initiated, causing service-wide failure.' },
        { id: 4, timestamp: new Date(Date.now() - 2520000).toISOString(), service: 'auth-service', severity: 'critical', impact: 'critical', message: 'Auth service failing — cannot validate sessions', explanation: 'With the database unavailable, auth service cannot verify user sessions, causing authentication failures.' },
        { id: 5, timestamp: new Date(Date.now() - 2460000).toISOString(), service: 'user-service', severity: 'critical', impact: 'critical', message: 'User service cascade failure detected', explanation: 'The cascade has spread to user-service. This is a full outage scenario.' },
        { id: 6, timestamp: new Date(Date.now() - 2400000).toISOString(), service: 'cache-service', severity: 'warning', impact: 'warning', message: 'Cache hit rate dropping — serving stale data', explanation: 'Cache service is serving stale data because it cannot sync with the primary database.' },
        { id: 7, timestamp: new Date(Date.now() - 2340000).toISOString(), service: 'db-primary', severity: 'info', impact: 'recovering', message: 'AI Autopilot: Killing long-running queries and recycling pool', explanation: 'The AI agent has identified the root cause: a runaway query. It is terminating it and recycling the connection pool.' },
        { id: 8, timestamp: new Date(Date.now() - 2280000).toISOString(), service: 'api-gateway', severity: 'success', impact: 'recovering', message: 'API gateway recovering — response times normalizing', explanation: 'With the database recovering, the API gateway is gradually returning to normal operation.' },
        { id: 9, timestamp: new Date(Date.now() - 2220000).toISOString(), service: 'auth-service', severity: 'success', impact: 'healthy', message: 'Auth service fully recovered', explanation: 'Authentication is restored. Users can now log in normally.' },
        { id: 10, timestamp: new Date(Date.now() - 2160000).toISOString(), service: 'db-primary', severity: 'success', impact: 'healthy', message: 'Database fully recovered — all connections healthy', explanation: 'The database has fully recovered. The incident duration was approximately 9 minutes.' },
      ],
    }
  }

  // Apply events up to currentEventIndex
  useEffect(() => {
    if (!incidentData) return
    const evts = incidentData.events || []
    const newStates = {}
    const services = incidentData.services || SAMPLE_SERVICES
    services.forEach(s => { newStates[s] = 'healthy' })
    evts.slice(0, currentEventIndex).forEach(ev => {
      if (ev.service && ev.impact) {
        newStates[ev.service] = ev.impact
      }
    })
    setServiceStates(newStates)
  }, [currentEventIndex, incidentData])

  // Playback interval
  useEffect(() => {
    if (!isPlaying) {
      if (playRef.current) clearInterval(playRef.current)
      return
    }
    const events = incidentData?.events || []
    if (currentEventIndex >= events.length) {
      setIsPlaying(false)
      return
    }
    const ms = Math.round(1200 / playbackSpeed)
    playRef.current = setInterval(() => {
      setCurrentEventIndex(prev => {
        const next = prev + 1
        if (next >= events.length) {
          setIsPlaying(false)
          clearInterval(playRef.current)
        }
        return Math.min(next, events.length)
      })
    }, ms)
    return () => clearInterval(playRef.current)
  }, [isPlaying, playbackSpeed, incidentData, currentEventIndex])

  // Build ReactFlow nodes and edges
  const buildGraph = useCallback(() => {
    const services = incidentData?.services || SAMPLE_SERVICES
    const nodes = services.map((svc, i) => {
      const cols = 3
      const row = Math.floor(i / cols)
      const col = i % cols
      const style = getNodeStyle(serviceStates[svc])
      return {
        id: svc,
        data: { label: svc },
        position: { x: col * 200 + 50, y: row * 120 + 40 },
        style: {
          ...style,
          border: `2px solid ${style.background}`,
          borderRadius: 8,
          padding: '8px 16px',
          fontSize: 11,
          fontWeight: 600,
          minWidth: 120,
          textAlign: 'center',
          transition: 'background 0.4s ease',
        },
      }
    })

    const edges = []
    // Create some dependency edges based on service names
    const deps = {
      'api-gateway': ['auth-service', 'user-service'],
      'auth-service': ['db-primary', 'cache-service'],
      'user-service': ['db-primary'],
      'notification-service': ['user-service'],
      'cache-service': ['db-primary'],
    }
    Object.entries(deps).forEach(([src, targets]) => {
      targets.forEach(tgt => {
        if (services.includes(src) && services.includes(tgt)) {
          edges.push({
            id: `${src}-${tgt}`,
            source: src,
            target: tgt,
            style: { stroke: '#30363d', strokeWidth: 1.5 },
            markerEnd: { type: 'arrowclosed', color: '#30363d' },
          })
        }
      })
    })

    return { nodes, edges }
  }, [incidentData, serviceStates])

  const { nodes, edges } = buildGraph()
  const events = incidentData?.events || []
  const currentEvent = events[currentEventIndex - 1] || null
  const isComplete = currentEventIndex >= events.length && events.length > 0
  const progress = events.length > 0 ? (currentEventIndex / events.length) * 100 : 0

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
        <span>Loading incidents...</span>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Top bar - incident selector */}
      <div style={{
        padding: 'var(--space-3) var(--space-6)',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-secondary)',
        display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
        flexShrink: 0,
      }}>
        <h1 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)', flexShrink: 0 }}>
          Incident Replay
        </h1>
        <select
          value={selectedIncidentId || ''}
          onChange={e => setSelectedIncidentId(e.target.value)}
          style={{
            flex: 1, maxWidth: 400,
            padding: '6px 12px',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            color: 'var(--text-primary)',
            fontSize: 'var(--text-sm)',
            cursor: 'pointer',
          }}
        >
          {incidents.map(inc => (
            <option key={inc.id || inc.incident_id} value={inc.id || inc.incident_id}
              style={{ background: 'var(--bg-tertiary)' }}>
              {inc.title || inc.name} {inc.severity ? `— ${inc.severity.toUpperCase()}` : ''}
            </option>
          ))}
        </select>
        {incidentData && (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            {events.length} events · {incidentData.duration || '—'}
          </span>
        )}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 320px', overflow: 'hidden' }}>
        {/* Left: Graph + Narrative */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid var(--border)' }}>
          {/* Dependency graph */}
          <div style={{ flex: 1, position: 'relative' }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              fitView
              style={{ background: 'var(--bg-primary)' }}
            >
              <Background color="var(--border)" gap={20} />
              <Controls style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }} />
              <MiniMap
                nodeColor={n => n.style?.background || 'var(--accent)'}
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
              />
            </ReactFlow>

            {/* Legend */}
            <div style={{
              position: 'absolute', top: 12, left: 12,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: 'var(--space-2) var(--space-3)',
              display: 'flex', gap: 12,
            }}>
              {[
                { state: 'healthy', color: '#3fb950' },
                { state: 'warning', color: '#d29922' },
                { state: 'critical', color: '#f85149' },
                { state: 'recovering', color: '#39c5cf' },
              ].map(l => (
                <div key={l.state} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color }} />
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{l.state}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Narrative */}
          <div style={{
            padding: 'var(--space-4)',
            background: 'var(--bg-secondary)',
            borderTop: '1px solid var(--border)',
            minHeight: 80,
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-2)' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--purple)' }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                AI Explanation
              </span>
              {currentEvent && (
                <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                  Event {currentEventIndex} of {events.length}
                </span>
              )}
            </div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {currentEvent?.explanation || (isComplete ? 'Replay complete. The incident has been fully analyzed.' : 'Press play to begin step-by-step replay. Each event will be explained by AI.')}
            </p>
          </div>
        </div>

        {/* Right: Event feed */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{
            padding: 'var(--space-3) var(--space-4)',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Activity size={13} color="var(--cyan)" />
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Event Timeline
            </span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-3)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {events.map((ev, i) => {
                const isActive = i === currentEventIndex - 1
                const isPast = i < currentEventIndex
                const color = getSeverityColor(ev.severity)
                return (
                  <div
                    key={ev.id || i}
                    onClick={() => setCurrentEventIndex(i + 1)}
                    style={{
                      padding: 'var(--space-2) var(--space-3)',
                      borderRadius: 'var(--radius-sm)',
                      background: isActive ? color + '22' : isPast ? 'var(--bg-tertiary)' : 'transparent',
                      border: `1px solid ${isActive ? color + '66' : isPast ? 'var(--border)' : 'transparent'}`,
                      opacity: isPast || isActive ? 1 : 0.4,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {formatTime(ev.timestamp)}
                      </span>
                      <span style={{
                        fontSize: 10, padding: '1px 5px',
                        background: color + '22', color,
                        borderRadius: 2, fontWeight: 600,
                        textTransform: 'uppercase', letterSpacing: '0.04em',
                        flexShrink: 0,
                      }}>
                        {ev.severity}
                      </span>
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)', marginTop: 3, lineHeight: 1.4 }}>
                      <span style={{ color: color, fontWeight: 600 }}>{ev.service}</span>: {ev.message}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Timeline player */}
      <div style={{
        padding: 'var(--space-3) var(--space-6)',
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', gap: 'var(--space-2)',
        flexShrink: 0,
      }}>
        {/* Progress bar */}
        <div
          style={{ height: 4, background: 'var(--bg-tertiary)', borderRadius: 2, cursor: 'pointer', position: 'relative' }}
          onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect()
            const pct = (e.clientX - rect.left) / rect.width
            setCurrentEventIndex(Math.round(pct * events.length))
          }}
        >
          <div style={{
            height: '100%', width: `${progress}%`,
            background: 'var(--accent)', borderRadius: 2,
            transition: 'width 0.3s ease',
          }} />
          {/* Thumb */}
          <div style={{
            position: 'absolute', top: '50%', left: `${progress}%`,
            transform: 'translate(-50%, -50%)',
            width: 10, height: 10, borderRadius: '50%',
            background: 'var(--accent)',
            boxShadow: '0 0 4px var(--accent)',
          }} />
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          {/* Playback buttons */}
          <button
            onClick={() => setCurrentEventIndex(0)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
          >
            <SkipBack size={16} />
          </button>

          <button
            onClick={() => setIsPlaying(p => !p)}
            disabled={events.length === 0 || (isComplete && !isPlaying)}
            style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'var(--accent)', border: 'none',
              color: 'white', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>

          <button
            onClick={() => setCurrentEventIndex(prev => Math.min(prev + 1, events.length))}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
          >
            <SkipForward size={16} />
          </button>

          {/* Speed selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Speed:</span>
            {[1, 2, 4].map(s => (
              <button
                key={s}
                onClick={() => setPlaybackSpeed(s)}
                style={{
                  padding: '3px 8px',
                  background: playbackSpeed === s ? 'var(--accent)' : 'var(--bg-tertiary)',
                  border: `1px solid ${playbackSpeed === s ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)',
                  color: playbackSpeed === s ? 'white' : 'var(--text-muted)',
                  fontSize: 11, cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Mute */}
          <button
            onClick={() => setIsMuted(m => !m)}
            style={{ background: 'none', border: 'none', color: isMuted ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: 'pointer', padding: 4 }}
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>

          {/* Event counter */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={12} color="var(--text-muted)" />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {currentEventIndex} / {events.length}
            </span>
          </div>

          {/* Completion badge */}
          {isComplete && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 10px',
              background: 'rgba(63,185,80,0.15)',
              border: '1px solid rgba(63,185,80,0.3)',
              borderRadius: 'var(--radius)',
            }}>
              <CheckCircle size={12} color="var(--green)" />
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--green)' }}>
                Replay Complete
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
