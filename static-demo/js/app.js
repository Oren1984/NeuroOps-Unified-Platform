// NeuroOps Static Demo — app.js
// Vanilla JS SPA with hash-based routing. No build step required.
// (c) NeuroOps Unified Platform

(function () {
  'use strict';

  // ============================================================
  // INLINE SVG ICONS (lucide-style)
  // ============================================================
  function icon(name, size, color) {
    size  = size  || 14;
    color = color || 'currentColor';
    const p = {
      'layout-dashboard':  '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
      'monitor-check':     '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/><path d="m9 10 2 2 4-4"/>',
      'activity':          '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
      'refresh-ccw':       '<path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/>',
      'briefcase':         '<rect width="20" height="14" x="2" y="7" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
      'bar-chart-2':       '<line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/>',
      'package':           '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
      'zap':               '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
      'info':              '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
      'wifi':              '<path d="M5 13a10 10 0 0 1 14 0"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M2 8.82a15 15 0 0 1 20 0"/><line x1="12" x2="12.01" y1="20" y2="20"/>',
      'bell':              '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
      'user':              '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
      'shield-check':      '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
      'alert-triangle':    '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/>',
      'trending-up':       '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
      'trending-down':     '<polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/>',
      'minus':             '<line x1="5" x2="19" y1="12" y2="12"/>',
      'arrow-right':       '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
      'radio':             '<path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1"/>',
      'git-branch':        '<line x1="6" x2="6" y1="3" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>',
      'server':            '<rect width="20" height="8" x="2" y="2" rx="2"/><rect width="20" height="8" x="2" y="14" rx="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/>',
      'log-out':           '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
      'play':              '<polygon points="5 3 19 12 5 21 5 3"/>',
      'pause':             '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>',
      'skip-back':         '<polygon points="19 20 9 12 19 4 19 20"/><line x1="5" x2="5" y1="19" y2="5"/>',
      'check-circle':      '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
      'circle-x':          '<circle cx="12" cy="12" r="10"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/>',
      'building-2':        '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>',
      'layers':            '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
      'cpu':               '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/>',
      'database':          '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>',
      'search':            '<circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/>',
      'map-pin':           '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
      'dollar-sign':       '<line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
      'box':               '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>',
      'warehouse':         '<path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z"/><path d="M6 18h12"/><path d="M6 14h12"/><rect width="8" height="12" x="8" y="10"/>',
    };
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;display:inline-block;vertical-align:middle">${p[name] || ''}</svg>`;
  }

  // ============================================================
  // UTILITY HELPERS
  // ============================================================
  function statusColor(s) {
    return { healthy: '#3fb950', degraded: '#db6d28', offline: '#f85149', warning: '#d29922', critical: '#f85149', info: '#1f6feb' }[s] || '#6e7681';
  }
  function healthColor(n) {
    if (n >= 80) return '#3fb950';
    if (n >= 50) return '#d29922';
    return '#f85149';
  }
  function badge(status) {
    const cls = { healthy: 'healthy', degraded: 'degraded', warning: 'warning', critical: 'critical', offline: 'offline', resolved: 'resolved', info: 'info', active: 'warning', investigating: 'warning', monitoring: 'info' }[status] || 'offline';
    return `<span class="badge badge-${cls}">${status}</span>`;
  }
  function pulseDot(color, size, pulse) {
    size  = size  !== undefined ? size  : 7;
    pulse = pulse !== undefined ? pulse : true;
    return `<span class="pulse-dot" style="width:${size}px;height:${size}px">
      ${pulse ? `<span class="pulse-ring" style="background:${color};opacity:0.35"></span>` : ''}
      <span class="pulse-core" style="background:${color}"></span>
    </span>`;
  }
  function trendIcon(trend) {
    if (trend === 'improving') return icon('trending-up',  12, '#3fb950');
    if (trend === 'declining') return icon('trending-down',12, '#f85149');
    return icon('minus', 12, '#6e7681');
  }
  function progressBar(pct, color, height) {
    height = height || 3;
    return `<div class="health-bar-track" style="height:${height}px">
      <div class="health-bar-fill" style="width:${Math.min(pct,100)}%;background:${color};box-shadow:0 0 5px ${color}88"></div>
    </div>`;
  }
  function barMeter(pct, color) {
    return `<div class="bar-meter">
      <div class="bar-meter-track"><div class="bar-meter-fill" style="width:${Math.min(pct,100)}%;background:${color};box-shadow:0 0 4px ${color}66"></div></div>
      <span class="bar-meter-label" style="color:${color}">${pct}%</span>
    </div>`;
  }
  function healthRing(score, size, thickness) {
    size      = size      || 88;
    thickness = thickness || 7;
    const r    = (size - thickness) / 2;
    const circ = 2 * Math.PI * r;
    const dash = (score / 100) * circ;
    const cx   = size / 2;
    const col  = healthColor(score);
    return `<div class="health-ring-wrap" style="width:${size}px;height:${size}px">
      <svg width="${size}" height="${size}" style="transform:rotate(-90deg)">
        <circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="${thickness}"/>
        <circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="${col}" stroke-width="${thickness}" stroke-linecap="round"
          stroke-dasharray="${circ.toFixed(2)}" stroke-dashoffset="${(circ - dash).toFixed(2)}"
          style="filter:drop-shadow(0 0 6px ${col}88);transition:stroke-dashoffset 0.8s ease"/>
      </svg>
      <div class="health-ring-center">
        <div style="font-size:${Math.round(size * 0.22)}px;font-weight:800;color:${col};font-family:var(--font-mono);line-height:1">${Math.round(score)}</div>
        <div style="font-size:9px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-top:2px">health</div>
      </div>
    </div>`;
  }
  function metricCard(label, value, col, sub, iconName) {
    return `<div class="metric-card">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <span class="metric-label">${label}</span>
        <div class="metric-icon" style="background:${col}22">${icon(iconName || 'activity', 15, col)}</div>
      </div>
      <div class="metric-value" style="color:${col}">${value}</div>
      ${sub ? `<div class="metric-sub">${sub}</div>` : ''}
    </div>`;
  }
  function sectionTitle(text) {
    return `<h2 style="font-size:var(--text-base);font-weight:600;color:var(--text-primary);margin-bottom:var(--space-4)">${text}</h2>`;
  }
  function navigate(route) {
    window.location.hash = route;
  }

  // ============================================================
  // SIDEBAR
  // ============================================================
  const NAV_ITEMS = [
    { id: 'dashboard',        label: 'Dashboard',        icon: 'layout-dashboard', color: '#1f6feb', desc: 'Platform overview' },
    { id: 'control-room',     label: 'Control Room',     icon: 'monitor-check',    color: '#d29922', desc: 'Incident intelligence' },
    { id: 'live-control',     label: 'Live Control',     icon: 'activity',         color: '#39c5cf', desc: 'Real-time monitoring' },
    { id: 'incident-replay',  label: 'Incident Replay',  icon: 'refresh-ccw',      color: '#bc8cff', desc: 'Post-incident analysis' },
    { id: 'career-agent',     label: 'Career Agent',     icon: 'briefcase',        color: '#db6d28', desc: 'AI job discovery' },
    { id: 'insight-engine',   label: 'Insight Engine',   icon: 'bar-chart-2',      color: '#1f6feb', desc: 'Business intelligence' },
    { id: 'warehouse-copilot',label: 'Warehouse Copilot',icon: 'package',          color: '#3fb950', desc: 'Warehouse ops AI' },
    { id: 'events',           label: 'Platform Events',  icon: 'zap',              color: '#39c5cf', desc: 'Live event stream', badge: 'LIVE' },
    { id: 'about',            label: 'Platform Overview',icon: 'info',             color: '#6e7681', desc: 'About this platform' },
  ];

  function renderSidebar(active) {
    const items = NAV_ITEMS.map(n => {
      const isActive = n.id === active;
      return `<a href="#${n.id}" class="nav-item${isActive ? ' active' : ''}" style="${isActive ? `border-left-color:${n.color}` : ''}">
        <div class="nav-icon" style="background:${isActive ? n.color + '22' : 'transparent'}">
          ${icon(n.icon, 14, isActive ? n.color : 'currentColor')}
        </div>
        <div style="min-width:0;flex:1">
          <div class="nav-label">${n.label}${n.badge ? `<span class="nav-badge">${n.badge}</span>` : ''}</div>
          ${isActive ? `<div class="nav-desc">${n.desc}</div>` : ''}
        </div>
        ${isActive ? `<div class="nav-dot" style="background:${n.color}"></div>` : ''}
      </a>`;
    }).join('');

    return `<div class="sidebar-brand">
        <div class="sidebar-logo">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="white" stroke-width="1.5" fill="none"/>
            <circle cx="8" cy="8" r="2.5" fill="white"/>
          </svg>
        </div>
        <div>
          <div style="font-size:13px;font-weight:700;color:var(--text-primary);letter-spacing:.02em">NeuroOps</div>
          <div style="font-size:10px;color:var(--text-muted);letter-spacing:.04em;text-transform:uppercase">Unified Platform</div>
        </div>
      </div>
      <nav class="sidebar-nav">${items}</nav>
      <div class="sidebar-footer">
        <span>v${MOCK.platform.version}</span>
        <span>© 2026</span>
      </div>`;
  }

  // ============================================================
  // TOPBAR
  // ============================================================
  const ROUTE_LABELS = {
    'dashboard':        'Dashboard',
    'control-room':     'Control Room',
    'live-control':     'Live Control',
    'incident-replay':  'Incident Replay',
    'career-agent':     'Career Agent',
    'insight-engine':   'Insight Engine',
    'warehouse-copilot':'Warehouse Copilot',
    'events':           'Platform Events',
    'about':            'Platform Overview',
  };

  function renderTopBar(active) {
    const h = MOCK.platform.health;
    const hCol = healthColor(h);
    return `<div class="topbar-left">
        <span class="topbar-breadcrumb-root">NeuroOps</span>
        <span class="topbar-sep">›</span>
        <span class="topbar-page">${ROUTE_LABELS[active] || 'NeuroOps'}</span>
      </div>
      <div class="topbar-right">
        <div class="health-pill">
          ${pulseDot(hCol, 7, true)}
          <span style="font-size:11px;font-weight:600;color:var(--text-secondary)">Platform Health</span>
          <span style="font-size:11px;font-weight:700;color:${hCol};font-family:var(--font-mono)">${h}%</span>
        </div>
        <div class="conn-dot">
          ${icon('wifi', 13, '#3fb950')}
          <span style="font-size:11px;color:#3fb950;font-weight:500">Demo</span>
        </div>
        <div class="icon-btn">${icon('bell', 13, '#d29922')}
          <span style="position:absolute;top:-4px;right:-4px;background:var(--red);color:#fff;font-size:9px;font-weight:700;border-radius:8px;padding:0 4px;min-width:14px;text-align:center">${MOCK.alerts.filter(a => a.level !== 'info').length}</span>
        </div>
        <span class="clock" id="live-clock">--:--:--</span>
        <div style="display:flex;align-items:center;gap:6px;padding:4px 10px;background:var(--bg-tertiary);border:1px solid var(--border);border-radius:var(--radius)">
          ${icon('user', 11, 'var(--text-muted)')}
          <span style="font-size:11px;color:var(--text-secondary);font-weight:500">demo-user</span>
        </div>
      </div>`;
  }

  // ============================================================
  // PAGE — DASHBOARD
  // ============================================================
  function pageDashboard() {
    const p  = MOCK.platform;
    const hCol = healthColor(p.health);

    const alertsHtml = MOCK.alerts.map(a => {
      const col = a.level === 'critical' ? 'var(--red)' : a.level === 'warning' ? 'var(--yellow)' : 'var(--accent)';
      return `<div style="display:flex;align-items:flex-start;gap:12px;padding:8px 10px;border-radius:var(--radius);background:${col}0d;border:1px solid ${col}28;margin-bottom:6px">
        ${icon('alert-triangle', 12, col)}
        <div style="flex:1;min-width:0">
          <div style="font-size:var(--text-xs);font-weight:600;color:var(--text-primary)">${a.title}</div>
          <div style="font-size:10px;color:var(--text-muted);margin-top:1px">${a.message}</div>
        </div>
        <span style="font-size:10px;color:${col};font-weight:600;flex-shrink:0">${a.level}</span>
      </div>`;
    }).join('');

    const eventsHtml = MOCK.events.slice(0, 5).map((e, i) => {
      const col = statusColor(e.severity);
      return `<div class="event-entry" style="background:${col}08;border:1px solid ${col}1a;margin-bottom:5px;border-radius:6px">
        ${pulseDot(col, 6, i === 0)}
        <div style="flex:1;min-width:0">
          <div style="font-size:11px;font-weight:600;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${e.message}</div>
          <div style="font-size:10px;color:var(--text-muted);margin-top:2px">${e.service.replace(/_/g,' ')} · ${e.severity}</div>
        </div>
        <div style="font-size:9px;color:var(--text-muted);white-space:nowrap;flex-shrink:0;margin-top:2px">${e.time}</div>
      </div>`;
    }).join('');

    const moduleCards = MOCK.modules.map(m => {
      const sc = statusColor(m.status);
      return `<div class="module-card" onclick="window.NeuroOps.navigate('${m.id}')"
          onmouseover="this.style.borderColor='${m.color}';this.style.boxShadow='0 0 0 1px ${m.color}33,0 4px 20px ${m.color}18'"
          onmouseout="this.style.borderColor='var(--border)';this.style.boxShadow='none'">
        <div class="module-card-accent" style="background:linear-gradient(90deg,${m.color},${m.color}44)"></div>
        <div style="display:flex;align-items:center;justify-content:space-between;padding-top:4px">
          <div style="display:flex;align-items:center;gap:8px">
            <div style="width:32px;height:32px;border-radius:8px;background:${m.color}22;display:flex;align-items:center;justify-content:center">
              ${icon(MOCK.modules.indexOf(m) === 0 ? 'monitor-check' : MOCK.modules.indexOf(m) === 1 ? 'activity' : MOCK.modules.indexOf(m) === 2 ? 'refresh-ccw' : MOCK.modules.indexOf(m) === 3 ? 'briefcase' : MOCK.modules.indexOf(m) === 4 ? 'bar-chart-2' : 'package', 15, m.color)}
            </div>
            <span style="font-size:var(--text-base);font-weight:600;color:var(--text-primary)">${m.label}</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            ${pulseDot(sc, 7, m.status === 'healthy')}
            ${trendIcon(m.trend)}
            ${badge(m.status)}
          </div>
        </div>
        <p style="font-size:var(--text-xs);color:var(--text-muted);line-height:1.6;margin:0">${m.description}</p>
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
            <span style="font-size:10px;color:var(--text-muted)">Health</span>
            <span style="font-size:10px;font-family:var(--font-mono);color:${sc};font-weight:700">${m.health}% <span style="color:var(--text-muted);font-weight:400">${m.responseMs}ms</span></span>
          </div>
          ${progressBar(m.health, sc, 3)}
        </div>
        <div style="display:flex;align-items:center;gap:4px;font-size:var(--text-xs);color:var(--text-muted);margin-top:auto">
          <span>Open Module</span>${icon('arrow-right', 11)}
        </div>
      </div>`;
    }).join('');

    const quickBtns = MOCK.modules.map(m => {
      const sc = statusColor(m.status);
      return `<a href="#${m.id}" class="quick-btn"
          onmouseover="this.style.borderColor='${m.color}';this.style.color='${m.color}';this.style.background='${m.color}11'"
          onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--text-secondary)';this.style.background='var(--bg-tertiary)'">
        ${pulseDot(sc, 5, m.status === 'healthy')}
        ${m.label}
      </a>`;
    }).join('') + `<a href="#events" class="quick-btn" style="background:rgba(57,197,207,0.08);border-color:rgba(57,197,207,0.25);color:#39c5cf">
        ${icon('radio', 12)}Platform Events</a>`;

    const moduleActivity = MOCK.modules.map(m => {
      const sc = statusColor(m.status);
      return `<div style="display:flex;align-items:center;gap:10px">
        ${pulseDot(sc, 6, m.status === 'healthy')}
        <span style="font-size:var(--text-xs);color:var(--text-secondary);width:130px;flex-shrink:0;font-weight:500">${m.label}</span>
        <div style="flex:1;height:5px;background:var(--bg-tertiary);border-radius:3px;overflow:hidden">
          <div style="height:100%;width:${m.health}%;background:${sc};box-shadow:0 0 4px ${sc}66;border-radius:3px;transition:width .6s ease"></div>
        </div>
        <span style="font-size:10px;font-family:var(--font-mono);color:${sc};width:36px;text-align:right;flex-shrink:0;font-weight:700">${m.health}%</span>
        ${trendIcon(m.trend)}
        <span style="font-size:10px;color:${sc};width:52px;flex-shrink:0">${m.status}</span>
      </div>`;
    }).join('');

    return `<div class="module-page animate-fade-in">
      <style>@keyframes pulse-dot{0%{transform:scale(1);opacity:.45}100%{transform:scale(2.6);opacity:0}}</style>

      <!-- Header -->
      <div class="module-header">
        <div style="display:flex;align-items:center;gap:20px">
          ${healthRing(p.health, 88, 7)}
          <div>
            <h1 style="font-size:var(--text-2xl);font-weight:700;color:var(--text-primary);margin-bottom:4px">NeuroOps Unified Platform</h1>
            <p style="font-size:var(--text-sm);color:var(--text-secondary)">
              Uptime: ${p.uptime} &nbsp;·&nbsp; ${p.healthyServices}/${p.totalServices} services online &nbsp;·&nbsp;
              <span style="color:${hCol};font-weight:600">${p.status}</span>
            </p>
          </div>
        </div>
        <div style="padding:7px 16px;background:${hCol}12;border:1px solid ${hCol}40;border-radius:20px;display:flex;align-items:center;gap:8px;box-shadow:0 0 12px ${hCol}18">
          ${pulseDot(hCol, 7, true)}
          <span style="font-size:12px;font-weight:700;color:${hCol};font-family:var(--font-mono);letter-spacing:.04em">${p.status.toUpperCase()}</span>
        </div>
      </div>

      <!-- Top metrics -->
      <div class="grid-4">
        ${metricCard('Services Online',  `${p.healthyServices}`,      '#3fb950', `of ${p.totalServices} monitored`,           'shield-check')}
        ${metricCard('Platform Health',  `${p.health}%`,              hCol,       'Overall score',                            'trending-up')}
        ${metricCard('Active Alerts',    `${MOCK.alerts.length}`,     '#d29922', '0 critical · 2 warnings',                  'alert-triangle')}
        ${metricCard('Avg Response',     `${p.avgResponseMs}ms`,      '#1f6feb', 'Service latency',                          'activity')}
      </div>

      <!-- Alerts + Events -->
      <div class="grid-2">
        <div class="card">
          <div class="card-title" style="display:flex;align-items:center;justify-content:space-between">
            <span>Platform Alerts</span>
            <span style="font-size:10px;background:var(--yellow);color:#0d1117;border-radius:10px;padding:1px 7px;font-weight:700">${MOCK.alerts.length}</span>
          </div>
          ${alertsHtml}
        </div>
        <div class="card">
          <div class="card-title" style="display:flex;align-items:center;justify-content:space-between">
            <div style="display:flex;align-items:center;gap:8px">${icon('radio', 13, '#39c5cf')} Live Event Stream</div>
            <a href="#events" style="display:flex;align-items:center;gap:4px;font-size:10px;color:#39c5cf">View all ${icon('arrow-right', 10)}</a>
          </div>
          ${eventsHtml}
        </div>
      </div>

      <!-- Module grid -->
      <div>
        <div style="margin-bottom:var(--space-4);display:flex;align-items:center;justify-content:space-between">
          <h2 style="font-size:var(--text-base);font-weight:600;color:var(--text-primary)">Platform Modules</h2>
          <div style="display:flex;gap:16px;font-size:var(--text-xs);color:var(--text-muted)">
            <span>${MOCK.modules.length} modules</span>
            <span style="color:#3fb950">${MOCK.modules.filter(m=>m.status==='healthy').length} online</span>
            <span style="color:#db6d28">${MOCK.modules.filter(m=>m.status==='degraded').length} degraded</span>
          </div>
        </div>
        <div class="grid-modules">${moduleCards}</div>
      </div>

      <!-- Module activity -->
      <div class="card">
        <div class="card-title" style="display:flex;align-items:center;gap:8px">${icon('activity',14,'var(--accent)')} Module Activity Overview</div>
        <div style="display:flex;flex-direction:column;gap:10px">${moduleActivity}</div>
      </div>

      <!-- Quick access -->
      <div class="card">
        <div class="card-title">Quick Access</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px">${quickBtns}</div>
      </div>
    </div>`;
  }

  // ============================================================
  // PAGE — CONTROL ROOM
  // ============================================================
  function pageControlRoom() {
    const d = MOCK.controlRoom;
    const incList = d.incidents.map(inc => {
      const sc = statusColor(inc.severity);
      return `<div class="card" style="margin-bottom:12px;border-left:3px solid ${sc}">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px">
          <div>
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
              <span style="font-size:11px;font-family:var(--font-mono);color:${sc};font-weight:700">${inc.id}</span>
              ${badge(inc.severity)}
              ${badge(inc.status)}
            </div>
            <div style="font-size:var(--text-base);font-weight:600;color:var(--text-primary)">${inc.title}</div>
          </div>
          <div style="text-align:right;flex-shrink:0">
            <div style="font-size:10px;color:var(--text-muted)">Duration</div>
            <div style="font-size:13px;font-family:var(--font-mono);color:var(--text-secondary);font-weight:600">${inc.duration}</div>
          </div>
        </div>
        <p style="font-size:var(--text-xs);color:var(--text-secondary);line-height:1.6;margin-bottom:10px">${inc.description}</p>
        <div style="display:flex;gap:16px;font-size:10px;color:var(--text-muted)">
          <span>${icon('server',11)} ${inc.service}</span>
          <span>${icon('user',11)} ${inc.assignee}</span>
        </div>
      </div>`;
    }).join('');

    const depRows = d.dependencies.map(dep => {
      const sc = statusColor(dep.status);
      return `<tr>
        <td><span style="font-size:var(--text-xs);color:var(--text-secondary)">${dep.from}</span></td>
        <td><span style="font-size:var(--text-xs);color:var(--text-secondary)">${dep.to}</span></td>
        <td>${pulseDot(sc, 6, dep.status === 'healthy')} <span style="font-size:var(--text-xs);color:${sc};margin-left:6px;font-weight:600">${dep.status}</span></td>
        <td style="font-family:var(--font-mono);font-size:11px;color:${dep.status === 'degraded' ? 'var(--orange)' : 'var(--text-muted)'}">${dep.latency}</td>
      </tr>`;
    }).join('');

    return `<div class="module-page animate-fade-in">
      <div class="module-header">
        <div style="display:flex;align-items:center;gap:16px">
          <div style="width:40px;height:40px;border-radius:10px;background:#d2992222;display:flex;align-items:center;justify-content:center">
            ${icon('monitor-check', 20, '#d29922')}
          </div>
          <div>
            <h1 style="font-size:var(--text-2xl);font-weight:700;color:var(--text-primary)">Control Room</h1>
            <p style="font-size:var(--text-sm);color:var(--text-secondary)">AI-powered incident intelligence &amp; dependency monitoring</p>
          </div>
        </div>
        <div style="display:flex;gap:10px">
          ${metricCard('Open Incidents', `${d.incidents.filter(i=>i.status!=='resolved').length}`, '#d29922', 'Needs attention', 'alert-triangle')}
          ${metricCard('Resolved Today', `${d.incidents.filter(i=>i.status==='resolved').length}`,  '#3fb950', 'Last 24 hours',   'check-circle')}
        </div>
      </div>

      <div>
        ${sectionTitle('Active Incidents')}
        ${incList}
      </div>

      <div class="card">
        <div class="card-title" style="display:flex;align-items:center;gap:8px">
          ${icon('git-branch', 13, '#d29922')} Service Dependencies
        </div>
        <table class="data-table">
          <thead><tr><th>From</th><th>To</th><th>Status</th><th>Latency</th></tr></thead>
          <tbody>${depRows}</tbody>
        </table>
      </div>
    </div>`;
  }

  // ============================================================
  // PAGE — LIVE CONTROL
  // ============================================================
  function pageLiveControl() {
    const d = MOCK.liveControl;
    const t = d.totals;

    const rows = d.services.map(s => {
      const sc  = statusColor(s.status);
      const cpuCol = s.cpu > 60 ? 'var(--orange)' : s.cpu > 40 ? 'var(--yellow)' : '#3fb950';
      const memCol = s.memory > 70 ? 'var(--orange)' : s.memory > 50 ? 'var(--yellow)' : '#1f6feb';
      return `<tr>
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            ${pulseDot(sc, 7, s.status === 'healthy')}
            <span style="font-size:var(--text-xs);font-weight:500;color:var(--text-primary)">${s.name}</span>
          </div>
        </td>
        <td>${badge(s.status)}</td>
        <td style="min-width:120px">${barMeter(s.cpu, cpuCol)}</td>
        <td style="min-width:120px">${barMeter(s.memory, memCol)}</td>
        <td style="font-family:var(--font-mono);font-size:11px;color:var(--text-secondary)">${s.rps.toLocaleString()}</td>
        <td style="font-family:var(--font-mono);font-size:11px;color:${s.latency > 400 ? 'var(--orange)' : s.latency > 200 ? 'var(--yellow)' : 'var(--green)'}">${s.latency}ms</td>
      </tr>`;
    }).join('');

    return `<div class="module-page animate-fade-in">
      <div class="module-header">
        <div style="display:flex;align-items:center;gap:16px">
          <div style="width:40px;height:40px;border-radius:10px;background:#39c5cf22;display:flex;align-items:center;justify-content:center">
            ${icon('activity', 20, '#39c5cf')}
          </div>
          <div>
            <h1 style="font-size:var(--text-2xl);font-weight:700;color:var(--text-primary)">Live Control</h1>
            <p style="font-size:var(--text-sm);color:var(--text-secondary)">Real-time service monitoring &amp; performance metrics</p>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;padding:6px 14px;background:rgba(57,197,207,0.1);border:1px solid rgba(57,197,207,0.3);border-radius:20px">
          ${pulseDot('#39c5cf', 7, true)}
          <span style="font-size:12px;font-weight:700;color:#39c5cf;font-family:var(--font-mono)">LIVE</span>
        </div>
      </div>

      <div class="grid-4">
        ${metricCard('Total RPS',    t.rps.toLocaleString(),  '#39c5cf', 'Requests per second', 'activity')}
        ${metricCard('Avg Latency',  `${t.avgLatency}ms`,     '#1f6feb', 'Cross-service avg',   'activity')}
        ${metricCard('Error Rate',   `${t.errorRate}%`,       '#3fb950', 'Last 5 minutes',      'shield-check')}
        ${metricCard('Connections',  t.activeConnections.toLocaleString(), '#bc8cff', 'Active WS + HTTP', 'server')}
      </div>

      <div class="card">
        <div class="card-title" style="display:flex;align-items:center;justify-content:space-between">
          <div style="display:flex;align-items:center;gap:8px">${icon('server',13,'var(--accent)')} Service Status Matrix</div>
          <span style="font-size:10px;color:var(--text-muted)">${d.services.length} services · last updated just now</span>
        </div>
        <table class="data-table">
          <thead><tr><th>Service</th><th>Status</th><th>CPU</th><th>Memory</th><th>RPS</th><th>Latency</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>

      <!-- Sparkline visual legend -->
      <div class="card">
        <div class="card-title">Performance Thresholds</div>
        <div style="display:flex;flex-wrap:wrap;gap:24px;font-size:var(--text-xs)">
          <div style="display:flex;align-items:center;gap:6px">${pulseDot('#3fb950',6,false)}<span style="color:var(--text-secondary)">Healthy — CPU &lt;40%, Latency &lt;200ms</span></div>
          <div style="display:flex;align-items:center;gap:6px">${pulseDot('#d29922',6,false)}<span style="color:var(--text-secondary)">Warning — CPU 40–60%, Latency 200–400ms</span></div>
          <div style="display:flex;align-items:center;gap:6px">${pulseDot('#db6d28',6,false)}<span style="color:var(--text-secondary)">Degraded — CPU &gt;60%, Latency &gt;400ms</span></div>
        </div>
      </div>
    </div>`;
  }

  // ============================================================
  // PAGE — INCIDENT REPLAY
  // ============================================================
  let selectedIncident = MOCK.incidentReplay.incidents[0].id;

  function pageIncidentReplay() {
    const d = MOCK.incidentReplay;

    const incList = d.incidents.map(inc => {
      const isSelected = inc.id === selectedIncident;
      const sc = statusColor(inc.severity);
      return `<div onclick="window.NeuroOps.selectIncident('${inc.id}')"
          style="padding:10px 12px;border-radius:var(--radius);cursor:pointer;border:1px solid ${isSelected ? sc : 'var(--border)'};background:${isSelected ? sc + '0d' : 'transparent'};margin-bottom:6px;transition:all .15s"
          onmouseover="this.style.background='${sc}08'" onmouseout="this.style.background='${isSelected ? sc + '0d' : 'transparent'}'">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
          <span style="font-size:11px;font-family:var(--font-mono);color:${sc};font-weight:700">${inc.id}</span>
          ${badge(inc.status)}
        </div>
        <div style="font-size:var(--text-xs);font-weight:500;color:var(--text-primary);margin-bottom:3px">${inc.title}</div>
        <div style="font-size:10px;color:var(--text-muted)">${inc.start} · ${inc.duration}</div>
      </div>`;
    }).join('');

    const timeline = (d.timelines[selectedIncident] || []).map((t, i) => {
      const sc = statusColor(t.severity);
      return `<div class="timeline-item">
        <div class="timeline-dot" style="background:${sc}"></div>
        <div style="flex:1;padding-bottom:8px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px">
            <span style="font-size:11px;font-family:var(--font-mono);font-weight:700;color:${sc}">${t.time}</span>
            ${badge(t.severity)}
          </div>
          <p style="font-size:var(--text-xs);color:var(--text-secondary);line-height:1.5;margin:0">${t.event}</p>
        </div>
      </div>`;
    }).join('');

    const selected = d.incidents.find(i => i.id === selectedIncident);
    const sc = statusColor(selected ? selected.severity : 'info');

    return `<div class="module-page animate-fade-in">
      <div class="module-header">
        <div style="display:flex;align-items:center;gap:16px">
          <div style="width:40px;height:40px;border-radius:10px;background:#bc8cff22;display:flex;align-items:center;justify-content:center">
            ${icon('refresh-ccw', 20, '#bc8cff')}
          </div>
          <div>
            <h1 style="font-size:var(--text-2xl);font-weight:700;color:var(--text-primary)">Incident Replay</h1>
            <p style="font-size:var(--text-sm);color:var(--text-secondary)">Step through historical incidents with timeline playback</p>
          </div>
        </div>
        <div class="grid-3" style="gap:10px">
          ${metricCard('Total Incidents', `${d.incidents.length}`,                             '#bc8cff', 'All time',        'refresh-ccw')}
          ${metricCard('Active',          `${d.incidents.filter(i=>i.status!=='resolved').length}`, '#d29922','Currently open',  'alert-triangle')}
          ${metricCard('Resolved',        `${d.incidents.filter(i=>i.status==='resolved').length}`, '#3fb950','Closed incidents','check-circle')}
        </div>
      </div>

      <div class="grid-2" style="align-items:start">
        <div class="card">
          <div class="card-title">Incident Log</div>
          ${incList}
        </div>
        <div>
          <div class="card" style="margin-bottom:12px;border-color:${sc}44">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
              <div>
                <div style="font-size:11px;font-family:var(--font-mono);color:${sc};font-weight:700;margin-bottom:2px">${selected ? selected.id : '—'}</div>
                <div style="font-size:var(--text-base);font-weight:600;color:var(--text-primary)">${selected ? selected.title : 'Select an incident'}</div>
              </div>
              ${selected ? badge(selected.status) : ''}
            </div>
            <div style="display:flex;gap:8px;margin-bottom:14px">
              <button class="replay-btn primary">${icon('play',12)} Replay</button>
              <button class="replay-btn">${icon('pause',12)} Pause</button>
              <button class="replay-btn">${icon('skip-back',12)} Reset</button>
            </div>
            <!-- Fake progress bar -->
            <div style="margin-bottom:4px">
              <div style="height:4px;background:var(--bg-tertiary);border-radius:2px;overflow:hidden">
                <div style="height:100%;width:45%;background:linear-gradient(90deg,#bc8cff,#1f6feb);border-radius:2px"></div>
              </div>
              <div style="display:flex;justify-content:space-between;font-size:9px;color:var(--text-muted);margin-top:3px">
                <span>T+0:00</span><span style="color:#bc8cff">T+${selected ? Math.round(parseInt(selected.duration)*0.45 || 22) : 22}m (45%)</span><span>${selected ? selected.duration : '—'}</span>
              </div>
            </div>
          </div>
          <div class="card">
            <div class="card-title" style="display:flex;align-items:center;gap:6px">${icon('zap',13,'#bc8cff')} Incident Timeline</div>
            <div style="margin-top:8px">${timeline || '<p style="font-size:var(--text-xs);color:var(--text-muted);text-align:center;padding:16px">No timeline available</p>'}</div>
          </div>
        </div>
      </div>
    </div>`;
  }

  // ============================================================
  // PAGE — CAREER AGENT
  // ============================================================
  function pageCareerAgent() {
    const d = MOCK.careerAgent;

    const jobs = d.jobs.map(j => {
      const matchCol = j.match >= 90 ? '#3fb950' : j.match >= 80 ? '#d29922' : '#8b949e';
      return `<div class="job-card">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
          <div>
            <div style="font-size:var(--text-base);font-weight:600;color:var(--text-primary);margin-bottom:3px">${j.title}</div>
            <div style="display:flex;align-items:center;gap:10px;font-size:var(--text-xs);color:var(--text-secondary)">
              ${icon('building-2',11)} ${j.company}
              &nbsp;·&nbsp;
              ${icon('map-pin',11)} ${j.location}
            </div>
          </div>
          <div style="text-align:center;flex-shrink:0">
            <div style="font-size:20px;font-weight:800;font-family:var(--font-mono);color:${matchCol};line-height:1">${j.match}%</div>
            <div style="font-size:9px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em">match</div>
          </div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:5px">
          ${j.skills.map(s => `<span class="skill-chip">${s}</span>`).join('')}
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between">
          <span style="font-size:var(--text-xs);color:#3fb950;font-weight:600">${j.salary}</span>
          <div style="display:flex;align-items:center;gap:10px;font-size:10px;color:var(--text-muted)">
            <span>${j.type}</span>
            <span>${j.posted}</span>
            <button style="padding:4px 12px;background:rgba(31,111,235,0.15);border:1px solid rgba(31,111,235,0.4);border-radius:var(--radius);color:var(--accent);font-size:11px;font-weight:600;cursor:pointer;font-family:var(--font-sans)">Apply</button>
          </div>
        </div>
      </div>`;
    }).join('');

    return `<div class="module-page animate-fade-in">
      <div class="module-header">
        <div style="display:flex;align-items:center;gap:16px">
          <div style="width:40px;height:40px;border-radius:10px;background:#db6d2822;display:flex;align-items:center;justify-content:center">
            ${icon('briefcase', 20, '#db6d28')}
          </div>
          <div>
            <h1 style="font-size:var(--text-2xl);font-weight:700;color:var(--text-primary)">Career Agent</h1>
            <p style="font-size:var(--text-sm);color:var(--text-secondary)">AI-powered job discovery with semantic skill matching</p>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;padding:6px 14px;background:rgba(219,109,40,0.1);border:1px solid rgba(219,109,40,0.3);border-radius:20px">
          ${pulseDot('#db6d28', 7, false)}
          <span style="font-size:12px;font-weight:700;color:#db6d28">DEGRADED</span>
        </div>
      </div>

      <div class="grid-4">
        ${metricCard('Jobs Scanned',    d.stats.totalScanned.toLocaleString(), '#db6d28', 'Across all sources',    'search')}
        ${metricCard('Matches Found',   `${d.stats.matches}`,                  '#3fb950', '≥70% confidence',       'check-circle')}
        ${metricCard('Applied Today',   `${d.stats.appliedToday}`,             '#1f6feb', 'Auto-submitted',        'briefcase')}
        ${metricCard('Interviews',      `${d.stats.interviews}`,               '#bc8cff', 'Scheduled this week',   'user')}
      </div>

      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-3)">
        ${sectionTitle('Top Job Matches')}
        <div style="display:flex;gap:6px">
          <button style="padding:5px 12px;background:rgba(219,109,40,0.12);border:1px solid rgba(219,109,40,0.3);border-radius:var(--radius);color:#db6d28;font-size:11px;font-weight:600;cursor:pointer;font-family:var(--font-sans)">Sort by Match</button>
          <button style="padding:5px 12px;background:var(--bg-tertiary);border:1px solid var(--border);border-radius:var(--radius);color:var(--text-secondary);font-size:11px;cursor:pointer;font-family:var(--font-sans)">Filter</button>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px">${jobs}</div>
    </div>`;
  }

  // ============================================================
  // PAGE — INSIGHT ENGINE
  // ============================================================
  function pageInsightEngine() {
    const d = MOCK.insightEngine;

    // Simple SVG bar chart
    const maxVal = Math.max(...d.chartData.revenue);
    const chartW  = 600, chartH = 120, barGap = 4;
    const barW    = (chartW - barGap * (d.chartData.revenue.length - 1)) / d.chartData.revenue.length;
    const bars    = d.chartData.revenue.map((v, i) => {
      const bh    = (v / maxVal) * chartH;
      const x     = i * (barW + barGap);
      const isLast = i === d.chartData.revenue.length - 1;
      return `<rect x="${x.toFixed(1)}" y="${(chartH - bh).toFixed(1)}" width="${barW.toFixed(1)}" height="${bh.toFixed(1)}"
        rx="2" fill="${isLast ? '#1f6feb' : '#1f6feb44'}" />
        <text x="${(x + barW/2).toFixed(1)}" y="${chartH + 14}" text-anchor="middle" fill="#6e7681" font-size="9" font-family="Inter,sans-serif">${d.chartData.months[i]}</text>`;
    }).join('');

    const kpiCards = d.kpis.map(k => {
      const col = k.up ? '#3fb950' : '#f85149';
      return `<div class="metric-card">
        <span class="metric-label">${k.label}</span>
        <div class="metric-value" style="color:var(--text-primary)">${k.value}</div>
        <div style="display:flex;align-items:center;gap:4px">
          ${k.up ? icon('trending-up', 12, '#3fb950') : icon('trending-down', 12, '#f85149')}
          <span style="font-size:11px;color:${col};font-weight:600">${k.change}</span>
          <span style="font-size:10px;color:var(--text-muted)">vs last month</span>
        </div>
      </div>`;
    }).join('');

    const insights = d.insights.map(ins => {
      const typeLabel = ins.type === 'opportunity' ? 'OPPORTUNITY' : ins.type === 'risk' ? 'RISK' : 'TREND';
      return `<div class="insight-card" style="border-color:${ins.color};margin-bottom:10px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
          <span style="font-size:10px;font-weight:700;color:${ins.color};letter-spacing:.06em">${typeLabel}</span>
          <span style="font-size:10px;color:var(--text-muted)">Confidence: <span style="color:${ins.color};font-weight:700">${ins.confidence}%</span></span>
        </div>
        <p style="font-size:var(--text-xs);color:var(--text-secondary);line-height:1.6;margin:0">${ins.text}</p>
      </div>`;
    }).join('');

    return `<div class="module-page animate-fade-in">
      <div class="module-header">
        <div style="display:flex;align-items:center;gap:16px">
          <div style="width:40px;height:40px;border-radius:10px;background:#1f6feb22;display:flex;align-items:center;justify-content:center">
            ${icon('bar-chart-2', 20, '#1f6feb')}
          </div>
          <div>
            <h1 style="font-size:var(--text-2xl);font-weight:700;color:var(--text-primary)">Insight Engine</h1>
            <p style="font-size:var(--text-sm);color:var(--text-secondary)">Business intelligence with AI analytics and LLM-powered Q&A</p>
          </div>
        </div>
        ${badge('healthy')}
      </div>

      <div class="grid-4">${kpiCards}</div>

      <div class="card">
        <div class="card-title" style="display:flex;align-items:center;justify-content:space-between">
          <div style="display:flex;align-items:center;gap:8px">${icon('bar-chart-2',13,'#1f6feb')} Monthly Revenue (USD K)</div>
          <span style="font-size:10px;color:var(--text-muted)">Apr 2025 → Mar 2026</span>
        </div>
        <div style="overflow-x:auto;padding-top:8px">
          <svg viewBox="0 0 ${chartW} ${chartH + 20}" width="100%" height="140" style="display:block">
            ${bars}
          </svg>
        </div>
      </div>

      <div class="card">
        <div class="card-title" style="display:flex;align-items:center;gap:8px">
          ${icon('zap',13,'#d29922')} AI-Generated Insights
        </div>
        ${insights}
      </div>
    </div>`;
  }

  // ============================================================
  // PAGE — WAREHOUSE COPILOT
  // ============================================================
  function pageWarehouseCopilot() {
    const d = MOCK.warehouseCopilot;

    const zones = d.zones.map(z => {
      const col = z.utilization > 85 ? '#db6d28' : z.utilization > 70 ? '#d29922' : '#3fb950';
      return `<div class="zone-card">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div>
            <div style="font-size:var(--text-xs);font-weight:600;color:var(--text-primary)">${z.name}</div>
            <div style="font-size:10px;color:var(--text-muted);margin-top:2px">${z.items.toLocaleString()} items · cap ${z.capacity.toLocaleString()}</div>
          </div>
          ${z.alerts > 0 ? `<span style="font-size:10px;background:var(--yellow);color:#0d1117;border-radius:10px;padding:1px 7px;font-weight:700">${z.alerts} alert${z.alerts>1?'s':''}</span>` : `<span class="badge badge-healthy">OK</span>`}
        </div>
        <div>
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:10px">
            <span style="color:var(--text-muted)">Utilization</span>
            <span style="color:${col};font-weight:700;font-family:var(--font-mono)">${z.utilization}%</span>
          </div>
          ${progressBar(z.utilization, col, 5)}
        </div>
      </div>`;
    }).join('');

    const invRows = d.inventory.map(item => {
      const sc = statusColor(item.status);
      return `<tr>
        <td style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted)">${item.sku}</td>
        <td style="font-size:var(--text-xs);color:var(--text-primary);font-weight:500">${item.name}</td>
        <td style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:${sc}">${item.stock}</td>
        <td style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted)">${item.reorderPoint}</td>
        <td>${badge(item.status)}</td>
        <td style="font-size:var(--text-xs);color:var(--text-secondary)">${item.zone}</td>
      </tr>`;
    }).join('');

    return `<div class="module-page animate-fade-in">
      <div class="module-header">
        <div style="display:flex;align-items:center;gap:16px">
          <div style="width:40px;height:40px;border-radius:10px;background:#3fb95022;display:flex;align-items:center;justify-content:center">
            ${icon('package', 20, '#3fb950')}
          </div>
          <div>
            <h1 style="font-size:var(--text-2xl);font-weight:700;color:var(--text-primary)">Warehouse Copilot</h1>
            <p style="font-size:var(--text-sm);color:var(--text-secondary)">Intelligent warehouse operations with inventory risk detection</p>
          </div>
        </div>
        ${badge('healthy')}
      </div>

      <div class="grid-4">
        ${metricCard('Total SKUs',       d.stats.totalSKUs.toLocaleString(),  '#3fb950', 'Across all zones',    'box')}
        ${metricCard('Active Alerts',    `${d.stats.activeAlerts}`,           '#d29922', 'Inventory risks',     'alert-triangle')}
        ${metricCard('Pending Reorders', `${d.stats.pendingReorders}`,        '#1f6feb', 'Auto-queued',         'refresh-ccw')}
        ${metricCard('Picks Today',      d.stats.todayPickRate.toLocaleString(),'#bc8cff','Items fulfilled',    'warehouse')}
      </div>

      <div>
        ${sectionTitle('Zone Utilization')}
        <div class="grid-4">${zones}</div>
      </div>

      <div class="card">
        <div class="card-title" style="display:flex;align-items:center;gap:8px">${icon('database',13,'#3fb950')} Inventory Watchlist</div>
        <table class="data-table">
          <thead><tr><th>SKU</th><th>Item</th><th>Stock</th><th>Reorder At</th><th>Status</th><th>Zone</th></tr></thead>
          <tbody>${invRows}</tbody>
        </table>
      </div>
    </div>`;
  }

  // ============================================================
  // PAGE — PLATFORM EVENTS
  // ============================================================
  function pageEvents() {
    const allEvents = MOCK.events.map((e, i) => {
      const col = statusColor(e.severity);
      return `<div class="event-entry" style="background:${col}08;border:1px solid ${col}18;border-radius:var(--radius);margin-bottom:6px">
        ${pulseDot(col, 7, i === 0)}
        <div style="flex:1;min-width:0">
          <div style="font-size:var(--text-xs);font-weight:600;color:var(--text-primary);line-height:1.4">${e.message}</div>
          <div style="display:flex;align-items:center;gap:10px;margin-top:3px">
            <span style="font-size:10px;color:var(--text-muted)">${e.service.replace(/_/g,' ')}</span>
            <span style="font-size:10px;font-family:var(--font-mono);color:var(--text-muted)">type:${e.type}</span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px;flex-shrink:0">
          <span class="badge badge-${e.severity === 'warning' ? 'warning' : e.severity === 'critical' ? 'critical' : 'info'}">${e.severity}</span>
          <span style="font-size:9px;color:var(--text-muted)">${e.time}</span>
        </div>
      </div>`;
    }).join('');

    const bySeverity = {
      info:    MOCK.events.filter(e => e.severity === 'info').length,
      warning: MOCK.events.filter(e => e.severity === 'warning').length,
      critical: MOCK.events.filter(e => e.severity === 'critical').length,
    };

    return `<div class="module-page animate-fade-in">
      <div class="module-header">
        <div style="display:flex;align-items:center;gap:16px">
          <div style="width:40px;height:40px;border-radius:10px;background:#39c5cf22;display:flex;align-items:center;justify-content:center">
            ${icon('zap', 20, '#39c5cf')}
          </div>
          <div>
            <h1 style="font-size:var(--text-2xl);font-weight:700;color:var(--text-primary)">Platform Events</h1>
            <p style="font-size:var(--text-sm);color:var(--text-secondary)">Real-time event stream across all NeuroOps services</p>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;padding:6px 14px;background:rgba(57,197,207,0.1);border:1px solid rgba(57,197,207,0.3);border-radius:20px">
          ${pulseDot('#39c5cf', 7, true)}
          <span style="font-size:12px;font-weight:700;color:#39c5cf;font-family:var(--font-mono);letter-spacing:.04em">LIVE STREAM</span>
        </div>
      </div>

      <div class="grid-3">
        ${metricCard('Total Events', `${MOCK.events.length}`, '#39c5cf', 'Last 24 hours',          'radio')}
        ${metricCard('Warnings',     `${bySeverity.warning}`, '#d29922', 'Requiring attention',     'alert-triangle')}
        ${metricCard('Info Events',  `${bySeverity.info}`,    '#1f6feb', 'Informational',           'info')}
      </div>

      <div class="card">
        <div class="card-title" style="display:flex;align-items:center;justify-content:space-between">
          <div style="display:flex;align-items:center;gap:8px">${icon('radio',13,'#39c5cf')} Event Feed</div>
          <div style="display:flex;gap:6px">
            <button style="padding:3px 10px;border-radius:var(--radius);background:rgba(57,197,207,0.12);border:1px solid rgba(57,197,207,0.3);color:#39c5cf;font-size:10px;cursor:pointer;font-family:var(--font-sans)">All</button>
            <button style="padding:3px 10px;border-radius:var(--radius);background:var(--bg-tertiary);border:1px solid var(--border);color:var(--text-muted);font-size:10px;cursor:pointer;font-family:var(--font-sans)">Warnings</button>
            <button style="padding:3px 10px;border-radius:var(--radius);background:var(--bg-tertiary);border:1px solid var(--border);color:var(--text-muted);font-size:10px;cursor:pointer;font-family:var(--font-sans)">Critical</button>
          </div>
        </div>
        ${allEvents}
      </div>

      <div class="card">
        <div class="card-title">Event Sources</div>
        <div class="grid-3" style="gap:10px">
          ${MOCK.modules.map(m => {
            const cnt = MOCK.events.filter(e => e.service.replace(/-/g,'_') === m.id.replace(/-/g,'_')).length;
            return `<div style="display:flex;align-items:center;gap:10px;padding:8px;border:1px solid var(--border);border-radius:var(--radius)">
              ${pulseDot(statusColor(m.status), 6, m.status==='healthy')}
              <span style="font-size:var(--text-xs);color:var(--text-secondary);flex:1">${m.label}</span>
              <span style="font-size:11px;font-family:var(--font-mono);color:var(--text-muted)">${cnt}</span>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>`;
  }

  // ============================================================
  // PAGE — ABOUT / PLATFORM OVERVIEW
  // ============================================================
  function pageAbout() {
    const tech = [
      { cat: 'Frontend',    items: ['React 18', 'Vite', 'React Router', 'Lucide Icons'] },
      { cat: 'Backend',     items: ['FastAPI (Python)', 'Node.js Gateway', 'WebSockets', 'JWT Auth'] },
      { cat: 'Database',    items: ['PostgreSQL 15', 'Redis 7', 'SQLAlchemy', 'Alembic'] },
      { cat: 'AI/ML',       items: ['OpenAI GPT-4o', 'LangChain', 'Sentence Transformers', 'FAISS'] },
      { cat: 'Infra',       items: ['Docker Compose', 'nginx', 'Prometheus', 'Grafana'] },
    ];

    const techRows = tech.map(t => `<tr>
      <td style="font-weight:600;color:var(--text-secondary);font-size:var(--text-xs)">${t.cat}</td>
      <td><div style="display:flex;flex-wrap:wrap;gap:5px">${t.items.map(i => `<span class="skill-chip">${i}</span>`).join('')}</div></td>
    </tr>`).join('');

    const modCards = MOCK.modules.map(m => {
      const sc = statusColor(m.status);
      return `<div class="card" style="border-left:3px solid ${m.color}">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
          <div style="width:32px;height:32px;border-radius:8px;background:${m.color}22;display:flex;align-items:center;justify-content:center">
            ${icon(m.id==='control-room'?'monitor-check':m.id==='live-control'?'activity':m.id==='incident-replay'?'refresh-ccw':m.id==='career-agent'?'briefcase':m.id==='insight-engine'?'bar-chart-2':'package', 15, m.color)}
          </div>
          <div>
            <div style="font-size:var(--text-xs);font-weight:600;color:var(--text-primary)">${m.label}</div>
            ${pulseDot(sc, 6, m.status==='healthy')} <span style="font-size:10px;color:${sc};margin-left:4px">${m.status}</span>
          </div>
        </div>
        <p style="font-size:10px;color:var(--text-muted);line-height:1.6;margin:0">${m.description}</p>
      </div>`;
    }).join('');

    return `<div class="module-page animate-fade-in">
      <div class="module-header">
        <div style="display:flex;align-items:center;gap:16px">
          <div style="width:40px;height:40px;border-radius:10px;background:rgba(31,111,235,0.15);display:flex;align-items:center;justify-content:center">
            ${icon('layers', 20, '#1f6feb')}
          </div>
          <div>
            <h1 style="font-size:var(--text-2xl);font-weight:700;color:var(--text-primary)">Platform Overview</h1>
            <p style="font-size:var(--text-sm);color:var(--text-secondary)">About NeuroOps Unified Platform v${MOCK.platform.version}</p>
          </div>
        </div>
      </div>

      <div class="card" style="border-color:rgba(31,111,235,0.3)">
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px">
          <div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#1f6feb,#388bfd,#39c5cf);display:flex;align-items:center;justify-content:center;box-shadow:0 0 20px rgba(31,111,235,0.4)">
            <svg width="22" height="22" viewBox="0 0 16 16" fill="none">
              <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="white" stroke-width="1.5" fill="none"/>
              <circle cx="8" cy="8" r="2.5" fill="white"/>
            </svg>
          </div>
          <div>
            <div style="font-size:var(--text-xl);font-weight:800;color:var(--text-primary)">NeuroOps Unified Platform</div>
            <div style="font-size:var(--text-xs);color:var(--text-muted)">Version ${MOCK.platform.version} · Built 2026</div>
          </div>
        </div>
        <p style="font-size:var(--text-sm);color:var(--text-secondary);line-height:1.7;max-width:720px">
          NeuroOps is a full-stack AI operations platform that unifies incident management, real-time monitoring,
          business intelligence, career automation, and warehouse logistics into a single control surface.
          Each module is independently deployable and communicates through a central Gateway API.
        </p>
      </div>

      <div>
        ${sectionTitle('Platform Modules')}
        <div class="grid-3">${modCards}</div>
      </div>

      <div class="card">
        <div class="card-title" style="display:flex;align-items:center;gap:8px">${icon('layers',13,'var(--accent)')} Technology Stack</div>
        <table class="data-table">
          <thead><tr><th>Category</th><th>Technologies</th></tr></thead>
          <tbody>${techRows}</tbody>
        </table>
      </div>

      <div class="grid-3">
        ${metricCard('Total Modules',  '6',                   '#1f6feb', 'Independently deployed',    'layers')}
        ${metricCard('API Services',   '7',                   '#3fb950', 'Including gateway',         'server')}
        ${metricCard('Platform Uptime',MOCK.platform.uptime,  '#bc8cff', 'Current run',               'activity')}
      </div>
    </div>`;
  }

  // ============================================================
  // ROUTER
  // ============================================================
  const PAGES = {
    'dashboard':        pageDashboard,
    'control-room':     pageControlRoom,
    'live-control':     pageLiveControl,
    'incident-replay':  pageIncidentReplay,
    'career-agent':     pageCareerAgent,
    'insight-engine':   pageInsightEngine,
    'warehouse-copilot':pageWarehouseCopilot,
    'events':           pageEvents,
    'about':            pageAbout,
  };

  function getRoute() {
    const h = window.location.hash.slice(1);
    return PAGES[h] ? h : 'dashboard';
  }

  function render() {
    const route = getRoute();

    document.getElementById('sidebar').innerHTML      = renderSidebar(route);
    document.getElementById('topbar').innerHTML       = renderTopBar(route);
    document.getElementById('page-content').innerHTML = PAGES[route]();

    // Start clock
    startClock();
  }

  // ============================================================
  // CLOCK
  // ============================================================
  let clockInterval = null;
  function startClock() {
    if (clockInterval) clearInterval(clockInterval);
    function tick() {
      const el = document.getElementById('live-clock');
      if (el) {
        el.textContent = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      }
    }
    tick();
    clockInterval = setInterval(tick, 1000);
  }

  // ============================================================
  // PUBLIC API (for onclick handlers)
  // ============================================================
  window.NeuroOps = {
    navigate: function (route) {
      window.location.hash = route;
    },
    selectIncident: function (id) {
      selectedIncident = id;
      // Re-render just the page content
      const el = document.getElementById('page-content');
      if (el) el.innerHTML = pageIncidentReplay();
    },
  };

  // ============================================================
  // INIT
  // ============================================================
  window.addEventListener('hashchange', render);
  window.addEventListener('DOMContentLoaded', function () {
    if (!window.location.hash || window.location.hash === '#') {
      window.location.hash = 'dashboard';
    } else {
      render();
    }
  });

})();
