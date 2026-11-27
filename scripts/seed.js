// Source-backed Davao Light advisory snapshot checked on 27 November 2026.
// These are scheduled interruptions, not live outage telemetry. Recheck the
// utility's original notice for changes before relying on the schedule.
const fs = require('fs');
const path = require('path');

function seed(file) {
  const davaoCity = {
    regionCode: '1100000000', provinceCode: '1182400000', cityMunicipalityCode: '1130700000', barangayCode: '',
    region: 'Region XI (Davao Region)', province: 'Davao del Sur', cityMunicipality: 'City of Davao', barangay: ''
  };
  const panabo = {
    regionCode: '1100000000', provinceCode: '', cityMunicipalityCode: '', barangayCode: '',
    region: 'Region XI (Davao Region)', province: 'Davao del Norte', cityMunicipality: 'Panabo City', barangay: ''
  };
  const carmen = {
    regionCode: '1100000000', provinceCode: '', cityMunicipalityCode: '', barangayCode: '',
    region: 'Region XI (Davao Region)', province: 'Davao del Norte', cityMunicipality: 'Carmen', barangay: ''
  };
  const source = 'Davao Light official advisory - 25 Nov 2026';
  const officialUrl = 'https://www.davaolight.com/post/switching-power-interruptions-on-november-28-and-december-1-in-davao-city-and-davao-del-norte';
  const commonNote = 'Scheduled switching interruption: about 30 minutes at an unspecified time within the 1:00 AM-4:00 AM window. This is not a continuous three-hour outage. The map circle is only an approximate locator; use the named streets/areas and the official notice for the actual coverage.';
  const records = [
    {
      id: 'dlpc-2026-11-28-davao-north', type: 'power',
      area: 'Nov 28, 1:00-4:00 AM window: Lanang, R. Castillo Street, Buhangin, Panacan, Sasa, Pampanga, Bunawan, Tibungco, Mudiang and Ilang',
      location: davaoCity, lat: 7.1450, lng: 125.6450, radius: 14000,
      reason: { en: 'Davao Light switching work for the ERA Substation. A brief interruption of about 30 minutes may occur at any time in the stated window.', ceb: 'Switching work sa ERA Substation sa Davao Light. Mga 30 minutos nga interruption mahimong mahitabo bisan unsang oras sulod sa gipahibalo nga oras.' },
      start: '2026-11-28T01:00:00+08:00', eta: '2026-11-28T04:00:00+08:00',
      source, note: commonNote + ' Official notice: ' + officialUrl,
      createdAt: '2026-11-27T15:00:00+08:00', updatedAt: '2026-11-27T15:00:00+08:00'
    },
    {
      id: 'dlpc-2026-11-28-dn', type: 'power',
      area: 'Nov 28, 1:00-4:00 AM window: portions of Panabo, including Gredu, San Francisco/Poblacion and Tadeco Road toward Nanyo Central Elementary School',
      location: panabo, lat: 7.3080, lng: 125.6840, radius: 4200,
      reason: { en: 'Davao Light switching work for the ERA Substation. A brief interruption of about 30 minutes may occur at any time in the stated window.', ceb: 'Switching work sa ERA Substation sa Davao Light. Mga 30 minutos nga interruption mahimong mahitabo bisan unsang oras sulod sa gipahibalo nga oras.' },
      start: '2026-11-28T01:00:00+08:00', eta: '2026-11-28T04:00:00+08:00',
      source, note: commonNote + ' Official notice: ' + officialUrl,
      createdAt: '2026-11-27T15:00:00+08:00', updatedAt: '2026-11-27T15:00:00+08:00'
    },
    {
      id: 'dlpc-2026-11-28-carmen', type: 'power',
      area: 'Nov 28, 1:00-4:00 AM window: portions of Carmen, from Flying V Carmen toward Tuganay',
      location: carmen, lat: 7.3650, lng: 125.7050, radius: 4200,
      reason: { en: 'Davao Light switching work for the ERA Substation. A brief interruption of about 30 minutes may occur at any time in the stated window.', ceb: 'Switching work sa ERA Substation sa Davao Light. Mga 30 minutos nga interruption mahimong mahitabo bisan unsang oras sulod sa gipahibalo nga oras.' },
      start: '2026-11-28T01:00:00+08:00', eta: '2026-11-28T04:00:00+08:00',
      source, note: commonNote + ' Official notice: ' + officialUrl,
      createdAt: '2026-11-27T15:00:00+08:00', updatedAt: '2026-11-27T15:00:00+08:00'
    },
    {
      id: 'dlpc-2026-11-28-lanang-normalization', type: 'power',
      area: 'Nov 28, 9:00-10:00 AM window: portion of J.P. Laurel Avenue in Lanang, crossing Arroyo Street up to the Shell station opposite Davao Light Bajada Substation',
      location: davaoCity, lat: 7.1015, lng: 125.6305, radius: 1600,
      reason: { en: 'Davao Light normalization work. A brief interruption of about 30 minutes may occur within the stated one-hour window.', ceb: 'Normalization work sa Davao Light. Mga 30 minutos nga interruption mahimong mahitabo sulod sa gipahibalo nga usa ka oras nga window.' },
      start: '2026-11-28T09:00:00+08:00', eta: '2026-11-28T10:00:00+08:00',
      source, note: 'The utility gives a one-hour window for a roughly 30-minute interruption; it does not specify the exact start minute. The map circle is approximate. Official notice: ' + officialUrl,
      createdAt: '2026-11-27T15:00:00+08:00', updatedAt: '2026-11-27T15:00:00+08:00'
    },
    {
      id: 'dlpc-2026-12-01-davao-north', type: 'power',
      area: 'Dec 1, 1:00-4:00 AM window: Lanang, R. Castillo Street, Buhangin, Panacan, Sasa, Pampanga, Bunawan, Tibungco, Mudiang and Ilang',
      location: davaoCity, lat: 7.1450, lng: 125.6450, radius: 14000,
      reason: { en: 'Davao Light switching work to return affected loads to their normal setup. A brief interruption of about 30 minutes may occur at any time in the stated window.', ceb: 'Switching work sa Davao Light aron ibalik sa normal ang linya. Mga 30 minutos nga interruption mahimong mahitabo bisan unsang oras sulod sa gipahibalo nga oras.' },
      start: '2026-12-01T01:00:00+08:00', eta: '2026-12-01T04:00:00+08:00',
      source, note: commonNote + ' Official notice: ' + officialUrl,
      createdAt: '2026-11-27T15:00:00+08:00', updatedAt: '2026-11-27T15:00:00+08:00'
    },
    {
      id: 'dlpc-2026-12-01-carmen', type: 'power',
      area: 'Dec 1, 1:00-4:00 AM window: portions of Carmen, from Flying V Carmen toward Tuganay',
      location: carmen, lat: 7.3650, lng: 125.7050, radius: 4200,
      reason: { en: 'Davao Light switching work to return affected loads to their normal setup. A brief interruption of about 30 minutes may occur at any time in the stated window.', ceb: 'Switching work sa Davao Light aron ibalik sa normal ang linya. Mga 30 minutos nga interruption mahimong mahitabo bisan unsang oras sulod sa gipahibalo nga oras.' },
      start: '2026-12-01T01:00:00+08:00', eta: '2026-12-01T04:00:00+08:00',
      source, note: commonNote + ' Official notice: ' + officialUrl,
      createdAt: '2026-11-27T15:00:00+08:00', updatedAt: '2026-11-27T15:00:00+08:00'
    },
    {
      id: 'dlpc-2026-12-01-dn', type: 'power',
      area: 'Dec 1, 1:00-4:00 AM window: portions of Panabo, including Gredu, San Francisco/Poblacion and Tadeco Road toward Nanyo Central Elementary School',
      location: panabo, lat: 7.3080, lng: 125.6840, radius: 4200,
      reason: { en: 'Davao Light switching work to return affected loads to their normal setup. A brief interruption of about 30 minutes may occur at any time in the stated window.', ceb: 'Switching work sa Davao Light aron ibalik sa normal ang linya. Mga 30 minutos nga interruption mahimong mahitabo bisan unsang oras sulod sa gipahibalo nga oras.' },
      start: '2026-12-01T01:00:00+08:00', eta: '2026-12-01T04:00:00+08:00',
      source, note: commonNote + ' Official notice: ' + officialUrl,
      createdAt: '2026-11-27T15:00:00+08:00', updatedAt: '2026-11-27T15:00:00+08:00'
    }
  ];
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(records, null, 2));
  return records;
}

module.exports = { seed };

if (require.main === module) {
  const file = path.join(__dirname, '..', 'data', 'advisories.json');
  seed(file);
  console.log('Wrote source-backed Davao Light advisories to', file);
}
