import React from 'react'
import useDashboardData from './hooks/useDashboardData.js'
import SystemHealth from './components/SystemHealth.jsx'
import SummaryCard from './components/SummaryCard.jsx'
import ServiceStatusGrid from './components/ServiceStatusGrid.jsx'
import EventStream from './components/EventStream.jsx'
import AIDecisionsPanel from './components/AIDecisionsPanel.jsx'
import AgentActions from './components/AgentActions.jsx'
import SimulationControls from './components/SimulationControls.jsx'
import { api } from './api.js'

export default function AutopilotPage() {
  const { health, events, services, decisions, agentActions, summary, loading, error, connected } = useDashboardData()

  const handleStart = () => api.startSimulation()
  const handleStop = () => api.stopSimulation()
  const handleInject = (type) => api.injectAnomaly(type)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
      <span>Loading Autopilot System...</span>
    </div>
  )

  return (
    <div className="module-page">
      <div className="module-header">
        <div>
          <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)' }}>AI Autopilot System</h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 4 }}>Autonomous operations monitoring & decision engine</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: connected ? 'var(--green)' : 'var(--red)' }} />
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{connected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', background: 'var(--red)22', border: '1px solid var(--red)44', borderRadius: 'var(--radius)', color: 'var(--red)', fontSize: 'var(--text-sm)' }}>
          ⚠ {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 'var(--space-4)' }}>
        <SystemHealth score={health?.health_score ?? 0} />
        <SummaryCard events={events} decisions={decisions} agentActions={agentActions} summary={summary} health={health} />
      </div>

      <SimulationControls
        simulationRunning={health?.simulation_running}
        onStart={handleStart}
        onStop={handleStop}
        onInject={handleInject}
        simStatus={health}
      />

      <ServiceStatusGrid services={services ?? []} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        <EventStream events={events ?? []} />
        <AIDecisionsPanel decisions={decisions ?? []} />
      </div>

      <AgentActions agentActions={agentActions ?? []} />
    </div>
  )
}
