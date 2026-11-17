# Claude AI Guidelines - FoodHub Map

## Project Vision
খাLaS is an interactive, hyper-local food discovery SPA built for Bangladesh's food culture. It features Mapbox (with Leaflet fallback), 1-10 map scores, 1-5 star food + hygiene reviews, live vendor status, QR codes, PWA install, advance booking, delivery routing, and live spot community chat.

## Coding Principles
1. **Modular Vanilla JS**: Keep HTML/CSS/JS clean and split by feature. Use the FastAPI REST API and PostgreSQL for shared persistence; keep browser-only preferences in localStorage.
2. **Mobile First UI**: Ensure bottom-sheets, the header, map action buttons and side drawers work smoothly on 390px-wide screens.
3. **Rating Standards**: The legacy map/sidebar score stays on a 1.0 - 10.0 scale with color thresholds (Emerald >=9.0, Lime >=7.5, Yellow >=5.5, Red <5.5). Cart-detail reviews use 1-5 stars for overall food plus 1-5 stars for hygiene; when updating the legacy score, convert `overall * 2`.
4. **Data Layer**: `FH.db` talks to the FastAPI backend. Keep the local demo fallback available when the API is offline.
5. **Map Layer**: `map-engine.js` abstracts Mapbox GL JS and Leaflet. Do not call `L.*` or `mapboxgl.*` directly from feature modules; use `FH.map` or `FH.mapEngine`.
6. **Interactive State**: State updates (new chat message, new rating, status toggle, filter) must reflect immediately on both map markers and sidebar UI via `FH.store.emit()`.

## Frequently Used Features
- `map.js` + `map-engine.js`: Mapbox/Leaflet pins, geolocation, theme switching, picker maps.
- `directions.js`: Route from the visitor to the selected cart (OSRM, direct-line fallback) drawn via the map engine.
- `status.js`: Vendor Open/Closed toggle persisted through FastAPI.
- `reviews.js`: 1-5 star overall + hygiene reviews, offline-first.
- `crowdsource.js`: Quick “Add a Cart” modal with draggable pin.
- `qr.js`: Vendor QR generation and PNG download.
- `pwa.js` + `manifest.json` + `sw.js`: Installable PWA and offline app shell.
- `booking.js`: Opens booking modal with slot picker & token fee estimator.
- `community.js`: In-memory live chat feed per spot id.
