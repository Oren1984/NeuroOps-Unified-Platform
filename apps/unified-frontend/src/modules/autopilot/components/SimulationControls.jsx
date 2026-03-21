import React from 'react'
import { Play, Square, Zap, Cpu, Wifi, GitBranch, Activity } from 'lucide-react'

const INJECT_OPTIONS = [
  { id: 'memory_spike', label: 'Memory Spike', icon: Activity, color: 'var(--yellow)' },
  { id: 'cpu_overload', label: 'CPU Overload', icon: Cpu, color: 'var(--orange)' },
  { id: 'network_failure', label: 'Network Failure', icon: Wifi, color: 'var(--red)' },
  { id: 'cascade_failure', label: 'Cascade Failure', icon: GitBranch, color: 'var(--purple)' },
]

export default function SimulationControls({ simulationRunning, onStart, onStop, onInject, simStatus }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="card-title" style={{ marginBottom: 0 }}>Simulation Controls</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: simulationRunning ? 'var(--green)' : 'var(--status-offline)',
            boxShadow: simulationRunning ? '0 0 6px var(--green)' : 'none',
            animation: simulationRunning ? 'livePulse 1.5s ease-in-out infinite' : 'none',
          }} />
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            {simulationRunning ? 'Simulation Running' : 'Simulation Stopped'}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        {/* Start/Stop */}
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button
            onClick={onStart}
            disabled={simulationRunning}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px',
              background: simulationRunning ? 'var(--bg-tertiary)' : 'rgba(63,185,80,0.15)',
              border: `1px solid ${simulationRunning ? 'var(--border)' : 'rgba(63,185,80,0.4)'}`,
              borderRadius: 'var(--radius)',
              color: simulationRunning ? 'var(--text-muted)' : 'var(--green)',
              fontSize: 'var(--text-xs)', fontWeight: 600,
              cursor: simulationRunning ? 'not-allowed' : 'pointer',
              opacity: simulationRunning ? 0.5 : 1,
              transition: 'all 0.15s ease',
              fontFamily: 'var(--font-sans)',
            }}
          >
            <Play size={12} />
            Start
          </button>

          <button
            onClick={onStop}
            disabled={!simulationRunning}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px',
              background: !simulationRunning ? 'var(--bg-tertiary)' : 'rgba(248,81,73,0.15)',
              border: `1px solid ${!simulationRunning ? 'var(--border)' : 'rgba(248,81,73,0.4)'}`,
              borderRadius: 'var(--radius)',
              color: !simulationRunning ? 'var(--text-muted)' : 'var(--red)',
              fontSize: 'var(--text-xs)', fontWeight: 600,
              cursor: !simulationRunning ? 'not-allowed' : 'pointer',
              opacity: !simulationRunning ? 0.5 : 1,
              transition: 'all 0.15s ease',
              fontFamily: 'var(--font-sans)',
            }}
          >
            <Square size={12} />
            Stop
          </button>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 28, background: 'var(--border)' }} />

        {/* Inject buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 2 }}>
            Inject:
          </span>
          {INJECT_OPTIONS.map(opt => {
            const Icon = opt.icon
            return (
              <button
                key={opt.id}
                onClick={() => onInject(opt.id)}
                disabled={!simulationRunning}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 10px',
                  background: 'var(--bg-tertiary)',
                  border: `1px solid var(--border)`,
                  borderRadius: 'var(--radius)',
                  color: simulationRunning ? opt.color : 'var(--text-muted)',
                  fontSize: 'var(--text-xs)', fontWeight: 500,
                  cursor: simulationRunning ? 'pointer' : 'not-allowed',
                  opacity: simulationRunning ? 1 : 0.4,
                  transition: 'all 0.15s ease',
                  fontFamily: 'var(--font-sans)',
                }}
                onMouseEnter={e => {
                  if (simulationRunning) {
                    e.currentTarget.style.borderColor = opt.color
                    e.currentTarget.style.background = opt.color + '22'
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.background = 'var(--bg-tertiary)'
                }}
              >
                <Icon size={11} />
                {opt.label}
              </button>
            )
          })}
        </div>

        {/* Sim stats */}
        {simStatus && (
          <>
            <div style={{ width: 1, height: 28, background: 'var(--border)' }} />
            <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
              {[
                { label: 'Health', value: `${Math.round(simStatus.health_score ?? 0)}%` },
                { label: 'Uptime', value: simStatus.uptime ?? '—' },
                { label: 'Tick', value: `#${simStatus.tick ?? 0}` },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{s.label}</span>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                    {s.value}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}
