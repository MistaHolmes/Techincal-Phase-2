// Minimal client app copied from root monitoring UI with DraftDock branding.
// This file is intentionally a direct copy of the original dashboard client
// to provide a working scaffold. Adjust endpoints and UI as needed.

// ── State ──────────────────────────────────────────────────
let currentData = { checks: [], states: {}, summary: { total: 0, up: 0, down: 0, warning: 0, unknown: 0, lastRun: null } };
let responseChart = null;
let refreshTimer = null;

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  fetchStatus();
  fetchEmailStatus();
  startAutoRefresh();
  setInterval(fetchEmailStatus, 10000);
  lucide.createIcons();
});

function initTheme() {
  const saved = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeIcon(saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  updateThemeIcon(next);
}

function updateThemeIcon(theme) {
  const icon = document.getElementById('themeIcon');
  if (icon) {
    icon.setAttribute('data-lucide', theme === 'dark' ? 'sun' : 'moon');
    lucide.createIcons();
  }
}

async function fetchStatus(showSkeletons = false) {
  const loader = document.getElementById('globalLoader');
  if (showSkeletons) {
    if (loader) loader.style.display = 'flex';
    renderSkeletons();
  }

  try {
    const res = await fetch('/api/status');
    currentData = await res.json();
    updateSummary();
    renderChecks();
  } catch (err) {
    console.error('Failed to fetch status:', err);
  } finally {
    if (showSkeletons && loader) {
      loader.style.display = 'none';
      lucide.createIcons();
    }
  }
}

async function fetchEmailStatus() {
  try {
    const res = await fetch('/api/email-status');
    const data = await res.json();
    renderEmailStatusBanner(data);
  } catch (err) { }
}

function renderEmailStatusBanner(data) {
  const el = document.getElementById('emailStatusBanner');
  if (!el) return;
  const { status, accepted = [], rejected = [], subject, sentAt } = data;
  if (status === 'idle') { el.style.display = 'none'; return; }
  const cfgs = {
    queued:  { bg: 'rgba(234,179,8,0.12)',  border: '#ca8a04', color: '#ca8a04', icon: 'loader-2',   cls: 'loading', label: '⏳ Alert email queued — sending...' },
    sent:    { bg: 'rgba(34,197,94,0.10)',   border: '#16a34a', color: '#16a34a', icon: 'mail-check', cls: '',        label: `✅ Alert email delivered to all ${accepted.length} recipient(s)` },
    partial: { bg: 'rgba(234,179,8,0.12)',  border: '#ca8a04', color: '#ca8a04', icon: 'mail',       cls: '',        label: `⚠️ Partial — ${accepted.length} sent, ${rejected.length} failed (${rejected.join(', ')})` },
    failed:  { bg: 'rgba(239,68,68,0.12)',  border: '#dc2626', color: '#dc2626', icon: 'mail-x',     cls: '',        label: '❌ Alert email failed to send' },
  };
  const cfg = cfgs[status] || cfgs.failed;
  const timeStr = sentAt ? ` · ${new Date(sentAt).toLocaleTimeString()}` : '';
  el.style.display = 'flex';
  el.style.background = cfg.bg;
  el.style.borderColor = cfg.border;
  el.style.color = cfg.color;
  el.innerHTML = `<i data-lucide="${cfg.icon}" class="${cfg.cls}" style="width:16px;height:16px;flex-shrink:0;"></i><span>${cfg.label}${timeStr}</span>${subject ? `<span style="margin-left:auto;font-size:0.75rem;opacity:0.65;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:320px;">${escHtml(subject)}</span>` : ''}`;
  lucide.createIcons();
}

function updateSummary() {
  const s = currentData.summary;
  document.getElementById('totalCount').textContent = s.total;
  document.getElementById('upCount').textContent = s.up;
  document.getElementById('downCount').textContent = s.down;
  document.getElementById('warnCount').textContent = s.warning + s.unknown;
  document.getElementById('lastRun').textContent = s.lastRun
    ? `Last run: ${new Date(s.lastRun).toLocaleTimeString()}`
    : 'Not run yet';
}

function renderSkeletons() {
  const grid = document.getElementById('checksGrid');
  let html = '';
  for (let i = 0; i < 4; i++) {
    html += `<div class="group-section">`;
    html += `<div class="skeleton skeleton-title"></div>`;
    html += `<div class="checks-grid">`;
    for (let j = 0; j < 3; j++) {
      html += `
        <div class="check-card" style="border:1px solid var(--border);">
          <div class="skeleton skeleton-title" style="width: 40%"></div>
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text" style="width: 60%"></div>
        </div>`;
    }
    html += `</div></div>`;
  }
  grid.innerHTML = html;
}

const visibleLimits = {};

function renderChecks() {
  const grid = document.getElementById('checksGrid');
  const groupFilter = document.getElementById('filterGroup').value;
  const statusFilter = document.getElementById('filterStatus').value;

  let checks = currentData.checks || [];
  if (groupFilter !== 'all') checks = checks.filter(c => c.group === groupFilter);
  if (statusFilter !== 'all') checks = checks.filter(c => c.status === statusFilter);

  const groups = {};
  const groupOrder = ['backend-health', 'feature-api', 'frontend-api', 'database', 'redis', 's3', 'ec2', 'dns-tls', 'ai-ml'];
  checks.forEach(c => {
    if (!groups[c.group]) groups[c.group] = [];
    groups[c.group].push(c);
  });

  const groupLabels = {
    'backend-health': '<i data-lucide="server" style="width:16px;height:16px;"></i> Backend Health',
    'feature-api': '<i data-lucide="activity" style="width:16px;height:16px;"></i> Feature API Probes',
    'frontend-api': '<i data-lucide="layout-template" style="width:16px;height:16px;"></i> Frontend API Probes',
    'database': '<i data-lucide="database" style="width:16px;height:16px;"></i> Database (NeonDB)',
    'redis': '<i data-lucide="box" style="width:16px;height:16px;"></i> Redis',
    's3': '<i data-lucide="cloud" style="width:16px;height:16px;"></i> AWS S3',
    'ec2': '<i data-lucide="monitor" style="width:16px;height:16px;"></i> EC2 Instance',
    'dns-tls': '<i data-lucide="globe" style="width:16px;height:16px;"></i> DNS & TLS',
    'ai-ml': '<i data-lucide="bot" style="width:16px;height:16px;"></i> AI/ML Models',
  };

  window.toggleGroupExpandAll = function(groupId, totalItems) {
    if (visibleLimits[groupId] >= totalItems) {
      visibleLimits[groupId] = 6;
    } else {
      visibleLimits[groupId] = totalItems;
    }
    renderChecks();
  };

  window.showMoreChecks = function(groupId) {
    visibleLimits[groupId] = (visibleLimits[groupId] || 6) + 5;
    renderChecks();
  };

  let html = '';
  groupOrder.forEach(g => {
    if (!groups[g] || groups[g].length === 0) return;

    if (visibleLimits[g] === undefined) visibleLimits[g] = 6;

    const groupChecks = groups[g].sort((a, b) => {
      const aFail = a.status !== 'UP' ? 1 : 0;
      const bFail = b.status !== 'UP' ? 1 : 0;
      return bFail - aFail;
    });

    const up = groupChecks.filter(c => c.status === 'UP').length;
    const limit = visibleLimits[g];
    const isFullyExpanded = limit >= groupChecks.length;

    const visibleChecks = groupChecks.slice(0, limit);
    const hiddenCount = groupChecks.length - visibleChecks.length;

    html += `<div class="group-section">`;
    html += `
      <div class="group-title" style="display:flex;align-items:center;justify-content:space-between;">
        <span style="display:flex;align-items:center;gap:8px;">
          ${groupLabels[g] || g}
          <span style="font-size:0.75rem;color:var(--text-dim);font-weight:500;text-transform:none;">(${up}/${groupChecks.length} up)</span>
        </span>
        ${groupChecks.length > 6 ? `<button class="btn btn-secondary" onclick="toggleGroupExpandAll('${g}', ${groupChecks.length})" style="padding:4px 8px;font-size:0.7rem;"><i data-lucide="${isFullyExpanded ? 'chevron-up' : 'chevron-down'}" style="width:14px;height:14px;"></i></button>` : ''}
      </div>
    `;

    html += `<div class="checks-grid">`;
    visibleChecks.forEach(c => {
      const safeId = CSS.escape(c.id);
      html += `
        <div class="check-card status-${c.status}" style="cursor:pointer;" onclick="showCheckDetail('${escAttr(c.id)}')">
          <div class="check-header">
            <span class="check-name">${c.name}</span>
            <span class="check-status ${c.status}" style="display:flex;align-items:center;gap:4px;">${statusIcon(c.status)} ${c.status}</span>
          </div>
          <div class="check-msg" title="${escHtml(c.message)}">${escHtml(truncate(c.message, 120))}</div>
          <div class="check-meta">
            <span>${c.responseTimeMs}ms</span>
            <span>${new Date(c.timestamp).toLocaleTimeString()}</span>
          </div>
        </div>`;
    });
    html += `</div>`;

    if (hiddenCount > 0) {
      const showAmount = Math.min(hiddenCount, 5);
      html += `
        <button class="view-more-btn" onclick="showMoreChecks('${g}')">
          <i data-lucide="chevron-down" style="width:16px;height:16px;"></i> Show ${showAmount} more checks
        </button>
      `;
    }

    html += `</div>`;
  });

  grid.innerHTML = html || '<p style="color: var(--text-dim); text-align: center; padding: 40px;">No checks matching filter</p>';
  lucide.createIcons();
}

function escHtml(s) { return (s || '').toString().replace(/&/g, '&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function escAttr(s) { return (s || '').toString().replace(/'/g, "&#39;").replace(/"/g, '&quot;'); }
function truncate(s, n) { if (!s) return ''; return s.length > n ? s.slice(0, n-1) + '…' : s; }

function statusIcon(s) {
  if (s === 'UP') return '<i data-lucide="check-circle-2"></i>';
  if (s === 'DOWN') return '<i data-lucide="x-circle"></i>';
  if (s === 'WARNING') return '<i data-lucide="alert-triangle"></i>';
  return '<i data-lucide="circle"></i>';
}

function statusIconHtml(s) {
  return statusIcon(s);
}

function startAutoRefresh() {
  const cb = document.getElementById('autoRefresh');
  if (!cb) return;
  cb.addEventListener('change', () => {
    if (cb.checked) {
      refreshTimer = setInterval(() => fetchStatus(), 60 * 60 * 1000 + 15 * 60 * 1000);
    } else if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  });
  if (cb.checked) refreshTimer = setInterval(() => fetchStatus(), 60 * 60 * 1000 + 15 * 60 * 1000);
}

async function triggerCheck() { fetchStatus(true); await fetch('/api/check/run', { method: 'POST' }).then(() => fetchStatus(true)).catch(() => fetchStatus()); }

async function sendManualAlert() { await fetch('/api/alert/send', { method: 'POST' }).then(() => fetchAlerts()).catch(() => {}); }

async function fetchIncidents() { try { const res = await fetch('/api/incidents'); const incidents = await res.json(); renderIncidents(incidents); } catch (err) { console.error(err); } }
async function fetchAlerts() { try { const res = await fetch('/api/alerts'); const alerts = await res.json(); renderAlerts(alerts); } catch (err) { console.error(err); } }
async function fetchHistory() { try { const res = await fetch('/api/history?hours=24'); const history = await res.json(); renderChart(history); } catch (err) { console.error(err); } }
async function fetchLogs() { try { const res = await fetch('/api/logs'); const logs = await res.json(); renderLogs(logs); } catch (err) { console.error(err); } }

function renderIncidents(incidents) {
  const tbody = document.querySelector('#incidentsTable tbody');
  if (!incidents.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-dim);">No incidents recorded</td></tr>';
    return;
  }
  tbody.innerHTML = incidents.slice().reverse().map(inc => `
    <tr>
      <td>${new Date(inc.timestamp).toLocaleString()}</td>
      <td>${escHtml(inc.checkName)}</td>
      <td>${inc.group}</td>
      <td style="display:flex;align-items:center;gap:6px;font-weight:600;">
        <span style="color:var(--text);display:flex;align-items:center;gap:4px;">${statusIconHtml(inc.from)} ${inc.from}</span>
        <i data-lucide="arrow-right" style="width:14px;height:14px;color:var(--text-dim);"></i>
        <span style="color:var(--text);display:flex;align-items:center;gap:4px;">${statusIconHtml(inc.to)} ${inc.to}</span>
      </td>
      <td>${escHtml(inc.message)}</td>
    </tr>
  `).join('');
  lucide.createIcons();
}

function renderAlerts(alerts) {
  const tbody = document.querySelector('#alertsTable tbody');
  if (!alerts.length) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-dim);">No alerts sent</td></tr>'; return; }
  tbody.innerHTML = alerts.slice().reverse().map(a => `
    <tr>
      <td>${new Date(a.timestamp).toLocaleString()}</td>
      <td>${escHtml(a.checkName)}</td>
      <td>${a.severity}</td>
      <td>${a.type}</td>
      <td>${escHtml(a.subject)}</td>
      <td>${a.emailStatus || '—'}</td>
    </tr>
  `).join('');
  lucide.createIcons();
}

function renderLogs(logsData) {
  const container = document.getElementById('logsContainer');
  if (!container) return;
  if (!logsData || Object.keys(logsData).length === 0) {
    container.innerHTML = '<p style="color:var(--text-dim);text-align:center;padding:20px;">No EC2 logs available yet</p>';
    return;
  }
  let html = '';
  for (const [svc, data] of Object.entries(logsData)) {
    const ts = data.timestamp ? new Date(data.timestamp).toLocaleString() : '—';
    const logText = data.logs || data.error || 'No logs found';
    html += `
      <div style="margin-bottom: 24px; background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; overflow: hidden;">
        <div style="padding: 10px 14px; background: rgba(0,0,0,0.2); border-bottom: 1px solid var(--border); display: flex; justify-content: space-between;">
          <strong style="color: var(--accent);">${escHtml(svc)}</strong>
          <span style="font-size: 0.8rem; color: var(--text-dim);">${ts}</span>
        </div>
        <pre style="padding: 14px; font-size: 0.8rem; color: #a8b2d1; overflow-x: auto; max-height: 400px; overflow-y: auto; white-space: pre-wrap; margin: 0; font-family: monospace;">${escHtml(logText)}</pre>
      </div>
    `;
  }
  container.innerHTML = html;
}

function renderChart(history) {
  const canvas = document.getElementById('responseChart');
  if (!canvas || !history || !history.length) return;
  if (responseChart) responseChart.destroy();
  const byCheck = {};
  history.forEach(h => { if (!byCheck[h.checkId]) byCheck[h.checkId] = []; byCheck[h.checkId].push(h); });
  const top = Object.entries(byCheck).sort((a, b) => b[1].length - a[1].length).slice(0, 8);
  const colors = ['#ededed','#17c964','#f31260','#f5a524','#06b6d4','#f97316','#a855f7','#ec4899'];
  responseChart = new Chart(canvas, {
    type: 'line',
    data: {
      datasets: top.map(([id, pts], i) => ({
        label: id,
        data: pts.map(p => ({ x: new Date(p.timestamp), y: p.responseTimeMs })),
        borderColor: colors[i % colors.length],
        backgroundColor: 'transparent',
        borderWidth: 2, pointRadius: 1, tension: 0.3,
      }))
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: { type: 'timeseries', time: { unit: 'hour' }, ticks: { color: '#a1a1aa' }, grid: { color: '#333' } },
        y: { title: { display: true, text: 'Response Time (ms)', color: '#a1a1aa' }, ticks: { color: '#a1a1aa' }, grid: { color: '#333' } },
      },
      plugins: { legend: { labels: { color: '#ededed', font: { size: 11 } } } },
    }
  });
}

// ── Tab switching ─────────────────────────────────────────
function switchTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === `tab-${name}`));
  if (name === 'chart') fetchHistory();
  if (name === 'incidents') fetchIncidents();
  if (name === 'alerts') fetchAlerts();
  if (name === 'logs') fetchLogs();
}

// ── Aggregated logs modal (Down / Warning cards) ───────────
function showAggregatedLogs(status) {
  const modal = document.getElementById('aggregatedLogModal');
  const title = document.getElementById('aggregatedLogTitle');
  const content = document.getElementById('aggregatedLogContent');
  if (!modal || !title || !content) { console.warn('aggregatedLogModal not found in DOM'); return; }
  const targets = (currentData.checks || []).filter(c => c.status === status);
  title.textContent = `${status === 'DOWN' ? '❌ Down' : '⚠️ Warning/Unknown'} Checks (${targets.length})`;
  if (!targets.length) {
    content.innerHTML = '<p style="color:var(--text-dim);text-align:center;">No checks with this status</p>';
  } else {
    content.innerHTML = targets.map(c => `
      <div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:14px;margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <strong style="color:var(--text);">${escHtml(c.name)}</strong>
          <span style="font-size:0.8rem;font-weight:700;color:${c.status === 'DOWN' ? 'var(--red)' : 'var(--yellow)'}">${c.status}</span>
        </div>
        <div style="font-size:0.82rem;color:var(--text-dim);margin-bottom:4px;">${escHtml(c.message)}</div>
        <div style="font-size:0.75rem;color:var(--text-dim);">${c.responseTimeMs}ms · ${new Date(c.timestamp).toLocaleTimeString()}</div>
      </div>`).join('');
  }
  modal.style.display = 'flex';
}

// ── Export CSV ─────────────────────────────────────────────
function exportCSV() {
  window.open('/api/export/csv', '_blank');
}

// ── Severity badge ─────────────────────────────────────────
function severityBadge(s) {
  const colors = { CRITICAL: 'var(--red)', WARNING: 'var(--yellow)', NOTICE: '#a1a1aa' };
  return `<span style="color:${colors[s] || '#a1a1aa'};font-size:0.75rem;font-weight:700;">${escHtml(s)}</span>`;
}

function showCheckDetail(id) {
  const modal = document.getElementById('checkDetailModal');
  const content = document.getElementById('checkDetailContent');
  modal.style.display = 'flex';
  content.innerHTML = `<pre style="white-space:pre-wrap;">Loading...</pre>`;
  fetch(`/api/check-log/${encodeURIComponent(id)}`).then(r => r.json()).then(json => { content.innerHTML = `<pre style="white-space:pre-wrap;">${escHtml(JSON.stringify(json, null, 2))}</pre>`; }).catch(() => { content.innerHTML = `<pre>No log</pre>`; });
}

function closeCheckDetail(){ document.getElementById('checkDetailModal').style.display='none'; }
function closeAggregatedLogs(){ document.getElementById('aggregatedLogModal').style.display='none'; }
