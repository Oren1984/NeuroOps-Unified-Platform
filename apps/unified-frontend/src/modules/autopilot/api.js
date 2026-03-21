const BASE = '/api/autopilot'

async function get(path) {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

export const api = {
  health: () => get('/health'),
  events: (limit = 50) => get(`/api/events?limit=${limit}`),
  services: () => get('/api/services'),
  decisions: (limit = 20) => get(`/api/decisions?limit=${limit}`),
  agentActions: (limit = 20) => get(`/api/agents/actions?limit=${limit}`),
  reportSummary: () => get('/api/reports/summary'),
  simulationStatus: () => get('/api/simulation/status'),
  startSimulation: () => fetch(`${BASE}/api/simulation/start`, { method: 'POST' }).then(r => r.json()),
  stopSimulation: () => fetch(`${BASE}/api/simulation/stop`, { method: 'POST' }).then(r => r.json()),
  injectAnomaly: (type) => fetch(`${BASE}/api/simulation/inject`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ anomaly_type: type }) }).then(r => r.json()),
  metricsJson: () => get('/metrics/json'),
}
