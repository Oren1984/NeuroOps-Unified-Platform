import React from 'react'
import { useLocation, Link } from 'react-router-dom'
import {
  LayoutDashboard, Bot, MonitorCheck, Activity,
  RefreshCcw, Briefcase, BarChart2, Package
} from 'lucide-react'

const MODULES = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    color: '#1f6feb',
    description: 'Platform overview',
  },
  {
    id: 'autopilot',
    label: 'Autopilot',
    path: '/autopilot',
    icon: Bot,
    color: '#3fb950',
    description: 'AI autonomous ops',
  },
  {
    id: 'control-room',
    label: 'Control Room',
    path: '/control-room',
    icon: MonitorCheck,
    color: '#d29922',
    description: 'Incident intelligence',
  },
  {
    id: 'live-control',
    label: 'Live Control',
    path: '/live-control',
    icon: Activity,
    color: '#39c5cf',
    description: 'Real-time monitoring',
  },
  {
    id: 'incident-replay',
    label: 'Incident Replay',
    path: '/incident-replay',
    icon: RefreshCcw,
    color: '#bc8cff',
    description: 'Post-incident analysis',
  },
  {
    id: 'career-agent',
    label: 'Career Agent',
    path: '/career-agent',
    icon: Briefcase,
    color: '#db6d28',
    description: 'AI job discovery',
  },
  {
    id: 'insight-engine',
    label: 'Insight Engine',
    path: '/insight-engine',
    icon: BarChart2,
    color: '#1f6feb',
    description: 'Business intelligence',
  },
  {
    id: 'warehouse-copilot',
    label: 'Warehouse Copilot',
    path: '/warehouse-copilot',
    icon: Package,
    color: '#3fb950',
    description: 'Warehouse ops AI',
  },
]

export default function Sidebar() {
  const location = useLocation()

  return (
    <div style={{
      width: 'var(--sidebar-width)',
      flexShrink: 0,
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
    }}>
      {/* Brand */}
      <div style={{
        padding: '16px 16px 12px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexShrink: 0,
      }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'linear-gradient(135deg, #1f6feb 0%, #388bfd 50%, #39c5cf 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 0 12px rgba(31,111,235,0.4)',
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="8" cy="8" r="2.5" fill="white"/>
          </svg>
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
            NeuroOps
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Unified Platform
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {MODULES.map((mod) => {
          const isActive = location.pathname === mod.path ||
            (mod.path !== '/dashboard' && location.pathname.startsWith(mod.path))
          const Icon = mod.icon

          return (
            <Link
              key={mod.id}
              to={mod.path}
              style={{ textDecoration: 'none', display: 'block' }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 14px 8px 16px',
                margin: '1px 6px',
                borderRadius: 'var(--radius)',
                background: isActive ? 'var(--bg-tertiary)' : 'transparent',
                borderLeft: isActive ? `2px solid ${mod.color}` : '2px solid transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'background 0.15s ease, color 0.15s ease',
                position: 'relative',
              }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'var(--bg-tertiary)'
                    e.currentTarget.style.color = 'var(--text-primary)'
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--text-secondary)'
                  }
                }}
              >
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: isActive ? mod.color + '22' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'background 0.15s ease',
                }}>
                  <Icon size={14} color={isActive ? mod.color : 'currentColor'} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 400,
                    letterSpacing: '0.01em',
                    lineHeight: '1.3',
                  }}>
                    {mod.label}
                  </div>
                  {isActive && (
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                      {mod.description}
                    </div>
                  )}
                </div>
                {isActive && (
                  <div style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: mod.color,
                    flexShrink: 0,
                  }} />
                )}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--border)',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
          v2.0.0
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
          © {new Date().getFullYear()}
        </span>
      </div>
    </div>
  )
}
