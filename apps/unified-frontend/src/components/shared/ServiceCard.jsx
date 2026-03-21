import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import StatusBadge from './StatusBadge.jsx'

export default function ServiceCard({ name, status, description, path, metrics, color }) {
  const navigate = useNavigate()
  const [hovered, setHovered] = React.useState(false)

  return (
    <div
      className="card"
      onClick={() => path && navigate(path)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: path ? 'pointer' : 'default',
        borderColor: hovered && path ? (color || 'var(--accent)') : 'var(--border)',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        boxShadow: hovered && path ? `0 0 0 1px ${color || 'var(--accent)'}33` : 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        position: 'relative',
      }}
    >
      {/* Color accent top bar */}
      {color && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: 2,
          background: color,
          borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
          opacity: hovered ? 1 : 0.5,
          transition: 'opacity 0.15s ease',
        }} />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: color ? 4 : 0 }}>
        <span style={{
          fontSize: 'var(--text-base)',
          fontWeight: 600,
          color: 'var(--text-primary)',
        }}>
          {name}
        </span>
        <StatusBadge status={status || 'unknown'} size="xs" />
      </div>

      {/* Description */}
      {description && (
        <p style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-muted)',
          lineHeight: 1.5,
        }}>
          {description}
        </p>
      )}

      {/* Metrics */}
      {metrics && Object.keys(metrics).length > 0 && (
        <div style={{
          display: 'flex',
          gap: 'var(--space-3)',
          flexWrap: 'wrap',
        }}>
          {Object.entries(metrics).slice(0, 3).map(([key, val]) => (
            <div key={key} style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              minWidth: 0,
            }}>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {key}
              </span>
              <span style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
              }}>
                {val}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Footer link */}
      {path && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 'var(--text-xs)',
          color: hovered ? (color || 'var(--accent)') : 'var(--text-muted)',
          transition: 'color 0.15s ease',
          marginTop: 'auto',
        }}>
          <span>Open Module</span>
          <ArrowRight size={11} />
        </div>
      )}
    </div>
  )
}
