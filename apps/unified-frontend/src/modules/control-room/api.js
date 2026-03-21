const BASE = '/api/control-room'
const get = (path) => fetch(`${BASE}${path}`).then(r => { if (!r.ok) throw new Error(r.status); return r.json() })

export const api = {
  health: () => get('/api/health'),
  events: () => get('/api/events'),
  anomalies: () => get('/api/anomalies'),
  dependencyGraph: () => get('/api/dependency-graph'),
  services: () => get('/api/services'),
  investigation: () => get('/api/investigation'),
  whatChanged: () => get('/api/what-changed'),
  deployImpact: () => get('/api/deploy-impact'),
  incidentTimeline: () => get('/api/incident-timeline'),
  incidents: () => get('/api/incidents'),
}
