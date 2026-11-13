/* ============================================================
   Map engine adapter — Mapbox GL JS with Leaflet fallback
   ------------------------------------------------------------
   One small API so the rest of the app does not care which
   renderer is active. Mapbox is used when a valid public token
   (`pk.…`) is present in config.js; otherwise Leaflet + OSM/Carto
   keeps the existing demo working with zero configuration.
   ============================================================ */
(function () {
  const cfg = window.FH_CONFIG || {};
  const MAPBOX_VERSION = '3.8.0';
  const MAPBOX_CSS = `https://api.mapbox.com/mapbox-gl-js/v${MAPBOX_VERSION}/mapbox-gl.css`;
  const MAPBOX_JS = `https://api.mapbox.com/mapbox-gl-js/v${MAPBOX_VERSION}/mapbox-gl.js`;

  const token = String(cfg.MAPBOX_TOKEN || '').trim();
  const mapboxConfigured = /^pk\./.test(token) && !token.includes('YOUR_');

  let mapboxPromise = null;

  function theme() {
    try {
      return localStorage.getItem('foodhub_theme') || document.documentElement.getAttribute('data-theme') || 'dark';
    } catch (e) {
      return 'dark';
    }
  }

  function styleFor(mode) {
    return mode === 'light'
      ? (cfg.MAP_STYLE_LIGHT || 'mapbox://styles/mapbox/light-v11')
      : (cfg.MAP_STYLE_DARK || 'mapbox://styles/mapbox/dark-v11');
  }

  function normalizeCenter(center) {
    if (!center) return { lng: 90.395, lat: 23.775 };
    if (Array.isArray(center)) return { lng: Number(center[0]), lat: Number(center[1]) };
    return { lng: Number(center.lng), lat: Number(center.lat) };
  }

  function loadMapbox() {
    if (window.mapboxgl && window.mapboxgl.Map) {
      window.mapboxgl.accessToken = token;
      return Promise.resolve(window.mapboxgl);
    }
    if (mapboxPromise) return mapboxPromise;

    mapboxPromise = new Promise((resolve, reject) => {
      if (!document.querySelector('link[data-mapbox-css]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = MAPBOX_CSS;
        link.dataset.mapboxCss = 'true';
        document.head.appendChild(link);
      }
      const script = document.createElement('script');
      script.src = MAPBOX_JS;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        if (!window.mapboxgl || !window.mapboxgl.Map) {
          reject(new Error('Mapbox GL JS did not initialise.'));
          return;
        }
        window.mapboxgl.accessToken = token;
        resolve(window.mapboxgl);
      };
      script.onerror = () => reject(new Error('Could not load Mapbox GL JS.'));
      document.head.appendChild(script);
    });

    return mapboxPromise;
  }

  function markerAnchor(anchor, size) {
    const w = size[0] || 44;
    const h = size[1] || 32;
    if (anchor === 'center') return { leaflet: [w / 2, h / 2], mapbox: 'center' };
    if (anchor === 'top') return { leaflet: [w / 2, 0], mapbox: 'top' };
    return { leaflet: [w / 2, h], mapbox: 'bottom' };
  }

  /* ------------------------------------------------------------
     Leaflet adapter
     ------------------------------------------------------------ */
  function createLeaflet(container, opts) {
    if (!window.L) throw new Error('Leaflet is not loaded.');
    const center = normalizeCenter(opts.center);
    const zoom = opts.zoom || 12;
    const mode = opts.theme || theme();

    const map = L.map(container, {
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      touchZoom: true
    }).setView([center.lat, center.lng], zoom);

    if (opts.controls !== false) {
      L.control.zoom({ position: 'topright' }).addTo(map);
    }

    let tileLayer = null;
    let currentTheme = null;
    let routeCasing = null;
    let routeLine = null;
    const mapEl = typeof container === 'string' ? document.getElementById(container) : container;

    function clearRouteLayers() {
      if (routeCasing) { map.removeLayer(routeCasing); routeCasing = null; }
      if (routeLine) { map.removeLayer(routeLine); routeLine = null; }
    }

    function applyTiles(nextMode) {
      if (currentTheme === nextMode && tileLayer) return;
      currentTheme = nextMode;
      if (tileLayer) map.removeLayer(tileLayer);

      // OSM needs no API key. Dark mode uses a CSS filter on the tile pane,
      // which keeps the demo fully functional without a paid tile provider.
      const isLight = nextMode === 'light';
      tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      if (mapEl) mapEl.classList.toggle('fh-tiles-dark', !isLight);
    }

    applyTiles(mode);

    return {
      engine: 'leaflet',
      raw: map,

      setTheme(nextMode) {
        applyTiles(nextMode || theme());
      },

      onClick(callback) {
        map.on('click', (e) => callback({ lat: e.latlng.lat, lng: e.latlng.lng }));
      },

      addMarker(marker) {
        const size = marker.iconSize || [44, 32];
        const anchors = markerAnchor(marker.anchor || 'bottom', size);
        const icon = L.divIcon({
          className: `fh-marker-icon ${marker.className || ''}`,
          iconSize: size,
          iconAnchor: anchors.leaflet,
          html: marker.html || ''
        });

        const leafletMarker = L.marker([marker.lat, marker.lng], {
          icon,
          draggable: Boolean(marker.draggable),
          title: marker.title || '',
          keyboard: false
        }).addTo(map);

        if (marker.onClick) leafletMarker.on('click', (e) => {
          if (e && e.originalEvent) e.originalEvent.stopPropagation();
          marker.onClick(e);
        });
        if (marker.onDrag) leafletMarker.on('drag', (e) => {
          const p = e.target.getLatLng();
          marker.onDrag({ lat: p.lat, lng: p.lng });
        });
        if (marker.onDragEnd) leafletMarker.on('dragend', (e) => {
          const p = e.target.getLatLng();
          marker.onDragEnd({ lat: p.lat, lng: p.lng });
        });

        return {
          raw: leafletMarker,
          setLatLng(lat, lng) { leafletMarker.setLatLng([lat, lng]); },
          getLatLng() { const p = leafletMarker.getLatLng(); return { lat: p.lat, lng: p.lng }; },
          remove() { map.removeLayer(leafletMarker); }
        };
      },

      flyTo(lat, lng, targetZoom) {
        map.flyTo([lat, lng], targetZoom || map.getZoom(), { duration: 0.8 });
      },

      panTo(lat, lng) {
        map.panTo([lat, lng]);
      },

      setView(lat, lng, targetZoom) {
        map.setView([lat, lng], targetZoom || map.getZoom());
      },

      getZoom() {
        return map.getZoom();
      },

      fitBounds(points, options) {
        if (!points || !points.length) return;
        const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
        const opts = options || {};
        const pad = opts.padding;
        const topLeft = Array.isArray(pad) ? pad : [pad && pad.left != null ? pad.left : 50, pad && pad.top != null ? pad.top : 50];
        const bottomRight = Array.isArray(pad) ? pad : [pad && pad.right != null ? pad.right : 50, pad && pad.bottom != null ? pad.bottom : 50];
        map.fitBounds(bounds, {
          paddingTopLeft: topLeft,
          paddingBottomRight: bottomRight,
          maxZoom: opts.maxZoom || 15
        });
      },

      drawRoute(points, options) {
        clearRouteLayers();
        if (!Array.isArray(points) || points.length < 2) return;
        const latlngs = points.map((p) => [Number(p.lat), Number(p.lng)]);
        const color = (options && options.color) || '#f04e37';
        routeCasing = L.polyline(latlngs, {
          color: '#ffffff',
          weight: 11,
          opacity: 0.85,
          lineCap: 'round',
          lineJoin: 'round',
          interactive: false
        }).addTo(map);
        routeLine = L.polyline(latlngs, {
          color,
          weight: 6,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round',
          interactive: false
        }).addTo(map);
      },

      clearRoute() {
        clearRouteLayers();
      },

      invalidateSize() {
        setTimeout(() => map.invalidateSize(), 60);
      },

      remove() {
        map.remove();
      }
    };
  }

  /* ------------------------------------------------------------
     Mapbox GL adapter
     ------------------------------------------------------------ */
  function createMapbox(container, opts) {
    const mapboxgl = window.mapboxgl;
    const center = normalizeCenter(opts.center);
    const zoom = opts.zoom || 12;
    const initialStyle = styleFor(opts.theme || theme());

    const map = new mapboxgl.Map({
      container,
      style: initialStyle,
      center: [center.lng, center.lat],
      zoom,
      attributionControl: true,
      logoPosition: 'bottom-left',
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      antialias: true
    });

    if (opts.controls !== false) {
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
    }

    let currentStyle = initialStyle;
    let routeData = null;
    let routeColor = '#f04e37';
    let routePainted = false;
    const ROUTE_SOURCE = 'fh-route';

    function removeRouteLayers() {
      try {
        ['fh-route-line', 'fh-route-casing'].forEach((id) => {
          if (map.getLayer(id)) map.removeLayer(id);
        });
        if (map.getSource(ROUTE_SOURCE)) map.removeSource(ROUTE_SOURCE);
      } catch (err) {
        /* style may be mid-swap */
      }
      routePainted = false;
    }

    function paintRoute() {
      if (!routeData || routePainted) return;
      try {
        if (!map.getSource(ROUTE_SOURCE)) {
          map.addSource(ROUTE_SOURCE, { type: 'geojson', data: routeData });
        } else {
          map.getSource(ROUTE_SOURCE).setData(routeData);
        }
        if (!map.getLayer('fh-route-casing')) {
          map.addLayer({
            id: 'fh-route-casing',
            type: 'line',
            source: ROUTE_SOURCE,
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: { 'line-color': '#ffffff', 'line-width': 11, 'line-opacity': 0.85 }
          });
        }
        if (!map.getLayer('fh-route-line')) {
          map.addLayer({
            id: 'fh-route-line',
            type: 'line',
            source: ROUTE_SOURCE,
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: { 'line-color': routeColor, 'line-width': 6, 'line-opacity': 0.95 }
          });
        }
        routePainted = true;
      } catch (err) {
        console.warn('[FH.mapEngine] Could not draw route:', err);
      }
    }

    // Layers are wiped whenever the style changes; restore them afterwards.
    map.on('style.load', () => {
      if (!routeData) return;
      removeRouteLayers();
      paintRoute();
    });


    return {
      engine: 'mapbox',
      raw: map,

      setTheme(nextMode) {
        const next = styleFor(nextMode || theme());
        if (next === currentStyle) return;
        currentStyle = next;
        map.setStyle(next);
      },

      onClick(callback) {
        map.on('click', (e) => callback({ lat: e.lngLat.lat, lng: e.lngLat.lng }));
      },

      addMarker(marker) {
        const size = marker.iconSize || [44, 32];
        const anchors = markerAnchor(marker.anchor || 'bottom', size);
        const el = document.createElement('div');
        el.className = `fh-mapbox-marker ${marker.className || ''}`;
        el.innerHTML = marker.html || '';
        if (marker.title) el.title = marker.title;

        if (marker.onClick) {
          el.addEventListener('click', (event) => {
            event.stopPropagation();
            marker.onClick(event);
          });
        }

        const mbMarker = new mapboxgl.Marker({
          element: el,
          anchor: anchors.mapbox,
          draggable: Boolean(marker.draggable)
        }).setLngLat([marker.lng, marker.lat]).addTo(map);

        if (marker.onDrag) mbMarker.on('drag', () => {
          const p = mbMarker.getLngLat();
          marker.onDrag({ lat: p.lat, lng: p.lng });
        });
        if (marker.onDragEnd) mbMarker.on('dragend', () => {
          const p = mbMarker.getLngLat();
          marker.onDragEnd({ lat: p.lat, lng: p.lng });
        });

        return {
          raw: mbMarker,
          setLatLng(lat, lng) { mbMarker.setLngLat([lng, lat]); },
          getLatLng() { const p = mbMarker.getLngLat(); return { lat: p.lat, lng: p.lng }; },
          remove() { mbMarker.remove(); }
        };
      },

      flyTo(lat, lng, targetZoom) {
        map.flyTo({ center: [lng, lat], zoom: targetZoom || map.getZoom(), essential: true });
      },

      panTo(lat, lng) {
        map.panTo([lng, lat]);
      },

      setView(lat, lng, targetZoom) {
        map.jumpTo({ center: [lng, lat], zoom: targetZoom || map.getZoom() });
      },

      getZoom() {
        return map.getZoom();
      },

      fitBounds(points, options) {
        if (!points || !points.length) return;
        const bounds = points.reduce(
          (b, p) => b.extend([p.lng, p.lat]),
          new mapboxgl.LngLatBounds([points[0].lng, points[0].lat], [points[0].lng, points[0].lat])
        );
        const opts = options || {};
        const pad = opts.padding;
        const padding = Array.isArray(pad)
          ? { top: pad[0], bottom: pad[0], left: pad[1], right: pad[1] }
          : {
              top: pad && pad.top != null ? pad.top : 64,
              bottom: pad && pad.bottom != null ? pad.bottom : 64,
              left: pad && pad.left != null ? pad.left : 64,
              right: pad && pad.right != null ? pad.right : 64
            };
        map.fitBounds(bounds, {
          padding,
          maxZoom: opts.maxZoom || 15,
          duration: 900
        });
      },

      drawRoute(points, options) {
        removeRouteLayers();
        if (!Array.isArray(points) || points.length < 2) {
          routeData = null;
          return;
        }
        routeColor = (options && options.color) || '#f04e37';
        routeData = {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: points.map((p) => [Number(p.lng), Number(p.lat)])
          }
        };
        if (map.isStyleLoaded()) paintRoute();
      },

      clearRoute() {
        routeData = null;
        removeRouteLayers();
      },

      invalidateSize() {
        setTimeout(() => map.resize(), 60);
      },

      remove() {
        map.remove();
      }
    };
  }

  FH.mapEngine = {
    mapboxConfigured,
    engine: mapboxConfigured ? 'mapbox' : 'leaflet',
    loadMapbox,

    /**
     * Creates a map with the best available engine.
     * Always returns a Promise for a consistent API.
     */
    create(container, options) {
      const opts = Object.assign({
        center: cfg.DEFAULT_CENTER || [90.395, 23.775],
        zoom: cfg.DEFAULT_ZOOM || 12,
        theme: theme(),
        controls: true
      }, options || {});

      if (mapboxConfigured) {
        return loadMapbox()
          .then(() => createMapbox(container, opts))
          .catch((err) => {
            console.warn('[FH.mapEngine] Mapbox unavailable, falling back to Leaflet.', err);
            return createLeaflet(container, opts);
          });
      }

      try {
        return Promise.resolve(createLeaflet(container, opts));
      } catch (err) {
        return Promise.reject(err);
      }
    }
  };
})();
