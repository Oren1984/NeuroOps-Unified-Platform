import React from 'react'

const MODULES = [
  { label: 'Control Room',       description: 'AI-powered incident intelligence with real-time service dependency mapping and automated root-cause analysis.' },
  { label: 'Live Control',       description: 'Real-time operations dashboard with live metrics, service health tracking, and instant alerting.' },
  { label: 'Incident Replay',    description: 'Step through historical incidents frame-by-frame with full timeline playback and post-mortem tooling.' },
  { label: 'Career Agent',       description: 'AI-powered job discovery engine with semantic matching, LLM scoring, and smart deduplication across sources.' },
  { label: 'Insight Engine',     description: 'Business intelligence platform with AI analytics, LLM Q&A, RAG retrieval, and n8n automation integration.' },
  { label: 'Warehouse Copilot',  description: 'Intelligent warehouse operations dashboard with inventory risk detection, anomaly analysis, and a natural-language AI assistant.' },
]

export default function AboutPage() {
  return (
    <div className="module-page">
      <div className="module-header">
        <div>
          <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)' }}>Platform Overview</h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 4 }}>About NeuroOps Unified Platform</p>
        </div>
      </div>

      {/* What is NeuroOps */}
      <div className="card">
        <div className="card-title">What is NeuroOps</div>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 720 }}>
          NeuroOps is a unified AI operations platform that brings together seven independent systems into a single deployable environment.
          It is designed for engineering teams who need real-time visibility, automated decision-making, and AI-assisted workflows — all from one place.
        </p>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 720, marginTop: 12 }}>
          Each module was originally a standalone project. The unified platform integrates them behind a shared gateway, a single PostgreSQL database,
          and one frontend shell — so they share authentication, events, health monitoring, and platform intelligence without duplicating infrastructure.
        </p>
      </div>

      {/* Modules */}
      <div className="card">
        <div className="card-title">Modules</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {MODULES.map((mod) => (
            <div key={mod.label} style={{
              padding: '12px 14px',
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                {mod.label}
              </div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {mod.description}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Platform idea */}
      <div className="card">
        <div className="card-title">Unified Platform Idea</div>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 720 }}>
          Rather than running each system as an isolated service, NeuroOps treats them as modules of a single platform.
          A central gateway API aggregates health, events, and intelligence across all modules.
          Nginx routes all traffic through one public endpoint. PostgreSQL schemas isolate each module's data while sharing a single database instance.
        </p>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 720, marginTop: 12 }}>
          The result is a platform where the whole is greater than the sum of its parts — cross-module correlation, shared alerting,
          and a unified operator experience without the overhead of managing seven separate deployments.
        </p>
      </div>

      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', paddingBottom: 8 }}>
        NeuroOps Unified Platform · v4.0.0
      </div>
    </div>
  )
}
