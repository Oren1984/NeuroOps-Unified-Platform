/**
 * useGatewayData — fetches the /platform/intelligence endpoint
 * which combines health, alerts, anomalies, correlations, and module
 * activity into one payload to minimise round-trips.
 *
 * Falls back to /platform/status if the intelligence endpoint is
 * unavailable (gateway v1 compatibility).
 */
import { useState, useEffect, useRef } from 'react'

const POLL_INTERVAL = 10_000  // 10 s

async function fetchIntelligence() {
  const res = await fetch('/api/gateway/platform/intelligence')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

async function fetchStatusFallback() {
  const res = await fetch('/api/gateway/platform/status')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export function useGatewayData() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const mounted = useRef(true)

  const fetchData = async () => {
    try {
      let json
      try {
        json = await fetchIntelligence()
      } catch {
        json = await fetchStatusFallback()
      }
      if (mounted.current) { setData(json); setError(null) }
    } catch (err) {
      if (mounted.current) setError(err.message)
    } finally {
      if (mounted.current) setLoading(false)
    }
  }

  useEffect(() => {
    mounted.current = true
    fetchData()
    const interval = setInterval(fetchData, POLL_INTERVAL)
    return () => { mounted.current = false; clearInterval(interval) }
  }, [])

  return { data, loading, error }
}

export default useGatewayData
