// Zero-dependency Node server: serves /public and a small JSON API.
// Run: npm start   (Node 18+)
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { seed } = require('../scripts/seed');

/* ---------- tiny .env loader (no dotenv needed) ---------- */
const ROOT = path.join(__dirname, '..');
try {
  fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/).forEach(line => {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !line.trim().startsWith('#') && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  });
} catch (e) { /* no .env is fine */ }

const PORT = Number(process.env.PORT) || 3000;
const CONTACT_EMAIL = process.env.NOMINATIM_EMAIL || ''; // optional, asked for by OpenStreetMap's usage policy
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const PUBLIC_DIR = path.join(ROOT, 'public');
const ADV_FILE = path.join(ROOT, 'data', 'advisories.json');
const REP_FILE = path.join(ROOT, 'data', 'reports.json');

/* ---------- storage ---------- */
function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return fallback; }
}
function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
}
if (!fs.existsSync(ADV_FILE)) { seed(ADV_FILE); console.log('Seeded demo advisories.'); }

/* ---------- helpers ---------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };

function send(res, code, body, headers = {}) {
  const isObj = typeof body === 'object' && !Buffer.isBuffer(body);
  res.writeHead(code, Object.assign({
    'Content-Type': isObj ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8',
    'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store'
  }, headers));
  res.end(isObj ? JSON.stringify(body) : body);
}

function readBody(req, limit = 20000) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > limit) { reject(new Error('too large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString() || '{}')); } catch (e) { reject(new Error('bad json')); } });
    req.on('error', reject);
  });
}

function isAdmin(req) {
  if (!ADMIN_TOKEN) return false;
  const given = Buffer.from(String(req.headers['x-admin-token'] || ''));
  const real = Buffer.from(ADMIN_TOKEN);
  return given.length === real.length && crypto.timingSafeEqual(given, real);
}

const num = (v, min, max) => { const n = Number(v); return Number.isFinite(n) && n >= min && n <= max ? n : null; };
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

function cleanAdvisory(b) {
  const type = b.type === 'water' || b.type === 'power' ? b.type : null;
  const lat = num(b.lat, -90, 90), lng = num(b.lng, -180, 180), radius = num(b.radius, 100, 30000);
  const area = str(b.area, 120), en = str(b.reason && b.reason.en, 400), ceb = str(b.reason && b.reason.ceb, 400) || en;
  const start = new Date(b.start), eta = new Date(b.eta);
  if (!type || lat === null || lng === null || radius === null || !area || !en || isNaN(start) || isNaN(eta) || eta <= start) return null;
  return { id: crypto.randomUUID(), type, area, lat, lng, radius, reason: { en, ceb },
    start: start.toISOString(), eta: eta.toISOString(), source: str(b.source, 120) || 'Admin' };
}

/* simple per-IP rate limit for community reports: 5 per 10 minutes */
const hits = new Map();
function limited(ip) {
  const now = Date.now(), list = (hits.get(ip) || []).filter(t => now - t < 600000);
  if (list.length >= 5) { hits.set(ip, list); return true; }
  list.push(now); hits.set(ip, list); return false;
}

/* ---------- free geocoding via OpenStreetMap Nominatim ----------
   Usage policy: max 1 request/second, identify the app, cache results, no autocomplete.
   So the browser calls /api/geocode and this server does the throttled, cached lookup. */
const geoCache = new Map();           // query -> { at, data }
let geoQueue = Promise.resolve(), lastGeo = 0;
const geoHits = new Map();            // per-IP limiter: 20 searches per minute

function geoLimited(ip) {
  const now = Date.now(), list = (geoHits.get(ip) || []).filter(t => now - t < 60000);
  const over = list.length >= 20; if (!over) list.push(now);
  geoHits.set(ip, list); return over;
}
function throttled(fn) {
  const run = geoQueue.then(async () => {
    const wait = Math.max(0, lastGeo + 1100 - Date.now());
    if (wait) await new Promise(r => setTimeout(r, wait));
    lastGeo = Date.now();
    return fn();
  });
  geoQueue = run.catch(() => {});
  return run;
}
async function geocode(q) {
  const key = q.toLowerCase();
  const hit = geoCache.get(key);
  if (hit && Date.now() - hit.at < 24 * 3600e3) return hit.data;
  const u = new URL('https://nominatim.openstreetmap.org/search');
  u.search = new URLSearchParams({
    format: 'jsonv2', limit: '5', countrycodes: 'ph', q,
    viewbox: '125.2,7.5,126.0,6.5', bounded: '0', // prefer Davao area, but not limited to it
    ...(CONTACT_EMAIL ? { email: CONTACT_EMAIL } : {})
  }).toString();
  const r = await throttled(() => fetch(u, { headers: { 'User-Agent': 'tubig-kuryente-tracker/1.0', 'Accept-Language': 'en' } }));
  if (!r.ok) throw new Error('geocoder returned ' + r.status);
  const data = (await r.json()).map(x => ({ name: String(x.display_name).slice(0, 160), lat: Number(x.lat), lng: Number(x.lon) }))
    .filter(x => Number.isFinite(x.lat) && Number.isFinite(x.lng));
  if (geoCache.size > 500) geoCache.clear();
  geoCache.set(key, { at: Date.now(), data });
  return data;
}

/* ---------- API ---------- */
async function api(req, res, url) {
  const p = url.pathname;

  if (req.method === 'GET' && p === '/api/geocode') {
    const q = str(url.searchParams.get('q') || '', 120);
    if (q.length < 3) return send(res, 400, { error: 'query too short' });
    if (geoLimited(req.socket.remoteAddress || 'x')) return send(res, 429, { error: 'too many searches, wait a minute' });
    try { return send(res, 200, await geocode(q)); }
    catch (e) { return send(res, 502, { error: 'address search is unavailable right now' }); }
  }

  if (req.method === 'GET' && p === '/api/advisories') {
    const cutoff = Date.now() - 6 * 3600e3; // keep recently restored ones for 6h
    return send(res, 200, readJson(ADV_FILE, []).filter(a => new Date(a.eta).getTime() > cutoff));
  }

  if (req.method === 'POST' && p === '/api/advisories') {
    if (!isAdmin(req)) return send(res, 401, { error: 'unauthorized' });
    const adv = cleanAdvisory(await readBody(req));
    if (!adv) return send(res, 400, { error: 'invalid advisory' });
    const all = readJson(ADV_FILE, []); all.push(adv); writeJson(ADV_FILE, all);
    return send(res, 201, adv);
  }

  if (req.method === 'DELETE' && p.startsWith('/api/advisories/')) {
    if (!isAdmin(req)) return send(res, 401, { error: 'unauthorized' });
    const id = decodeURIComponent(p.split('/').pop());
    const all = readJson(ADV_FILE, []), next = all.filter(a => a.id !== id);
    writeJson(ADV_FILE, next);
    return send(res, 200, { removed: all.length - next.length });
  }

  if (req.method === 'GET' && p === '/api/reports') { // recent community reports (last 3h)
    const since = Date.now() - 3 * 3600e3;
    return send(res, 200, readJson(REP_FILE, []).filter(r => r.at > since).map(({ type, lat, lng, at }) => ({ type, lat, lng, at })));
  }

  if (req.method === 'POST' && p === '/api/reports') {
    const ip = req.socket.remoteAddress || 'x';
    if (limited(ip)) return send(res, 429, { error: 'too many reports, try later' });
    const b = await readBody(req);
    const type = b.type === 'water' || b.type === 'power' ? b.type : null;
    const lat = num(b.lat, -90, 90), lng = num(b.lng, -180, 180);
    if (!type || lat === null || lng === null) return send(res, 400, { error: 'invalid report' });
    // round to ~100 m so exact home locations are not stored
    const r = { type, lat: Math.round(lat * 1000) / 1000, lng: Math.round(lng * 1000) / 1000, at: Date.now() };
    const all = readJson(REP_FILE, []).filter(x => x.at > Date.now() - 24 * 3600e3); all.push(r); writeJson(REP_FILE, all);
    return send(res, 201, { ok: true });
  }

  return send(res, 404, { error: 'not found' });
}

/* ---------- static files ---------- */
function serveStatic(req, res, url) {
  let rel = decodeURIComponent(url.pathname);
  if (rel === '/') rel = '/index.html';
  const file = path.normalize(path.join(PUBLIC_DIR, rel));
  if (!file.startsWith(PUBLIC_DIR + path.sep)) return send(res, 403, 'forbidden');
  fs.readFile(file, (err, data) => {
    if (err) return send(res, 404, 'not found');
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' });
    res.end(data);
  });
}

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'method not allowed');
    serveStatic(req, res, url);
  } catch (e) {
    send(res, e.message === 'too large' ? 413 : 400, { error: e.message });
  }
}).listen(PORT, () => {
  console.log('Tracker running at http://localhost:' + PORT);
  if (!ADMIN_TOKEN) console.log('Note: ADMIN_TOKEN is empty, so the admin API is disabled.');
});
