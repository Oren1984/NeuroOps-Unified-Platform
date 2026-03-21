import { useState, useEffect, useRef } from 'react'
import { api } from '../api.js'

const POLL_INTERVAL = 3000

export default function useDashboardData() {
  const [health, setHealth] = useState(null)
  const [events, setEvents] = useState([])
  const [services, setServices] = useState([])
  const [decisions, setDecisions] = useState([])
  const [agentActions, setAgentActions] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [connected, setConnected] = useState(false)
  const mounted = useRef(true)

  const fetchAll = async () => {
    const results = await Promise.allSettled([
      api.health(),
      api.events(50),
      api.services(),
      api.decisions(20),
      api.agentActions(20),
      api.reportSummary(),
    ])

    if (!mounted.current) return

    const [healthRes, eventsRes, servicesRes, decisionsRes, agentActionsRes, summaryRes] = results

    let anySuccess = false

    if (healthRes.status === 'fulfilled') {
      setHealth(healthRes.value)
      anySuccess = true
    }
    if (eventsRes.status === 'fulfilled') {
      setEvents(Array.isArray(eventsRes.value) ? eventsRes.value : eventsRes.value?.events || [])
      anySuccess = true
    }
    if (servicesRes.status === 'fulfilled') {
      setServices(Array.isArray(servicesRes.value) ? servicesRes.value : servicesRes.value?.services || [])
      anySuccess = true
    }
    if (decisionsRes.status === 'fulfilled') {
      setDecisions(Array.isArray(decisionsRes.value) ? decisionsRes.value : decisionsRes.value?.decisions || [])
      anySuccess = true
    }
    if (agentActionsRes.status === 'fulfilled') {
      setAgentActions(Array.isArray(agentActionsRes.value) ? agentActionsRes.value : agentActionsRes.value?.actions || [])
      anySuccess = true
    }
    if (summaryRes.status === 'fulfilled') {
      setSummary(summaryRes.value)
      anySuccess = true
    }

    setConnected(anySuccess)
    if (!anySuccess) {
      const firstError = results.find(r => r.status === 'rejected')
      setError(firstError ? firstError.reason?.message : 'Failed to connect to Autopilot service')
    } else {
      setError(null)
    }
    setLoading(false)
  }

  useEffect(() => {
    mounted.current = true
    fetchAll()
    const interval = setInterval(fetchAll, POLL_INTERVAL)
    return () => {
      mounted.current = false
      clearInterval(interval)
    }
  }, [])

  return { health, events, services, decisions, agentActions, summary, loading, error, connected }
}
