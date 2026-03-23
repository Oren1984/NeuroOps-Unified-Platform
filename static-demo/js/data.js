// NeuroOps Static Demo — Mock Data
// All data is static/pre-generated for demo purposes. No backend required.

const MOCK = {
  platform: {
    health: 92,
    status: 'healthy',
    uptime: '14d 6h 42m',
    totalServices: 7,
    healthyServices: 6,
    offlineServices: 0,
    degradedServices: 1,
    avgResponseMs: 124,
    version: '4.0.0',
  },

  modules: [
    { id: 'control-room',      label: 'Control Room',      color: '#d29922', status: 'healthy',  health: 94, responseMs: 118, trend: 'stable',    description: 'AI-powered incident intelligence with dependency mapping.' },
    { id: 'live-control',      label: 'Live Control',      color: '#39c5cf', status: 'healthy',  health: 98, responseMs:  89, trend: 'improving', description: 'Real-time operations dashboard with live metrics.' },
    { id: 'incident-replay',   label: 'Incident Replay',   color: '#bc8cff', status: 'healthy',  health: 88, responseMs: 201, trend: 'stable',    description: 'Step through historical incidents with timeline playback.' },
    { id: 'career-agent',      label: 'Career Agent',      color: '#db6d28', status: 'degraded', health: 71, responseMs: 456, trend: 'declining', description: 'AI-powered job discovery with semantic matching.' },
    { id: 'insight-engine',    label: 'Insight Engine',    color: '#1f6feb', status: 'healthy',  health: 95, responseMs: 142, trend: 'improving', description: 'Business intelligence with AI analytics and LLM Q&A.' },
    { id: 'warehouse-copilot', label: 'Warehouse Copilot', color: '#3fb950', status: 'healthy',  health: 91, responseMs: 167, trend: 'stable',    description: 'Intelligent warehouse operations with inventory risk detection.' },
  ],

  alerts: [
    { id: 'a1', level: 'warning',  title: 'Career Agent Response Time Elevated',      message: 'P95 latency above 400ms threshold for 12 minutes',          service: 'Career Agent',      time: '8m ago' },
    { id: 'a2', level: 'warning',  title: 'Warehouse DB Connection Pool Near Limit',  message: 'Connection utilization at 78% of max pool size',            service: 'Warehouse Copilot', time: '23m ago' },
    { id: 'a3', level: 'info',     title: 'Insight Engine Model Refresh Complete',    message: 'Scheduled ML model retraining completed successfully',      service: 'Insight Engine',    time: '1h ago' },
  ],

  events: [
    { id: 'e1', type: 'service_health_check',   service: 'live_control',       severity: 'info',    message: 'Health check passed — all metrics nominal',                    time: '12s ago' },
    { id: 'e2', type: 'alert_triggered',        service: 'career_agent',       severity: 'warning', message: 'Response time threshold exceeded (P95 > 400ms)',              time: '8m ago' },
    { id: 'e3', type: 'model_inference',        service: 'insight_engine',     severity: 'info',    message: 'AI insight generation completed — 3 new insights surfaced',   time: '14m ago' },
    { id: 'e4', type: 'incident_created',       service: 'control_room',       severity: 'warning', message: 'New incident INC-2847 opened: DB latency spike detected',     time: '22m ago' },
    { id: 'e5', type: 'inventory_risk_alert',   service: 'warehouse_copilot',  severity: 'warning', message: 'SKU-40921 stock critically low — auto-reorder triggered',     time: '31m ago' },
    { id: 'e6', type: 'deployment_complete',    service: 'platform',           severity: 'info',    message: 'Platform v4.0.0 deployment verified healthy across all nodes', time: '2h ago' },
    { id: 'e7', type: 'scaling_event',          service: 'live_control',       severity: 'info',    message: 'Auto-scaled Live Control to 3 replicas (load: 82%)',           time: '3h ago' },
    { id: 'e8', type: 'job_match_found',        service: 'career_agent',       severity: 'info',    message: 'High-confidence job match found: Sr. Platform Engineer (94%)', time: '4h ago' },
  ],

  // ── Control Room ──────────────────────────────────────────
  controlRoom: {
    incidents: [
      { id: 'INC-2847', title: 'Database Latency Spike',             severity: 'warning',  status: 'investigating', service: 'Warehouse Copilot', duration: '22m',       assignee: 'ops-team',      description: 'P99 query latency increased to 1.8s — above 500ms SLO threshold. Postgres connection pool saturation suspected.' },
      { id: 'INC-2831', title: 'Career Agent External API Timeout',  severity: 'warning',  status: 'monitoring',    service: 'Career Agent',      duration: '1h 14m',    assignee: 'backend-team',  description: 'LinkedIn API integration timing out intermittently — 15% error rate on /jobs/search endpoint.' },
      { id: 'INC-2819', title: 'Control Room WebSocket Reconnects',  severity: 'info',     status: 'resolved',      service: 'Control Room',      duration: '4h 02m',    assignee: 'platform-team', description: 'Clients experiencing elevated WebSocket reconnect rate — resolved via nginx upstream keepalive config update.' },
    ],
    dependencies: [
      { from: 'Gateway API',  to: 'Control Room',      latency: '118ms', status: 'healthy'  },
      { from: 'Gateway API',  to: 'Live Control',      latency:  '89ms', status: 'healthy'  },
      { from: 'Gateway API',  to: 'Career Agent',      latency: '456ms', status: 'degraded' },
      { from: 'Gateway API',  to: 'Insight Engine',    latency: '142ms', status: 'healthy'  },
      { from: 'Gateway API',  to: 'Warehouse Copilot', latency: '167ms', status: 'healthy'  },
      { from: 'Gateway API',  to: 'Incident Replay',   latency: '201ms', status: 'healthy'  },
    ],
  },

  // ── Live Control ──────────────────────────────────────────
  liveControl: {
    services: [
      { name: 'Gateway API',       status: 'healthy',  cpu: 12, memory: 38, rps: 842,  latency:  45 },
      { name: 'Control Room',      status: 'healthy',  cpu: 18, memory: 52, rps: 234,  latency: 118 },
      { name: 'Live Control',      status: 'healthy',  cpu:  9, memory: 29, rps: 1204, latency:  89 },
      { name: 'Incident Replay',   status: 'healthy',  cpu:  7, memory: 41, rps:  67,  latency: 201 },
      { name: 'Career Agent',      status: 'degraded', cpu: 74, memory: 81, rps: 188,  latency: 456 },
      { name: 'Insight Engine',    status: 'healthy',  cpu: 31, memory: 67, rps: 312,  latency: 142 },
      { name: 'Warehouse Copilot', status: 'healthy',  cpu: 22, memory: 55, rps: 445,  latency: 167 },
    ],
    totals: { rps: 3292, avgLatency: 174, errorRate: 0.8, activeConnections: 1847 },
  },

  // ── Incident Replay ───────────────────────────────────────
  incidentReplay: {
    incidents: [
      { id: 'INC-2847', title: 'Database Latency Spike',             start: '2026-03-23 09:36', end: '—',               duration: '22m+',   severity: 'warning',  status: 'active'   },
      { id: 'INC-2831', title: 'Career Agent External API Timeout',  start: '2026-03-23 08:14', end: '—',               duration: '1h 14m+',severity: 'warning',  status: 'active'   },
      { id: 'INC-2819', title: 'Control Room WebSocket Reconnects',  start: '2026-03-22 18:30', end: '2026-03-22 22:32',duration: '4h 02m', severity: 'info',     status: 'resolved' },
      { id: 'INC-2801', title: 'Insight Engine DB Query Timeout',    start: '2026-03-21 14:10', end: '2026-03-21 14:47',duration: '37m',    severity: 'critical', status: 'resolved' },
      { id: 'INC-2788', title: 'Gateway API Memory Spike',           start: '2026-03-19 03:22', end: '2026-03-19 03:51',duration: '29m',    severity: 'warning',  status: 'resolved' },
    ],
    timelines: {
      'INC-2847': [
        { time: 'T+0:00',  event: 'Postgres P99 latency crossed 500ms SLO threshold',       severity: 'warning'  },
        { time: 'T+1:30',  event: 'Automated alert: warehouse_copilot DB latency elevated', severity: 'warning'  },
        { time: 'T+4:00',  event: 'INC-2847 created — assigned to ops-team',               severity: 'info'     },
        { time: 'T+8:15',  event: 'Investigation started: connection pool at 78%',          severity: 'warning'  },
        { time: 'T+14:00', event: 'Identified long-running migration query (SKU bulk load)',severity: 'critical' },
        { time: 'T+18:45', event: 'Migration query terminated — latency improving',         severity: 'info'     },
        { time: 'T+22:00', event: 'Currently monitoring for full recovery',                 severity: 'info'     },
      ],
      'INC-2831': [
        { time: 'T+0:00',  event: 'LinkedIn API /jobs/search timeout (15% error rate)',      severity: 'warning'  },
        { time: 'T+2:30',  event: 'Auto-scaling triggered: +2 Career Agent replicas',        severity: 'info'     },
        { time: 'T+4:15',  event: 'LinkedIn API circuit breaker opened (error rate 18%)',    severity: 'critical' },
        { time: 'T+8:00',  event: 'Incident escalated to backend-team',                      severity: 'warning'  },
        { time: 'T+12:45', event: 'Fallback mode activated: cached results served to users', severity: 'info'     },
        { time: 'T+34:00', event: 'LinkedIn API partial recovery — error rate 6%',           severity: 'info'     },
        { time: 'T+74:00', event: 'Currently monitoring — awaiting full recovery',           severity: 'info'     },
      ],
      'INC-2819': [
        { time: 'T+0:00',  event: 'WebSocket reconnect rate elevated: 12 reconnects/min',  severity: 'warning'  },
        { time: 'T+5:00',  event: 'Nginx upstream keepalive timeout suspected',             severity: 'info'     },
        { time: 'T+18:00', event: 'Config change deployed: keepalive_timeout 75s → 120s',  severity: 'info'     },
        { time: 'T+20:00', event: 'Reconnect rate dropping — monitoring continues',         severity: 'info'     },
        { time: 'T+242:00',event: 'Incident resolved — reconnect rate nominal (0.3/min)',   severity: 'info'     },
      ],
    },
  },

  // ── Career Agent ──────────────────────────────────────────
  careerAgent: {
    stats: { totalScanned: 12847, matches: 31, appliedToday: 3, interviews: 2 },
    jobs: [
      { id: 'j1', title: 'Senior Platform Engineer',      company: 'DataStream Corp',      location: 'Remote',            match: 94, skills: ['Kubernetes','Python','Kafka'],            posted: '2d ago',  salary: '$160k–$200k', type: 'Full-time' },
      { id: 'j2', title: 'Site Reliability Engineer',     company: 'CloudNative Inc',      location: 'New York, NY',      match: 89, skills: ['Prometheus','Go','Terraform'],             posted: '1d ago',  salary: '$150k–$185k', type: 'Full-time' },
      { id: 'j3', title: 'DevOps Lead',                   company: 'FinOps Solutions',     location: 'San Francisco, CA', match: 82, skills: ['AWS','CI/CD','Docker'],                   posted: '3d ago',  salary: '$170k–$210k', type: 'Full-time' },
      { id: 'j4', title: 'ML Infrastructure Engineer',    company: 'AI Ventures',          location: 'Remote',            match: 78, skills: ['CUDA','MLflow','PyTorch'],                 posted: '5d ago',  salary: '$180k–$220k', type: 'Full-time' },
      { id: 'j5', title: 'Platform Architect',            company: 'Enterprise SaaS Co',   location: 'Seattle, WA',       match: 75, skills: ['Microservices','gRPC','PostgreSQL'],        posted: '1w ago',  salary: '$200k–$250k', type: 'Full-time' },
    ],
  },

  // ── Insight Engine ────────────────────────────────────────
  insightEngine: {
    kpis: [
      { label: 'Monthly Revenue',  value: '$4.2M',  change: '+12.4%', up: true  },
      { label: 'Active Users',     value: '28,491', change: '+8.1%',  up: true  },
      { label: 'Churn Rate',       value: '2.3%',   change: '-0.4%',  up: true  },
      { label: 'Avg Session',      value: '14.2m',  change: '+1.8m',  up: true  },
    ],
    chartData: {
      revenue: [320, 340, 295, 380, 420, 390, 445, 420, 460, 480, 510, 520],
      months:  ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'],
    },
    insights: [
      { id: 'i1', type: 'opportunity', color: '#3fb950', text: 'Revenue per user increased 3.9% YoY. Upsell campaign converting at 2× industry average — consider expanding to enterprise tier.', confidence: 94 },
      { id: 'i2', type: 'risk',        color: '#f85149', text: 'Cohort analysis: 23% of users who onboarded in Q4 have not logged in for 14+ days. Churn risk elevated — trigger re-engagement flow.', confidence: 87 },
      { id: 'i3', type: 'trend',       color: '#1f6feb', text: 'Mobile session duration up 22% since UX redesign in Jan 2026. Driving overall average session time increase above forecast.', confidence: 91 },
    ],
  },

  // ── Warehouse Copilot ─────────────────────────────────────
  warehouseCopilot: {
    stats: { totalSKUs: 18420, activeAlerts: 3, pendingReorders: 7, todayPickRate: 2841 },
    zones: [
      { id: 'Z-A', name: 'Zone A — Electronics',  utilization: 78, capacity: 5000,  items: 3890, alerts: 1 },
      { id: 'Z-B', name: 'Zone B — Apparel',      utilization: 52, capacity: 8000,  items: 4160, alerts: 0 },
      { id: 'Z-C', name: 'Zone C — Perishables',  utilization: 91, capacity: 2000,  items: 1820, alerts: 2 },
      { id: 'Z-D', name: 'Zone D — Industrial',   utilization: 34, capacity: 12000, items: 4080, alerts: 0 },
    ],
    inventory: [
      { sku: 'SKU-40921', name: 'Industrial Sensor Module',   stock:  12, reorderPoint:  50, status: 'critical', zone: 'Z-D' },
      { sku: 'SKU-28834', name: 'USB-C Charging Cable 2m',    stock: 234, reorderPoint: 100, status: 'healthy',  zone: 'Z-A' },
      { sku: 'SKU-11042', name: 'Cold Storage Container L',   stock:  44, reorderPoint:  60, status: 'warning',  zone: 'Z-C' },
      { sku: 'SKU-33901', name: 'Heavy-Duty Shelving Unit',   stock: 180, reorderPoint:  30, status: 'healthy',  zone: 'Z-D' },
      { sku: 'SKU-50782', name: 'Wireless Barcode Scanner',   stock:  18, reorderPoint:  25, status: 'warning',  zone: 'Z-A' },
      { sku: 'SKU-72340', name: 'Refrigerant Pack 500g',      stock:  31, reorderPoint:  80, status: 'warning',  zone: 'Z-C' },
    ],
  },
};
