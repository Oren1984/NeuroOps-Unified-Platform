/**
 * EventsPage.jsx — Phase 4D: Live Platform Events Dashboard
 *
 * Real-time operations console showing the unified platform event stream.
 * Polls /api/gateway/platform/events every 5 seconds.
 * Supports filtering by severity and service.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Zap, RefreshCw, Filter, Circle,
  AlertTriangle, AlertCircle, Info, CheckCircle2,
  ChevronDown, X,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const POLL_INTERVAL_MS = 5000
const API_URL = '/api/gateway/platform/events'

const SEVERITIES = [
  { key: 'all',      label: 'All',      color: '#8b949e' },
  { key: 'info',     label: 'Info',     color: '#39c5cf' },
  { key: 'warning',  label: 'Warning',  color: '#d29922' },
  { key: 'critical', label: 'Critical', color: '#f85149' },
  { key: 'error',    label: 'Error',    color: '#f85149' },
]

const SEVERITY_META = {
  info:     { color: '#39c5cf', icon: Info,          bg: 'rgba(57,197,207,0.08)'  },
  warning:  { color: '#d29922', icon: AlertTriangle,  bg: 'rgba(210,153,34,0.08)'  },
  critical: { color: '#f85149', icon: AlertCircle,    bg: 'rgba(248,81,73,0.10)'   },
  error:    { color: '#f85149', icon: AlertCircle,    bg: 'rgba(248,81,73,0.10)'   },
  unknown:  { color: '#6e7681', icon: Circle,         bg: 'rgba(110,118,129,0.08)' },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSeverityMeta(severity) {
  return SEVERITY_META[severity] || SEVERITY_META.unknown
}

function formatTimestamp(ts) {
  if (!ts) return '—'
  try {
    const d = new Date(ts)
    const now = new Date()
    const diffSec = Math.floor((now - d) / 1000)
    if (diffSec < 5)   return 'just now'
    if (diffSec < 60)  return `${diffSec}s ago`
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch {
    return ts.slice(0, 19).replace('T', ' ')
  }
}

function formatEventType(type) {
  return type?.replace(/_/g, ' ') ?? 'unknown'
}

function serviceLabel(svc) {
  return svc?.replace(/_/g, ' ') ?? 'unknown'
}

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

function SeverityBadge({ severity }) {
  const meta = getSeverityMeta(severity)
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 3,
      fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
      color: meta.color, background: meta.bg,
      border: `1px solid ${meta.color}33`,
    }}>
      {severity || 'unknown'}
    </span>
  )
}

function PulseDot({ color }) {
  return (
    <span style={{ position: 'relative', display: 'inline-block', width: 8, height: 8 }}>
      <span style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: color, opacity: 0.3,
        animation: 'pulse-ring 1.5s ease-out infinite',
      }} />
      <span style={{
        position: 'absolute', inset: 1, borderRadius: '50%',
        background: color,
      }} />
    </span>
  )
}

function EventRow({ event, isNew }) {
  const meta = getSeverityMeta(event.severity)
  const SeverityIcon = meta.icon
  const ts = event.occurred_at || event.timestamp || event.time || event.created_at

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '24px 90px 130px 130px 1fr auto',
      gap: 12,
      alignItems: 'center',
      padding: '10px 16px',
      borderBottom: '1px solid var(--border-subtle)',
      background: isNew ? `${meta.bg}` : 'transparent',
      transition: 'background 1.5s ease',
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
    }}>
      {/* Severity icon */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <SeverityIcon size={14} color={meta.color} />
      </div>

      {/* Severity badge */}
      <div>
        <SeverityBadge severity={event.severity} />
      </div>

      {/* Source service */}
      <div style={{
        color: 'var(--text-secondary)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        fontSize: 11,
      }}>
        {serviceLabel(event.source_service)}
      </div>

      {/* Event type */}
      <div style={{
        color: meta.color,
        fontWeight: 600,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        fontSize: 11,
      }}>
        {formatEventType(event.event_type)}
      </div>

      {/* Message / payload preview */}
      <div style={{
        color: 'var(--text-primary)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        fontSize: 11,
      }}>
        {event.payload?.message
          || event.message
          || event.title
          || JSON.stringify(event.payload || {}).slice(0, 80)}
      </div>

      {/* Timestamp */}
      <div style={{
        color: 'var(--text-muted)', fontSize: 10,
        whiteSpace: 'nowrap', textAlign: 'right',
      }}>
        {formatTimestamp(ts)}
      </div>
    </div>
  )
}

function FilterChip({ label, active, color, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '5px 12px', borderRadius: 4,
        fontSize: 11, fontWeight: 600, cursor: 'pointer',
        border: active ? `1px solid ${color}` : '1px solid var(--border)',
        background: active ? `${color}18` : 'transparent',
        color: active ? color : 'var(--text-secondary)',
        transition: 'all 0.15s ease',
      }}
    >
      {label}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function EventsPage() {
  const [data, setData]             = useState(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [severityFilter, setSeverity] = useState('all')
  const [serviceFilter, setService]  = useState('all')
  const [lastPollTime, setLastPoll]  = useState(null)
  const [newEventIds, setNewEventIds] = useState(new Set())
  const prevEventIds                 = useRef(new Set())
  const pollTimer                    = useRef(null)

  const fetchEvents = useCallback(async () => {
    try {
      const token = localStorage.getItem('neuroops_access_token')
      const res = await fetch(API_URL, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setData(json)
      setError(null)
      setLastPoll(new Date())

      // Track newly arrived events for flash animation
      const incoming = new Set(
        (json.events || []).map(e => e.id || `${e.source_service}-${e.occurred_at || e.timestamp}`)
      )
      const freshIds = new Set([...incoming].filter(id => !prevEventIds.current.has(id)))
      if (freshIds.size > 0) {
        setNewEventIds(freshIds)
        setTimeout(() => setNewEventIds(new Set()), 3000)
      }
      prevEventIds.current = incoming
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEvents()
    pollTimer.current = setInterval(fetchEvents, POLL_INTERVAL_MS)
    return () => clearInterval(pollTimer.current)
  }, [fetchEvents])

  // Derive unique services for filter dropdown
  const allServices = data
    ? ['all', ...new Set((data.events || []).map(e => e.source_service).filter(Boolean))]
    : ['all']

  // Filter events
  const filteredEvents = (data?.events || []).filter(e => {
    const matchSeverity = severityFilter === 'all' || e.severity === severityFilter
    const matchService  = serviceFilter === 'all' || e.source_service === serviceFilter
    return matchSeverity && matchService
  })

  // Stats
  const stats = {
    total:    data?.total_events ?? 0,
    db:       data?.db_events ?? 0,
    live:     data?.live_events ?? 0,
    critical: filteredEvents.filter(e => e.severity === 'critical' || e.severity === 'error').length,
    warning:  filteredEvents.filter(e => e.severity === 'warning').length,
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', overflow: 'hidden' }}>
      {/* Pulse animation keyframe */}
      <style>{`
        @keyframes pulse-ring {
          0%   { transform: scale(1);   opacity: 0.4; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes fade-in-row {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px 10px 20px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
        background: 'var(--bg-secondary)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'rgba(57,197,207,0.15)',
            border: '1px solid rgba(57,197,207,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={16} color="#39c5cf" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              Platform Events
            </h1>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>
              Real-time operations event stream — polls every 5s
            </p>
          </div>
          {/* Live indicator */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '3px 10px', borderRadius: 20,
            background: 'rgba(63,185,80,0.10)',
            border: '1px solid rgba(63,185,80,0.25)',
          }}>
            <PulseDot color="#3fb950" />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#3fb950', letterSpacing: '0.06em' }}>
              LIVE
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {[
            { label: 'Total', value: stats.total, color: 'var(--text-secondary)' },
            { label: 'DB',    value: stats.db,    color: '#39c5cf' },
            { label: 'Live',  value: stats.live,  color: '#3fb950' },
            { label: 'Critical', value: stats.critical, color: '#f85149' },
            { label: 'Warning',  value: stats.warning,  color: '#d29922' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: s.color, lineHeight: 1.1, fontFamily: 'var(--font-mono)' }}>
                {s.value}
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {s.label}
              </div>
            </div>
          ))}
          {/* Refresh button */}
          <button
            onClick={fetchEvents}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 6,
              background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
              color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12,
            }}
          >
            <RefreshCw size={12} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        flexShrink: 0,
        background: 'var(--bg-secondary)',
      }}>
        <Filter size={12} color="var(--text-muted)" />
        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginRight: 4 }}>Severity:</span>
        {SEVERITIES.map(s => (
          <FilterChip
            key={s.key}
            label={s.label}
            active={severityFilter === s.key}
            color={s.color}
            onClick={() => setSeverity(s.key)}
          />
        ))}

        <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />

        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginRight: 4 }}>Service:</span>
        <select
          value={serviceFilter}
          onChange={e => setService(e.target.value)}
          style={{
            background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
            borderRadius: 4, color: 'var(--text-primary)', fontSize: 11,
            padding: '4px 8px', cursor: 'pointer',
          }}
        >
          {allServices.map(s => (
            <option key={s} value={s}>{s === 'all' ? 'All Services' : serviceLabel(s)}</option>
          ))}
        </select>

        {(severityFilter !== 'all' || serviceFilter !== 'all') && (
          <button
            onClick={() => { setSeverity('all'); setService('all') }}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 8px', borderRadius: 4,
              background: 'transparent', border: '1px solid var(--border)',
              color: 'var(--text-muted)', cursor: 'pointer', fontSize: 11,
            }}
          >
            <X size={10} /> Clear
          </button>
        )}

        <div style={{ flex: 1 }} />
        {lastPollTime && (
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            Updated {formatTimestamp(lastPollTime)}
          </span>
        )}
      </div>

      {/* Column headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '24px 90px 130px 130px 1fr auto',
        gap: 12, padding: '6px 16px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
        background: 'var(--bg-secondary)',
      }}>
        {['', 'Severity', 'Service', 'Event Type', 'Message', 'Time'].map((h, i) => (
          <div key={i} style={{
            fontSize: 10, fontWeight: 700, color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            {h}
          </div>
        ))}
      </div>

      {/* Event feed */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 13 }}>
            Loading event stream...
          </div>
        )}
        {error && !loading && (
          <div style={{
            margin: 20, padding: 16, borderRadius: 8,
            background: 'rgba(248,81,73,0.08)', border: '1px solid rgba(248,81,73,0.25)',
            color: '#f85149', fontSize: 13,
          }}>
            <AlertCircle size={14} style={{ marginRight: 8 }} />
            Failed to reach gateway: {error}
          </div>
        )}
        {!loading && !error && filteredEvents.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)', fontSize: 13 }}>
            <CheckCircle2 size={32} style={{ marginBottom: 12, color: 'var(--green)', opacity: 0.5 }} />
            <div>No events match the current filter.</div>
            <div style={{ fontSize: 11, marginTop: 4 }}>
              {severityFilter !== 'all' || serviceFilter !== 'all' ? 'Try clearing filters.' : 'Platform is quiet — all systems nominal.'}
            </div>
          </div>
        )}
        {!loading && filteredEvents.map((event) => {
          const id = event.id || `${event.source_service}-${event.occurred_at || event.timestamp}`
          const isNew = newEventIds.has(String(id))
          return <EventRow key={id} event={event} isNew={isNew} />
        })}
      </div>

      {/* Footer bar */}
      {data?.errors && Object.keys(data.errors).length > 0 && (
        <div style={{
          padding: '6px 16px', flexShrink: 0,
          background: 'rgba(210,153,34,0.06)',
          borderTop: '1px solid rgba(210,153,34,0.2)',
          fontSize: 10, color: '#d29922',
        }}>
          <AlertTriangle size={10} style={{ marginRight: 6 }} />
          Some live sources unreachable: {Object.keys(data.errors).join(', ')}
        </div>
      )}
    </div>
  )
}
