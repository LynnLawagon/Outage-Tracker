/* Admin page: add / delete advisories. Needs ADMIN_TOKEN from .env. Map: Leaflet + OpenStreetMap (free). */
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let map, pin, preview;
const PSGC = 'https://psgc.billyjamesramos.com/api/v1';
const locationState = { region: null, province: null, city: null, barangay: null };
const locationCache = new Map();


async function psgc(path) {
  if (locationCache.has(path)) return locationCache.get(path);
  const response = await fetch(PSGC + path);
  if (!response.ok) throw new Error('Could not load Philippine location data.');
  const payload = await response.json();
  const rows = payload.data || [];
  locationCache.set(path, rows);
  return rows;
}
function fillSelect(id, rows, placeholder, includeNone = false) {
  const el = $(id);
  el.innerHTML = '<option value="">' + esc(placeholder) + '</option>';
  if (includeNone) el.insertAdjacentHTML('beforeend', '<option value="none">Independent city / HUC / special area</option>');
  rows.forEach(item => {
    const option = document.createElement('option');
    option.value = item.code; option.textContent = item.name; el.appendChild(option);
  });
  el.disabled = rows.length === 0 && !includeNone;
}
function resetSelect(id, placeholder) { fillSelect(id, [], placeholder); }
function chosenText(id) { const el = $(id); return el.value && el.value !== 'none' ? el.options[el.selectedIndex].text : ''; }
function updateArea() {
  const parts = ['barangay', 'city', 'province', 'region'].map(chosenText).filter(Boolean);
  const current = $('area').value.trim();
  const oldAuto = $('area').dataset.auto || '';
  const details = current.startsWith(oldAuto) ? current.slice(oldAuto.length).replace(/^,\s*/, '') : '';
  const base = parts.join(', ');
  $('area').value = base + (details ? ', ' + details : '');
  $('area').dataset.auto = base;
}
async function loadRegions() {
  try {
    const regions = await psgc('/regions?limit=100');
    fillSelect('region', regions, 'Select region');
  } catch (error) {
    resetSelect('region', 'Could not load regions - refresh page');
    toast(error.message);
  }
}
async function onRegionChange() {
  const code = $('region').value;
  locationState.region = code || null; locationState.province = locationState.city = locationState.barangay = null;
  resetSelect('province', 'Loading provinces...'); resetSelect('city', 'Select province first'); resetSelect('barangay', 'Select city / municipality first');
  if (!code) { updateArea(); return; }
  try {
    const [provinces, independent] = await Promise.all([
      psgc('/regions/' + code + '/provinces'),
      psgc('/cities-municipalities?region=' + code + '&province=none&limit=2000')
    ]);
    locationState.independent = independent;
    fillSelect('province', provinces, provinces.length ? 'Select province (or independent city)' : 'No province in this region', provinces.length > 0);
    if (!provinces.length) {
      fillSelect('city', independent, 'Select city / municipality');
      $('city').disabled = !independent.length;
    }
  } catch (error) { toast(error.message); resetSelect('province', 'Could not load provinces'); }
  updateArea();
}
async function onProvinceChange() {
  const code = $('province').value;
  locationState.province = code && code !== 'none' ? code : null; locationState.city = locationState.barangay = null;
  resetSelect('city', 'Loading cities / municipalities...'); resetSelect('barangay', 'Select city / municipality first');
  if (!code) { updateArea(); return; }
  try {
    const rows = code === 'none' ? (locationState.independent || []) : await psgc('/provinces/' + code + '/cities-municipalities?limit=500');
    fillSelect('city', rows, 'Select city / municipality');
  } catch (error) { toast(error.message); resetSelect('city', 'Could not load cities / municipalities'); }
  updateArea();
}
async function onCityChange() {
  const code = $('city').value;
  locationState.city = code || null; locationState.barangay = null;
  resetSelect('barangay', 'Loading barangays...');
  if (!code) { updateArea(); return; }
  try {
    const rows = await psgc('/cities-municipalities/' + code + '/barangays?limit=1000');
    fillSelect('barangay', rows, 'Select barangay');
  } catch (error) { toast(error.message); resetSelect('barangay', 'Could not load barangays'); }
  updateArea();
}
function onBarangayChange() {
  locationState.barangay = $('barangay').value || null;
  updateArea();
}

function headers() { return { 'Content-Type': 'application/json', 'X-Admin-Token': $('token').value }; }
function toast(msg) {
  const el = document.createElement('div'); el.className = 'toast'; el.textContent = msg;
  document.body.appendChild(el); setTimeout(() => el.remove(), 3000);
}

async function refresh() {
  const r = await fetch('/api/advisories');
  const list = r.ok ? await r.json() : [];
  $('list').innerHTML = list.length ? list.map(a =>
    '<div class="card"><div class="top"><span class="tag ' + esc(a.type) + '">' + esc(a.type) + '</span>' +
    '<button class="btn small danger" data-id="' + esc(a.id) + '">Delete</button></div>' +
    '<div class="row"><b>' + esc(a.area) + '</b> (' + esc(a.radius) + ' m)</div>' +
    '<div class="row">' + esc(a.reason.en) + '</div>' +
    '<div class="muted">' + esc(new Date(a.start).toLocaleString()) + ' to ' + esc(new Date(a.eta).toLocaleString()) + ' - ' + esc(a.source) + '</div></div>'
  ).join('') : '<div class="muted">No advisories.</div>';
  document.querySelectorAll('#list [data-id]').forEach(b => b.onclick = async () => {
    if (!confirm('Delete this advisory?')) return;
    const d = await fetch('/api/advisories/' + encodeURIComponent(b.dataset.id), { method: 'DELETE', headers: headers() });
    toast(d.ok ? 'Deleted' : 'Failed (check token)'); refresh();
  });
}

function updatePreview() {
  const lat = parseFloat($('lat').value), lng = parseFloat($('lng').value), radius = parseFloat($('radius').value);
  if (isNaN(lat) || isNaN(lng)) return;
  if (pin) pin.setLatLng([lat, lng]); else pin = L.marker([lat, lng]).addTo(map);
  if (!preview) preview = L.circle([lat, lng], { radius: radius > 0 ? radius : 1000, color: '#dc2626', fillOpacity: 0.15 }).addTo(map);
  preview.setLatLng([lat, lng]); if (radius > 0) preview.setRadius(radius);
}

map = L.map('map').setView([7.0731, 125.6128], 11);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);
map.on('click', e => { $('lat').value = e.latlng.lat.toFixed(6); $('lng').value = e.latlng.lng.toFixed(6); updatePreview(); });

const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
$('start').value = d.toISOString().slice(0, 16);
refresh();

$('radius').oninput = updatePreview; $('lat').oninput = updatePreview; $('lng').oninput = updatePreview;
$('region').addEventListener('change', onRegionChange);
$('province').addEventListener('change', onProvinceChange);
$('city').addEventListener('change', onCityChange);
$('barangay').addEventListener('change', onBarangayChange);
loadRegions();
$('load').onclick = refresh;
$('form').onsubmit = async e => {
  e.preventDefault();
  const body = {
    type: $('type').value, area: $('area').value, lat: $('lat').value, lng: $('lng').value, radius: $('radius').value,
    location: { regionCode: locationState.region, provinceCode: locationState.province, cityMunicipalityCode: locationState.city, barangayCode: locationState.barangay, region: chosenText('region'), province: chosenText('province'), cityMunicipality: chosenText('city'), barangay: chosenText('barangay') },
    reason: { en: $('reasonEn').value, ceb: $('reasonCeb').value },
    start: new Date($('start').value).toISOString(), eta: new Date($('eta').value).toISOString(), source: $('source').value
  };
  const r = await fetch('/api/advisories', { method: 'POST', headers: headers(), body: JSON.stringify(body) });
  if (r.ok) { toast('Published'); $('area').value = ''; $('area').dataset.auto = ''; $('reasonEn').value = ''; $('reasonCeb').value = ''; refresh(); }
  else toast(r.status === 401 ? 'Wrong or missing admin token' : 'Invalid input');
};
