// Zero-dependency Node server: serves /public and a small JSON API.
// Run: npm start   (Node 18+)
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
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
const CONTACT_EMAIL = process.env.NOMINATIM_EMAIL || '';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const TRUST_PROXY = process.env.TRUST_PROXY === '1'; // set to 1 when running behind nginx / a PaaS router
const PUBLIC_DIR = path.join(ROOT, 'public');
const DATA_DIR = path.join(ROOT, 'data');
const ADV_FILE = path.join(DATA_DIR, 'advisories.json');
const REP_FILE = path.join(DATA_DIR, 'reports.json');
const PSGC_DIR = path.join(DATA_DIR, 'psgc-cache');
const PSGC_API = 'https://psgc.billyjamesramos.com/api/v1';

/* ---------- storage: JSON on disk, held in memory so requests never wait on the disk ---------- */
function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return fallback; }
}
function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
}
if (!fs.existsSync(ADV_FILE)) { seed(ADV_FILE); console.log('Seeded source-backed Davao Light advisories.'); }

let advisories = readJson(ADV_FILE, []);
let reports = readJson(REP_FILE, []);
// Source-backed schedules are never regenerated as fake/live incidents. Refresh the
// seed snapshot manually from the utility's latest notice when schedules change.
let advVersion = Date.now();      // bumps on every change; used as the ETag for /api/advisories
let advDirty = false, repDirty = false;
function saveAdvisories() { advVersion = Date.now(); advDirty = true; flush(); }
function saveReports() { repDirty = true; flush(); }
let flushTimer = null;
function flush() {            // coalesce bursts of writes into one disk write
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    try { if (advDirty) { writeJson(ADV_FILE, advisories); advDirty = false; } } catch (e) { console.error('save advisories failed', e.message); }
    try { if (repDirty) { writeJson(REP_FILE, reports); repDirty = false; } } catch (e) { console.error('save reports failed', e.message); }
  }, 150);
}
function flushNow() { clearTimeout(flushTimer); flushTimer = null; try { if (advDirty) writeJson(ADV_FILE, advisories); if (repDirty) writeJson(REP_FILE, reports); } catch (e) { /* ignore */ } }
['SIGINT', 'SIGTERM'].forEach(s => process.on(s, () => { flushNow(); process.exit(0); }));

/* ---------- helpers ---------- */
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json; charset=utf-8'
};
const COMPRESSIBLE = /^(text\/|application\/json|image\/svg)/;

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(self), camera=(), microphone=()',
  'Content-Security-Policy': "default-src 'self'; img-src 'self' data: https://tile.openstreetmap.org https://*.tile.openstreetmap.org; " +
    "style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
};

function clientIp(req) {
  if (TRUST_PROXY) {
    const f = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    if (f) return f;
  }
  return req.socket.remoteAddress || 'x';
}

/* send a body, gzip-compressed when the client accepts it and it is worth it */
function respond(req, res, code, body, headers = {}) {
  const buf = Buffer.isBuffer(body) ? body : Buffer.from(body);
  const h = Object.assign({}, SECURITY_HEADERS, headers);
  const type = String(h['Content-Type'] || '');
  h.Vary = 'Accept-Encoding';
  if (buf.length > 1024 && COMPRESSIBLE.test(type) && /\bgzip\b/.test(String(req.headers['accept-encoding'] || ''))) {
    const z = zlib.gzipSync(buf, { level: 6 });
    h['Content-Encoding'] = 'gzip'; h['Content-Length'] = z.length;
    res.writeHead(code, h); return res.end(req.method === 'HEAD' ? undefined : z);
  }
  h['Content-Length'] = buf.length;
  res.writeHead(code, h); res.end(req.method === 'HEAD' ? undefined : buf);
}
function send(req, res, code, body, headers = {}) {
  const isObj = typeof body === 'object' && !Buffer.isBuffer(body);
  respond(req, res, code, isObj ? JSON.stringify(body) : String(body), Object.assign({
    'Content-Type': isObj ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8', 'Cache-Control': 'no-store'
  }, headers));
}
/* JSON with an ETag, so unchanged polls cost a 304 with no body */
function sendJsonEtag(req, res, data, etagSeed, maxAge = 0) {
  const body = JSON.stringify(data);
  const etag = '"' + crypto.createHash('sha1').update(String(etagSeed) + body.length).digest('base64url').slice(0, 20) + '"';
  const cc = 'public, max-age=' + maxAge + ', must-revalidate';
  if (req.headers['if-none-match'] === etag) { res.writeHead(304, Object.assign({}, SECURITY_HEADERS, { ETag: etag, 'Cache-Control': cc })); return res.end(); }
  respond(req, res, 200, body, { 'Content-Type': 'application/json; charset=utf-8', ETag: etag, 'Cache-Control': cc });
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
/* slow down token guessing: 10 failed admin attempts per 15 minutes per IP */
const authFails = new Map();
function authBlocked(ip) {
  const now = Date.now(), list = (authFails.get(ip) || []).filter(t => now - t < 900e3);
  authFails.set(ip, list); return list.length >= 10;
}
function authFailed(ip) { const l = authFails.get(ip) || []; l.push(Date.now()); authFails.set(ip, l); }
function requireAdmin(req, res) {
  const ip = clientIp(req);
  if (authBlocked(ip)) { send(req, res, 429, { error: 'Too many failed attempts. Try again in 15 minutes.' }); return false; }
  if (!isAdmin(req)) { authFailed(ip); send(req, res, 401, { error: 'unauthorized' }); return false; }
  return true;
}

const num = (v, min, max) => { const n = Number(v); return Number.isFinite(n) && n >= min && n <= max ? n : null; };
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

function cleanLocation(l) {
  if (!l || typeof l !== 'object') return null;
  const loc = {
    regionCode: str(l.regionCode, 10), provinceCode: str(l.provinceCode, 10),
    cityMunicipalityCode: str(l.cityMunicipalityCode, 10), barangayCode: str(l.barangayCode, 10),
    region: str(l.region, 100), province: str(l.province, 100),
    cityMunicipality: str(l.cityMunicipality, 100), barangay: str(l.barangay, 100)
  };
  return loc.regionCode && loc.cityMunicipalityCode && loc.barangayCode ? loc : null;
}

/* validate a full advisory. Returns { error } or { value } */
function cleanAdvisory(b, base) {
  const type = b.type === 'water' || b.type === 'power' ? b.type : null;
  const lat = num(b.lat, -90, 90), lng = num(b.lng, -180, 180), radius = num(b.radius, 100, 30000);
  const area = str(b.area, 240), en = str(b.reason && b.reason.en, 400), ceb = str(b.reason && b.reason.ceb, 400) || en;
  const start = new Date(b.start), eta = new Date(b.eta);
  if (!type) return { error: 'Choose water or electricity.' };
  if (lat === null || lng === null) return { error: 'Set the zone center on the map.' };
  if (radius === null) return { error: 'Radius must be between 100 and 30,000 meters.' };
  if (!area) return { error: 'Describe the affected area.' };
  if (!en) return { error: 'Enter the reason in English.' };
  if (isNaN(start) || isNaN(eta)) return { error: 'Enter valid start and expected-back times.' };
  if (eta <= start) return { error: 'Expected-back time must be after the start time.' };
  const location = cleanLocation(b.location) || (base && base.location) || null;
  if (!location) return { error: 'Select the region, city / municipality and barangay.' };
  const note = str(b.note, 300);
  return { value: {
    id: base ? base.id : crypto.randomUUID(), type, area, location, lat, lng, radius, reason: { en, ceb },
    start: start.toISOString(), eta: eta.toISOString(), source: str(b.source, 120) || 'Admin', note,
    createdAt: base ? base.createdAt || base.start : new Date().toISOString(), updatedAt: new Date().toISOString()
  } };
}

/* simple per-IP rate limit for community reports: 5 per 10 minutes */
const hits = new Map();
function limited(ip) {
  const now = Date.now(), list = (hits.get(ip) || []).filter(t => now - t < 600000);
  if (list.length >= 5) { hits.set(ip, list); return true; }
  list.push(now); hits.set(ip, list); return false;
}
setInterval(() => { // keep the in-memory limiter maps from growing forever
  const now = Date.now();
  for (const m of [hits, geoHits, authFails]) for (const [k, v] of m) if (!v.length || now - v[v.length - 1] > 900e3) m.delete(k);
}, 600e3).unref();

/* ---------- free geocoding via OpenStreetMap Nominatim ----------
   Usage policy: max 1 request/second, identify the app, cache results, no autocomplete. */
const geoCache = new Map();
let geoQueue = Promise.resolve(), lastGeo = 0;
const geoHits = new Map();
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
async function fetchTimeout(url, opts = {}, ms = 8000) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), ms);
  try { return await fetch(url, Object.assign({}, opts, { signal: ctl.signal })); } finally { clearTimeout(t); }
}
async function geocode(q) {
  const key = q.toLowerCase();
  const hit = geoCache.get(key);
  if (hit && Date.now() - hit.at < 24 * 3600e3) return hit.data;
  const u = new URL('https://nominatim.openstreetmap.org/search');
  u.search = new URLSearchParams({
    format: 'jsonv2', limit: '5', countrycodes: 'ph', q,
    viewbox: '125.2,7.5,126.0,6.5', bounded: '0',
    ...(CONTACT_EMAIL ? { email: CONTACT_EMAIL } : {})
  }).toString();
  const r = await throttled(() => fetchTimeout(u, { headers: { 'User-Agent': 'safezone-outage-tracker/2.0', 'Accept-Language': 'en' } }));
  if (!r.ok) throw new Error('geocoder returned ' + r.status);
  const data = (await r.json()).map(x => ({ name: String(x.display_name).slice(0, 160), lat: Number(x.lat), lng: Number(x.lon) }))
    .filter(x => Number.isFinite(x.lat) && Number.isFinite(x.lng));
  if (geoCache.size > 500) geoCache.clear();
  geoCache.set(key, { at: Date.now(), data });
  return data;
}

/* ---------- Philippine location lists (PSGC), proxied + cached ----------
   The browser used to call a slow third-party API for every dropdown. Now the server fetches each list once,
   keeps it in memory and on disk for 30 days, and serves stale copies if the upstream is down. */
const PSGC_ALLOWED = [
  /^\/regions$/, /^\/regions\/\d+\/provinces$/, /^\/provinces\/\d+\/cities-municipalities$/,
  /^\/cities-municipalities$/, /^\/cities-municipalities\/\d+\/barangays$/
];
const PSGC_TTL = 30 * 24 * 3600e3;
const psgcMem = new Map();      // key -> { at, rows }
const psgcInflight = new Map(); // key -> Promise
function psgcFile(key) { return path.join(PSGC_DIR, crypto.createHash('sha1').update(key).digest('hex') + '.json'); }
async function psgc(pathname, search) {
  const key = pathname + '?' + search;
  const mem = psgcMem.get(key);
  if (mem && Date.now() - mem.at < PSGC_TTL) return mem.rows;
  let disk = null;
  try { disk = JSON.parse(fs.readFileSync(psgcFile(key), 'utf8')); } catch (e) { /* none yet */ }
  if (disk && Date.now() - disk.at < PSGC_TTL) { psgcMem.set(key, disk); return disk.rows; }
  if (psgcInflight.has(key)) return psgcInflight.get(key);
  const job = (async () => {
    try {
      const r = await fetchTimeout(PSGC_API + pathname + (search ? '?' + search : ''), { headers: { Accept: 'application/json' } }, 10000);
      if (!r.ok) throw new Error('psgc ' + r.status);
      const json = await r.json();
      const rows = (json.data || []).map(x => ({ code: String(x.code), name: String(x.name) }));
      if (!rows.length && !/\/regions\/|province=none/.test(key + search)) throw new Error('empty');
      const entry = { at: Date.now(), rows };
      psgcMem.set(key, entry);
      try { fs.mkdirSync(PSGC_DIR, { recursive: true }); fs.writeFileSync(psgcFile(key), JSON.stringify(entry)); } catch (e) { /* cache is best-effort */ }
      return rows;
    } catch (e) {
      if (disk) return disk.rows;   // stale is better than nothing
      throw e;
    } finally { psgcInflight.delete(key); }
  })();
  psgcInflight.set(key, job);
  return job;
}

/* ---------- API ---------- */
async function api(req, res, url) {
  const p = url.pathname, m = req.method;

  if (m === 'GET' && p === '/api/health') return send(req, res, 200, { ok: true, advisories: advisories.length, uptime: Math.round(process.uptime()) });

  if (m === 'GET' && p.startsWith('/api/psgc/')) {
    const sub = p.slice('/api/psgc'.length);
    if (!PSGC_ALLOWED.some(re => re.test(sub))) return send(req, res, 404, { error: 'not found' });
    const qs = new URLSearchParams();
    for (const k of ['region', 'province', 'limit']) {
      const v = url.searchParams.get(k);
      if (v !== null && /^[a-z0-9]{1,12}$/i.test(v)) qs.set(k, v);
    }
    try { const rows = await psgc(sub, qs.toString()); return sendJsonEtag(req, res, rows, 'psgc', 86400); }
    catch (e) { return send(req, res, 502, { error: 'The Philippine location list is unavailable right now.' }); }
  }

  if (m === 'GET' && p === '/api/geocode') {
    const q = str(url.searchParams.get('q') || '', 120);
    if (q.length < 3) return send(req, res, 400, { error: 'query too short' });
    if (geoLimited(clientIp(req))) return send(req, res, 429, { error: 'too many searches, wait a minute' });
    try { return send(req, res, 200, await geocode(q), { 'Cache-Control': 'private, max-age=3600' }); }
    catch (e) { return send(req, res, 502, { error: 'address search is unavailable right now' }); }
  }

  if (m === 'GET' && p === '/api/advisories') {
    const cutoff = Date.now() - 6 * 3600e3; // keep recently restored ones for 6h
    if (url.searchParams.get('all') === '1') { // admin view includes everything
      if (!requireAdmin(req, res)) return;
      return send(req, res, 200, advisories);
    }
    return sendJsonEtag(req, res, advisories.filter(a => new Date(a.eta).getTime() > cutoff), advVersion, 0);
  }

  if (m === 'GET' && p === '/api/admin/verify') {
    if (!requireAdmin(req, res)) return;
    return send(req, res, 200, { ok: true });
  }

  if (m === 'POST' && p === '/api/advisories') {
    if (!requireAdmin(req, res)) return;
    const r = cleanAdvisory(await readBody(req));
    if (r.error) return send(req, res, 400, { error: r.error });
    advisories.push(r.value); saveAdvisories();
    return send(req, res, 201, r.value);
  }

  let mm = p.match(/^\/api\/advisories\/([^/]+)(?:\/(resolve))?$/);
  if (mm) {
    const id = decodeURIComponent(mm[1]);
    if (m === 'DELETE' && !mm[2]) {
      if (!requireAdmin(req, res)) return;
      const before = advisories.length; advisories = advisories.filter(a => a.id !== id);
      if (advisories.length !== before) saveAdvisories();
      return send(req, res, 200, { removed: before - advisories.length });
    }
    if (m === 'PUT' && !mm[2]) {   // edit: send the full advisory (the admin form does)
      if (!requireAdmin(req, res)) return;
      const i = advisories.findIndex(a => a.id === id);
      if (i < 0) return send(req, res, 404, { error: 'Advisory not found.' });
      const r = cleanAdvisory(await readBody(req), advisories[i]);
      if (r.error) return send(req, res, 400, { error: r.error });
      advisories[i] = r.value; saveAdvisories();
      return send(req, res, 200, r.value);
    }
    if (m === 'POST' && mm[2] === 'resolve') {  // mark as restored right now
      if (!requireAdmin(req, res)) return;
      const a = advisories.find(x => x.id === id);
      if (!a) return send(req, res, 404, { error: 'Advisory not found.' });
      const now = new Date();
      if (new Date(a.start) >= now) a.start = new Date(now.getTime() - 60e3).toISOString();
      a.eta = now.toISOString(); a.updatedAt = now.toISOString(); a.resolved = true; saveAdvisories();
      return send(req, res, 200, a);
    }
  }

  if (m === 'GET' && p === '/api/reports') { // recent community reports (last 3h)
    const since = Date.now() - 3 * 3600e3;
    const out = reports.filter(r => r.at > since).map(({ type, lat, lng, at }) => ({ type, lat, lng, at }));
    return sendJsonEtag(req, res, out, out.length + ':' + (out.length ? out[out.length - 1].at : 0), 0);
  }

  if (m === 'POST' && p === '/api/reports') {
    if (limited(clientIp(req))) return send(req, res, 429, { error: 'Too many reports. Try again later.' });
    const b = await readBody(req);
    const type = b.type === 'water' || b.type === 'power' ? b.type : null;
    const lat = num(b.lat, -90, 90), lng = num(b.lng, -180, 180);
    if (!type || lat === null || lng === null) return send(req, res, 400, { error: 'invalid report' });
    // round to ~100 m so exact home locations are not stored
    reports = reports.filter(x => x.at > Date.now() - 24 * 3600e3);
    reports.push({ type, lat: Math.round(lat * 1000) / 1000, lng: Math.round(lng * 1000) / 1000, at: Date.now() });
    saveReports();
    return send(req, res, 201, { ok: true });
  }

  return send(req, res, 404, { error: 'not found' });
}

/* ---------- static files: read once, cache in memory, compress once ---------- */
const staticCache = new Map(); // file -> { mtime, raw, gz, etag, type }
function loadStatic(file) {
  let st; try { st = fs.statSync(file); } catch (e) { return null; }
  if (!st.isFile()) return null;
  const c = staticCache.get(file);
  if (c && c.mtime === st.mtimeMs) return c;
  const raw = fs.readFileSync(file), type = MIME[path.extname(file)] || 'application/octet-stream';
  const entry = {
    mtime: st.mtimeMs, raw, type,
    gz: raw.length > 1024 && COMPRESSIBLE.test(type) ? zlib.gzipSync(raw, { level: 9 }) : null,
    etag: '"' + crypto.createHash('sha1').update(raw).digest('base64url').slice(0, 20) + '"'
  };
  staticCache.set(file, entry); return entry;
}
function serveStatic(req, res, url) {
  let rel;
  try { rel = decodeURIComponent(url.pathname); } catch (e) { return send(req, res, 400, 'bad request'); }
  if (rel === '/') rel = '/index.html';
  if (rel === '/admin') rel = '/admin.html';
  const file = path.normalize(path.join(PUBLIC_DIR, rel));
  if (!file.startsWith(PUBLIC_DIR + path.sep)) return send(req, res, 403, 'forbidden');
  const e = loadStatic(file);
  if (!e) return send(req, res, 404, 'not found');
  const immutable = rel.startsWith('/vendor/');
  const h = Object.assign({}, SECURITY_HEADERS, {
    'Content-Type': e.type, ETag: e.etag, Vary: 'Accept-Encoding',
    'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'public, max-age=300, must-revalidate'
  });
  if (req.headers['if-none-match'] === e.etag) { res.writeHead(304, h); return res.end(); }
  const useGz = e.gz && /\bgzip\b/.test(String(req.headers['accept-encoding'] || ''));
  const body = useGz ? e.gz : e.raw;
  if (useGz) h['Content-Encoding'] = 'gzip';
  h['Content-Length'] = body.length;
  res.writeHead(200, h); res.end(req.method === 'HEAD' ? undefined : body);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(req, res, 405, 'method not allowed');
    serveStatic(req, res, url);
  } catch (e) {
    if (!res.headersSent) send(req, res, e.message === 'too large' ? 413 : 400, { error: e.message });
  }
});
server.keepAliveTimeout = 65000;
server.listen(PORT, () => {
  console.log('SafeZone tracker running at http://localhost:' + PORT);
  if (!ADMIN_TOKEN) console.log('Note: ADMIN_TOKEN is empty, so the admin API is disabled.');
  // warm the region list so the first visitor does not wait on the upstream API
  psgc('/regions', 'limit=100').catch(() => {});
});
