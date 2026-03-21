const BASE = '/api/live-control'
const get = (path) => fetch(`${BASE}${path}`).then(r => { if(!r.ok) throw new Error(r.status); return r.json() })

export const api = {
  health: () => get('/health'),
  metricsLive: () => get('/metrics/live'),
  eventsLive: () => get('/events/live'),
  alertsLive: () => get('/alerts/live'),
  narrative: () => get('/narrative'),
  servicesStatus: () => get('/services/status'),
}
