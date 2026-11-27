/* SafeZone public site. Leaflet + OpenStreetMap (free). Address search -> /api/geocode (Nominatim).
   Location lists -> /api/psgc (cached on the server). Nothing here depends on a third-party API at page load. */
'use strict';
const CONFIG = { DEFAULT_CENTER: [7.0731, 125.6128], DEFAULT_ZOOM: 11, NEAR_EXTRA_M: 800, REPORT_RADIUS_M: 1000, POLL_MS: 60000, FEED_MAX: 40 };
const H = 3600e3, MIN = 60e3;

/* ---------------- text (English / Bisaya) ---------------- */
const T = {
  en: {
    skip: 'Skip to advisories', tagline: 'Community utilities watch', navMap: 'Live map', navReport: 'Report an outage', navAdmin: 'Admin',
    docTitle: 'SafeZone - Water and Power Interruptions',
    title: 'Is your area affected?', lede: 'Search your barangay, street or landmark, or use your location.',
    phLabel: 'Address or landmark', ph: 'Barangay or landmark', check: 'Check area', locate: 'Use my location', searching: 'Searching...',
    browse: 'Browse by location', region: 'Region', province: 'Province', city: 'City / municipality', barangay: 'Barangay', clear: 'Clear',
    selRegion: 'Select region', selProvince: 'Select province', selCity: 'Select city / municipality', selBarangay: 'Select barangay',
    regionFirst: 'Select region first', provinceFirst: 'Select province first', cityFirst: 'Select city first', loading: 'Loading...',
    indep: 'Independent city / special area', noProvince: 'No province in this region', locFail: 'Could not load the list. Try again.',
    locHint: 'Pick a city to see its advisories.', showing: 'Showing',
    feedTitle: 'Current advisories', all: 'All', water: 'Water', power: 'Electricity',
    ongoing: 'Ongoing', scheduled: 'Scheduled', restored: 'Restored', restoredNote: 'last 6 h',
    updated: 'Updated', refresh: 'Refresh', refreshing: 'Updating...', offline: 'Cannot reach the server. Showing the last data we received',
    demo: 'Demo data: these advisories are samples. Add real advisories at /admin.html.',
    emptyTitle: 'No advisories to show', emptyBody: 'There are no matching interruptions right now. Clear the filters to see everything.',
    emptyAll: 'No interruptions are on record right now.', clearFilters: 'Clear filters',
    badWater: 'Water supply is interrupted in your area', badPower: 'Electricity is interrupted in your area', badBoth: 'Water and electricity are interrupted in your area',
    schedWater: 'A water interruption is scheduled for your area', schedPower: 'A power interruption is scheduled for your area', schedBoth: 'Interruptions are scheduled for your area',
    nearTitle: 'An interruption is close to your area', nearSub: 'This spot is just outside the affected zone, so supply may be unstable.',
    ok: 'No known interruption here', okSub: 'No active or scheduled advisory covers this spot. If your supply is out, it may be a local fault. Report it below and tell your utility.',
    backIn: n => 'Service is expected back ' + n + '.', startsIn: n => 'The interruption starts ' + n + '.',
    copyLink: 'Copy link', copied: 'Link copied', copyFail: 'Could not copy. Copy the address from your browser instead.',
    youAffected: 'Affects you', youNear: 'Near you',
    reason: 'Reason', started: 'Started', starts: 'Starts', eta: 'Expected back', restoredAt: 'Restored', source: 'Source', away: 'from zone center',
    inside: 'Inside the zone', near: 'Near the zone', showOnMap: 'Show on map',
    inAbout: 'in about', hrs: 'h', min: 'min', soon: 'any moment now', ago: 'ago', justNow: 'just now', done: 'done', left: 'left',
    geoFail: 'Could not get your location. Type your address instead.', notFound: 'Location not found. Add the barangay or city and try again.',
    pick: 'Did you mean:', searchDown: 'Address search is unavailable right now. Tap the map to choose your spot.', tooMany: 'Too many searches. Wait a minute and try again.',
    tapMap: 'Tap the map to check another spot', yourSpot: 'Selected spot',
    rTitle: 'Still no supply, and no advisory?', rHelp: 'Send an anonymous report for this spot. It is rounded to about 100 m.',
    rWater: 'I have no water', rPower: 'I have no power', rSent: 'Report sent. Thank you.', rFail: 'Could not send the report. Try again later.',
    rCount: n => n + ' report' + (n === 1 ? '' : 's') + ' of this problem within 1 km in the last 3 hours',
    foot: 'Always confirm with your utility (Davao Light for electricity, your water district for water). SafeZone only shows the advisories it has been given. Map data: OpenStreetMap contributors.',
    theme: 'Switch theme', crowd: 'Community reports nearby'
  },
  ceb: {
    skip: 'Laktaw sa mga advisory', tagline: 'Bantay sa serbisyo sa komunidad', navMap: 'Live nga mapa', navReport: 'Mag-report', navAdmin: 'Admin',
    docTitle: 'SafeZone - Tubig ug Kuryente',
    title: 'Apektado ba ang imong lugar?', lede: 'Pangitaa ang imong barangay, dalan o landmark, o gamita ang imong location.',
    phLabel: 'Address o landmark', ph: 'Barangay o landmark', check: 'Susiha', locate: 'Gamita akong location', searching: 'Nangita...',
    browse: 'Pangitaa sa lugar', region: 'Rehiyon', province: 'Probinsya', city: 'Siyudad / munisipyo', barangay: 'Barangay', clear: 'I-clear',
    selRegion: 'Pili og rehiyon', selProvince: 'Pili og probinsya', selCity: 'Pili og siyudad / munisipyo', selBarangay: 'Pili og barangay',
    regionFirst: 'Pili una og rehiyon', provinceFirst: 'Pili una og probinsya', cityFirst: 'Pili una og siyudad', loading: 'Nag-load...',
    indep: 'Independent nga siyudad / special area', noProvince: 'Walay probinsya niining rehiyona', locFail: 'Wala ma-load ang lista. Sulayi usab.',
    locHint: 'Pili og siyudad aron makita ang iyang mga advisory.', showing: 'Gipakita',
    feedTitle: 'Karon nga mga advisory', all: 'Tanan', water: 'Tubig', power: 'Kuryente',
    ongoing: 'Nagpadayon', scheduled: 'Naka-schedule', restored: 'Nabalik na', restoredNote: 'miaging 6 ka oras',
    updated: 'Gi-update', refresh: 'I-refresh', refreshing: 'Nag-update...', offline: 'Dili maabot ang server. Gipakita ang katapusang datos nga nadawat',
    demo: 'Demo data: sample ra kini nga mga advisory. Pagdugang og tinuod sa /admin.html.',
    emptyTitle: 'Walay advisory nga ipakita', emptyBody: 'Walay motabang nga interruption karon. I-clear ang filters aron makita ang tanan.',
    emptyAll: 'Walay interruption nga natala karon.', clearFilters: 'I-clear ang filters',
    badWater: 'Naay interruption sa tubig sa imong lugar', badPower: 'Naay interruption sa kuryente sa imong lugar', badBoth: 'Naay interruption sa tubig ug kuryente sa imong lugar',
    schedWater: 'Naka-schedule ang interruption sa tubig sa imong lugar', schedPower: 'Naka-schedule ang interruption sa kuryente sa imong lugar', schedBoth: 'Naka-schedule ang mga interruption sa imong lugar',
    nearTitle: 'Duol ang interruption sa imong lugar', nearSub: 'Hapit ra kini sa apektadong zone, basin dili stable ang suplay.',
    ok: 'Walay nahibaloang interruption dinhi', okSub: 'Walay active o scheduled nga advisory niini nga lugar. Kung wala gyud kay suplay, basin lokal nga sira. I-report sa ubos ug sa imong utility.',
    backIn: n => 'Gipaabot nga mubalik ' + n + '.', startsIn: n => 'Magsugod ang interruption ' + n + '.',
    copyLink: 'Kopyaha ang link', copied: 'Nakopya na ang link', copyFail: 'Wala makopya. Kopyaha ang address sa browser.',
    youAffected: 'Apektado ka', youNear: 'Duol nimo',
    reason: 'Ngano', started: 'Nagsugod', starts: 'Magsugod', eta: 'Kanus-a mabalik', restoredAt: 'Nabalik', source: 'Tinubdan', away: 'gikan sa tunga sa zone',
    inside: 'Sulod sa zone', near: 'Duol sa zone', showOnMap: 'Ipakita sa mapa',
    inAbout: 'mga', hrs: 'ka oras', min: 'minuto', soon: 'karon na lang', ago: 'na ang milabay', justNow: 'karon lang', done: 'human', left: 'nahabilin',
    geoFail: 'Wala makuha imong location. I-type na lang imong address.', notFound: 'Wala makit-i ang lugar. Idugang ang barangay o siyudad ug sulayi usab.',
    pick: 'Kini ba imong gipasabot:', searchDown: 'Dili magamit ang address search karon. I-tap ang mapa aron pilion imong lugar.', tooMany: 'Daghan kaayo ang search. Paghulat og usa ka minuto.',
    tapMap: 'I-tap ang mapa aron susihon ang lain nga lugar', yourSpot: 'Napili nga lugar',
    rTitle: 'Wala gihapoy suplay ug walay advisory?', rHelp: 'Magpadala og anonymous nga report para ani nga lugar. Gi-round kini sa mga 100 m.',
    rWater: 'Walay tubig sa akoa', rPower: 'Walay kuryente sa akoa', rSent: 'Napadala na ang report. Salamat.', rFail: 'Wala napadala ang report. Sulayi unya.',
    rCount: n => n + ' ka report sa parehas nga problema sulod sa 1 km niining miaging 3 ka oras',
    foot: 'Kanunay nga i-confirm sa imong utility (Davao Light para sa kuryente, water district para sa tubig). Ang gipakita ra sa SafeZone kay ang advisory nga gihatag niini. Map data: OpenStreetMap contributors.',
    theme: 'Usba ang theme', crowd: 'Mga report sa komunidad sa duol'
  }
};

/* ---------------- state + helpers ---------------- */
const state = { lang: 'en', type: 'both', status: 'all', pos: null, city: null, advisories: [], reports: [], sig: '', loaded: false, failed: false, updatedAt: 0, picks: null };
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const t = k => T[state.lang][k];
const pick = obj => (obj && (obj[state.lang] || obj.en)) || '';
const icon = n => '<svg class="ico" aria-hidden="true"><use href="#i-' + n + '"/></svg>';
const typeIcon = ty => ty === 'water' ? 'water' : 'power';
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
};

function distM(lat1, lng1, lat2, lng2) {
  const R = 6371000, rad = x => x * Math.PI / 180;
  const dLat = rad(lat2 - lat1), dLng = rad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
function statusOf(a, now = Date.now()) {
  const s = new Date(a.start).getTime(), e = new Date(a.eta).getTime();
  return now > e ? 'restored' : now >= s ? 'ongoing' : 'scheduled';
}
const fmtTime = iso => new Date(iso).toLocaleString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
function dur(ms) {
  const h = Math.floor(ms / H), m = Math.round((ms % H) / MIN);
  if (h >= 48) return Math.round(h / 24) + ' d';
  if (!h && m < 2) return null;
  return (h ? h + ' ' + t('hrs') : '') + (h && m && h < 6 ? ' ' : '') + ((!h || h < 6) && m ? m + ' ' + t('min') : '');
}
function relFuture(iso) { const d = dur(new Date(iso).getTime() - Date.now()); return d ? t('inAbout') + ' ' + d : t('soon'); }
function relPast(iso) { const d = dur(Date.now() - new Date(iso).getTime()); return d ? d + ' ' + t('ago') : t('justNow'); }
function toast(msg, isError) {
  let wrap = document.querySelector('.toast-wrap');
  if (!wrap) { wrap = document.createElement('div'); wrap.className = 'toast-wrap'; wrap.setAttribute('role', 'status'); document.body.appendChild(wrap); }
  const el = document.createElement('div'); el.className = 'toast' + (isError ? ' error' : ''); el.textContent = msg;
  wrap.appendChild(el); setTimeout(() => el.remove(), 3800);
}

/* ---------------- language + theme ---------------- */
function applyLang() {
  const L = state.lang;
  document.documentElement.lang = L === 'ceb' ? 'ceb' : 'en';
  document.title = t('docTitle');
  document.querySelectorAll('[data-i18n]').forEach(el => { const v = T[L][el.dataset.i18n]; if (typeof v === 'string') el.textContent = v; });
  $('q').placeholder = t('ph');
  $('check').textContent = t('check');
  $('locate').querySelector('.sr').textContent = t('locate'); $('locate').title = t('locate');
  $('foot').textContent = t('foot');
  $('r-title').textContent = t('rTitle'); $('r-help').textContent = t('rHelp');
  $('repWater').querySelector('span').textContent = t('rWater'); $('repPower').querySelector('span').textContent = t('rPower');
  $('refresh').setAttribute('aria-label', t('refresh')); $('refresh').title = t('refresh');
  $('themeBtn').setAttribute('aria-label', t('theme')); $('themeBtn').title = t('theme');
  const seg = $('typeSeg').children; seg[0].textContent = t('all'); seg[1].textContent = t('water'); seg[2].textContent = t('power');
  document.querySelectorAll('.lang button').forEach(b => { const on = b.dataset.l === L; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
  if (!$('offlineNote').hidden) $('offlineNote').textContent = t('offline') + '.';
  resetLocationLists();
  renderAll();
}
function setTheme(dark) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  store.set('sz-theme', dark ? 'dark' : 'light');
  $('themeBtn').querySelector('use').setAttribute('href', dark ? '#i-sun' : '#i-moon');
}

/* ---------------- data (polite polling: conditional requests, only when the tab is visible) ---------------- */
let loading = null;
function loadData(manual) {
  if (loading) return loading;
  if (manual) $('refresh').classList.add('spin');
  loading = (async () => {
    try {
      const [a, r] = await Promise.all([fetch('/api/advisories'), fetch('/api/reports')]);
      if (!a.ok) throw new Error('advisories ' + a.status);
      const [at, rt] = [await a.text(), r.ok ? await r.text() : '[]'];
      state.failed = false; state.updatedAt = Date.now();
      const sig = at + '|' + rt;
      if (sig !== state.sig || !state.loaded) {
        state.sig = sig; state.advisories = JSON.parse(at); state.reports = JSON.parse(rt);
        const first = !state.loaded; state.loaded = true;
        drawZones(); if (first) fitInitial();
        renderAll();
      } else { renderUpdated(); renderFeed(); }   // same data: only refresh countdowns
    } catch (e) {
      state.failed = true;
      if (!state.loaded) { state.loaded = true; renderAll(); }
    } finally {
      loading = null; $('refresh').classList.remove('spin');
      $('offlineNote').hidden = !state.failed; if (state.failed) $('offlineNote').textContent = t('offline') + '.';
      $('demoNote').hidden = false;
      $('demoNote').innerHTML = 'Schedules shown here are source-backed notices, not a live outage feed. The current seed is based on Davao Light\'s 25 Nov 2026 advisory. Switching may last about 30 minutes within the stated time window; the map circles are approximate. <a href="https://www.davaolight.com/post/switching-power-interruptions-on-november-28-and-december-1-in-davao-city-and-davao-del-norte" target="_blank" rel="noopener noreferrer">Open official notice</a>. Check the utility for updates.';
      renderUpdated();
    }
  })();
  return loading;
}
function renderUpdated() {
  $('updated').textContent = state.updatedAt ? t('updated') + ' ' + new Date(state.updatedAt).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' }) : '';
}

/* ---------------- map ---------------- */
let map, marker, zoneLayer; const zones = new Map();
function initMap() {
  L.Icon.Default.imagePath = '/vendor/leaflet/images/';
  map = L.map('map', { preferCanvas: true, zoomControl: false, zoomSnap: 0.5 }).setView(CONFIG.DEFAULT_CENTER, CONFIG.DEFAULT_ZOOM);
  L.control.zoom({ position: 'bottomright' }).addTo(map);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, keepBuffer: 3, updateWhenIdle: true,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
  }).addTo(map);
  zoneLayer = L.layerGroup().addTo(map);
  map.on('click', e => setPosition(e.latlng.lat, e.latlng.lng, { label: '' }));
  map.once('movestart', () => $('mapHint').classList.add('gone'));
  setTimeout(() => $('mapHint').classList.add('gone'), 9000);
}
function popupHtml(a) {
  const st = statusOf(a);
  return '<b>' + esc(t(a.type)) + ' - ' + esc(t(st)) + '</b><div>' + esc(a.area) + '</div><div class="pm">' + esc(pick(a.reason)) + '</div><div class="pm">' +
    esc(st === 'scheduled' ? t('starts') + ' ' + fmtTime(a.start) : t('eta') + ' ' + fmtTime(a.eta)) + '</div>';
}
function drawZones() {
  if (!map) return;
  zoneLayer.clearLayers(); zones.clear();
  state.advisories.forEach(a => {
    const st = statusOf(a);
    if (st === 'restored') return;
    const color = a.type === 'water' ? '#0b72b8' : '#d98e00';
    const c = L.circle([a.lat, a.lng], {
      radius: a.radius, color, weight: 2, fillColor: color,
      fillOpacity: st === 'ongoing' ? 0.26 : 0.1, dashArray: st === 'scheduled' ? '7 7' : null
    }).bindPopup(popupHtml(a)).addTo(zoneLayer);
    zones.set(a.id, c);
  });
}
function fitInitial() {
  if (state.pos) return;
  const cs = [...zones.values()]; if (!cs.length) return;
  const b = L.featureGroup(cs).getBounds();
  if (b.isValid()) map.fitBounds(b, { padding: [50, 50], maxZoom: 13 });
}
function focusAdvisory(id) {
  const c = zones.get(id); if (!c) return;
  map.flyToBounds(c.getBounds(), { padding: [40, 40], maxZoom: 14, duration: 0.8 });
  setTimeout(() => c.openPopup(), 500);
  if (innerWidth <= 1000) $('map').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* ---------------- checking a spot ---------------- */
function setPosition(lat, lng, opts = {}) {
  state.pos = { lat, lng, label: opts.label || '' };
  $('picks').hidden = true; state.picks = null;
  if (marker) marker.setLatLng([lat, lng]); else marker = L.marker([lat, lng]).addTo(map);
  if (opts.fly === false) map.panTo([lat, lng]); else map.flyTo([lat, lng], Math.max(map.getZoom(), 14), { duration: 0.7 });
  syncUrl(); renderAll();
}
function hitsFor(pos) {
  const out = [];
  state.advisories.forEach(a => {
    const st = statusOf(a); if (st === 'restored') return;
    if (state.type !== 'both' && a.type !== state.type) return;
    const d = distM(pos.lat, pos.lng, a.lat, a.lng);
    if (d <= a.radius) out.push({ a, st, d, zone: 'inside' });
    else if (d <= a.radius + CONFIG.NEAR_EXTRA_M) out.push({ a, st, d, zone: 'near' });
  });
  return out;
}
function renderStatus() {
  const box = $('status'), rbox = $('reportBox');
  if (!state.pos) { box.hidden = true; rbox.hidden = true; return; }
  rbox.hidden = false; box.hidden = false;
  const hits = hitsFor(state.pos), inside = hits.filter(h => h.zone === 'inside');
  const nearby = { water: 0, power: 0 };
  state.reports.forEach(r => { if (distM(state.pos.lat, state.pos.lng, r.lat, r.lng) <= CONFIG.REPORT_RADIUS_M) nearby[r.type]++; });
  const crowd = ['water', 'power'].filter(k => nearby[k] && (state.type === 'both' || state.type === k))
    .map(k => '<div>' + icon(typeIcon(k)).replace('class="ico"', 'class="ico ' + k + '"') + ' ' + esc(t(k)) + ': ' + esc(t('rCount')(nearby[k])) + '</div>').join('');
  let cls, title, sub;
  const live = inside.filter(h => h.st === 'ongoing'), sched = inside.filter(h => h.st === 'scheduled');
  const kinds = list => { const s = new Set(list.map(h => h.a.type)); return s.size > 1 ? 'Both' : s.has('water') ? 'Water' : 'Power'; };
  if (live.length) {
    cls = 'bad'; title = t('bad' + kinds(live));
    const eta = live.map(h => h.a.eta).sort()[0]; sub = t('backIn')(relFuture(eta));
  } else if (sched.length) {
    cls = 'near'; title = t('sched' + kinds(sched));
    sub = t('startsIn')(relFuture(sched.map(h => h.a.start).sort()[0]));
  } else if (hits.length) { cls = 'near'; title = t('nearTitle'); sub = t('nearSub'); }
  else { cls = 'ok'; title = t('ok'); sub = t('okSub'); }
  const label = state.pos.label || t('yourSpot') + ' (' + state.pos.lat.toFixed(4) + ', ' + state.pos.lng.toFixed(4) + ')';
  box.className = 'status ' + cls;
  box.innerHTML = '<h2>' + esc(title) + '</h2><p class="sub">' + esc(sub) + '</p>' +
    '<div class="where">' + icon('pin') + '<span>' + esc(label.length > 110 ? label.slice(0, 107) + '...' : label) + '</span></div>' +
    (crowd ? '<div class="crowd"><b>' + esc(t('crowd')) + '</b>' + crowd + '</div>' : '') +
    '<div class="foot"><button class="link-btn" id="copyLink" type="button">' + esc(t('copyLink')) + '</button></div>';
  $('copyLink').onclick = copyLink;
}

/* ---------------- feed ---------------- */
const norm = s => String(s || '').toLowerCase().replace(/\bcity of\b|\bcity\b/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
function inCity(a) {
  const f = state.city; if (!f) return true;
  const l = a.location; if (!l) return false;
  return (f.code && l.cityMunicipalityCode === f.code) || (f.name && norm(l.cityMunicipality) === norm(f.name));
}
function viewList() {
  const now = Date.now();
  return state.advisories.map(a => ({ a, st: statusOf(a, now) }))
    .filter(x => (state.type === 'both' || x.a.type === state.type) && inCity(x.a));
}
const ORDER = { ongoing: 0, scheduled: 1, restored: 2 };
function renderStats(list) {
  const c = { ongoing: 0, scheduled: 0, restored: 0 }; list.forEach(x => c[x.st]++);
  const el = $('stats');
  if (!state.loaded) { el.innerHTML = '<div class="sk stat"></div><div class="sk stat"></div><div class="sk stat"></div>'; return; }
  el.innerHTML = ['ongoing', 'scheduled', 'restored'].map(k =>
    '<button type="button" class="stat s-' + k + '" data-s="' + k + '" aria-pressed="' + (state.status === k) + '"><b>' + c[k] + '</b><span>' + esc(t(k)) + '</span></button>').join('');
}
function advCard(x, hit) {
  const { a, st } = x;
  const s = new Date(a.start).getTime(), e = new Date(a.eta).getTime();
  const pct = st === 'ongoing' ? Math.min(100, Math.max(3, (Date.now() - s) / (e - s) * 100)) : st === 'restored' ? 100 : 0;
  let meta;
  if (st === 'ongoing') meta = '<span><b>' + esc(t('eta')) + '</b> ' + esc(fmtTime(a.eta)) + '</span><span>' + esc(relFuture(a.eta)) + '</span>';
  else if (st === 'scheduled') meta = '<span><b>' + esc(t('starts')) + '</b> ' + esc(fmtTime(a.start)) + '</span><span>' + esc(relFuture(a.start)) + '</span>';
  else meta = '<span><b>' + esc(t('restoredAt')) + '</b> ' + esc(fmtTime(a.eta)) + '</span><span>' + esc(relPast(a.eta)) + '</span>';
  const you = hit ? '<span class="badge you">' + esc(t(hit.zone === 'inside' ? 'youAffected' : 'youNear')) + '</span>' : '';
  return '<article class="adv ' + esc(a.type) + ' is-' + st + '" data-id="' + esc(a.id) + '">' +
    '<div class="adv-top"><span class="type ' + esc(a.type) + '">' + icon(typeIcon(a.type)) + esc(t(a.type)) + '</span><span class="badge ' + st + '">' + esc(t(st)) + '</span>' + you + '</div>' +
    '<h3>' + esc(a.area) + '</h3><p class="reason">' + esc(pick(a.reason)) + '</p>' + (a.note ? '<p class="note">' + esc(a.note) + '</p>' : '') +
    (st !== 'scheduled' ? '<div class="prog"><div class="prog-bar" role="presentation"><i style="width:' + pct.toFixed(0) + '%"></i></div><div class="prog-meta">' + meta + '</div></div>'
      : '<div class="prog"><div class="prog-meta">' + meta + '</div></div>') +
    '<div class="adv-foot"><span>' + esc(t('source')) + ': ' + esc(a.source) + (hit ? ' - ' + (hit.d / 1000).toFixed(1) + ' km ' + esc(t('away')) : '') + '</span>' +
    (st !== 'restored' ? '<button class="link-btn" type="button" data-show="' + esc(a.id) + '">' + esc(t('showOnMap')) + '</button>' : '') + '</div></article>';
}
function renderFeed() {
  const feed = $('feed'), list = viewList();
  renderStats(list);
  if (!state.loaded) { feed.innerHTML = '<div class="sk card"></div><div class="sk card"></div><div class="sk card"></div>'; return; }
  let rows = list.filter(x => state.status === 'all' || x.st === state.status);
  const hitMap = new Map();
  if (state.pos) hitsFor(state.pos).forEach(h => hitMap.set(h.a.id, h));
  rows.sort((x, y) => {
    const hx = hitMap.get(x.a.id), hy = hitMap.get(y.a.id);
    const kx = hx ? (hx.zone === 'inside' ? 0 : 1) : 2, ky = hy ? (hy.zone === 'inside' ? 0 : 1) : 2;
    if (kx !== ky && x.st !== 'restored' && y.st !== 'restored') return kx - ky;
    if (ORDER[x.st] !== ORDER[y.st]) return ORDER[x.st] - ORDER[y.st];
    return x.st === 'restored' ? new Date(y.a.eta) - new Date(x.a.eta) : new Date(x.a.eta) - new Date(y.a.eta);
  });
  if (!rows.length) {
    const filtered = state.type !== 'both' || state.status !== 'all' || state.city;
    feed.innerHTML = '<div class="empty"><b>' + esc(t('emptyTitle')) + '</b>' + esc(filtered ? t('emptyBody') : t('emptyAll')) + '<br>' +
      (filtered ? '<button class="btn small" id="clearFilters" type="button" style="margin-top:12px">' + esc(t('clearFilters')) + '</button>' : '') + '</div>';
    const cf = $('clearFilters'); if (cf) cf.onclick = () => { state.status = 'all'; setType('both'); clearCity(); };
    return;
  }
  feed.innerHTML = rows.slice(0, CONFIG.FEED_MAX).map(x => advCard(x, hitMap.get(x.a.id))).join('');
}
function renderAll() { renderStatus(); renderFeed(); renderUpdated(); }

/* ---------------- address search ---------------- */
async function search(q, label) {
  q = (q || $('q').value).trim();
  if (q.length < 3) return $('q').focus();
  const btn = $('check'), picks = $('picks');
  btn.disabled = true; btn.textContent = t('searching');
  try {
    const r = await fetch('/api/geocode?q=' + encodeURIComponent(q));
    if (r.status === 429) { toast(t('tooMany'), true); return; }
    if (!r.ok) throw new Error('down');
    const list = await r.json();
    if (!list.length) { picks.hidden = true; return toast(t('notFound'), true); }
    if (list.length === 1) return setPosition(list[0].lat, list[0].lng, { label: label || list[0].name });
    state.picks = list; picks.hidden = false;
    picks.innerHTML = '<div>' + esc(t('pick')) + '</div>' + list.map((p, i) => '<button type="button" class="btn small pick" data-i="' + i + '">' + esc(p.name) + '</button>').join('');
  } catch (e) { picks.hidden = true; toast(t('searchDown'), true); }
  finally { btn.disabled = false; btn.textContent = t('check'); }
}
function locate() {
  if (!navigator.geolocation) return toast(t('geoFail'), true);
  const b = $('locate'); b.disabled = true;
  navigator.geolocation.getCurrentPosition(
    p => { b.disabled = false; setPosition(p.coords.latitude, p.coords.longitude, { label: t('yourSpot') }); },
    () => { b.disabled = false; toast(t('geoFail'), true); }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
}

/* ---------------- community reports ---------------- */
async function sendReport(type) {
  if (!state.pos) return;
  const btns = [$('repWater'), $('repPower')]; btns.forEach(b => b.disabled = true);
  try {
    const r = await fetch('/api/reports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, lat: state.pos.lat, lng: state.pos.lng }) });
    if (r.status === 429) throw new Error('rate');
    if (!r.ok) throw new Error('fail');
    toast(t('rSent')); loadData();
  } catch (e) { toast(e.message === 'rate' ? t('tooMany') : t('rFail'), true); }
  finally { btns.forEach(b => b.disabled = false); }
}

/* ---------------- shareable URL ---------------- */
function syncUrl() {
  const u = new URL(location.href); u.search = '';
  if (state.pos) { u.searchParams.set('lat', state.pos.lat.toFixed(5)); u.searchParams.set('lng', state.pos.lng.toFixed(5)); }
  if (state.type !== 'both') u.searchParams.set('type', state.type);
  if (state.lang !== 'en') u.searchParams.set('lang', state.lang);
  try { history.replaceState(null, '', u); } catch (e) { /* ignore */ }
}
async function copyLink() {
  try { await navigator.clipboard.writeText(location.href); toast(t('copied')); } catch (e) { toast(t('copyFail'), true); }
}

/* ---------------- Philippine location lists (lazy: nothing loads until the panel is opened) ---------------- */
const loc = { loaded: false, independent: [] };
async function psgc(path) {
  const r = await fetch('/api/psgc' + path);
  if (!r.ok) throw new Error('psgc');
  return r.json();
}
function fill(id, rows, placeholder, withIndependent) {
  const el = $(id);
  el.innerHTML = '<option value="">' + esc(placeholder) + '</option>' + (withIndependent ? '<option value="none">' + esc(t('indep')) + '</option>' : '') +
    rows.map(r => '<option value="' + esc(r.code) + '">' + esc(r.name) + '</option>').join('');
  el.disabled = !rows.length && !withIndependent;
}
const chosen = id => { const el = $(id); return el.value && el.value !== 'none' ? el.options[el.selectedIndex].text : ''; };
function locSummary() {
  const parts = ['barangay', 'city', 'province', 'region'].map(chosen).filter(Boolean);
  $('locationSummary').textContent = parts.length ? parts.join(', ') : t('locHint');
}
/* (re)label the empty first option of each list in the current language */
function resetLocationLists() {
  const prompts = { region: 'selRegion', province: 'regionFirst', city: 'provinceFirst', barangay: 'cityFirst' };
  const ready = { region: 'selRegion', province: 'selProvince', city: 'selCity', barangay: 'selBarangay' };
  Object.keys(prompts).forEach(id => {
    const el = $(id);
    if (!el.options.length) el.innerHTML = '<option value=""></option>';
    el.options[0].textContent = t(el.disabled || (id === 'region' && !loc.loaded) ? prompts[id] : ready[id]);
    if (id === 'region' && !loc.loaded) el.options[0].textContent = t('selRegion');
  });
  locSummary();
}
async function loadRegions() {
  if (loc.loaded) return; loc.loaded = true;
  fill('region', [], t('loading'));
  try { fill('region', await psgc('/regions?limit=100'), t('selRegion')); }
  catch (e) { loc.loaded = false; fill('region', [], t('locFail')); toast(t('locFail'), true); }
}
async function onRegion() {
  const code = $('region').value; clearCity(true);
  fill('province', [], t('loading')); fill('city', [], t('provinceFirst')); fill('barangay', [], t('cityFirst'));
  if (!code) { fill('province', [], t('regionFirst')); return locSummary(); }
  try {
    const [provinces, indep] = await Promise.all([psgc('/regions/' + code + '/provinces'), psgc('/cities-municipalities?region=' + code + '&province=none&limit=2000')]);
    loc.independent = indep;
    fill('province', provinces, provinces.length ? t('selProvince') : t('noProvince'), provinces.length > 0 && indep.length > 0);
    if (!provinces.length) fill('city', indep, t('selCity'));
  } catch (e) { fill('province', [], t('locFail')); toast(t('locFail'), true); }
  locSummary();
}
async function onProvince() {
  const code = $('province').value; clearCity(true);
  fill('city', [], t('loading')); fill('barangay', [], t('cityFirst'));
  if (!code) { fill('city', [], t('provinceFirst')); return locSummary(); }
  try { fill('city', code === 'none' ? loc.independent : await psgc('/provinces/' + code + '/cities-municipalities?limit=500'), t('selCity')); }
  catch (e) { fill('city', [], t('locFail')); toast(t('locFail'), true); }
  locSummary();
}
async function onCity() {
  const code = $('city').value;
  fill('barangay', [], code ? t('loading') : t('cityFirst'));
  state.city = code ? { code, name: chosen('city') } : null;
  renderFeed(); locSummary();
  if (!code) return;
  const ids = state.advisories.filter(a => inCity(a) && zones.has(a.id)).map(a => zones.get(a.id));
  if (ids.length) map.fitBounds(L.featureGroup(ids).getBounds(), { padding: [50, 50], maxZoom: 14 });
  try { fill('barangay', await psgc('/cities-municipalities/' + code + '/barangays?limit=1000'), t('selBarangay')); }
  catch (e) { fill('barangay', [], t('locFail')); }
  locSummary();
}
async function onBarangay() {
  locSummary();
  if (!$('barangay').value) return;
  const q = [chosen('barangay'), chosen('city'), chosen('province') || chosen('region')].filter(Boolean).join(', ');
  $('q').value = q; await search(q, q);
}
function clearCity(keepSelects) {
  state.city = null;
  if (!keepSelects) {
    ['region', 'province', 'city', 'barangay'].forEach(id => { $(id).value = ''; });
    fill('province', [], t('regionFirst')); fill('city', [], t('provinceFirst')); fill('barangay', [], t('cityFirst'));
    locSummary();
  }
  renderFeed();
}

/* ---------------- filters ---------------- */
function setType(f) {
  state.type = f;
  [...$('typeSeg').children].forEach(b => { const on = b.dataset.f === f; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
  syncUrl(); renderAll();
}

/* ---------------- wiring ---------------- */
function wire() {
  $('searchForm').addEventListener('submit', e => { e.preventDefault(); search(); });
  $('locate').onclick = locate;
  $('refresh').onclick = () => loadData(true);
  $('typeSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setType(b.dataset.f); });
  $('stats').addEventListener('click', e => { const b = e.target.closest('.stat'); if (!b) return; state.status = state.status === b.dataset.s ? 'all' : b.dataset.s; renderFeed(); });
  $('feed').addEventListener('click', e => { const b = e.target.closest('[data-show]'); if (b) focusAdvisory(b.dataset.show); });
  $('picks').addEventListener('click', e => { const b = e.target.closest('.pick'); if (!b || !state.picks) return; const p = state.picks[+b.dataset.i]; setPosition(p.lat, p.lng, { label: p.name }); });
  $('repWater').onclick = () => sendReport('water'); $('repPower').onclick = () => sendReport('power');
  document.querySelectorAll('.lang button').forEach(b => b.onclick = () => { state.lang = b.dataset.l; store.set('sz-lang', state.lang); syncUrl(); applyLang(); });
  $('themeBtn').onclick = () => setTheme(document.documentElement.getAttribute('data-theme') !== 'dark');
  $('browse').addEventListener('toggle', () => { if ($('browse').open) loadRegions(); });
  $('region').onchange = onRegion; $('province').onchange = onProvince; $('city').onchange = onCity; $('barangay').onchange = onBarangay;
  $('clearLocation').onclick = () => { $('q').value = ''; clearCity(); };
  // refresh when the tab comes back, poll only while visible
  document.addEventListener('visibilitychange', () => { if (!document.hidden && Date.now() - state.updatedAt > 30000) loadData(); });
  setInterval(() => { if (!document.hidden) loadData(); }, CONFIG.POLL_MS);
}

/* ---------------- boot ---------------- */
(function boot() {
  const qs = new URLSearchParams(location.search);
  state.lang = qs.get('lang') === 'ceb' || (!qs.get('lang') && store.get('sz-lang') === 'ceb') ? 'ceb' : 'en';
  if (['water', 'power'].includes(qs.get('type'))) state.type = qs.get('type');
  setTheme(document.documentElement.getAttribute('data-theme') === 'dark');
  initMap(); wire();
  setType(state.type);
  applyLang();                   // paints skeletons immediately
  const lat = parseFloat(qs.get('lat')), lng = parseFloat(qs.get('lng'));
  if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
    state.pos = { lat, lng, label: '' }; marker = L.marker([lat, lng]).addTo(map); map.setView([lat, lng], 14);
  }
  loadData();
})();
