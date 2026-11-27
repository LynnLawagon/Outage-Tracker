// Source-backed Davao Light advisory snapshot checked on 27 November 2026.
// Never auto-regenerates fictional incidents; includes full verification metadata,
// exact announcement URLs, specific road/landmark descriptions, and honest Level 3
// approximate flags where exact distribution feeder polygons are not published by the utility.
const fs = require('fs');
const path = require('path');

function seed(file) {
  const davaoCity = {
    regionCode: '1100000000',
    provinceCode: '1182400000',
    cityMunicipalityCode: '1130700000',
    barangayCode: '',
    region: 'Region XI (Davao Region)',
    province: 'Davao del Sur',
    cityMunicipality: 'City of Davao',
    barangay: 'Multiple Barangays (Lanang, Buhangin, Panacan, Sasa, Pampanga, Bunawan, Tibungco, Mudiang, Ilang)'
  };
  const panabo = {
    regionCode: '1100000000',
    provinceCode: '1102300000',
    cityMunicipalityCode: '1102315000',
    barangayCode: '',
    region: 'Region XI (Davao Region)',
    province: 'Davao del Norte',
    cityMunicipality: 'Panabo City',
    barangay: 'Portions of Gredu, San Francisco / Poblacion'
  };
  const carmen = {
    regionCode: '1100000000',
    provinceCode: '1102300000',
    cityMunicipalityCode: '1102303000',
    barangayCode: '',
    region: 'Region XI (Davao Region)',
    province: 'Davao del Norte',
    cityMunicipality: 'Carmen',
    barangay: 'Portions toward Tuganay'
  };

  const provider = 'Davao Light and Power Company';
  const source = 'Davao Light official advisory - 25 Nov 2026';
  const sourceUrl = 'https://www.davaolight.com/post/switching-power-interruptions-on-november-28-and-december-1-in-davao-city-and-davao-del-norte';
  const publishedAt = '2026-11-25T08:00:00+08:00';
  const lastVerifiedAt = '2026-11-27T15:00:00+08:00';
  const commonNote = 'Scheduled switching interruption: about 30 minutes at an unspecified time within the 1:00 AM-4:00 AM window (not a continuous three-hour outage). Utility notice does not supply GIS feeder polygons; circle is an approximate visual locator only.';

  const records = [
    {
      id: 'dlpc-2026-11-28-davao-north',
      type: 'power',
      utilityType: 'electricity',
      provider,
      area: 'Lanang, R. Castillo Street, Buhangin, Panacan, Sasa, Pampanga, Bunawan, Tibungco, Mudiang and Ilang',
      specificLocations: ['Lanang', 'R. Castillo Street', 'Buhangin', 'Panacan', 'Sasa', 'Pampanga', 'Bunawan', 'Tibungco', 'Mudiang', 'Ilang'],
      location: davaoCity,
      lat: 7.1450,
      lng: 125.6450,
      radius: 14000,
      mappingLevel: 3,
      geometry: null,
      isApproximate: true,
      reason: {
        en: 'Davao Light switching work for the ERA Substation. A brief interruption of about 30 minutes may occur at any time in the stated window.',
        ceb: 'Switching work sa ERA Substation sa Davao Light. Mga 30 minutos nga interruption mahimong mahitabo bisan unsang oras sulod sa gipahibalo nga oras.'
      },
      interruptionDate: '2026-11-28',
      start: '2026-11-28T01:00:00+08:00',
      startTime: '2026-11-28T01:00:00+08:00',
      eta: '2026-11-28T04:00:00+08:00',
      expectedRestoration: '2026-11-28T04:00:00+08:00',
      source,
      sourceUrl,
      publishedAt,
      lastVerifiedAt,
      lastSyncedAt: lastVerifiedAt,
      verification: 'Officially Confirmed',
      isCommunityReport: false,
      resolved: false,
      note: commonNote,
      createdAt: lastVerifiedAt,
      updatedAt: lastVerifiedAt
    },
    {
      id: 'dlpc-2026-11-28-dn',
      type: 'power',
      utilityType: 'electricity',
      provider,
      area: 'Portions of Panabo, including Gredu, San Francisco/Poblacion and Tadeco Road toward Nanyo Central Elementary School',
      specificLocations: ['Gredu', 'San Francisco / Poblacion', 'Tadeco Road toward Nanyo Central Elementary School'],
      location: panabo,
      lat: 7.3080,
      lng: 125.6840,
      radius: 4200,
      mappingLevel: 3,
      geometry: null,
      isApproximate: true,
      reason: {
        en: 'Davao Light switching work for the ERA Substation. A brief interruption of about 30 minutes may occur at any time in the stated window.',
        ceb: 'Switching work sa ERA Substation sa Davao Light. Mga 30 minutos nga interruption mahimong mahitabo bisan unsang oras sulod sa gipahibalo nga oras.'
      },
      interruptionDate: '2026-11-28',
      start: '2026-11-28T01:00:00+08:00',
      startTime: '2026-11-28T01:00:00+08:00',
      eta: '2026-11-28T04:00:00+08:00',
      expectedRestoration: '2026-11-28T04:00:00+08:00',
      source,
      sourceUrl,
      publishedAt,
      lastVerifiedAt,
      lastSyncedAt: lastVerifiedAt,
      verification: 'Officially Confirmed',
      isCommunityReport: false,
      resolved: false,
      note: commonNote,
      createdAt: lastVerifiedAt,
      updatedAt: lastVerifiedAt
    },
    {
      id: 'dlpc-2026-11-28-carmen',
      type: 'power',
      utilityType: 'electricity',
      provider,
      area: 'Portions of Carmen, from Flying V Carmen toward Tuganay',
      specificLocations: ['Flying V Carmen toward Tuganay'],
      location: carmen,
      lat: 7.3650,
      lng: 125.7050,
      radius: 4200,
      mappingLevel: 3,
      geometry: null,
      isApproximate: true,
      reason: {
        en: 'Davao Light switching work for the ERA Substation. A brief interruption of about 30 minutes may occur at any time in the stated window.',
        ceb: 'Switching work sa ERA Substation sa Davao Light. Mga 30 minutos nga interruption mahimong mahitabo bisan unsang oras sulod sa gipahibalo nga oras.'
      },
      interruptionDate: '2026-11-28',
      start: '2026-11-28T01:00:00+08:00',
      startTime: '2026-11-28T01:00:00+08:00',
      eta: '2026-11-28T04:00:00+08:00',
      expectedRestoration: '2026-11-28T04:00:00+08:00',
      source,
      sourceUrl,
      publishedAt,
      lastVerifiedAt,
      lastSyncedAt: lastVerifiedAt,
      verification: 'Officially Confirmed',
      isCommunityReport: false,
      resolved: false,
      note: commonNote,
      createdAt: lastVerifiedAt,
      updatedAt: lastVerifiedAt
    },
    {
      id: 'dlpc-2026-11-28-lanang-normalization',
      type: 'power',
      utilityType: 'electricity',
      provider,
      area: 'Portion of J.P. Laurel Avenue in Lanang, crossing Arroyo Street up to the Shell station opposite Davao Light Bajada Substation',
      specificLocations: ['J.P. Laurel Avenue (Lanang)', 'Arroyo Street crossing', 'Shell station opposite Davao Light Bajada Substation'],
      location: Object.assign({}, davaoCity, { barangay: 'Vicente Hizon Sr. / Lanang corridor' }),
      lat: 7.1015,
      lng: 125.6305,
      radius: 1600,
      mappingLevel: 2,
      geometry: {
        type: 'Point',
        coordinates: [125.6305, 7.1015]
      },
      isApproximate: false,
      reason: {
        en: 'Davao Light normalization work. A brief interruption of about 30 minutes may occur within the stated one-hour window.',
        ceb: 'Normalization work sa Davao Light. Mga 30 minutos nga interruption mahimong mahitabo sulod sa gipahibalo nga usa ka oras nga window.'
      },
      interruptionDate: '2026-11-28',
      start: '2026-11-28T09:00:00+08:00',
      startTime: '2026-11-28T09:00:00+08:00',
      eta: '2026-11-28T10:00:00+08:00',
      expectedRestoration: '2026-11-28T10:00:00+08:00',
      source,
      sourceUrl,
      publishedAt,
      lastVerifiedAt,
      lastSyncedAt: lastVerifiedAt,
      verification: 'Officially Confirmed',
      isCommunityReport: false,
      resolved: false,
      note: 'Specific corridor marker along J.P. Laurel Ave / Bajada Substation. Roughly 30-minute switching window within 9:00-10:00 AM.',
      createdAt: lastVerifiedAt,
      updatedAt: lastVerifiedAt
    },
    {
      id: 'dlpc-2026-12-01-davao-north',
      type: 'power',
      utilityType: 'electricity',
      provider,
      area: 'Lanang, R. Castillo Street, Buhangin, Panacan, Sasa, Pampanga, Bunawan, Tibungco, Mudiang and Ilang',
      specificLocations: ['Lanang', 'R. Castillo Street', 'Buhangin', 'Panacan', 'Sasa', 'Pampanga', 'Bunawan', 'Tibungco', 'Mudiang', 'Ilang'],
      location: davaoCity,
      lat: 7.1450,
      lng: 125.6450,
      radius: 14000,
      mappingLevel: 3,
      geometry: null,
      isApproximate: true,
      reason: {
        en: 'Davao Light switching work to return affected loads to their normal setup. A brief interruption of about 30 minutes may occur at any time in the stated window.',
        ceb: 'Switching work sa Davao Light aron ibalik sa normal ang linya. Mga 30 minutos nga interruption mahimong mahitabo bisan unsang oras sulod sa gipahibalo nga oras.'
      },
      interruptionDate: '2026-12-01',
      start: '2026-12-01T01:00:00+08:00',
      startTime: '2026-12-01T01:00:00+08:00',
      eta: '2026-12-01T04:00:00+08:00',
      expectedRestoration: '2026-12-01T04:00:00+08:00',
      source,
      sourceUrl,
      publishedAt,
      lastVerifiedAt,
      lastSyncedAt: lastVerifiedAt,
      verification: 'Officially Confirmed',
      isCommunityReport: false,
      resolved: false,
      note: commonNote,
      createdAt: lastVerifiedAt,
      updatedAt: lastVerifiedAt
    },
    {
      id: 'dlpc-2026-12-01-carmen',
      type: 'power',
      utilityType: 'electricity',
      provider,
      area: 'Portions of Carmen, from Flying V Carmen toward Tuganay',
      specificLocations: ['Flying V Carmen toward Tuganay'],
      location: carmen,
      lat: 7.3650,
      lng: 125.7050,
      radius: 4200,
      mappingLevel: 3,
      geometry: null,
      isApproximate: true,
      reason: {
        en: 'Davao Light switching work to return affected loads to their normal setup. A brief interruption of about 30 minutes may occur at any time in the stated window.',
        ceb: 'Switching work sa Davao Light aron ibalik sa normal ang linya. Mga 30 minutos nga interruption mahimong mahitabo bisan unsang oras sulod sa gipahibalo nga oras.'
      },
      interruptionDate: '2026-12-01',
      start: '2026-12-01T01:00:00+08:00',
      startTime: '2026-12-01T01:00:00+08:00',
      eta: '2026-12-01T04:00:00+08:00',
      expectedRestoration: '2026-12-01T04:00:00+08:00',
      source,
      sourceUrl,
      publishedAt,
      lastVerifiedAt,
      lastSyncedAt: lastVerifiedAt,
      verification: 'Officially Confirmed',
      isCommunityReport: false,
      resolved: false,
      note: commonNote,
      createdAt: lastVerifiedAt,
      updatedAt: lastVerifiedAt
    },
    {
      id: 'dlpc-2026-12-01-dn',
      type: 'power',
      utilityType: 'electricity',
      provider,
      area: 'Portions of Panabo, including Gredu, San Francisco/Poblacion and Tadeco Road toward Nanyo Central Elementary School',
      specificLocations: ['Gredu', 'San Francisco / Poblacion', 'Tadeco Road toward Nanyo Central Elementary School'],
      location: panabo,
      lat: 7.3080,
      lng: 125.6840,
      radius: 4200,
      mappingLevel: 3,
      geometry: null,
      isApproximate: true,
      reason: {
        en: 'Davao Light switching work to return affected loads to their normal setup. A brief interruption of about 30 minutes may occur at any time in the stated window.',
        ceb: 'Switching work sa Davao Light aron ibalik sa normal ang linya. Mga 30 minutos nga interruption mahimong mahitabo bisan unsang oras sulod sa gipahibalo nga oras.'
      },
      interruptionDate: '2026-12-01',
      start: '2026-12-01T01:00:00+08:00',
      startTime: '2026-12-01T01:00:00+08:00',
      eta: '2026-12-01T04:00:00+08:00',
      expectedRestoration: '2026-12-01T04:00:00+08:00',
      source,
      sourceUrl,
      publishedAt,
      lastVerifiedAt,
      lastSyncedAt: lastVerifiedAt,
      verification: 'Officially Confirmed',
      isCommunityReport: false,
      resolved: false,
      note: commonNote,
      createdAt: lastVerifiedAt,
      updatedAt: lastVerifiedAt
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