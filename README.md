# খাLaS

Find the cart. Feed the street. — a map-based discovery app for unlisted roadside food carts, with community verification, live vendor status, hygiene reviews, QR codes and PWA install.

Plain HTML, Tailwind (CDN), Mapbox GL JS (with Leaflet fallback), Supabase, vanilla JS. No build step.

## Run

Serve the folder (recommended, so geolocation and the service worker work):

```bash
python -m http.server 8000
# or: npx serve .
```

Open <http://localhost:8000>. An internet connection is needed for the CDN libraries, map tiles and live Supabase data.

### Enable Mapbox + Supabase

1. Add your Mapbox public token and Supabase URL/anon key to `assets/js/config.js`.
2. Run `supabase/schema.sql` once in the Supabase SQL Editor.
3. Full click-by-click steps, architecture and troubleshooting: **[docs/SETUP.md](docs/SETUP.md)**.

Without keys the app still runs in local demo mode (Leaflet + `localStorage`).

## New in this build

- **Mapbox integration** — custom HTML pins, dark/light styles, automatic Leaflet fallback if no token is configured.
- **Find Near Me** — HTML5 geolocation, pulsating “you are here” marker, nearest-cart distance, map fit, and distance chips in the sidebar.
- **Directions** — route from your current location to the selected cart, drawn on the map with distance, driving time and a Google Maps link (OSRM, direct-line fallback).
- **Live Open / Closed status** — vendor toggle writes to Supabase, updates instantly via Realtime.
- **1–5 star reviews + hygiene rating** — food/overall and cleanliness scores, comments, offline-first cache, aggregate hygiene badges.
- **Crowdsourced “Add a Cart”** — quick mobile-friendly modal with cart type, draggable pin and “Use GPS”.
- **Vendor QR codes** — qrcode.js generates a downloadable 512×512 PNG with a `?cart=<id>` deep link.
- **Installable PWA** — `manifest.json`, service worker app-shell caching, offline fallback and install prompt.

## Features
- **Email-based User Accounts**: Users can register and sign in using their Email ID. Accounts are stored in `localStorage` with quick one-click test account switching.
- **Spot Photos (3 - 5 Pictures)**:
  - Every spot includes **3 to 5 authentic photos** showing food, menu, and dining ambience.
  - Interactive photo slider with thumbnail strip, prev/next navigation, and full-screen Lightbox modal.
  - Adding a new spot enforces **3 to 5 photos** (via device file upload with base64 conversion, web URLs, or quick sample presets).
  - Users can also contribute additional photos to any spot.
  - Sidebar list items show live photo thumbnails and photo counters.
- **Add New Food Spots with Interactive Draggable Pin Map**: Registered users can publish new spots with spot name, categories, type, price, delivery, description, 3-5 photos, and an interactive draggable pin map that automatically calculates exact Latitude and Longitude in real time.
- **Spot Verification / Confirmation System (No Upper Limit, Lower Limit = 25)**:
  - Minimum **25 community confirmations (lower limit)** required to unlock the official **Community Verified** (`✓`) badge.
  - **No upper limit**: as many users as want can confirm and verify any spot (unlimited growth, e.g. 50, 100, 500+).
  - To confirm a spot, an **email account is strictly required**.
  - Users can confirm authentic spots, view all confirming users, or undo their confirmation.
  - Filter toggle to view only verified spots (25+ confirms).
- **Interactive Map & Pins**: Mapbox GL JS when a token is configured, Leaflet otherwise. Pins display ratings, Open/Closed dots and verification badges (verified checkmark vs pending clock icon). Supports click-to-pick coordinates mode.
- **Ratings & Reviews**: The original 1.0–10.0 community score remains for filtering/map colour; cart details now also collect 1–5 star food and hygiene reviews with comments.
- **Facility Indicators (Booking & Delivery)**: Displays clear informational badges for Table Booking and Home Delivery. Defaults to "No Booking" and "No Delivery" unless explicitly enabled during spot creation or editing.
- **Edit Added Spots**: Users can edit any spot they created (change name, photos, pin coordinates on map, facilities, description) with changes saving instantly.
- **My Added Spots List**: Header displays "My Spots (X)" button showing total spots created by the user, opening a dedicated management modal with View on Map, Edit, and Delete actions.
- **Live Spot Chat**: In-memory / BroadcastChannel real-time chat between browser tabs.
