import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Bell, Wifi, WifiOff, LogOut, User } from 'lucide-react'
import useGatewayData from '../../modules/dashboard/useGatewayData.js'
import { useAuth } from '../../auth/AuthContext.jsx'

const ROUTE_LABELS = {
  '/dashboard':         'Dashboard',
  '/autopilot':         'AI Autopilot System',
  '/control-room':      'Control Room',
  '/live-control':      'Live Control',
  '/incident-replay':   'Incident Replay',
  '/career-agent':      'Career Agent',
  '/insight-engine':    'Insight Engine',
  '/warehouse-copilot': 'Warehouse Copilot',
}

function healthColor(score) {
  if (score >= 80) return 'var(--status-healthy)'
  if (score >= 60) return 'var(--status-warning)'
  if (score >= 40) return 'var(--status-degraded)'
  return 'var(--status-critical)'
}

export default function TopBar() {
  const location = useLocation()
  const { data, loading, error } = useGatewayData()
  const { user, logout } = useAuth()
  const [clock, setClock]   = useState('')
  const [showUser, setShowUser] = useState(false)

  useEffect(() => {
    const update = () => {
      const now = new Date()
      setClock(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  const moduleName  = ROUTE_LABELS[location.pathname] || 'NeuroOps'
  const connected   = !error && !loading && data !== null
  const healthScore = data?.health?.platform_health ?? data?.platform_health ?? null
  const alertCount  = data?.alerts?.critical ?? 0

  return (
    <div style={{
      height: 'var(--topbar-height)',
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 var(--space-6)',
      flexShrink: 0,
      position: 'relative',
    }}>
      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          NeuroOps
        </span>
        <span style={{ color: 'var(--border)', fontSize: 16 }}>›</span>
        <span style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)' }}>
          {moduleName}
        </span>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>

        {/* Platform health pill */}
        {healthScore !== null && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 10px',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
          }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: healthColor(healthScore), boxShadow: `0 0 6px ${healthColor(healthScore)}` }} />
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)' }}>Platform Health</span>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: healthColor(healthScore), fontFamily: 'var(--font-mono)' }}>
              {Math.round(healthScore)}%
            </span>
          </div>
        )}

        {/* Connection */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {connected
            ? <Wifi size={13} color="var(--status-healthy)" />
            : <WifiOff size={13} color="var(--status-offline)" />
          }
          <span style={{ fontSize: 'var(--text-xs)', color: connected ? 'var(--status-healthy)' : 'var(--status-offline)', fontWeight: 500 }}>
            {connected ? 'Live' : loading ? 'Connecting…' : 'Offline'}
          </span>
        </div>

        {/* Alerts bell */}
        <div style={{ position: 'relative' }}>
          <div style={{ width: 28, height: 28, borderRadius: 'var(--radius)', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Bell size={13} color={alertCount > 0 ? 'var(--yellow)' : 'var(--text-muted)'} />
          </div>
          {alertCount > 0 && (
            <span style={{ position: 'absolute', top: -4, right: -4, background: 'var(--red)', color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: 8, padding: '0 4px', minWidth: 14, textAlign: 'center' }}>
              {alertCount}
            </span>
          )}
        </div>

        {/* Clock */}
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
          {clock}
        </span>

        {/* User menu */}
        {user && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowUser(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '4px 10px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                color: 'var(--text-secondary)',
                fontSize: 'var(--text-xs)',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
              }}
            >
              <User size={11} />
              {user}
            </button>

            {showUser && (
              <div
                style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 6px)',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: 4,
                  minWidth: 140,
                  zIndex: 100,
                  boxShadow: 'var(--shadow)',
                }}
              >
                <div style={{ padding: '6px 10px', fontSize: 10, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                  Signed in as <strong style={{ color: 'var(--text-secondary)' }}>{user}</strong>
                </div>
                <button
                  onClick={() => { setShowUser(false); logout() }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    width: '100%', padding: '7px 10px',
                    background: 'none', border: 'none',
                    borderRadius: 4,
                    color: 'var(--text-secondary)', fontSize: 'var(--text-xs)',
                    fontFamily: 'var(--font-sans)',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--red)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-secondary)' }}
                >
                  <LogOut size={12} /> Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Click outside to close user menu */}
      {showUser && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 99 }}
          onClick={() => setShowUser(false)}
        />
      )}
    </div>
  )
}
