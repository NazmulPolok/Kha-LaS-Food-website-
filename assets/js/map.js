(function () {
  const cfg = window.FH_CONFIG || {};
  const $ = (s) => document.querySelector(s);

  const ICON = {
    'Street Food': 'fa-burger',
    'Food Cart': 'fa-cart-shopping',
    Rooftop: 'fa-building',
    Cafe: 'fa-mug-hot',
    'Fine Dining': 'fa-champagne-glasses',
    Buffet: 'fa-plate-wheat'
  };

  let api = null;
  let readyPromise = null;
  let markers = [];
  let userMarker = null;
  let pickCallback = null;
  let pendingSpots = null;
  let pendingFocus = null;
  let pendingTheme = null;

  function currentTheme() {
    if (FH.theme && typeof FH.theme.get === 'function') return FH.theme.get();
    try { return localStorage.getItem('foodhub_theme') || 'dark'; } catch (e) { return 'dark'; }
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function distanceKm(a, b) {
    const R = 6371;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  function distanceLabel(km) {
    if (km == null || !isFinite(km)) return '';
    if (km < 1) return Math.max(10, Math.round(km * 1000 / 10) * 10) + ' m';
    return km.toFixed(km < 10 ? 1 : 0) + ' km';
  }

  function setNearButton(loading) {
    const btn = $('#btn-find-near');
    if (!btn) return;
    const label = btn.querySelector('[data-near-label]');
    const icon = btn.querySelector('i');
    btn.disabled = loading;
    btn.classList.toggle('opacity-70', loading);
    if (label) label.textContent = loading ? 'Locating…' : 'Find Near Me';
    if (icon) icon.className = loading ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-crosshairs';
  }

  function placeUserMarker(user) {
    if (!api || !user) return;
    if (userMarker) {
      userMarker.remove();
      userMarker = null;
    }
    userMarker = api.addMarker({
      lat: Number(user.lat),
      lng: Number(user.lng),
      html: '<div class="fh-user-dot" title="You are here"><span></span></div>',
      className: 'fh-user-marker',
      iconSize: [30, 30],
      anchor: 'center'
    });
  }

  FH.geo = {
    user: null,
    distances: {},
    distanceKm,
    label: distanceLabel
  };

  FH.map = {
    init() {
      if (readyPromise) return readyPromise;
      const container = document.getElementById('map');
      if (!container) return Promise.resolve(null);

      pendingTheme = currentTheme();
      readyPromise = FH.mapEngine.create(container, {
        center: (cfg.DEFAULT_CENTER || [90.395, 23.775]),
        zoom: cfg.DEFAULT_ZOOM || 12,
        theme: pendingTheme,
        controls: true
      }).then((mapApi) => {
        api = mapApi;

        api.onClick((latlng) => {
          if (typeof pickCallback !== 'function') return;
          const callback = pickCallback;
          pickCallback = null;
          container.classList.remove('cursor-crosshair');
          callback(latlng);
        });

        if (pendingSpots) this.render(pendingSpots);
        if (pendingFocus) {
          const focus = pendingFocus;
          pendingFocus = null;
          this.focus(focus);
        }
        if (pendingTheme) api.setTheme(pendingTheme);
        return api;
      }).catch((err) => {
        console.error('[FH.map] Map could not start:', err);
        if (typeof FH.toast === 'function') {
          FH.toast('Map could not load. Check your internet connection or Mapbox token.');
        }
        return null;
      });

      return readyPromise;
    },

    get engine() {
      return api ? api.engine : FH.mapEngine.engine;
    },

    setTheme(mode) {
      pendingTheme = mode || currentTheme();
      if (api) api.setTheme(pendingTheme);
    },

    invalidate() {
      if (api) api.invalidateSize();
    },

    setPickMode(callback) {
      pickCallback = callback;
      const el = document.getElementById('map');
      if (el) el.classList.add('cursor-crosshair');
      if (!api) {
        readyPromise.then(() => {
          if (!pickCallback) el.classList.remove('cursor-crosshair');
        });
      }
    },

    render(spots) {
      pendingSpots = spots || [];
      if (!api) return;

      markers.forEach((marker) => marker.remove());
      markers = [];

      const threshold = FH.VERIFIED_THRESHOLD || 25;

      pendingSpots.forEach((spot) => {
        const selected = FH.store.S.sel === spot.id;
        const confirmations = (spot.confirmations && spot.confirmations.length) || 0;
        const isVerified = confirmations >= threshold;
        const score = Number(spot.rating) || 0;
        const color = score > 0 ? FH.scoreColor(score) : '#64748b';
        const closed = spot.status === 'closed';
        const scoreLabel = score > 0 ? score.toFixed(1) : 'NEW';
        const html = `
          <div class="fh-pin ${selected ? 'sel' : ''} ${!isVerified ? 'unverified-pin' : ''} ${closed ? 'is-closed' : ''}"
               style="background:${color}"
               title="${escapeHtml(spot.name)} — ${closed ? 'Closed' : 'Open'}${score > 0 ? ' · ' + score.toFixed(1) + '/10' : ''}">
            <i class="fa-solid ${ICON[spot.type] || 'fa-utensils'}"></i>
            <b>${scoreLabel}</b>
            ${isVerified
              ? '<i class="fa-solid fa-circle-check text-[10px] text-white ml-0.5" title="Community verified"></i>'
              : `<i class="fa-regular fa-clock text-[10px] text-amber-200 ml-0.5" title="Pending verification (${confirmations}/${threshold})"></i>`}
            <span class="fh-pin-status ${closed ? 'closed' : 'open'}" title="${closed ? 'Closed' : 'Open'}"></span>
          </div>`;

        markers.push(api.addMarker({
          lat: Number(spot.lat),
          lng: Number(spot.lng),
          html,
          title: `${spot.name} — ${closed ? 'Closed' : 'Open'}`,
          className: selected ? 'is-selected' : '',
          iconSize: [96, 32],
          anchor: 'bottom',
          onClick: () => {
            if (pickCallback) return;
            FH.store.select(spot.id);
          }
        }));
      });
    },

    focus(spot) {
      if (!spot) return;
      if (!api) {
        pendingFocus = spot;
        return;
      }
      api.flyTo(Number(spot.lat), Number(spot.lng), Math.max(api.getZoom() || 13, 15));
    },

    showUser(user) {
      if (!user || !isFinite(Number(user.lat)) || !isFinite(Number(user.lng))) return null;
      const next = { lat: Number(user.lat), lng: Number(user.lng) };
      FH.geo.user = next;
      placeUserMarker(next);
      return next;
    },

    drawRoute(points, options) {
      if (api) api.drawRoute(points, options);
    },

    clearRoute() {
      if (api) api.clearRoute();
    },

    fit(points, options) {
      if (api) api.fitBounds(points, options);
    },

    async findNearMe() {
      if (!navigator.geolocation) {
        FH.toast('Geolocation is not supported by this browser.');
        return;
      }

      setNearButton(true);

      try {
        if (!api) await readyPromise;
        if (!api) throw new Error('Map is not ready.');

        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          });
        });

        const user = { lat: position.coords.latitude, lng: position.coords.longitude };
        const candidates = (FH.store.filtered().length ? FH.store.filtered() : FH.store.S.spots)
          .filter((spot) => Number.isFinite(Number(spot.lat)) && Number.isFinite(Number(spot.lng)));

        const distances = {};
        candidates.forEach((spot) => {
          distances[spot.id] = distanceKm(user, { lat: Number(spot.lat), lng: Number(spot.lng) });
        });

        FH.geo.user = user;
        FH.geo.distances = distances;

        this.showUser(user);

        const nearest = candidates
          .slice()
          .sort((a, b) => distances[a.id] - distances[b.id])[0];

        if (nearest) {
          api.fitBounds([user, { lat: Number(nearest.lat), lng: Number(nearest.lng) }], {
            maxZoom: cfg.NEAR_ME_MAX_ZOOM || 15
          });
          FH.toast(`Nearest cart: ${nearest.name} · ${distanceLabel(distances[nearest.id])} away`);
        } else {
          api.flyTo(user.lat, user.lng, 15);
          FH.toast('You are located! No carts match the current filters.');
        }

        // Re-render the sidebar so distance chips appear on every card.
        FH.store.emit();
      } catch (err) {
        if (err && err.code === 1) {
          FH.toast('Location permission denied. Enable it in your browser settings.');
        } else if (err && err.code === 3) {
          FH.toast('Location request timed out. Please try again.');
        } else {
          FH.toast('Could not find your location. Please check GPS / permissions.');
        }
      } finally {
        setNearButton(false);
      }
    }
  };
})();
