import React from 'react'
import EmbedFrame from '../../components/shared/EmbedFrame.jsx'

export default function WarehouseCopilotPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
        <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)' }}>Warehouse Copilot</h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 4 }}>
          Intelligent warehouse operations dashboard — inventory risk detection, anomaly analysis, category activity tracking, and natural-language AI assistant.
        </p>
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <EmbedFrame src="/embed/warehouse-copilot" title="Warehouse Copilot" />
      </div>
    </div>
  )
}
