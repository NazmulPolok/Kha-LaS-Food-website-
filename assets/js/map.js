(function () {
  let map, layer, tileLayer;
  let pickCallback = null;
  const ICON = { 'Street Food': 'fa-burger', 'Food Cart': 'fa-cart-shopping', Rooftop: 'fa-building', Cafe: 'fa-mug-hot', 'Fine Dining': 'fa-champagne-glasses', Buffet: 'fa-plate-wheat' };

  FH.map = {
    init() {
      map = L.map('map', { zoomControl: true }).setView([23.775, 90.395], 12);
      
      const theme = (FH.theme && FH.theme.get()) || localStorage.getItem('foodhub_theme') || 'dark';
      this.setTheme(theme);

      layer = L.layerGroup().addTo(map);

      map.on('click', e => {
        if (typeof pickCallback === 'function') {
          const cb = pickCallback;
          pickCallback = null;
          document.getElementById('map').classList.remove('cursor-crosshair');
          cb(e.latlng);
        }
      });
    },

    setTheme(mode) {
      if (!map) return;
      if (tileLayer) map.removeLayer(tileLayer);

      tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
        maxZoom: 19
      }).addTo(map);

      if (layer) layer.bringToFront();
    },

    invalidate() {
      if (map) {
        setTimeout(() => map.invalidateSize(), 50);
      }
    },

    setPickMode(callback) {
      pickCallback = callback;
      const el = document.getElementById('map');
      if (el) el.classList.add('cursor-crosshair');
    },

    render(spots) {
      layer.clearLayers();
      const threshold = FH.VERIFIED_THRESHOLD || 25;

      spots.forEach(s => {
        const sel = FH.store.S.sel === s.id;
        const confCount = (s.confirmations && s.confirmations.length) || 0;
        const isVerified = confCount >= threshold;

        const icon = L.divIcon({
          className: '',
          iconSize: [84, 28],
          iconAnchor: [42, 28],
          html: `<div class="fh-pin ${sel ? 'sel' : ''} ${!isVerified ? 'border-amber-300' : ''}" style="background:${FH.scoreColor(s.rating)}" title="${FH.esc(s.name)} - ${isVerified ? 'Verified (' + confCount + ')' : 'Pending (' + confCount + '/' + threshold + ')'}">
            <i class="fa-solid ${ICON[s.type] || 'fa-utensils'}"></i>
            <b>${s.rating.toFixed(1)}</b>
            ${isVerified
              ? `<i class="fa-solid fa-circle-check text-[10px] text-white ml-0.5" title="Community Verified (${confCount})"></i>`
              : `<i class="fa-regular fa-clock text-[10px] text-amber-200 ml-0.5" title="Pending Verification (${confCount}/${threshold})"></i>`
            }
          </div>`
        });

        L.marker([s.lat, s.lng], { icon, title: s.name, zIndexOffset: sel ? 1000 : 0 })
          .on('click', () => {
            if (pickCallback) return; // Ignore spot selection in pick mode
            FH.store.select(s.id);
          }).addTo(layer);
      });
    },

    focus(s) {
      map.flyTo([s.lat, s.lng], Math.max(map.getZoom(), 15));
    }
  };
})();
