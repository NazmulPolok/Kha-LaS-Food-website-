/* ============================================================
   খাLaS service worker
   ------------------------------------------------------------
   App-shell precache + runtime caching for CDN assets.
   Mapbox tiles/styles and API requests always go to the network
   (live data must not be cached as if it were static).
   ============================================================ */
const SHELL_CACHE = 'khalas-shell-v8';
const RUNTIME_CACHE = 'khalas-runtime-v8';

const SHELL_FILES = [
  './',
  './index.html',
  './manifest.json',
  './assets/css/styles.css?v=4',
  './assets/css/tailwind.config.js',
  './assets/js/config.js',
  './assets/js/store.js',
  './assets/js/db.js',
  './assets/js/map-engine.js?v=4',
  './assets/js/theme.js',
  './assets/js/auth.js',
  './assets/js/map.js?v=5',
  './assets/js/directions.js?v=3',
  './assets/js/filters.js',
  './assets/js/booking.js',
  './assets/js/delivery.js',
  './assets/js/community.js',
  './assets/js/gallery.js',
  './assets/js/status.js',
  './assets/js/reviews.js',
  './assets/js/qr.js',
  './assets/js/crowdsource.js',
  './assets/js/pwa.js',
  './assets/js/spot-modal.js?v=3',
  './assets/js/app.js?v=6',
  './assets/images/icons/icon-192.png',
  './assets/images/icons/icon-512.png',
  './assets/images/icons/icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_FILES))
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn('[SW] Precache incomplete:', err);
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key !== SHELL_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

function isLiveHost(hostname) {
  return hostname.includes('mapbox.com') ||
    hostname.includes('mapbox.cn') ||
    hostname.includes('tiles');
}

function isCdnHost(hostname) {
  return hostname.includes('cdn.tailwindcss.com') ||
    hostname.includes('cdn.jsdelivr.net') ||
    hostname.includes('cdnjs.cloudflare.com') ||
    hostname.includes('fonts.googleapis.com') ||
    hostname.includes('fonts.gstatic.com') ||
    hostname.includes('images.unsplash.com') ||
    hostname.includes('api.mapbox.com');
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(SHELL_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    return (await caches.match('./index.html')) ||
      (await caches.match('./')) ||
      new Response('Offline — open খাLaS once while online to cache the app.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(SHELL_CACHE);
  const cached = await cache.match(request, { ignoreSearch: true });
  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || network;
}

async function cacheFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request, { ignoreSearch: true });
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && (response.ok || response.type === 'opaque')) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    return new Response('', { status: 504, statusText: 'Offline' });
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (!request || request.method !== 'GET') return;

  let url;
  try { url = new URL(request.url); } catch (e) { return; }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Live API / map tiles / Mapbox styles always go to the network.
  // The Mapbox GL JS script itself can be cached for faster app startup.
  if (url.origin === self.location.origin && url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }
  const isMapboxLib = request.url.includes('/mapbox-gl-js/');
  if (isLiveHost(url.hostname) && !isMapboxLib) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  if (isCdnHost(url.hostname)) {
    event.respondWith(cacheFirst(request));
  }
});
