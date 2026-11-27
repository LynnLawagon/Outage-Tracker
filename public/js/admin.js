/* SafeZone admin console: sign in, add / edit / extend / restore / delete advisories. */
'use strict';
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const H = 3600e3, MIN = 60e3;
const TYPE_LABEL = { water: 'Water', power: 'Electricity' };
const icon = n => '<svg class="ico ' + n + '" aria-hidden="true"><use href="#i-' + n + '"/></svg>';
const state = { token: '', all: [], editing: null, type: 'water', busy: false };
let map, pin, preview;

/* ---------- small helpers ---------- */
function toast(msg, isError) {
  let wrap = document.querySelector('.toast-wrap');
  if (!wrap) { wrap = document.createElement('div'); wrap.className = 'toast-wrap'; wrap.setAttribute('role', 'status'); document.body.appendChild(wrap); }
  const el = document.createElement('div'); el.className = 'toast' + (isError ? ' error' : ''); el.textContent = msg;
  wrap.appendChild(el); setTimeout(() => el.remove(), 3800);
}
const statusOf = a => { const n = Date.now(); return n > new Date(a.eta) ? 'restored' : n >= new Date(a.start) ? 'ongoing' : 'scheduled'; };
const fmt = iso => new Date(iso).toLocaleString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
const toLocalInput = d => { const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 16); };
function relative(iso) {
  const ms = new Date(iso) - Date.now(), abs = Math.abs(ms), h = Math.floor(abs / H), m = Math.round((abs % H) / MIN);
  const s = h >= 48 ? Math.round(h / 24) + ' d' : (h ? h + ' h ' : '') + (h < 6 ? m + ' min' : '');
  return ms >= 0 ? 'in ' + s.trim() : s.trim() + ' ago';
}
async function api(path, opts = {}) {
  const r = await fetch(path, Object.assign({}, opts, { headers: Object.assign({ 'Content-Type': 'application/json', 'X-Admin-Token': state.token }, opts.headers || {}) }));
  let body = null; try { body = await r.json(); } catch (e) { /* no body */ }
  if (!r.ok) { const err = new Error((body && body.error) || 'Request failed (' + r.status + ')'); err.status = r.status; throw err; }
  return body;
}
function confirmDialog(title, body, okLabel) {
  return new Promise(resolve => {
    const d = $('confirm'); $('cTitle').textContent = title; $('cBody').textContent = body; $('cOk').textContent = okLabel;
    d.onclose = () => resolve(d.returnValue === 'ok'); d.returnValue = 'cancel'; d.showModal();
  });
}

/* ---------- sign in ---------- */
function showConsole(on) {
  $('loginView').hidden = on; $('consoleView').hidden = !on; $('logout').hidden = !on;
  if (on) { if (!map) initMap(); setTimeout(() => map.invalidateSize(), 50); }
}
async function signIn(token, silent) {
  state.token = token;
  try {
    await api('/api/admin/verify');
    try { sessionStorage.setItem('sz-admin', token); } catch (e) { /* ignore */ }
    showConsole(true); await refresh(); loadRegions();
    return true;
  } catch (e) {
    state.token = ''; try { sessionStorage.removeItem('sz-admin'); } catch (x) { /* ignore */ }
    if (!silent) {
      const el = $('loginError'); el.hidden = false;
      el.textContent = e.status === 401 ? 'That token is not correct. Check ADMIN_TOKEN in your .env file.' :
        e.status === 429 ? e.message : 'Could not reach the server. Check that it is running, then try again.';
    }
    return false;
  }
}
$('loginForm').addEventListener('submit', async e => {
  e.preventDefault(); $('loginError').hidden = true;
  const b = $('loginBtn'); b.disabled = true; b.textContent = 'Signing in...';
  await signIn($('token').value.trim(), false);
  b.disabled = false; b.textContent = 'Sign in';
});
$('logout').onclick = () => { state.token = ''; try { sessionStorage.removeItem('sz-admin'); } catch (e) { /* ignore */ } $('token').value = ''; showConsole(false); };

/* ---------- list ---------- */
async function refresh() {
  $('reload').classList.add('spin');
  try { state.all = await api('/api/advisories?all=1'); }
  catch (e) { if (e.status === 401) { toast('Session expired. Sign in again.', true); $('logout').click(); } else toast(e.message, true); }
  $('reload').classList.remove('spin');
  renderKpis(); renderList();
}
function renderKpis() {
  const c = { ongoing: 0, scheduled: 0, restored: 0 };
  state.all.forEach(a => c[statusOf(a)]++);
  const items = [['ongoing', 'Ongoing', c.ongoing], ['scheduled', 'Scheduled', c.scheduled], ['restored', 'Restored', c.restored], ['total', 'Total on record', state.all.length]];
  $('kpis').innerHTML = items.map(([k, l, n]) => '<div class="kpi k-' + k + '"><b>' + n + '</b><span>' + l + '</span></div>').join('');
}
const ORDER = { ongoing: 0, scheduled: 1, restored: 2 };
function renderList() {
  const q = $('filterText').value.trim().toLowerCase(), fs = $('filterStatus').value, ft = $('filterType').value;
  const rows = state.all.map(a => ({ a, st: statusOf(a) }))
    .filter(x => (fs === 'all' || x.st === fs) && (ft === 'all' || x.a.type === ft) &&
      (!q || (x.a.area + ' ' + (x.a.reason && x.a.reason.en) + ' ' + (x.a.source || '')).toLowerCase().includes(q)))
    .sort((x, y) => ORDER[x.st] - ORDER[y.st] || (x.st === 'restored' ? new Date(y.a.eta) - new Date(x.a.eta) : new Date(x.a.eta) - new Date(y.a.eta)));
  $('list').innerHTML = rows.length ? rows.map(({ a, st }) =>
    '<article class="arow' + (state.editing && state.editing.id === a.id ? ' editing' : '') + '" data-id="' + esc(a.id) + '">' +
    '<div class="arow-top"><span class="type ' + esc(a.type) + '">' + icon(a.type) + TYPE_LABEL[a.type] + '</span><span class="badge ' + st + '">' + st[0].toUpperCase() + st.slice(1) + '</span>' +
    '<span class="when">' + esc(st === 'scheduled' ? 'Starts ' + relative(a.start) : st === 'ongoing' ? 'Back ' + relative(a.eta) : 'Restored ' + relative(a.eta)) + '</span></div>' +
    '<h3>' + esc(a.area) + '</h3><p>' + esc(a.reason && a.reason.en) + '</p>' +
    '<div class="meta">' + esc(fmt(a.start)) + ' to ' + esc(fmt(a.eta)) + ' - ' + esc(a.radius) + ' m radius - ' + esc(a.source) + '</div>' +
    '<div class="arow-actions">' +
    '<button class="btn small" data-act="edit">Edit</button>' +
    (st !== 'restored' ? '<button class="btn small" data-act="extend" title="Push expected-back time by 1 hour">+1 h</button><button class="btn small" data-act="resolve">Mark restored</button>' : '') +
    '<button class="btn small danger" data-act="delete">Delete</button></div></article>').join('')
    : '<div class="empty"><b>No advisories match</b>' + (state.all.length ? 'Change the filters to see more.' : 'Add the first advisory with the form.') + '</div>';
}
['filterText', 'filterStatus', 'filterType'].forEach(id => $(id).addEventListener('input', renderList));
$('reload').onclick = refresh;
$('list').addEventListener('click', async e => {
  const btn = e.target.closest('[data-act]'); if (!btn) return;
  const a = state.all.find(x => x.id === btn.closest('.arow').dataset.id); if (!a) return;
  const act = btn.dataset.act;
  try {
    if (act === 'edit') return startEdit(a);
    if (act === 'extend') { await api('/api/advisories/' + encodeURIComponent(a.id), { method: 'PUT', body: JSON.stringify(Object.assign({}, a, { eta: new Date(new Date(a.eta).getTime() + H).toISOString() })) }); toast('Expected-back time pushed by 1 hour'); }
    if (act === 'resolve') {
      if (!await confirmDialog('Mark as restored?', 'The advisory moves to "Restored" now and disappears from the map. It stays on the site for 6 hours.', 'Mark restored')) return;
      await api('/api/advisories/' + encodeURIComponent(a.id) + '/resolve', { method: 'POST', body: '{}' }); toast('Marked as restored');
    }
    if (act === 'delete') {
      if (!await confirmDialog('Delete this advisory?', a.area + ' will be removed permanently. Use "Mark restored" instead to keep the record.', 'Delete')) return;
      await api('/api/advisories/' + encodeURIComponent(a.id), { method: 'DELETE' }); toast('Deleted');
      if (state.editing && state.editing.id === a.id) resetForm();
    }
    await refresh();
  } catch (err) { toast(err.message, true); }
});

/* ---------- map ---------- */
function initMap() {
  L.Icon.Default.imagePath = '/vendor/leaflet/images/';
  map = L.map('map', { preferCanvas: true }).setView([7.0731, 125.6128], 11);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, keepBuffer: 3, updateWhenIdle: true,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>' }).addTo(map);
  map.on('click', e => { $('lat').value = e.latlng.lat.toFixed(6); $('lng').value = e.latlng.lng.toFixed(6); updatePreview(); $('mapNote').hidden = true; });
}
function updatePreview() {
  const lat = parseFloat($('lat').value), lng = parseFloat($('lng').value), r = parseFloat($('radius').value) || 1000;
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !map) return;
  const color = state.type === 'water' ? '#0b72b8' : '#d98e00';
  if (pin) pin.setLatLng([lat, lng]); else pin = L.marker([lat, lng]).addTo(map);
  if (!preview) preview = L.circle([lat, lng], { radius: r, weight: 2 }).addTo(map);
  preview.setLatLng([lat, lng]).setRadius(r).setStyle({ color, fillColor: color, fillOpacity: .2 });
}
function fitPreview() { if (preview) map.fitBounds(preview.getBounds(), { padding: [30, 30], maxZoom: 15 }); }

/* ---------- Philippine location lists (served from the app's own cache) ---------- */
const loc = { independent: [], loaded: false };
async function psgc(path) { const r = await fetch('/api/psgc' + path); if (!r.ok) throw new Error('Could not load the Philippine location list. Try again in a moment.'); return r.json(); }
function fill(id, rows, placeholder, withIndependent) {
  const el = $(id);
  el.innerHTML = '<option value="">' + esc(placeholder) + '</option>' + (withIndependent ? '<option value="none">Independent city / special area</option>' : '') +
    rows.map(r => '<option value="' + esc(r.code) + '">' + esc(r.name) + '</option>').join('');
  el.disabled = !rows.length && !withIndependent;
}
const chosen = id => { const el = $(id); return el.value && el.value !== 'none' ? el.options[el.selectedIndex].text : ''; };
function resetBelow(level) {
  const L = ['region', 'province', 'city', 'barangay'], msgs = ['', 'Select region first', 'Select province first', 'Select city / municipality first'];
  for (let i = level; i < 4; i++) if (i > 0) fill(L[i], [], msgs[i]);
}
function updateArea() {
  const parts = ['barangay', 'city', 'province', 'region'].map(chosen).filter(Boolean);
  const a = $('area'), cur = a.value.trim(), oldAuto = a.dataset.auto || '';
  const details = cur.startsWith(oldAuto) ? cur.slice(oldAuto.length).replace(/^,\s*/, '') : cur;
  const base = parts.join(', '); a.value = base + (details && base ? ', ' + details : details); a.dataset.auto = base;
}
async function loadRegions() {
  if (loc.loaded) return;
  fill('region', [], 'Loading regions...'); resetBelow(1);
  try { fill('region', await psgc('/regions?limit=100'), 'Select region'); loc.loaded = true; }
  catch (e) { fill('region', [], 'Could not load regions'); toast(e.message, true); }
}
async function loadProvinces(code) {
  fill('province', [], 'Loading provinces...');
  const [provinces, indep] = await Promise.all([psgc('/regions/' + code + '/provinces'), psgc('/cities-municipalities?region=' + code + '&province=none&limit=2000')]);
  loc.independent = indep;
  fill('province', provinces, provinces.length ? 'Select province' : 'No province in this region', provinces.length > 0 && indep.length > 0);
  if (!provinces.length) fill('city', indep, 'Select city / municipality');
}
async function loadCities(code) {
  fill('city', [], 'Loading cities...');
  fill('city', code === 'none' ? loc.independent : await psgc('/provinces/' + code + '/cities-municipalities?limit=500'), 'Select city / municipality');
}
async function loadBarangays(code) {
  fill('barangay', [], 'Loading barangays...');
  fill('barangay', await psgc('/cities-municipalities/' + code + '/barangays?limit=1000'), 'Select barangay');
}
$('region').onchange = async () => { resetBelow(1); updateArea(); if ($('region').value) try { await loadProvinces($('region').value); } catch (e) { toast(e.message, true); fill('province', [], 'Could not load provinces'); } updateArea(); };
$('province').onchange = async () => { resetBelow(2); updateArea(); if ($('province').value) try { await loadCities($('province').value); } catch (e) { toast(e.message, true); fill('city', [], 'Could not load cities'); } updateArea(); };
$('city').onchange = async () => { resetBelow(3); updateArea(); if ($('city').value) try { await loadBarangays($('city').value); } catch (e) { toast(e.message, true); fill('barangay', [], 'Could not load barangays'); } updateArea(); };
$('barangay').onchange = async () => {
  updateArea();
  if (!$('barangay').value || ($('lat').value && $('lng').value)) return;
  // center the map on the barangay when the admin has not placed a pin yet
  try {
    const q = [chosen('barangay'), chosen('city'), chosen('province')].filter(Boolean).join(', ');
    const r = await fetch('/api/geocode?q=' + encodeURIComponent(q)); const list = r.ok ? await r.json() : [];
    if (list[0] && !$('lat').value) { $('lat').value = list[0].lat.toFixed(6); $('lng').value = list[0].lng.toFixed(6); updatePreview(); fitPreview(); $('mapNote').hidden = true; toast('Zone center set from the barangay. Click the map to adjust it.'); }
  } catch (e) { /* optional convenience */ }
};
async function setLocation(l) {
  if (!l) return;
  await loadRegions(); $('region').value = l.regionCode || '';
  if (!$('region').value) return;
  await loadProvinces(l.regionCode);
  const hasProv = $('province').options.length > 2 || ($('province').options.length === 2 && $('province').options[1].value !== 'none');
  if (hasProv) { $('province').value = l.provinceCode || 'none'; await loadCities($('province').value || 'none'); }
  $('city').value = l.cityMunicipalityCode || '';
  if ($('city').value) { await loadBarangays(l.cityMunicipalityCode); $('barangay').value = l.barangayCode || ''; }
}

/* ---------- form ---------- */
function setType(v) {
  state.type = v;
  [...$('typeSeg').children].forEach(b => { const on = b.dataset.v === v; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
  updatePreview();
}
$('typeSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setType(b.dataset.v); });
$('radius').addEventListener('input', () => { $('radiusOut').textContent = Number($('radius').value).toLocaleString() + ' m'; updatePreview(); });
['lat', 'lng'].forEach(id => $(id).addEventListener('change', () => { updatePreview(); fitPreview(); }));
$('durChips').addEventListener('click', e => {
  const b = e.target.closest('.chip'); if (!b) return;
  const s = $('start').value ? new Date($('start').value) : new Date();
  if (!$('start').value) $('start').value = toLocalInput(s);
  $('eta').value = toLocalInput(new Date(s.getTime() + Number(b.dataset.h) * H));
});
function resetForm() {
  state.editing = null; $('form').reset(); $('area').dataset.auto = '';
  $('h-edit').textContent = 'New advisory'; $('submitBtn').textContent = 'Publish advisory'; $('cancelEdit').hidden = true;
  $('formError').hidden = true; setType('water');
  $('radius').value = 1500; $('radiusOut').textContent = '1,500 m';
  $('start').value = toLocalInput(new Date());
  ['region', 'province', 'city', 'barangay'].forEach(id => { $(id).value = ''; }); resetBelow(1);
  if (loc.loaded) $('region').value = '';
  if (pin) { map.removeLayer(pin); pin = null; } if (preview) { map.removeLayer(preview); preview = null; }
  $('mapNote').hidden = false; renderList();
}
async function startEdit(a) {
  state.editing = a; $('h-edit').textContent = 'Edit advisory'; $('submitBtn').textContent = 'Save changes'; $('cancelEdit').hidden = false; $('formError').hidden = true;
  setType(a.type); $('radius').value = Math.min(10000, a.radius); $('radiusOut').textContent = Number(a.radius).toLocaleString() + ' m';
  $('area').value = a.area; $('area').dataset.auto = ''; $('reasonEn').value = a.reason.en || ''; $('reasonCeb').value = a.reason.ceb === a.reason.en ? '' : (a.reason.ceb || '');
  $('start').value = toLocalInput(a.start); $('eta').value = toLocalInput(a.eta); $('source').value = a.source || ''; $('note').value = a.note || '';
  $('lat').value = a.lat; $('lng').value = a.lng; updatePreview(); fitPreview(); $('mapNote').hidden = true;
  renderList(); $('form').scrollIntoView({ behavior: 'smooth', block: 'start' });
  try { await setLocation(a.location); $('area').value = a.area; } catch (e) { toast(e.message, true); }
}
$('cancelEdit').onclick = resetForm; $('resetBtn').onclick = resetForm;

function readForm() {
  const l = state.editing && state.editing.location && !$('barangay').value ? state.editing.location : null;
  return {
    type: state.type, area: $('area').value.trim(), lat: $('lat').value, lng: $('lng').value, radius: $('radius').value,
    location: l || { regionCode: $('region').value, provinceCode: $('province').value === 'none' ? '' : $('province').value, cityMunicipalityCode: $('city').value, barangayCode: $('barangay').value,
      region: chosen('region'), province: chosen('province'), cityMunicipality: chosen('city'), barangay: chosen('barangay') },
    reason: { en: $('reasonEn').value.trim(), ceb: $('reasonCeb').value.trim() },
    start: $('start').value ? new Date($('start').value).toISOString() : '', eta: $('eta').value ? new Date($('eta').value).toISOString() : '',
    source: $('source').value.trim(), note: $('note').value.trim()
  };
}
function validate(b) {
  const bad = [];
  const mark = (id, cond) => { $(id).classList.toggle('invalid', !!cond); return !!cond; };
  if (mark('lat', !b.lat) | mark('lng', !b.lng)) bad.push('Click the map to set the zone center.');
  const L = b.location, editingLoc = !!(state.editing && state.editing.location);
  const locOk = L.regionCode && L.cityMunicipalityCode && (L.barangayCode || editingLoc);
  if (mark('region', !locOk) | mark('city', !locOk) | mark('barangay', !locOk)) bad.push('Select the region, city / municipality and barangay.');
  if (mark('area', !b.area)) bad.push('Describe the affected area.');
  if (mark('reasonEn', !b.reason.en)) bad.push('Enter the reason in English.');
  if (mark('start', !b.start) | mark('eta', !b.eta)) bad.push('Enter the start and expected-back times.');
  else if (mark('eta', new Date(b.eta) <= new Date(b.start))) bad.push('Expected back must be after the start time.');
  return bad;
}
$('form').addEventListener('submit', async e => {
  e.preventDefault(); if (state.busy) return;
  const body = readForm(), problems = validate(body), err = $('formError');
  if (problems.length) { err.hidden = false; err.innerHTML = problems.map(esc).join('<br>'); return; }
  err.hidden = true; state.busy = true; const btn = $('submitBtn'); btn.disabled = true; btn.textContent = 'Saving...';
  try {
    if (state.editing) await api('/api/advisories/' + encodeURIComponent(state.editing.id), { method: 'PUT', body: JSON.stringify(body) });
    else await api('/api/advisories', { method: 'POST', body: JSON.stringify(body) });
    toast(state.editing ? 'Changes saved' : 'Advisory published');
    resetForm(); await refresh();
  } catch (x) {
    if (x.status === 401) { toast('Session expired. Sign in again.', true); $('logout').click(); }
    else { err.hidden = false; err.textContent = x.message; }
  } finally { state.busy = false; btn.disabled = false; btn.textContent = state.editing ? 'Save changes' : 'Publish advisory'; }
});

/* ---------- theme + boot ---------- */
function setTheme(dark) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  try { localStorage.setItem('sz-theme', dark ? 'dark' : 'light'); } catch (e) { /* ignore */ }
  $('themeBtn').querySelector('use').setAttribute('href', dark ? '#i-sun' : '#i-moon');
}
$('themeBtn').onclick = () => setTheme(document.documentElement.getAttribute('data-theme') !== 'dark');
setTheme(document.documentElement.getAttribute('data-theme') === 'dark');
setInterval(() => { if (!document.hidden && state.token) renderList(); }, 60000);   // keep the relative times fresh
(async function boot() {
  let saved = ''; try { saved = sessionStorage.getItem('sz-admin') || ''; } catch (e) { /* ignore */ }
  resetBelow(1); $('start').value = toLocalInput(new Date());
  if (saved) await signIn(saved, true);
  if (!state.token) $('token').focus();
})();
