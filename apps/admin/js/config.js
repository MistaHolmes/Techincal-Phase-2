// ── Admin Panel Shared Configuration ─────────────────────────────────────────
const API_BASE = 'http://localhost:4000/api/admin';

// ── Fetch Helper with Client-Side Caching (Session Storage) ─────────────────────
async function fetchAdmin(path, options = {}) {
  const method = options.method || 'GET';
  const cacheKey = `admin_cache_${path}`;
  const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minute cache lifespan

  // 1. Return from cache if valid GET request
  if (method === 'GET') {
    const cachedItem = sessionStorage.getItem(cacheKey);
    if (cachedItem) {
      try {
        const { timestamp, data } = JSON.parse(cachedItem);
        if (Date.now() - timestamp < CACHE_EXPIRY_MS) {
          console.log(`[Cache Hit] serving ${path} from sessionStorage`);
          return data;
        }
      } catch (e) {
        console.warn('Cache parsing failed, wiping cache entry.');
        sessionStorage.removeItem(cacheKey);
      }
    }
  }

  // 2. Clear cache if it's a mutating request (POST, PATCH, DELETE)
  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method.toUpperCase())) {
    sessionStorage.clear(); // Simply clear all admin cache so lists refresh
    console.log(`[Cache Cleared] due to ${method} request`);
  }

  // 3. Perform network fetch
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  
  const fetchedData = await res.json();

  // 4. Save to cache
  if (method === 'GET') {
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify({
        timestamp: Date.now(),
        data: fetchedData
      }));
    } catch(e) {
      console.warn("Could not save to session storage:", e);
    }
  }

  return fetchedData;
}

// ── Number Formatter ─────────────────────────────────────────────────────────
function formatNumber(num) {
  if (num === null || num === undefined) return '0';
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  return num.toLocaleString();
}

// ── Relative Time ────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
  return new Date(dateStr).toLocaleDateString();
}

// ── Toast Notification ───────────────────────────────────────────────────────
function showToast(message, type = 'success') {
  const existing = document.getElementById('admin-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'admin-toast';
  toast.style.cssText = `
    position:fixed; bottom:24px; right:24px; z-index:9999;
    padding:14px 24px; border-radius:12px; font-size:14px; font-weight:600;
    color:#fff; box-shadow:0 8px 32px rgba(0,0,0,.18);
    animation: slideIn .3s ease; font-family:'Manrope',sans-serif;
    background: ${type === 'error' ? '#b41340' : type === 'warning' ? '#d97706' : '#16a34a'};
  `;
  toast.textContent = message;
  document.body.appendChild(toast);

  if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}`;
    document.head.appendChild(style);
  }

  setTimeout(() => toast.remove(), 3500);
}

// ── Loading State Helper ─────────────────────────────────────────────────────
function showLoading(elementId) {
  const el = document.getElementById(elementId);
  if (el) el.innerHTML = '<div style="text-align:center;padding:2rem;color:#94a3b8;font-size:14px;">Loading...</div>';
}
