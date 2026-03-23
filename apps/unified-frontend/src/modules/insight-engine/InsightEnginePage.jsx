import React from 'react'
import EmbedFrame from '../../components/shared/EmbedFrame.jsx'

export default function InsightEnginePage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
        <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)' }}>Insight Engine</h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 4 }}>
          Business intelligence platform with AI-powered analytics, LLM Q&A, RAG retrieval, and n8n automation integration.
        </p>
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <EmbedFrame src="/embed/insight-engine/" title="Insight Engine" />
      </div>
    </div>
  )
}
