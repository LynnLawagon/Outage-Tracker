/* Public site: Leaflet + OpenStreetMap (free). Address search goes through /api/geocode (Nominatim). */
const CONFIG = { DEFAULT_CENTER: [7.0731, 125.6128], NEAR_EXTRA_M: 800, REPORT_RADIUS_M: 1000 };
const H = 3600e3;

const T = {
  en: {
    title: 'Water & Power Interruption Tracker',
    demo: 'DEMO DATA: these advisories are samples. The site owner must add real advisories at /admin.html.',
    ph: 'Type your barangay, street or landmark', check: 'Check my area', locate: 'Use my location',
    qWater: 'No water?', qPower: 'Brownout?', qBoth: 'Both',
    ok: 'No known interruption in your area',
    okSub: 'We found no active or scheduled advisory near this location. If your supply is out, it may be a local fault - report it below and tell your utility.',
    bad: 'Your area is affected', badSub: n => n + ' advisory found near this location.',
    water: 'Water', power: 'Electricity', ongoing: 'Ongoing', scheduled: 'Scheduled',
    reason: 'Why', started: 'Started', starts: 'Starts', eta: 'Expected back', source: 'Source', dist: 'Distance from zone center',
    inside: 'Inside affected zone', near: 'Near affected zone (edge)', in: 'in about', hrs: 'h', min: 'min', soon: 'any moment now',
    foot: 'Always confirm with your utility (Davao Light for electricity, your local water district for water). This tool only shows the advisories it has been given. Map data: OpenStreetMap contributors.',
    geoFail: 'Could not get your location. Type your address instead.', notFound: 'Location not found. Try a more specific place, e.g. add the barangay or city.',
    searching: 'Searching...', pick: 'Did you mean:', searchDown: 'Address search is unavailable right now. Tap the map to choose your spot.',
    tapMap: 'Tip: you can also tap the map to choose your exact spot.',
    rTitle: 'Still no supply and no advisory?', rHelp: 'Send an anonymous report for this spot (rounded to about 100 m).',
    rWater: 'I have no water', rPower: 'I have no power', rSent: 'Report sent. Salamat!', rFail: 'Could not send the report.',
    rCount: n => n + ' report(s) of the same problem within 1 km in the last 3 hours'
  },
  ceb: {
    title: 'Tracker sa Tubig ug Kuryente',
    demo: 'DEMO DATA: sample ra kini nga mga advisory. Ang tag-iya sa site kinahanglan mu-dugang og tinuod sa /admin.html.',
    ph: 'I-type imong barangay, dalan o landmark', check: 'Susiha akong lugar', locate: 'Gamita akong location',
    qWater: 'Walay tubig?', qPower: 'Brownout?', qBoth: 'Duha',
    ok: 'Walay nahibaloang problema sa imong lugar',
    okSub: 'Walay active o scheduled nga advisory duol ani nga lugar. Kung wala gyud kay tubig/kuryente, basin lokal nga sira - i-report sa ubos ug sa imong utility.',
    bad: 'Apektado ang imong lugar', badSub: n => n + ' ka advisory ang nakit-an duol ani nga lugar.',
    water: 'Tubig', power: 'Kuryente', ongoing: 'Nagpadayon', scheduled: 'Naka-schedule',
    reason: 'Ngano', started: 'Nagsugod', starts: 'Magsugod', eta: 'Kanus-a mabalik', source: 'Tinubdan', dist: 'Gilay-on gikan sa tunga sa zone',
    inside: 'Sulod sa apektadong zone', near: 'Duol sa apektadong zone (pinakagawas)', in: 'mga', hrs: 'ka oras', min: 'minuto', soon: 'karon na lang',
    foot: 'Kanunay nga i-confirm sa imong utility (Davao Light para sa kuryente, water district para sa tubig). Ang gipakita ra ani nga tool kay ang advisory nga gihatag niini. Map data: OpenStreetMap contributors.',
    geoFail: 'Wala makuha imong location. I-type na lang imong address.', notFound: 'Wala makit-i ang lugar. Sulayi ang mas espisipiko, pananglitan idugang ang barangay o siyudad.',
    searching: 'Nangita...', pick: 'Kini ba imong gipasabot:', searchDown: 'Dili magamit ang address search karon. I-tap ang mapa aron pilion imong lugar.',
    tapMap: 'Tip: pwede pud nimo i-tap ang mapa aron pilion ang eksaktong lugar.',
    rTitle: 'Wala gihapoy suplay ug walay advisory?', rHelp: 'Magpadala og anonymous nga report para ani nga lugar (gi-round sa mga 100 m).',
    rWater: 'Walay tubig sa akoa', rPower: 'Walay kuryente sa akoa', rSent: 'Napadala na ang report. Salamat!', rFail: 'Wala napadala ang report.',
    rCount: n => n + ' ka report sa parehas nga problema sulod sa 1 km niining miaging 3 ka oras'
  }
};

let lang = 'en', filter = 'both', lastPos = null, advisories = [], reports = [];
let map, marker, zoneLayer;
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const t = k => T[lang][k];
const pick = obj => (obj && (obj[lang] || obj.en)) || '';

/* distance in meters between two lat/lng points (haversine) */
function distM(lat1, lng1, lat2, lng2) {
  const R = 6371000, rad = x => x * Math.PI / 180;
  const dLat = rad(lat2 - lat1), dLng = rad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function applyLang() {
  document.documentElement.lang = lang === 'ceb' ? 'ceb' : 'en';
  $('t-title').textContent = t('title'); document.title = t('title');
  $('demoNote').textContent = t('demo');
  $('q').placeholder = t('ph'); $('check').textContent = t('check'); $('locate').textContent = t('locate');
  $('qWater').textContent = t('qWater'); $('qPower').textContent = t('qPower'); $('qBoth').textContent = t('qBoth');
  $('foot').textContent = t('foot');
  $('r-title').textContent = t('rTitle'); $('r-help').textContent = t('rHelp');
  $('repWater').textContent = t('rWater'); $('repPower').textContent = t('rPower');
  document.querySelectorAll('.lang button').forEach(b => b.classList.toggle('on', b.dataset.l === lang));
  drawZones();
  if (lastPos) evaluate(lastPos);
}

function status(a) {
  const n = Date.now(), s = new Date(a.start).getTime(), e = new Date(a.eta).getTime();
  if (n > e) return 'restored';
  return n >= s ? 'ongoing' : 'scheduled';
}
function fmtTime(iso) {
  return new Date(iso).toLocaleString('en-PH', { weekday: 'short', hour: 'numeric', minute: '2-digit', month: 'short', day: 'numeric' });
}
function rel(iso) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return t('soon');
  const h = Math.floor(ms / H), m = Math.round((ms % H) / 60e3);
  return t('in') + ' ' + (h ? h + ' ' + t('hrs') : '') + (h && m ? ' ' : '') + (m && h < 6 ? m + ' ' + t('min') : '');
}
function toast(msg) {
  const el = document.createElement('div'); el.className = 'toast'; el.textContent = msg;
  document.body.appendChild(el); setTimeout(() => el.remove(), 3500);
}

/* ---------------- data ---------------- */
async function loadData() {
  try {
    const [a, r] = await Promise.all([fetch('/api/advisories'), fetch('/api/reports')]);
    advisories = a.ok ? await a.json() : advisories;
    reports = r.ok ? await r.json() : reports;
  } catch (e) { /* keep old data */ }
  $('demoNote').hidden = !advisories.some(a => a.source === 'Demo data');
  drawZones();
  if (lastPos) evaluate(lastPos);
}

/* ---------------- map (Leaflet + OpenStreetMap tiles) ---------------- */
function initMap() {
  map = L.map('map').setView(CONFIG.DEFAULT_CENTER, 11);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  zoneLayer = L.layerGroup().addTo(map);
  map.on('click', e => setPosition(e.latlng.lat, e.latlng.lng, false));
  drawZones();
}

function drawZones() {
  if (!map) return;
  zoneLayer.clearLayers();
  advisories.forEach(a => {
    const st = status(a);
    if (st === 'restored') return;
    const color = a.type === 'water' ? '#1e88e5' : '#f59e0b';
    L.circle([a.lat, a.lng], { radius: a.radius, color, weight: 2, fillColor: color, fillOpacity: st === 'ongoing' ? 0.28 : 0.12 })
      .bindPopup('<b>' + esc(t(a.type)) + '</b> - ' + esc(a.area) + '<br>' + esc(pick(a.reason)))
      .addTo(zoneLayer);
  });
}

function setPosition(lat, lng, zoom = true) {
  lastPos = { lat, lng };
  $('picks').hidden = true;
  if (marker) marker.setLatLng([lat, lng]); else marker = L.marker([lat, lng]).addTo(map);
  if (zoom) map.setView([lat, lng], 14); else map.panTo([lat, lng]);
  evaluate(lastPos);
}

/* ---------------- evaluate + render ---------------- */
function evaluate(pos) {
  const hits = [];
  advisories.forEach(a => {
    const st = status(a);
    if (st === 'restored') return;
    if (filter !== 'both' && a.type !== filter) return;
    const d = distM(pos.lat, pos.lng, a.lat, a.lng);
    if (d <= a.radius) hits.push({ a, st, d, zone: 'inside' });
    else if (d <= a.radius + CONFIG.NEAR_EXTRA_M) hits.push({ a, st, d, zone: 'near' });
  });
  hits.sort((x, y) => (x.zone === y.zone ? 0 : x.zone === 'inside' ? -1 : 1));
  const nearby = { water: 0, power: 0 };
  reports.forEach(r => { if (distM(pos.lat, pos.lng, r.lat, r.lng) <= CONFIG.REPORT_RADIUS_M) nearby[r.type]++; });
  render(hits, nearby);
}

function render(hits, nearby) {
  const banner = $('banner'), box = $('results');
  banner.hidden = false; $('reportBox').hidden = false;
  const counts = ['water', 'power'].filter(k => nearby[k] && (filter === 'both' || filter === k))
    .map(k => '<div class="muted">' + esc(t(k)) + ': ' + esc(t('rCount')(nearby[k])) + '</div>').join('');
  if (!hits.length) {
    banner.className = 'banner ok';
    banner.innerHTML = '<h2>' + esc(t('ok')) + '</h2><div class="muted">' + esc(t('okSub')) + '</div>' + counts;
    box.innerHTML = ''; return;
  }
  banner.className = 'banner bad';
  banner.innerHTML = '<h2>' + esc(t('bad')) + '</h2><div class="muted">' + esc(t('badSub')(hits.length)) + '</div>' + counts;
  box.innerHTML = hits.map(({ a, st, d, zone }) => {
    const when = '<div class="row"><b>' + esc(t(st === 'scheduled' ? 'starts' : 'started')) + ':</b> ' + esc(fmtTime(a.start)) + '</div>';
    return '<div class="card">' +
      '<div class="top"><span class="tag ' + esc(a.type) + '">' + esc(t(a.type)) + '</span><span class="state">' + esc(t(st)) + ' - ' + esc(t(zone)) + '</span></div>' +
      '<div class="row"><b>' + esc(a.area) + '</b></div>' +
      '<div class="row"><b>' + esc(t('reason')) + ':</b> ' + esc(pick(a.reason)) + '</div>' + when +
      '<div class="row"><b>' + esc(t('eta')) + ':</b> ' + esc(fmtTime(a.eta)) + ' (' + esc(rel(a.eta)) + ')</div>' +
      '<div class="muted">' + esc(t('dist')) + ': ' + (d / 1000).toFixed(1) + ' km - ' + esc(t('source')) + ': ' + esc(a.source) + '</div></div>';
  }).join('');
}

/* ---------------- address search ---------------- */
async function search() {
  const q = $('q').value.trim();
  if (q.length < 3) return;
  const picks = $('picks');
  picks.hidden = false; picks.textContent = t('searching');
  try {
    const r = await fetch('/api/geocode?q=' + encodeURIComponent(q));
    if (r.status === 429) throw new Error('rate');
    if (!r.ok) throw new Error('down');
    const list = await r.json();
    if (!list.length) { picks.hidden = true; return toast(t('notFound')); }
    if (list.length === 1) return setPosition(list[0].lat, list[0].lng);
    picks.innerHTML = '<div class="muted">' + esc(t('pick')) + '</div>' + list.map((p, i) =>
      '<button class="btn small pick" data-i="' + i + '">' + esc(p.name) + '</button>').join('') +
      '<div class="muted">' + esc(t('tapMap')) + '</div>';
    picks.querySelectorAll('.pick').forEach(b => b.onclick = () => { const p = list[+b.dataset.i]; setPosition(p.lat, p.lng); });
  } catch (e) { picks.hidden = true; toast(t('searchDown')); }
}

/* ---------------- community reports ---------------- */
async function sendReport(type) {
  if (!lastPos) return;
  try {
    const r = await fetch('/api/reports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, lat: lastPos.lat, lng: lastPos.lng }) });
    if (!r.ok) throw new Error();
    toast(t('rSent')); loadData();
  } catch (e) { toast(t('rFail')); }
}

/* ---------------- events ---------------- */
$('check').onclick = search;
$('q').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); search(); } });
$('locate').onclick = () => {
  if (!navigator.geolocation) return toast(t('geoFail'));
  navigator.geolocation.getCurrentPosition(
    p => setPosition(p.coords.latitude, p.coords.longitude),
    () => toast(t('geoFail')), { enableHighAccuracy: true, timeout: 10000 });
};
function setFilter(f) {
  filter = f;
  ['Water', 'Power', 'Both'].forEach(n => $('q' + n).classList.toggle('on', n.toLowerCase() === f));
  if (lastPos) evaluate(lastPos);
}
$('qWater').onclick = () => setFilter('water');
$('qPower').onclick = () => setFilter('power');
$('qBoth').onclick = () => setFilter('both');
$('repWater').onclick = () => sendReport('water');
$('repPower').onclick = () => sendReport('power');
document.querySelectorAll('.lang button').forEach(b => b.onclick = () => { lang = b.dataset.l; applyLang(); });

/* ---------------- Philippine location dropdowns (PSGC) ---------------- */
const PSGC_API = 'https://psgc.billyjamesramos.com/api/v1';
const psgcCache = new Map();
const publicLocation = { region: null, province: null, city: null, barangay: null, independent: [] };
async function getPsgc(path) {
  if (psgcCache.has(path)) return psgcCache.get(path);
  const response = await fetch(PSGC_API + path);
  if (!response.ok) throw new Error('Philippine location list is temporarily unavailable.');
  const json = await response.json(); const rows = json.data || [];
  psgcCache.set(path, rows); return rows;
}
function setLocationOptions(id, rows, placeholder, allowNone=false) {
  const el = $(id); el.innerHTML = '<option value="">' + esc(placeholder) + '</option>';
  if (allowNone) el.insertAdjacentHTML('beforeend','<option value="none">Independent city / special area</option>');
  rows.forEach(row => { const o=document.createElement('option'); o.value=row.code; o.textContent=row.name; el.appendChild(o); });
  el.disabled = !rows.length && !allowNone;
}
function locationText(id) { const el=$(id); return el.value && el.value!=='none' ? el.options[el.selectedIndex].text : ''; }
function updateLocationSummary() {
  const parts=['barangay','city','province','region'].map(locationText).filter(Boolean);
  $('locationSummary').textContent = parts.length ? parts.join(', ') : 'Choose a location to check advisories for that area.';
}
async function loadPublicRegions() {
  try { setLocationOptions('region', await getPsgc('/regions?limit=100'), 'Select region'); }
  catch(e) { setLocationOptions('region', [], 'Location list unavailable'); toast(e.message); }
}
async function publicRegionChanged() {
  const code=$('region').value; publicLocation.region=code||null; publicLocation.province=publicLocation.city=publicLocation.barangay=null;
  setLocationOptions('province',[],'Loading provinces...'); setLocationOptions('city',[],'Select province first'); setLocationOptions('barangay',[],'Select city / municipality first');
  if (!code) { updateLocationSummary(); return; }
  try {
    const [provinces, independent]=await Promise.all([getPsgc('/regions/'+code+'/provinces'),getPsgc('/cities-municipalities?region='+code+'&province=none&limit=2000')]);
    publicLocation.independent=independent;
    setLocationOptions('province',provinces,provinces.length?'Select province (or independent city)':'No province in this region',provinces.length>0);
    if (!provinces.length) setLocationOptions('city',independent,'Select city / municipality');
  } catch(e) { toast(e.message); setLocationOptions('province',[],'Could not load provinces'); }
  updateLocationSummary();
}
async function publicProvinceChanged() {
  const code=$('province').value; publicLocation.province=code&&code!=='none'?code:null; publicLocation.city=publicLocation.barangay=null;
  setLocationOptions('city',[],'Loading cities / municipalities...'); setLocationOptions('barangay',[],'Select city / municipality first');
  if (!code) { updateLocationSummary(); return; }
  try { const rows=code==='none'?publicLocation.independent:await getPsgc('/provinces/'+code+'/cities-municipalities?limit=500'); setLocationOptions('city',rows,'Select city / municipality'); }
  catch(e) { toast(e.message); setLocationOptions('city',[],'Could not load cities / municipalities'); }
  updateLocationSummary();
}
async function publicCityChanged() {
  const code=$('city').value; publicLocation.city=code||null; publicLocation.barangay=null;
  setLocationOptions('barangay',[],'Loading barangays...');
  if (!code) { updateLocationSummary(); return; }
  try { setLocationOptions('barangay',await getPsgc('/cities-municipalities/'+code+'/barangays?limit=1000'),'Select barangay'); }
  catch(e) { toast(e.message); setLocationOptions('barangay',[],'Could not load barangays'); }
  updateLocationSummary();
}
async function publicBarangayChanged() {
  publicLocation.barangay=$('barangay').value||null; updateLocationSummary();
  if (!$('barangay').value) return;
  const parts=['barangay','city','province','region'].map(locationText).filter(Boolean);
  $('q').value=parts.join(', '); await search();
}
$('region').addEventListener('change',publicRegionChanged);
$('province').addEventListener('change',publicProvinceChanged);
$('city').addEventListener('change',publicCityChanged);
$('barangay').addEventListener('change',publicBarangayChanged);
$('clearLocation').onclick=()=>{
  ['region','province','city','barangay'].forEach((id,i)=>{ $(id).value=''; });
  publicLocation.region=publicLocation.province=publicLocation.city=publicLocation.barangay=null;
  setLocationOptions('province',[],'Select region first'); setLocationOptions('city',[],'Select province first'); setLocationOptions('barangay',[],'Select city / municipality first');
  $('q').value=''; updateLocationSummary();
};

/* ---------------- boot ---------------- */
initMap();
loadPublicRegions();
applyLang();
loadData();
setInterval(loadData, 60000);
