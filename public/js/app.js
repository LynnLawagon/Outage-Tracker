/* SafeZone public site. Leaflet + OpenStreetMap (free). Address search -> /api/geocode (Nominatim).
   Location lists -> /api/psgc (cached on the server). Boundaries -> /api/boundaries/:code. */
'use strict';

const CONFIG = {
  DEFAULT_CENTER: [7.0731, 125.6128],
  DEFAULT_ZOOM: 11,
  NEAR_EXTRA_M: 800,
  REPORT_RADIUS_M: 1000,
  POLL_MS: 60000,
  FEED_MAX: 40
};
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
    ongoing: 'Ongoing', scheduled: 'Scheduled', restored: 'Restored', recheck: 'Needs Recheck', restoredNote: 'last 6 h',
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
    ongoing: 'Nagpadayon', scheduled: 'Naka-schedule', restored: 'Nabalik na', recheck: 'Kinahanglan i-recheck', restoredNote: 'miaging 6 ka oras',
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
const state = {
  lang: 'en', type: 'both', status: 'all',
  pos: null, city: null,
  advisories: [], reports: [],
  sig: '', loaded: false, failed: false, updatedAt: 0, picks: null
};
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const t = k => (T[state.lang] && T[state.lang][k]) || T.en[k] || k;
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
  if (a.resolved || a.lifecycleStatus === 'Restored') return 'restored';
  const s = new Date(a.start).getTime(), e = new Date(a.eta).getTime();
  if (Number.isFinite(s) && now < s) return 'scheduled';
  if (Number.isFinite(e) && now > e) return 'recheck';
  return 'ongoing';
}

const fmtTime = iso => {
  if (!iso) return 'N/A';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'N/A';
  return d.toLocaleString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

function dur(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const h = Math.floor(ms / H), m = Math.round((ms % H) / MIN);
  if (h >= 48) return Math.round(h / 24) + ' d';
  if (!h && m < 2) return null;
  return (h ? h + ' ' + t('hrs') : '') + (h && m && h < 6 ? ' ' : '') + ((!h || h < 6) && m ? m + ' ' + t('min') : '');
}

function relFuture(iso) {
  const d = dur(new Date(iso).getTime() - Date.now());
  return d ? t('inAbout') + ' ' + d : t('soon');
}

function relPast(iso) {
  const d = dur(Date.now() - new Date(iso).getTime());
  return d ? d + ' ' + t('ago') : t('justNow');
}

function toast(msg, isError) {
  let wrap = document.querySelector('.toast-wrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.className = 'toast-wrap';
    wrap.setAttribute('role', 'status');
    document.body.appendChild(wrap);
  }
  const el = document.createElement('div');
  el.className = 'toast' + (isError ? ' error' : '');
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 3800);
}

/* ---------------- language + theme ---------------- */
function applyLang() {
  const L = state.lang;
  document.documentElement.lang = L === 'ceb' ? 'ceb' : 'en';
  document.title = t('docTitle');
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const v = T[L] && T[L][el.dataset.i18n];
    if (typeof v === 'string') el.textContent = v;
  });
  if ($('q')) $('q').placeholder = t('ph');
  if ($('check')) $('check').textContent = t('check');
  if ($('locate')) {
    const sr = $('locate').querySelector('.sr');
    if (sr) sr.textContent = t('locate');
    $('locate').title = t('locate');
  }
  if ($('foot')) $('foot').textContent = t('foot');
  if ($('r-title')) $('r-title').textContent = t('rTitle');
  if ($('r-help')) $('r-help').textContent = t('rHelp');
  if ($('repWater') && $('repWater').querySelector('span')) $('repWater').querySelector('span').textContent = t('rWater');
  if ($('repPower') && $('repPower').querySelector('span')) $('repPower').querySelector('span').textContent = t('rPower');
  if ($('refresh')) { $('refresh').setAttribute('aria-label', t('refresh')); $('refresh').title = t('refresh'); }
  if ($('themeBtn')) { $('themeBtn').setAttribute('aria-label', t('theme')); $('themeBtn').title = t('theme'); }
  if ($('typeSeg') && $('typeSeg').children.length >= 3) {
    const seg = $('typeSeg').children;
    seg[0].textContent = t('all');
    seg[1].textContent = t('water');
    seg[2].textContent = t('power');
  }
  document.querySelectorAll('.lang button').forEach(b => {
    const on = b.dataset.l === L;
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', on);
  });
  if ($('offlineNote') && !$('offlineNote').hidden) $('offlineNote').textContent = t('offline') + '.';
  resetLocationLists();
  renderAll();
}

function setTheme(dark) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  store.set('sz-theme', dark ? 'dark' : 'light');
  const useEl = $('themeBtn') && $('themeBtn').querySelector('use');
  if (useEl) useEl.setAttribute('href', dark ? '#i-sun' : '#i-moon');
}

/* ---------------- data polling ---------------- */
let loading = null;
function loadData(manual) {
  if (loading) return loading;
  if (manual && $('refresh')) $('refresh').classList.add('spin');
  loading = (async () => {
    try {
      const [a, r] = await Promise.all([fetch('/api/advisories'), fetch('/api/reports')]);
      if (!a.ok) throw new Error('advisories ' + a.status);
      const [at, rt] = [await a.text(), r.ok ? await r.text() : '[]'];
      state.failed = false;
      state.updatedAt = Date.now();
      const sig = at + '|' + rt;
      if (sig !== state.sig || !state.loaded) {
        state.sig = sig;
        state.advisories = JSON.parse(at);
        state.reports = JSON.parse(rt);
        const first = !state.loaded;
        state.loaded = true;
        drawZones();
        if (first) fitInitial();
        renderAll();
      } else {
        renderUpdated();
        renderFeed();
      }
    } catch (e) {
      state.failed = true;
      if (!state.loaded) { state.loaded = true; renderAll(); }
    } finally {
      loading = null;
      if ($('refresh')) $('refresh').classList.remove('spin');
      if ($('offlineNote')) {
        $('offlineNote').hidden = !state.failed;
        if (state.failed) $('offlineNote').textContent = t('offline') + '.';
      }
      if ($('demoNote')) {
        $('demoNote').hidden = false;
        $('demoNote').innerHTML =
          'Schedules shown here are source-backed notices, not a live outage feed. Map circles are approximate unless exact GeoJSON boundaries or specific road/landmark data are provided. ' +
          '<a href="https://www.davaolight.com/post/switching-power-interruptions-on-november-28-and-december-1-in-davao-city-and-davao-del-norte" target="_blank" rel="noopener noreferrer">Open Davao Light notice</a>.';
      }
      renderUpdated();
    }
  })();
  return loading;
}

function renderUpdated() {
  if (!$('updated')) return;
  $('updated').textContent = state.updatedAt
    ? t('updated') + ' ' + new Date(state.updatedAt).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })
    : '';
}

/* ---------------- GIS Map & 3-Level Smart Fallback ---------------- */
let map, marker, layers;
const zones = new Map();
const boundaryCache = new Map();

function initMap() {
  L.Icon.Default.imagePath = '/vendor/leaflet/images/';
  map = L.map('map', { preferCanvas: true, zoomControl: false, zoomSnap: 0.5 }).setView(CONFIG.DEFAULT_CENTER, CONFIG.DEFAULT_ZOOM);
  L.control.zoom({ position: 'bottomright' }).addTo(map);

  const osmTiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    keepBuffer: 3,
    updateWhenIdle: true,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
  }).addTo(map);

  layers = {
    electricity: L.layerGroup().addTo(map),
    water: L.layerGroup().addTo(map),
    barangays: L.layerGroup().addTo(map),
    roads: L.layerGroup().addTo(map)
  };

  L.control.layers(
    { OpenStreetMap: osmTiles },
    {
      'Electricity Interruptions': layers.electricity,
      'Water Interruptions': layers.water,
      'Barangay Boundaries (GeoJSON)': layers.barangays,
      'Affected Roads & Specific Locations': layers.roads
    },
    { position: 'topright', collapsed: window.innerWidth <= 1000 }
  ).addTo(map);

  map.on('click', e => setPosition(e.latlng.lat, e.latlng.lng, { label: '' }));
  if ($('mapHint')) {
    map.once('movestart', () => $('mapHint').classList.add('gone'));
    setTimeout(() => $('mapHint').classList.add('gone'), 9000);
  }
}

function popupHtml(a) {
  const st = statusOf(a);
  const stText = st === 'recheck' ? t('recheck') + ' (Schedule Expired)' : t(st);
  const loc = a.location || {};
  const hierarchy = [loc.barangay, loc.cityMunicipality, loc.province, loc.region].filter(Boolean).join(', ');
  const levelNote = a.mappingLevel === 1
    ? 'Level 1: Exact Geographic Coverage (Verified GeoJSON boundary)'
    : a.mappingLevel === 2
      ? 'Level 2: Specific Location (Road segment or landmark)'
      : 'Level 3: Approximate affected area — exact boundary unavailable; actual coverage may differ.';
  const srcLink = a.sourceUrl
    ? '<div class="pm"><a href="' + esc(a.sourceUrl) + '" target="_blank" rel="noopener noreferrer">Original Announcement</a></div>'
    : '';

  return (
    '<b>' + esc(a.provider || t(a.type)) + ' (' + esc(t(a.type)) + ')</b>' +
    '<div class="pm"><b>Status:</b> ' + esc(stText) + ' &bull; <b>' + esc(a.verification || 'Unverified') + '</b></div>' +
    '<div class="pm"><b>Area:</b> ' + esc(hierarchy || a.area) + '</div>' +
    '<div class="pm"><b>Specific Locations:</b> ' + esc((a.specificLocations && a.specificLocations.length ? a.specificLocations : [a.area]).join(', ')) + '</div>' +
    '<div class="pm">' + esc(pick(a.reason)) + '</div>' +
    '<div class="pm"><b>Schedule:</b> ' + esc(fmtTime(a.start)) + ' &rarr; ' + esc(fmtTime(a.eta)) + '</div>' +
    '<div class="pm"><b>Published:</b> ' + esc(fmtTime(a.publishedAt || a.createdAt)) + ' &bull; <b>Verified:</b> ' + esc(fmtTime(a.lastVerifiedAt || a.updatedAt)) + '</div>' +
    '<div class="pm"><em>' + esc(levelNote) + '</em></div>' +
    srcLink
  );
}

function drawZones() {
  if (!map || !layers) return;
  Object.values(layers).forEach(g => g.clearLayers());
  zones.clear();

  state.advisories.forEach(a => {
    const st = statusOf(a);
    if (st === 'restored') return;
    if (state.type !== 'both' && a.type !== state.type) return;

    const color = a.type === 'water' ? '#0284c7' : '#d97706';
    const serviceGroup = a.type === 'water' ? layers.water : layers.electricity;
    const dashArray = st === 'scheduled' ? '7 7' : st === 'recheck' ? '3 6' : null;
    const fillOpacity = st === 'ongoing' ? 0.26 : 0.13;
    let layer = null;

    if (a.mappingLevel === 1 && a.geometry && ['Polygon', 'MultiPolygon'].includes(a.geometry.type)) {
      layer = L.geoJSON(a.geometry, {
        style: () => ({ color, weight: 2.5, fillColor: color, fillOpacity, dashArray })
      }).bindPopup(popupHtml(a)).addTo(layers.barangays);
      layer.addTo(serviceGroup);
    } else if (a.mappingLevel === 2 && a.geometry) {
      if (['LineString', 'MultiLineString'].includes(a.geometry.type)) {
        layer = L.geoJSON(a.geometry, {
          style: () => ({ color, weight: 5, opacity: 0.9, dashArray })
        }).bindPopup(popupHtml(a)).addTo(layers.roads);
      } else if (a.geometry.type === 'Point') {
        const [lng, lat] = a.geometry.coordinates;
        layer = L.circleMarker([lat, lng], {
          radius: 9, color, weight: 2.5, fillColor: color, fillOpacity: 0.78
        }).bindPopup(popupHtml(a)).addTo(layers.roads);
      }
      if (layer) layer.addTo(serviceGroup);
    } else if (Number.isFinite(a.lat) && Number.isFinite(a.lng)) {
      layer = L.circle([a.lat, a.lng], {
        radius: a.radius || 1000,
        color,
        weight: 2,
        fillColor: color,
        fillOpacity: 0.11,
        dashArray: '8 6'
      }).bindPopup(popupHtml(a)).addTo(serviceGroup);
    }

    if (layer) zones.set(a.id, layer);
  });
}

function fitInitial() {
  if (state.pos) return;
  const cs = [...zones.values()];
  if (!cs.length) return;
  const b = L.featureGroup(cs).getBounds();
  if (b.isValid()) map.fitBounds(b, { padding: [50, 50], maxZoom: 13 });
}

function focusAdvisory(id) {
  const layer = zones.get(id);
  if (!layer) return;
  if (typeof layer.getBounds === 'function') {
    const b = layer.getBounds();
    if (b.isValid()) map.flyToBounds(b, { padding: [40, 40], maxZoom: 14, duration: 0.8 });
  } else if (typeof layer.getLatLng === 'function') {
    map.flyTo(layer.getLatLng(), Math.max(map.getZoom(), 15), { duration: 0.8 });
  }
  setTimeout(() => layer.openPopup(), 450);
  if (window.innerWidth <= 1000 && $('map')) $('map').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* ---------------- checking a spot ---------------- */
function setPosition(lat, lng, opts = {}) {
  state.pos = { lat, lng, label: opts.label || '' };
  if ($('picks')) $('picks').hidden = true;
  state.picks = null;
  if (marker) marker.setLatLng([lat, lng]);
  else marker = L.marker([lat, lng]).addTo(map);
  if (opts.fly === false) map.panTo([lat, lng]);
  else map.flyTo([lat, lng], Math.max(map.getZoom(), 14), { duration: 0.7 });
  syncUrl();
  renderAll();
}

function hitsFor(pos) {
  const out = [];
  state.advisories.forEach(a => {
    const st = statusOf(a);
    if (st === 'restored') return;
    if (state.type !== 'both' && a.type !== state.type) return;
    const d = distM(pos.lat, pos.lng, a.lat, a.lng);
    const rad = a.radius || 1000;
    if (d <= rad) out.push({ a, st, d, zone: 'inside' });
    else if (d <= rad + CONFIG.NEAR_EXTRA_M) out.push({ a, st, d, zone: 'near' });
  });
  return out;
}

function renderStatus() {
  const box = $('status'), rbox = $('reportBox');
  if (!box || !rbox) return;
  if (!state.pos) { box.hidden = true; rbox.hidden = true; return; }
  rbox.hidden = false;
  box.hidden = false;
  const hits = hitsFor(state.pos), inside = hits.filter(h => h.zone === 'inside');
  const nearby = { water: 0, power: 0 };
  state.reports.forEach(r => {
    if (distM(state.pos.lat, state.pos.lng, r.lat, r.lng) <= CONFIG.REPORT_RADIUS_M) nearby[r.type]++;
  });
  const crowd = ['water', 'power']
    .filter(k => nearby[k] && (state.type === 'both' || state.type === k))
    .map(k => '<div>' + icon(typeIcon(k)).replace('class="ico"', 'class="ico ' + k + '"') + ' ' + esc(t(k)) + ': ' + esc(t('rCount')(nearby[k])) + '</div>')
    .join('');

  let cls, title, sub;
  const live = inside.filter(h => h.st === 'ongoing');
  const sched = inside.filter(h => h.st === 'scheduled');
  const kinds = list => {
    const s = new Set(list.map(h => h.a.type));
    return s.size > 1 ? 'Both' : s.has('water') ? 'Water' : 'Power';
  };
  if (live.length) {
    cls = 'bad';
    title = t('bad' + kinds(live));
    sub = t('backIn')(relFuture(live.map(h => h.a.eta).sort()[0]));
  } else if (sched.length) {
    cls = 'near';
    title = t('sched' + kinds(sched));
    sub = t('startsIn')(relFuture(sched.map(h => h.a.start).sort()[0]));
  } else if (hits.length) {
    cls = 'near';
    title = t('nearTitle');
    sub = t('nearSub');
  } else {
    cls = 'ok';
    title = t('ok');
    sub = t('okSub');
  }
  const label = state.pos.label || t('yourSpot') + ' (' + state.pos.lat.toFixed(4) + ', ' + state.pos.lng.toFixed(4) + ')';
  box.className = 'status ' + cls;
  box.innerHTML =
    '<h2>' + esc(title) + '</h2><p class="sub">' + esc(sub) + '</p>' +
    '<div class="where">' + icon('pin') + '<span>' + esc(label.length > 110 ? label.slice(0, 107) + '...' : label) + '</span></div>' +
    (crowd ? '<div class="crowd"><b>' + esc(t('crowd')) + '</b>' + crowd + '</div>' : '') +
    '<div class="foot"><button class="link-btn" id="copyLink" type="button">' + esc(t('copyLink')) + '</button></div>';
  if ($('copyLink')) $('copyLink').onclick = copyLink;
}

/* ---------------- feed ---------------- */
const norm = s => String(s || '').toLowerCase().replace(/\bcity of\b|\bcity\b/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
function inCity(a) {
  const f = state.city;
  if (!f) return true;
  const l = a.location;
  if (!l) return false;
  return (f.code && l.cityMunicipalityCode === f.code) || (f.name && norm(l.cityMunicipality) === norm(f.name));
}

function viewList() {
  const now = Date.now();
  return state.advisories
    .map(a => ({ a, st: statusOf(a, now) }))
    .filter(x => (state.type === 'both' || x.a.type === state.type) && inCity(x.a));
}

const ORDER = { ongoing: 0, scheduled: 1, recheck: 2, restored: 3 };
function renderStats(list) {
  const el = $('stats');
  if (!el) return;
  const c = { ongoing: 0, scheduled: 0, restored: 0 };
  list.forEach(x => {
    if (x.st === 'ongoing' || x.st === 'scheduled' || x.st === 'restored') c[x.st]++;
  });
  if (!state.loaded) {
    el.innerHTML = '<div class="sk stat"></div><div class="sk stat"></div><div class="sk stat"></div>';
    return;
  }
  el.innerHTML = ['ongoing', 'scheduled', 'restored']
    .map(k => '<button type="button" class="stat s-' + k + '" data-s="' + k + '" aria-pressed="' + (state.status === k) + '"><b>' + c[k] + '</b><span>' + esc(t(k)) + '</span></button>')
    .join('');
}

function advCard(x, hit) {
  const { a, st } = x;
  const loc = a.location || {};
  const verClass = a.verification === 'Officially Confirmed' ? 'verified' : a.verification === 'Community Report' ? 'community' : 'unverified';
  const statusBadge = st === 'recheck'
    ? '<span class="badge recheck">' + esc(t('recheck')) + '</span>'
    : '<span class="badge ' + st + '">' + esc(t(st)) + '</span>';
  const approxBadge = a.mappingLevel === 3
    ? '<span class="badge approx" title="Actual coverage may differ">Approximate affected area</span>'
    : '';
  const you = hit ? '<span class="badge you">' + esc(t(hit.zone === 'inside' ? 'youAffected' : 'youNear')) + '</span>' : '';

  return (
    '<article class="adv ' + esc(a.type) + ' is-' + st + '" data-id="' + esc(a.id) + '">' +
      '<div class="adv-top">' +
        '<span class="type ' + esc(a.type) + '">' + icon(typeIcon(a.type)) + esc(t(a.type)) + '</span>' +
        statusBadge +
        '<span class="badge ' + verClass + '">' + esc(a.verification || 'Unverified') + '</span>' +
        approxBadge +
        you +
      '</div>' +
      '<h3>' + esc(a.area) + '</h3>' +
      '<p class="reason">' + esc(pick(a.reason)) + '</p>' +
      '<div class="adv-meta-grid">' +
        '<div><b>Provider:</b> ' + esc(a.provider || a.source) + '</div>' +
        '<div><b>Region / Province:</b> ' + esc([loc.region, loc.province].filter(Boolean).join(' / ') || 'N/A') + '</div>' +
        '<div><b>City / Barangay:</b> ' + esc([loc.cityMunicipality, loc.barangay].filter(Boolean).join(' / ') || 'N/A') + '</div>' +
        '<div><b>Window:</b> ' + esc(fmtTime(a.start)) + ' &ndash; ' + esc(fmtTime(a.eta)) + '</div>' +
        '<div><b>Published:</b> ' + esc(fmtTime(a.publishedAt || a.createdAt)) + '</div>' +
        '<div><b>Last Verified:</b> ' + esc(fmtTime(a.lastVerifiedAt || a.updatedAt)) + '</div>' +
      '</div>' +
      (a.note ? '<p class="note">' + esc(a.note) + '</p>' : '') +
      '<div class="adv-foot">' +
        '<span>' + (a.sourceUrl ? '<a class="link-btn" href="' + esc(a.sourceUrl) + '" target="_blank" rel="noopener noreferrer">Original Announcement</a>' : esc(t('source') + ': ' + a.source)) + '</span>' +
        (st !== 'restored' ? '<button class="link-btn" type="button" data-show="' + esc(a.id) + '">' + esc(t('showOnMap')) + '</button>' : '') +
      '</div>' +
    '</article>'
  );
}

function renderFeed() {
  const feed = $('feed');
  if (!feed) return;
  const list = viewList();
  renderStats(list);
  if (!state.loaded) {
    feed.innerHTML = '<div class="sk card"></div><div class="sk card"></div><div class="sk card"></div>';
    return;
  }
  let rows = list.filter(x => state.status === 'all' || x.st === state.status);
  const hitMap = new Map();
  if (state.pos) hitsFor(state.pos).forEach(h => hitMap.set(h.a.id, h));
  rows.sort((x, y) => {
    const hx = hitMap.get(x.a.id), hy = hitMap.get(y.a.id);
    const kx = hx ? (hx.zone === 'inside' ? 0 : 1) : 2, ky = hy ? (hy.zone === 'inside' ? 0 : 1) : 2;
    if (kx !== ky && x.st !== 'restored' && y.st !== 'restored') return kx - ky;
    if (ORDER[x.st] !== ORDER[y.st]) return ORDER[x.st] - ORDER[y.st];
    return new Date(y.a.eta) - new Date(x.a.eta);
  });
  if (!rows.length) {
    const filtered = state.type !== 'both' || state.status !== 'all' || state.city;
    feed.innerHTML =
      '<div class="empty"><b>' + esc(t('emptyTitle')) + '</b>' + esc(filtered ? t('emptyBody') : t('emptyAll')) + '<br>' +
      (filtered ? '<button class="btn small" id="clearFilters" type="button" style="margin-top:12px">' + esc(t('clearFilters')) + '</button>' : '') +
      '</div>';
    if ($('clearFilters')) $('clearFilters').onclick = () => { state.status = 'all'; setType('both'); clearCity(); };
    return;
  }
  feed.innerHTML = rows.slice(0, CONFIG.FEED_MAX).map(x => advCard(x, hitMap.get(x.a.id))).join('');
}

function renderAll() { renderStatus(); renderFeed(); renderUpdated(); }

/* ---------------- address search & reports ---------------- */
async function search(q, label) {
  q = (q || ($('q') && $('q').value) || '').trim();
  if (q.length < 3) return $('q') && $('q').focus();
  const btn = $('check'), picks = $('picks');
  if (btn) { btn.disabled = true; btn.textContent = t('searching'); }
  try {
    const r = await fetch('/api/geocode?q=' + encodeURIComponent(q));
    if (r.status === 429) { toast(t('tooMany'), true); return; }
    if (!r.ok) throw new Error('down');
    const list = await r.json();
    if (!list.length) { if (picks) picks.hidden = true; return toast(t('notFound'), true); }
    if (list.length === 1) return setPosition(list[0].lat, list[0].lng, { label: label || list[0].name });
    state.picks = list;
    if (picks) {
      picks.hidden = false;
      picks.innerHTML = '<div>' + esc(t('pick')) + '</div>' + list.map((p, i) => '<button type="button" class="btn small pick" data-i="' + i + '">' + esc(p.name) + '</button>').join('');
    }
  } catch (e) {
    if (picks) picks.hidden = true;
    toast(t('searchDown'), true);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = t('check'); }
  }
}

function locate() {
  if (!navigator.geolocation) return toast(t('geoFail'), true);
  const b = $('locate'); if (b) b.disabled = true;
  navigator.geolocation.getCurrentPosition(
    p => { if (b) b.disabled = false; setPosition(p.coords.latitude, p.coords.longitude, { label: t('yourSpot') }); },
    () => { if (b) b.disabled = false; toast(t('geoFail'), true); },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
  );
}

async function sendReport(type) {
  if (!state.pos) return;
  const btns = [$('repWater'), $('repPower')].filter(Boolean);
  btns.forEach(b => { b.disabled = true; });
  try {
    const r = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, lat: state.pos.lat, lng: state.pos.lng })
    });
    if (r.status === 429) throw new Error('rate');
    if (!r.ok) throw new Error('fail');
    toast(t('rSent'));
    loadData();
  } catch (e) {
    toast(e.message === 'rate' ? t('tooMany') : t('rFail'), true);
  } finally {
    btns.forEach(b => { b.disabled = false; });
  }
}

function syncUrl() {
  const u = new URL(location.href); u.search = '';
  if (state.pos) { u.searchParams.set('lat', state.pos.lat.toFixed(5)); u.searchParams.set('lng', state.pos.lng.toFixed(5)); }
  if (state.type !== 'both') u.searchParams.set('type', state.type);
  if (state.lang !== 'en') u.searchParams.set('lang', state.lang);
  try { history.replaceState(null, '', u); } catch (e) { /* ignore */ }
}

async function copyLink() {
  try { await navigator.clipboard.writeText(location.href); toast(t('copied')); }
  catch (e) { toast(t('copyFail'), true); }
}

/* ---------------- Searchable PSGC Dropdowns & GeoJSON Boundary Lookup ---------------- */
const loc = { loaded: false, independent: [], rawLists: { region: [], province: [], city: [], barangay: [] } };

async function psgc(pathname) {
  const r = await fetch('/api/psgc' + pathname);
  if (!r.ok) throw new Error('psgc');
  return r.json();
}

function renderFilteredOptions(id, filterText, placeholder, withIndependent) {
  const el = $(id);
  if (!el) return;
  const rows = loc.rawLists[id] || [];
  const q = String(filterText || '').trim().toLowerCase();
  const filtered = q ? rows.filter(r => r.name.toLowerCase().includes(q)) : rows;
  const prev = el.value;
  el.innerHTML =
    '<option value="">' + esc(placeholder) + '</option>' +
    (withIndependent ? '<option value="none">' + esc(t('indep')) + '</option>' : '') +
    filtered.map(r => '<option value="' + esc(r.code) + '">' + esc(r.name) + '</option>').join('');
  if (prev && [...el.options].some(o => o.value === prev)) el.value = prev;
  el.disabled = !rows.length && !withIndependent;
  const fInput = $(id + 'Filter');
  if (fInput) fInput.disabled = el.disabled;
}

function fill(id, rows, placeholder, withIndependent) {
  loc.rawLists[id] = rows || [];
  const fInput = $(id + 'Filter');
  if (fInput) fInput.value = '';
  renderFilteredOptions(id, '', placeholder, withIndependent);
}

const chosen = id => {
  const el = $(id);
  return el && el.value && el.value !== 'none' ? el.options[el.selectedIndex].text : '';
};

function locSummary() {
  if (!$('locationSummary')) return;
  const parts = ['barangay', 'city', 'province', 'region'].map(chosen).filter(Boolean);
  $('locationSummary').textContent = parts.length ? parts.join(', ') : t('locHint');
}

function resetLocationLists() {
  const prompts = { region: 'selRegion', province: 'regionFirst', city: 'provinceFirst', barangay: 'cityFirst' };
  const ready = { region: 'selRegion', province: 'selProvince', city: 'selCity', barangay: 'selBarangay' };
  Object.keys(prompts).forEach(id => {
    const el = $(id);
    if (!el) return;
    if (!el.options.length) el.innerHTML = '<option value=""></option>';
    el.options[0].textContent = t(el.disabled || (id === 'region' && !loc.loaded) ? prompts[id] : ready[id]);
  });
  locSummary();
}

async function loadRegions() {
  if (loc.loaded) return;
  loc.loaded = true;
  fill('region', [], t('loading'));
  try { fill('region', await psgc('/regions?limit=100'), t('selRegion')); }
  catch (e) { loc.loaded = false; fill('region', [], t('locFail')); toast(t('locFail'), true); }
}

async function onRegion() {
  const code = $('region').value;
  clearCity(true);
  fill('province', [], t('loading'));
  fill('city', [], t('provinceFirst'));
  fill('barangay', [], t('cityFirst'));
  if (!code) { fill('province', [], t('regionFirst')); return locSummary(); }
  try {
    const [provinces, indep] = await Promise.all([
      psgc('/regions/' + code + '/provinces'),
      psgc('/cities-municipalities?region=' + code + '&province=none&limit=2000')
    ]);
    loc.independent = indep;
    fill('province', provinces, provinces.length ? t('selProvince') : t('noProvince'), provinces.length > 0 && indep.length > 0);
    if (!provinces.length) fill('city', indep, t('selCity'));
  } catch (e) {
    fill('province', [], t('locFail'));
    toast(t('locFail'), true);
  }
  locSummary();
}

async function onProvince() {
  const code = $('province').value;
  clearCity(true);
  fill('city', [], t('loading'));
  fill('barangay', [], t('cityFirst'));
  if (!code) { fill('city', [], t('provinceFirst')); return locSummary(); }
  try {
    const rows = code === 'none' ? loc.independent : await psgc('/provinces/' + code + '/cities-municipalities?limit=500');
    fill('city', rows, t('selCity'));
  } catch (e) {
    fill('city', [], t('locFail'));
    toast(t('locFail'), true);
  }
  locSummary();
}

async function zoomToBoundaryIfAvailable(code) {
  if (!code || !layers || !map) return false;
  try {
    let geo = boundaryCache.get(code);
    if (!geo) {
      const r = await fetch('/api/boundaries/' + encodeURIComponent(code));
      if (!r.ok) return false;
      geo = await r.json();
      boundaryCache.set(code, geo);
    }
    layers.barangays.clearLayers();
    const gLayer = L.geoJSON(geo, {
      style: { color: '#1f7a4c', weight: 2.5, fillColor: '#1f7a4c', fillOpacity: 0.14 }
    }).addTo(layers.barangays);
    const b = gLayer.getBounds();
    if (b.isValid()) {
      map.flyToBounds(b, { padding: [40, 40], maxZoom: 15, duration: 0.8 });
      return true;
    }
  } catch (e) { /* fallback to geocoder */ }
  return false;
}

async function onCity() {
  const code = $('city').value;
  fill('barangay', [], code ? t('loading') : t('cityFirst'));
  state.city = code ? { code, name: chosen('city') } : null;
  renderFeed();
  locSummary();
  if (!code) return;
  const ids = state.advisories.filter(a => inCity(a) && zones.has(a.id)).map(a => zones.get(a.id));
  if (ids.length) {
    const fg = L.featureGroup(ids);
    if (fg.getBounds().isValid()) map.fitBounds(fg.getBounds(), { padding: [50, 50], maxZoom: 14 });
  }
  try { fill('barangay', await psgc('/cities-municipalities/' + code + '/barangays?limit=1000'), t('selBarangay')); }
  catch (e) { fill('barangay', [], t('locFail')); }
  locSummary();
}

async function onBarangay() {
  locSummary();
  const brgyCode = $('barangay').value;
  if (!brgyCode) return;
  await zoomToBoundaryIfAvailable(brgyCode);
  const q = [chosen('barangay'), chosen('city'), chosen('province') || chosen('region')].filter(Boolean).join(', ');
  if ($('q')) $('q').value = q;
  await search(q, q);
}

function clearCity(keepSelects) {
  state.city = null;
  if (layers && layers.barangays) layers.barangays.clearLayers();
  if (!keepSelects) {
    ['region', 'province', 'city', 'barangay'].forEach(id => { if ($(id)) $(id).value = ''; });
    ['regionFilter', 'provinceFilter', 'cityFilter', 'barangayFilter'].forEach(id => { if ($(id)) $(id).value = ''; });
    fill('province', [], t('regionFirst'));
    fill('city', [], t('provinceFirst'));
    fill('barangay', [], t('cityFirst'));
    locSummary();
  }
  renderFeed();
}

/* ---------------- filters & wiring ---------------- */
function setType(f) {
  state.type = f;
  if ($('typeSeg')) {
    [...$('typeSeg').children].forEach(b => {
      const on = b.dataset.f === f;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on);
    });
  }
  drawZones();
  syncUrl();
  renderAll();
}

function wire() {
  if ($('searchForm')) $('searchForm').addEventListener('submit', e => { e.preventDefault(); search(); });
  if ($('locate')) $('locate').onclick = locate;
  if ($('refresh')) $('refresh').onclick = () => loadData(true);
  if ($('typeSeg')) $('typeSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setType(b.dataset.f); });
  if ($('stats')) $('stats').addEventListener('click', e => {
    const b = e.target.closest('.stat');
    if (!b) return;
    state.status = state.status === b.dataset.s ? 'all' : b.dataset.s;
    renderFeed();
  });
  if ($('feed')) $('feed').addEventListener('click', e => { const b = e.target.closest('[data-show]'); if (b) focusAdvisory(b.dataset.show); });
  if ($('picks')) $('picks').addEventListener('click', e => {
    const b = e.target.closest('.pick');
    if (!b || !state.picks) return;
    const p = state.picks[+b.dataset.i];
    if (p) setPosition(p.lat, p.lng, { label: p.name });
  });
  if ($('repWater')) $('repWater').onclick = () => sendReport('water');
  if ($('repPower')) $('repPower').onclick = () => sendReport('power');
  document.querySelectorAll('.lang button').forEach(b => {
    b.onclick = () => { state.lang = b.dataset.l; store.set('sz-lang', state.lang); syncUrl(); applyLang(); };
  });
  if ($('themeBtn')) $('themeBtn').onclick = () => setTheme(document.documentElement.getAttribute('data-theme') !== 'dark');
  if ($('browse')) $('browse').addEventListener('toggle', () => { if ($('browse').open) loadRegions(); });
  if ($('region')) $('region').onchange = onRegion;
  if ($('province')) $('province').onchange = onProvince;
  if ($('city')) $('city').onchange = onCity;
  if ($('barangay')) $('barangay').onchange = onBarangay;

  ['region', 'province', 'city', 'barangay'].forEach(level => {
    const inp = $(level + 'Filter');
    if (!inp) return;
    inp.addEventListener('input', () => {
      const ph = { region: t('selRegion'), province: t('selProvince'), city: t('selCity'), barangay: t('selBarangay') };
      renderFilteredOptions(level, inp.value, ph[level], level === 'province' && loc.independent.length > 0);
    });
  });

  if ($('clearLocation')) $('clearLocation').onclick = () => { if ($('q')) $('q').value = ''; clearCity(); };

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && Date.now() - state.updatedAt > 30000) loadData();
  });
  setInterval(() => { if (!document.hidden) loadData(); }, CONFIG.POLL_MS);
}

/* ---------------- boot ---------------- */
(function boot() {
  const qs = new URLSearchParams(location.search);
  state.lang = qs.get('lang') === 'ceb' || (!qs.get('lang') && store.get('sz-lang') === 'ceb') ? 'ceb' : 'en';
  if (['water', 'power'].includes(qs.get('type'))) state.type = qs.get('type');
  setTheme(document.documentElement.getAttribute('data-theme') === 'dark');
  initMap();
  wire();
  setType(state.type);
  applyLang();
  const lat = parseFloat(qs.get('lat')), lng = parseFloat(qs.get('lng'));
  if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
    state.pos = { lat, lng, label: '' };
    marker = L.marker([lat, lng]).addTo(map);
    map.setView([lat, lng], 14);
  }
  loadData();
})();