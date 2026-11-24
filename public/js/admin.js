/* Admin page: add / delete advisories. Needs ADMIN_TOKEN from .env. Map: Leaflet + OpenStreetMap (free). */
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let map, pin, preview;

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
$('load').onclick = refresh;
$('form').onsubmit = async e => {
  e.preventDefault();
  const body = {
    type: $('type').value, area: $('area').value, lat: $('lat').value, lng: $('lng').value, radius: $('radius').value,
    reason: { en: $('reasonEn').value, ceb: $('reasonCeb').value },
    start: new Date($('start').value).toISOString(), eta: new Date($('eta').value).toISOString(), source: $('source').value
  };
  const r = await fetch('/api/advisories', { method: 'POST', headers: headers(), body: JSON.stringify(body) });
  if (r.ok) { toast('Published'); $('area').value = ''; $('reasonEn').value = ''; $('reasonCeb').value = ''; refresh(); }
  else toast(r.status === 401 ? 'Wrong or missing admin token' : 'Invalid input');
};
