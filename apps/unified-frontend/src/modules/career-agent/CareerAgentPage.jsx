import React from 'react'
import EmbedFrame from '../../components/shared/EmbedFrame.jsx'

export default function CareerAgentPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
        <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)' }}>Career Agent</h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 4 }}>
          AI-powered job discovery, semantic matching, and career intelligence — powered by multi-source collection, LLM scoring, and smart deduplication.
        </p>
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <EmbedFrame src="/embed/career-agent" title="Career Agent" />
      </div>
    </div>
  )
}
