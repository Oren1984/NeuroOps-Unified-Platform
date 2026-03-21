import React, { useState, useRef } from 'react'
import { ExternalLink, Loader } from 'lucide-react'

export default function EmbedFrame({ src, title, minHeight = '700px' }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const iframeRef = useRef(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        padding: 'var(--space-3) var(--space-4)',
        background: 'var(--bg-tertiary)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: loading ? 'var(--yellow)' : 'var(--green)' }} />
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</span>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>— Embedded Service</span>
        </div>
        <a href={src} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <ExternalLink size={13} />
          <span style={{ fontSize: 'var(--text-xs)' }}>Open standalone</span>
        </a>
      </div>

      {loading && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 48, color: 'var(--text-secondary)' }}>
          <Loader size={28} style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: 'var(--text-sm)' }}>Loading {title}...</span>
        </div>
      )}

      {error && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 48, color: 'var(--text-secondary)' }}>
          <span style={{ fontSize: 32 }}>⚠</span>
          <span style={{ fontSize: 'var(--text-base)', color: 'var(--red)' }}>Service Unavailable</span>
          <span style={{ fontSize: 'var(--text-sm)', textAlign: 'center', maxWidth: 400 }}>
            The {title} service could not be reached. Ensure Docker services are running and the service is healthy.
          </span>
          <button onClick={() => { setError(false); setLoading(true); if (iframeRef.current) iframeRef.current.src = src }}
            style={{ padding: '8px 16px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>
            Retry
          </button>
        </div>
      )}

      <iframe
        ref={iframeRef}
        src={error ? undefined : src}
        title={title}
        onLoad={() => setLoading(false)}
        onError={() => { setLoading(false); setError(true) }}
        style={{
          flex: 1, width: '100%', border: 'none',
          minHeight, display: (loading || error) ? 'none' : 'block',
          background: 'var(--bg-primary)',
        }}
        allow="fullscreen"
      />

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
