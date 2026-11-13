/* ============================================================
   Directions — route from the visitor to a selected cart
   ------------------------------------------------------------
   Uses the public OSRM demo router for a real road route and
   falls back to a straight line when routing is unavailable
   (offline, blocked, or rate-limited). Drawn through the map
   engine, so it works with both Mapbox GL and Leaflet.
   ============================================================ */
(function () {
  const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving/';
  const $ = (s) => document.querySelector(s);

  let activeSpot = null;
  let requestId = 0;

  function setLoading(on) {
    const btn = $('#btn-directions');
    if (!btn) return;
    btn.disabled = on;
    btn.classList.toggle('opacity-70', on);
    const icon = btn.querySelector('i');
    if (icon) {
      icon.className = on ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-diamond-turn-right';
    }
    const label = btn.querySelector('[data-dir-label]');
    if (label) label.textContent = on ? 'Finding your route…' : 'Directions from my location';
  }

  function getPosition() {
    if (FH.geo && FH.geo.user) return Promise.resolve(FH.geo.user);
    if (!navigator.geolocation) return Promise.reject(new Error('unsupported'));
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        reject,
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }

  function formatDuration(seconds) {
    if (!isFinite(seconds) || seconds <= 0) return '';
    const mins = Math.max(1, Math.round(seconds / 60));
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    const rest = mins % 60;
    return rest ? `${hours} h ${rest} min` : `${hours} h`;
  }

  async function fetchRoute(from, to) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const url = `${OSRM_URL}${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson&alternatives=false&steps=false`;
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`Routing failed (${response.status})`);
      const data = await response.json();
      const route = data && data.routes && data.routes[0];
      const coords = route && route.geometry && route.geometry.coordinates;
      if (!coords || coords.length < 2) throw new Error('No route found');
      return {
        mode: 'road',
        distance: route.distance,
        duration: route.duration,
        coords: coords.map(([lng, lat]) => ({ lat, lng }))
      };
    } finally {
      clearTimeout(timer);
    }
  }

  function directRoute(from, to) {
    return {
      mode: 'direct',
      distance: FH.geo.distanceKm(from, to) * 1000,
      duration: null,
      coords: [from, to]
    };
  }

  function showPanel(spot, from, route) {
    const panel = $('#route-panel');
    if (!panel) return;

    const title = $('#route-title');
    const summary = $('#route-summary');
    const note = $('#route-note');
    const link = $('#route-google');

    if (title) title.textContent = `To ${spot.name}`;
    if (summary) {
      const bits = [FH.geo.label(route.distance / 1000)];
      const time = formatDuration(route.duration);
      if (time) bits.push(time);
      summary.textContent = bits.join(' · ');
    }
    if (note) {
      note.textContent = route.mode === 'road'
        ? 'Driving route · OpenStreetMap / OSRM'
        : 'Direct line — live routing unavailable';
    }
    if (link) {
      link.href = `https://www.google.com/maps/dir/?api=1&origin=${from.lat},${from.lng}&destination=${spot.lat},${spot.lng}&travelmode=driving`;
    }

    panel.classList.remove('hidden');
  }

  FH.directions = {
    async open(spot) {
      if (!spot) return;
      if (!isFinite(Number(spot.lat)) || !isFinite(Number(spot.lng))) {
        FH.toast('This cart has no valid map location yet.');
        return;
      }

      const id = ++requestId;
      activeSpot = spot;
      setLoading(true);

      try {
        const mapApi = await FH.map.init();
        if (!mapApi) throw new Error('Map is not ready.');

        const from = await getPosition();
        if (id !== requestId) return;
        FH.map.showUser(from);

        const to = { lat: Number(spot.lat), lng: Number(spot.lng) };
        const isMobile = window.matchMedia && window.matchMedia('(max-width: 767px)').matches;
        let route;
        try {
          route = await fetchRoute(from, to);
        } catch (err) {
          console.warn('[FH.directions] Routing unavailable, drawing a direct line:', err);
          route = directRoute(from, to);
        }
        if (id !== requestId) return;

        FH.map.clearRoute();
        FH.map.drawRoute(route.coords);
        // Keep the whole route clear of the summary card (mobile) and the
        // open detail drawer (desktop).
        FH.map.fit(route.coords, {
          maxZoom: 16,
          padding: isMobile
            ? { top: 300, right: 50, bottom: 90, left: 50 }
            : { top: 90, right: 470, bottom: 90, left: 90 }
        });
        showPanel(spot, from, route);

        // On phones the detail drawer covers the map — close it so the
        // route is visible immediately.
        if (isMobile) {
          setTimeout(() => {
            if (FH.store.S.sel === spot.id) FH.store.select(null);
          }, 350);
        }
      } catch (err) {
        if (err && err.code === 1) {
          FH.toast('Location permission denied. Enable it to see directions.');
        } else if (err && err.code === 3) {
          FH.toast('Location request timed out. Please try again.');
        } else {
          FH.toast('Could not build a route. Check your connection and try again.');
        }
      } finally {
        if (id === requestId) setLoading(false);
      }
    },

    close() {
      requestId += 1;
      activeSpot = null;
      const panel = $('#route-panel');
      if (panel) panel.classList.add('hidden');
      if (FH.map) FH.map.clearRoute();
    },

    get spot() {
      return activeSpot;
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = $('#route-close');
    if (closeBtn) closeBtn.onclick = () => FH.directions.close();
  });
})();
