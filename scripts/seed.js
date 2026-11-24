// Writes DEMO advisories with times relative to "now".
// Run: npm run seed   (the server also runs this automatically if the file is missing)
const fs = require('fs');
const path = require('path');

function seed(file) {
  const H = 3600e3, now = Date.now();
  const iso = ms => new Date(now + ms).toISOString();
  const data = [
    { id: 'demo-w1', type: 'water', area: 'Matina area (DEMO)', lat: 7.0560, lng: 125.5910, radius: 2200,
      reason: { en: 'Emergency pipe leak repair on the main transmission line.', ceb: 'Gi-ayo ang nabuak nga main pipe (emergency repair).' },
      start: iso(-3 * H), eta: iso(5 * H), source: 'Demo data' },
    { id: 'demo-w2', type: 'water', area: 'Toril area (DEMO)', lat: 7.0080, lng: 125.4950, radius: 2800,
      reason: { en: 'Pump station maintenance (scheduled).', ceb: 'Maintenance sa pump station (scheduled).' },
      start: iso(20 * H), eta: iso(30 * H), source: 'Demo data' },
    { id: 'demo-p1', type: 'power', area: 'Buhangin area (DEMO)', lat: 7.1130, lng: 125.6300, radius: 2500,
      reason: { en: 'Line maintenance and tree trimming near power lines.', ceb: 'Maintenance sa linya ug pagputol sa sanga duol sa poste.' },
      start: iso(-1 * H), eta: iso(3 * H), source: 'Demo data' },
    { id: 'demo-p2', type: 'power', area: 'Downtown Poblacion (DEMO)', lat: 7.0650, lng: 125.6050, radius: 1500,
      reason: { en: 'Transformer fault - crews are on site.', ceb: 'Nasira ang transformer - naa na ang crew sa lugar.' },
      start: iso(-30 * 60e3), eta: iso(4 * H), source: 'Demo data' }
  ];
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  return data;
}

module.exports = { seed };

if (require.main === module) {
  const file = path.join(__dirname, '..', 'data', 'advisories.json');
  seed(file);
  console.log('Wrote demo advisories to', file);
}
