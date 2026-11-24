# Tubig & Kuryente Tracker

A website where people enter their area (or use their location, or tap the map) and see whether a water or electricity interruption affects them, with the reason and expected restoration time. English and Bisaya.

**100% free stack, no API keys, no billing:**
- Map: [Leaflet](https://leafletjs.com) with [OpenStreetMap](https://www.openstreetmap.org) tiles
- Address search: [Nominatim](https://nominatim.org) (OpenStreetMap's geocoder), called through this server
- Device location: the browser's built-in geolocation

**Important:** no map API provides outage data. The advisories (from Davao Light, your water district, etc.) are entered by you at `/admin.html`. The included data is demo data only.

## Structure

```
outage-tracker/
  server/server.js      Node server + JSON API (no npm dependencies)
  scripts/seed.js       creates demo advisories
  public/index.html     public site
  public/css/style.css  styles
  public/js/app.js      map, search, outage check, reports
  public/admin.html     admin page
  public/js/admin.js    admin logic
  data/                 advisories.json and reports.json are created here
  .env.example          copy to .env
```

## Setup

1. Install Node 18 or newer.
2. Copy `.env.example` to `.env` and fill in:
   - `ADMIN_TOKEN` - a long random string (e.g. `openssl rand -hex 24`)
   - `NOMINATIM_EMAIL` - your email (optional, but OpenStreetMap asks apps to identify themselves)
3. Run `npm start` and open http://localhost:3000
4. Open `/admin.html`, paste the admin token, click the map to place an advisory, fill in the reason and times, and publish. Delete the demo advisories.

## API

| Method | Path | Notes |
|---|---|---|
| GET | `/api/geocode?q=...` | address search via Nominatim; cached 24 h, throttled to 1 request/second, 20 searches/min per IP |
| GET | `/api/advisories` | active, scheduled and recently restored |
| POST | `/api/advisories` | admin token header `X-Admin-Token` |
| DELETE | `/api/advisories/:id` | admin token |
| GET | `/api/reports` | anonymous community reports, last 3 h |
| POST | `/api/reports` | `{type, lat, lng}`, 5 per 10 min per IP |

## Free-service limits to know about

- **Nominatim** (address search) is a shared public service: 1 request per second, no search-as-you-type, no bulk use. This app follows that by searching only on submit and caching results. For a busy site, switch `geocode()` in `server/server.js` to a self-hosted Nominatim or a provider with a free tier.
- **OpenStreetMap tiles** (the map images) are also a shared service meant for light use. If your traffic grows, use a tile provider with a free tier (MapTiler, Stadia Maps) or host your own tiles. Change the URL in `public/js/app.js` and `public/js/admin.js`.
- Leaflet is loaded from the unpkg CDN. To avoid depending on it, download Leaflet 1.9.4 and serve it from `public/`.

## Notes

- Zones are circles (center + radius), so they approximate the real affected barangays.
- Community reports are rounded to about 100 m and are not verified. They are shown as counts only and never trigger an "affected" result.
- Put the site behind HTTPS so the admin token is not sent in clear text; browser location also only works on HTTPS (or localhost).
- Data is stored in JSON files, fine for a small deployment. Use a database if traffic grows.
