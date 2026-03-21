import React, { useEffect, useRef, useState } from 'react'

function getScoreColor(score) {
  if (score >= 80) return '#3fb950'
  if (score >= 60) return '#d29922'
  if (score >= 40) return '#db6d28'
  return '#f85149'
}

function getScoreTier(score) {
  if (score >= 95) return 'OPTIMAL'
  if (score >= 80) return 'HEALTHY'
  if (score >= 65) return 'NOMINAL'
  if (score >= 50) return 'DEGRADED'
  if (score >= 30) return 'CRITICAL'
  return 'FAILING'
}

export default function SystemHealth({ score = 0, previousScore }) {
  const [displayScore, setDisplayScore] = useState(score)
  const animRef = useRef(null)

  useEffect(() => {
    const start = displayScore
    const end = score
    const duration = 600
    const startTime = performance.now()

    const animate = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayScore(Math.round(start + (end - start) * eased))
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate)
      }
    }

    animRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animRef.current)
  }, [score])

  const color = getScoreColor(displayScore)
  const tier = getScoreTier(displayScore)

  // SVG semicircle gauge
  const cx = 120
  const cy = 120
  const r = 90
  const strokeWidth = 12
  const startAngle = -180
  const endAngle = 0
  const totalDegrees = 180

  // Background arc (full semicircle)
  const bgStart = toXY(cx, cy, r, startAngle)
  const bgEnd = toXY(cx, cy, r, endAngle)

  // Value arc
  const valueDegrees = (displayScore / 100) * totalDegrees
  const valueEnd = toXY(cx, cy, r, startAngle + valueDegrees)

  function toXY(cx, cy, r, angleDeg) {
    const rad = (angleDeg * Math.PI) / 180
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    }
  }

  function arcPath(cx, cy, r, startAngle, endAngle) {
    const start = toXY(cx, cy, r, startAngle)
    const end = toXY(cx, cy, r, endAngle)
    const largeArc = endAngle - startAngle > 180 ? 1 : 0
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`
  }

  const trend = previousScore !== undefined ? score - previousScore : 0

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
      <div className="card-title" style={{ alignSelf: 'flex-start' }}>System Health</div>

      <svg width="240" height="140" style={{ overflow: 'visible' }}>
        {/* Background arc */}
        <path
          d={arcPath(cx, cy, r, -180, 0)}
          fill="none"
          stroke="var(--bg-tertiary)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Colored value arc */}
        {displayScore > 0 && (
          <path
            d={arcPath(cx, cy, r, -180, -180 + (displayScore / 100) * 180)}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${color}88)` }}
          />
        )}

        {/* Score label */}
        <text x={cx} y={cy - 8} textAnchor="middle" fill={color} fontSize="36" fontWeight="700" fontFamily="'JetBrains Mono', monospace">
          {displayScore}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="var(--text-muted)" fontSize="11">
          / 100
        </text>

        {/* Tier label */}
        <text x={cx} y={cy + 36} textAnchor="middle" fill={color} fontSize="11" fontWeight="700" letterSpacing="0.08em">
          {tier}
        </text>

        {/* Scale markers */}
        {[0, 25, 50, 75, 100].map(val => {
          const angle = -180 + (val / 100) * 180
          const inner = toXY(cx, cy, r - 16, angle)
          const outer = toXY(cx, cy, r - 6, angle)
          return (
            <line key={val} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
              stroke="var(--border)" strokeWidth={1} />
          )
        })}
      </svg>

      {trend !== 0 && previousScore !== undefined && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 'var(--text-xs)',
          color: trend > 0 ? 'var(--green)' : 'var(--red)',
        }}>
          <span>{trend > 0 ? '▲' : '▼'}</span>
          <span>{Math.abs(trend).toFixed(1)} pts since last cycle</span>
        </div>
      )}
    </div>
  )
}
