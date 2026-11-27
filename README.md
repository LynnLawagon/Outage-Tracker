# SafeZone - Community Utilities Watch

A website where people check whether a water or electricity interruption affects their area, why it happened, and when service returns. English and Bisaya, light and dark theme, works on phones.

**Free stack, no API keys:** [Leaflet](https://leafletjs.com) + [OpenStreetMap](https://www.openstreetmap.org) tiles, [Nominatim](https://nominatim.org) address search (through this server), browser geolocation, and the Philippine Standard Geographic Code (PSGC) lists (through this server, cached).

No map API provides outage data. The included starter records are source-backed scheduled Davao Light interruptions published on 25 November 2026 (for 28 November and 1 December 2026). They are a dated snapshot, not a live utility feed. No water interruption is seeded because the DCWD notices found during the update were already past their scheduled dates. Verify current schedules with the utility before relying on them. Map circles are approximate locators, not official outage boundaries.

## What changed in v2

**Speed**
- Leaflet and the IBM Plex Sans font are now served from `public/vendor/`. Pages no longer wait on unpkg or Google Fonts.
- The server gzips responses once, caches static files in memory, sends ETags (repeat visits and polls return `304`, no body), and sets long cache lifetimes for vendor files.
- Advisories and reports are held in memory and saved to disk in the background, so requests never wait on the disk.
- PSGC location lists come from `/api/psgc/*`: fetched once, cached in memory and in `data/psgc-cache/` for 30 days, served stale if the upstream is down. The lists load only when someone opens "Browse by location".
- Polling runs only while the tab is visible and redraws only when the data changed. The map uses canvas rendering.

**Public site**
- Split layout: advisories on the left, map on the right (map on top on phones).
- Plain-language answer for a checked spot ("Electricity is interrupted in your area. Service is expected back in about 3 h"), with a shareable link.
- Summary counts (ongoing / scheduled / restored) that double as filters, a water / electricity filter, progress bars toward the expected-back time, "Affects you" tags, "Show on map".
- Filter the feed by city with no search at all. Loading skeletons, empty and error states, an offline notice, and a "last updated" time.
- Dark mode, keyboard focus styles, screen-reader labels, reduced-motion support.

**Admin console** (`/admin.html`)
- Token sign-in with a clear error, sign out, and a lockout after 10 wrong attempts per 15 minutes.
- Summary counts, a searchable and filterable advisory list, edit, "+1 h", "Mark restored", and delete with confirmation.
- Form with validation messages, radius slider with live map preview, duration shortcuts, optional public note, and the map centers on the barangay you pick.

**Server**
- New endpoints: `PUT /api/advisories/:id`, `POST /api/advisories/:id/resolve`, `GET /api/admin/verify`, `GET /api/health`, `GET /api/psgc/*`.
- Security headers including a Content-Security-Policy, request timeouts on outside calls, and `TRUST_PROXY` support.

## Setup

1. Install Node 18 or newer.
2. Copy `.env.example` to `.env` and fill in `ADMIN_TOKEN` (`openssl rand -hex 24`) and optionally `NOMINATIM_EMAIL`.
3. `npm start`, then open http://localhost:3000
4. Open `/admin.html`, sign in, manage advisories and remove or update the dated starter notices when they expire.

The starter advisories are not regenerated automatically. Refresh `scripts/seed.js` from current utility notices when schedules change. The server will not create fictional outages when the starter records expire.

## API

| Method | Path | Notes |
|---|---|---|
| GET | `/api/advisories` | active, scheduled and restored in the last 6 h (ETag) |
| GET | `/api/advisories?all=1` | everything, admin token |
| POST | `/api/advisories` | admin token (`X-Admin-Token`) |
| PUT | `/api/advisories/:id` | admin token, send the full advisory |
| POST | `/api/advisories/:id/resolve` | admin token, marks restored now |
| DELETE | `/api/advisories/:id` | admin token |
| GET | `/api/admin/verify` | admin token check |
| GET | `/api/reports` / POST | anonymous community reports, last 3 h; 5 per 10 min per IP |
| GET | `/api/geocode?q=` | Nominatim, cached 24 h, 1 request/s, 20 searches/min per IP |
| GET | `/api/psgc/...` | cached PSGC lists |
| GET | `/api/health` | liveness |

## Notes

- Zones are circles (center + radius), so they approximate the real affected barangays.
- Community reports are rounded to about 100 m, unverified, shown as counts only, and never trigger an "affected" result.
- Use HTTPS in production so the admin token is not sent in clear text; browser location also needs HTTPS (or localhost).
- OpenStreetMap tiles and Nominatim are shared services for light use. For heavy traffic switch to a tile provider with a free tier and a self-hosted geocoder (`geocode()` in `server/server.js`, tile URL in `public/js/app.js` and `admin.js`). If you change the tile host, add it to `img-src` in the Content-Security-Policy in `server/server.js`.
- Data is stored in JSON files, fine for a small deployment. Use a database if traffic grows.


## Starter data source and limitations

- Davao Light official notice (25 Nov 2026): https://www.davaolight.com/post/switching-power-interruptions-on-november-28-and-december-1-in-davao-city-and-davao-del-norte
- The 1:00-4:00 AM windows describe a roughly 30-minute switching interruption at an unspecified time in the window, not a continuous three-hour outage.
- The notice also lists a separate Lanang interruption within 9:00-10:00 AM on 28 November.
- The same notice describes an eight-hour interruption from 1:00 AM to 9:00 PM for the MK Central Building-to-Acacia Hotel area; those stated times conflict with the stated duration, so that item is deliberately excluded rather than guessing the correct end time.
- Davao City Water District interruption notices visible during this update were dated 23-26 November and had already passed as of 27 November 2026. No active DCWD interruption is fabricated.
- The map circles are approximate visual locators. The utility notice does not provide machine-readable outage polygons or exact geofences.
- This project still requires manual source checking and admin updates; it does not scrape or receive real-time outage data.
