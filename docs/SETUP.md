# খাLaS — Implementation & Setup Guide

This guide covers the full feature set added on top of the original single-page app:

- Mapbox map with custom food-cart pins + **Find Near Me** (HTML5 Geolocation)
- **Live Open / Closed status** for vendors (Supabase + Realtime)
- **1–5 star reviews + hygiene rating** (Supabase-backed, offline-first)
- **Crowdsourced “Add a Cart”** modal with draggable pin
- **Vendor QR code** generation + PNG download (qrcode.js)
- **Installable PWA** (manifest + service worker + install prompt)

The app still runs with **zero configuration** in local demo mode using `localStorage` and Leaflet. Mapbox and Supabase are enabled as soon as you add keys.

---

## 1. File structure

```
Kha-LaS-Food-website-/
├─ index.html                  App shell, map, detail drawer, modals
├─ manifest.json               PWA manifest (icons, shortcuts, standalone)
├─ sw.js                       Service worker (app-shell + CDN runtime cache)
├─ supabase/
│  └─ schema.sql               Tables, indexes, RLS policies, realtime
├─ docs/
│  └─ SETUP.md                 This guide
├─ assets/
│  ├─ css/
│  │  ├─ styles.css            Theme, pins, status switch, stars, QR, mapbox
│  │  └─ tailwind.config.js
│  ├─ images/icons/            PWA icons (192 / 512 / maskable / 180)
│  └─ js/
│     ├─ config.js             ← YOUR MAPBOX + SUPABASE KEYS GO HERE
│     ├─ store.js              Local state, seed data, remote merge
│     ├─ db.js                 Supabase data layer + realtime subscription
│     ├─ map-engine.js         Mapbox GL / Leaflet adapter
│     ├─ map.js                Main map, custom pins, geolocation
│     ├─ directions.js         Route from visitor to selected cart (OSRM)
│     ├─ status.js             Vendor Open/Closed toggle
│     ├─ reviews.js            1–5 star + hygiene reviews
│     ├─ crowdsource.js        “Add a Cart” quick modal
│     ├─ qr.js                 Vendor QR generator + download
│     ├─ pwa.js                Service worker registration + install UI
│     ├─ auth.js               Existing demo email accounts
│     ├─ filters.js, gallery.js, booking.js, delivery.js,
│     │  community.js, spot-modal.js, theme.js, app.js
│     └─ ...
└─ data/                       Original demo data (kept)
```

### How the modules fit together

```
index.html
   │
   ├─ config.js ──────────────► FH_CONFIG (Mapbox / Supabase keys)
   ├─ store.js ───────────────► FH.store (spots, filters, local cache, emit)
   ├─ db.js ──────────────────► FH.db (Supabase CRUD + realtime)
   ├─ map-engine.js ──────────► FH.mapEngine (Mapbox ⇄ Leaflet)
   ├─ map.js ─────────────────► FH.map (pins, near-me, focus, theme)
   ├─ directions.js ──────────► FH.directions (route to a selected cart)
   ├─ status.js ──────────────► FH.status (vendor toggle)
   ├─ reviews.js ─────────────► FH.reviews (stars + hygiene)
   ├─ crowdsource.js ─────────► FH.crowd (quick add modal)
   ├─ qr.js ──────────────────► FH.qr (share + download)
   ├─ pwa.js ─────────────────► FH.pwa (install + SW)
   └─ app.js ─────────────────► wires everything, detail drawer, list
```

`FH.store.emit()` is the single update loop: any change (new cart, new review, status, filter) re-renders the sidebar, map pins and detail panel immediately.

---

## 2. Mapbox setup (5 minutes)

1. Create a free account at <https://account.mapbox.com/>.
2. Open **Tokens → Create a token**.
3. Name it `khalas-web`.
4. Add **URL restrictions**:
   - `http://localhost:*/*` for local development
   - `https://yourdomain.com/*` for production
   - `https://yourname.github.io/*` if using GitHub Pages
5. Keep the default public scopes (`styles:tiles`, `styles:read`, `fonts:read`, `fonts:tiles` are enough).
6. Copy the token (it starts with `pk.`).
7. Open `assets/js/config.js` and paste it:

```js
window.FH_CONFIG = {
  MAPBOX_TOKEN: 'pk.eyJ1Ijoi...',
  ...
};
```

8. Reload the page. The map now uses Mapbox GL JS with the dark style. Leaflet remains the automatic fallback if the token is missing or fails to load.

### Free tier notes

- Mapbox has a generous free monthly map-load allowance; check the current pricing page.
- Never use a secret token (`sk.…`) in frontend code.
- The token is public by design — URL restrictions are your protection.
- To use your own branded dark/light styles later, change `MAP_STYLE_DARK` / `MAP_STYLE_LIGHT` in `config.js` to `mapbox://styles/<user>/<style-id>`.

### Find Near Me

`assets/js/map.js` implements this with `navigator.geolocation.getCurrentPosition()`:

- It asks for high-accuracy location.
- It computes Haversine distances to all currently filtered carts.
- It drops a pulsing blue “you are here” marker.
- It fits the map around you + the nearest cart and shows the distance.
- Distance chips appear on sidebar cards.
- Permission denied / timeout / unsupported browser states show friendly toasts.

Geolocation requires **HTTPS** or `localhost`. Opening `index.html` as `file://` will block it.

---

## 3. Supabase setup (5 minutes)

1. Create a project at <https://supabase.com/> (free tier is fine).
2. In **SQL Editor → New query**, paste the whole of `supabase/schema.sql` and run it.
   - Creates `carts` and `reviews`
   - Enables RLS and public read/insert/update policies (demo)
   - Adds the realtime publication for carts
3. Go to **Project Settings → API** and copy:
   - **Project URL** (`https://xxxx.supabase.co`)
   - **anon public** key
4. Paste both into `assets/js/config.js`:

```js
window.FH_CONFIG = {
  SUPABASE_URL: 'https://xxxxxxxxxxxx.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOi...',
  ...
};
```

5. Reload. The console should log `[FH.db] Loaded N cart(s) from Supabase.`
6. In **Database → Replication**, confirm `public.carts` is in the `supabase_realtime` publication (the SQL does this for you).

### What syncs where

| Feature | Store | Supabase table |
|---|---|---|
| Cart location / name / type / photos | `FH.store.S.spots` | `carts` |
| Live Open / Closed status | `spot.status` | `carts.status` + `updated_at` |
| Vendor ownership | `spot.creator` | `carts.vendor_email` |
| Reviews (food + hygiene) | local `foodhub_reviews_v1` cache | `reviews` |
| Aggregate hygiene | `spot.hygiene` | `carts.hygiene_rating` |

The app is **offline-first**: reviews and carts are saved locally immediately, then pushed to Supabase. If a write fails, the local copy remains and the user sees a toast.

### Demo seed carts

The original 9 demo spots still live in `store.js`. When you change a seed cart’s status or review it, the app **upserts** that cart into Supabase first, so foreign keys never fail.

### Production authentication (important)

This repo’s sign-in is a lightweight email demo stored in `localStorage`, not Supabase Auth. The SQL policies therefore allow anonymous writes for demo purposes. Before a public launch:

1. Replace local auth with Supabase Auth (email OTP / magic link).
2. Use the production policies commented at the bottom of `schema.sql`:
   - vendors update only carts where `vendor_email = auth.jwt() ->> 'email'`
   - only authenticated users insert reviews, and `author_email` must match
3. Add moderation/rate limiting (Edge Function or database function).

The anon key is safe to expose **only** when RLS is correctly configured.

---

## 4. Run locally

Any static server works — no build step.

```bash
# Python
python -m http.server 8000

# Node
npx serve .

# VS Code
Live Server extension → Open with Live Server
```

Then open <http://localhost:8000>.

> Use `localhost` or HTTPS for geolocation, service worker and PWA installation. `file://` will run the UI but block those browser APIs.

For phone testing on the same Wi-Fi, use your LAN IP (`http://192.168.x.x:8000`) — geolocation may still require HTTPS on some devices, so deploy a preview or use a tunnel (Cloudflare Tunnel / ngrok) for full PWA testing.

---

## 5. Feature walkthrough

### Live status toggle

1. Sign in with any email (quick test chips are provided).
2. Open a cart. The **Live status** card appears above Facilities.
3. Toggle Open / Closed.
   - The local map pin, sidebar badge and detail card update instantly.
   - If Supabase is configured, `carts.status` is upserted.
   - Supabase Realtime pushes the new status to other open devices.
4. Seeded demo carts (`creator: 'system'`) can be toggled by any signed-in tester. Real crowdsourced carts can only be toggled by their creator.

### Reviews & hygiene

- Every cart detail now has **Food / overall** and **Hygiene** 1–5 star inputs plus a comment box.
- Reviews are shown with both star scores, author, date, and a “saving…” badge until Supabase confirms the insert.
- The legacy map score stays on its original 1–10 scale; a 5-star overall review is converted (`stars × 2`) so existing filters, colors and sorting keep working.
- Hygiene averages are stored on the cart so the sidebar can show a `🧼 4.5`-style chip.

### Crowdsourced “Add a Cart”

- Tap the floating **Add Cart** button on the map (or a PWA shortcut).
- Fields: cart name, cart type, optional phone, draggable map pin, landmark/address, notes.
- **Use GPS** places the pin at your current position.
- The cart is published immediately to the local store and to Supabase when configured.
- The creator is recorded as the vendor and can toggle status / generate a QR code.

The original full **Add Spot** flow (3–5 photos, booking/delivery, categories) remains available in the header.

### Directions from my location

- Open any cart and tap **Directions from my location** at the top of the drawer.
- The browser asks for location (same permission as Find Near Me); the route is drawn on the map with your position marked.
- A summary card shows distance and driving time, plus a link to open turn-by-turn directions in Google Maps.
- Routes come from the public OSRM demo router (`router.project-osrm.org`) — no API key needed. If routing is blocked or offline, the app draws a straight line and labels it “Direct line”.
- On phones the detail drawer closes automatically so the route is visible; the **×** on the summary card clears the route.

### Vendor QR code

- Open any cart → **QR** button in the detail header; or **My Spots → QR**.
- `qr.js` lazy-loads qrcode.js from CDN.
- The QR encodes `https://your-site/path/?cart=<cart-id>`.
- **Download PNG** saves a 512×512 QR suitable for printing and sticking on the cart.
- **Copy link** copies the profile deep link.
- Scanning the QR opens the app, selects the cart and flies the map to it (handled by `openDeepLink()` in `app.js`).

### PWA

- `manifest.json` defines the name, theme, icons and shortcuts.
- `sw.js` precaches the app shell and runtime-caches CDN assets; Supabase and map tiles stay network-only.
- `pwa.js` registers the worker and shows an **Install** button when `beforeinstallprompt` fires.
- Visit once online, then use **Install** (Android/Chromium) or **Share → Add to Home Screen** (iOS).

---

## 6. PWA testing checklist

1. Serve over `localhost` or HTTPS.
2. DevTools → **Application → Manifest** — icons and shortcuts should load with no errors.
3. **Application → Service Workers** — `sw.js` should be activated.
4. **Application → Cache Storage** — `khalas-shell-v7` should contain the JS/CSS shell.
5. Turn on **Offline** in DevTools and reload — the app shell should still open (map tiles and live data need network).
6. On Android Chrome, use the install prompt. On iOS Safari, Share → Add to Home Screen.
7. After changing cached files, bump `SHELL_CACHE` in `sw.js` (e.g. `v7` → `v8`) and update the `?v=` query on changed scripts/styles so returning visitors get the new files.

---

## 7. Deployment

Works on any static host:

- **GitHub Pages** — push the repo and enable Pages. All paths are relative, so project subpaths like `/Kha-LaS-Food-website-/` work.
- **Netlify / Vercel / Cloudflare Pages** — publish the repository root; build command: none; output directory: `/`.
- Add the deployed origin to your Mapbox token URL restrictions.
- Supabase needs no deployment step, but add your production domain to **Authentication → URL Configuration** if/when you move to Supabase Auth.
- QR deep links use the current URL, so they automatically point at the deployed domain.

---

## 8. Troubleshooting

| Symptom | Fix |
|---|---|
| Map is plain / “Map could not load” | Check `MAPBOX_TOKEN` starts with `pk.`, has URL restrictions for your domain, and that the token has `styles:tiles` + `styles:read`. The app falls back to Leaflet if Mapbox fails. |
| “Find Near Me” does nothing | Geolocation requires HTTPS or localhost. Check browser site permissions. |
| Supabase writes fail with `relation does not exist` | Run `supabase/schema.sql` in the SQL Editor. |
| Reviews disappear after reload | Check the `reviews` insert policy and the `cart_id` foreign key. Seed carts must be upserted first — the app does this automatically. |
| Realtime status not updating on another device | Confirm `public.carts` is in the `supabase_realtime` publication and that Realtime is enabled for the project. |
| QR modal says “Could not load the QR library” | The CDN is blocked/offline. Serve online once so the service worker can cache it. |
| Install button never appears | PWA install requires HTTPS/localhost, a valid manifest, and an active service worker. On iOS the prompt API is unavailable — use Share → Add to Home Screen. |
| Map pin styling broken in Mapbox | Make sure custom markers are wrapped by `map-engine.js`; don’t apply transforms directly to the marker element. |
| Old JS still loading | Bump `?v=` query strings in `index.html` and the cache version in `sw.js`. |

---

## 9. Key safety

- `assets/js/config.js` contains **public** client keys only.
- Never put a Supabase **service_role** key or a Mapbox **secret** token in frontend code.
- Protect Supabase data with RLS. The demo policies are intentionally open — replace them before launch.
- For a real marketplace, move cart writes and review moderation behind an Edge Function with rate limiting.
