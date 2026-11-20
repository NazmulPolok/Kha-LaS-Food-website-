/* ============================================================
   Crowdsourcing — quick "Add a cart" form
   ------------------------------------------------------------
   A lightweight, cart-focused alternative to the full spot form.
   Required: name, cart type, pin location. Writes to the local
   store and to the FastAPI/PostgreSQL backend when available.
   ============================================================ */
(function () {
  const CART_TYPES = [
    'Fuchka / Chotpoti',
    'Street Burger',
    'Kebab / Boti',
    'Biryani / Kacchi',
    'Tea / Coffee',
    'Juice / Dessert',
    'Noodles / Chinese',
    'Deshi / Local',
    'Other street food'
  ];

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function newId() {
    return 'cart_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
  }

  FH.crowd = {
    open(prefill) {
      const user = FH.auth.getUser();
      if (!user || !FH.auth.getToken()) {
        FH.auth.openAuthModal(
          () => FH.crowd.open(prefill),
          'Sign in with your email to add a newly discovered food cart to the community map.'
        );
        return;
      }

      const cfg = window.FH_CONFIG || {};
      const defaultCenter = Array.isArray(cfg.DEFAULT_CENTER) ? cfg.DEFAULT_CENTER : [90.395, 23.775];
      let currentLat = prefill && prefill.lat ? Number(prefill.lat) : Number(defaultCenter[1]);
      let currentLng = prefill && prefill.lng ? Number(prefill.lng) : Number(defaultCenter[0]);
      let closed = false;
      let pickerApi = null;
      let pin = null;

      const modal = document.getElementById('modal');
      if (!modal) return;

      modal.innerHTML = `
        <div class="bg-[#07192f] border border-[#1b3d6a] w-full max-w-lg rounded-2xl p-5 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto relative text-white" role="dialog" aria-modal="true" aria-label="Add a food cart">
          <div class="flex items-start justify-between border-b border-[#1b3d6a] pb-3 gap-3">
            <div>
              <h2 class="text-lg font-bold text-white flex items-center gap-2">
                <i class="fa-solid fa-cart-shopping text-brand"></i> Add a Food Cart
              </h2>
              <p class="text-xs text-slate-400">Found a hidden roadside cart? Drop a pin so everyone can find it.</p>
            </div>
            <button id="crowd-close" type="button" aria-label="Close" class="text-slate-400 hover:text-white text-2xl leading-none">&times;</button>
          </div>

          <form id="crowd-form" class="space-y-4">
            <div>
              <label for="crowd-name" class="block text-xs font-semibold text-slate-300 mb-1">Cart name <span class="text-brand">*</span></label>
              <input id="crowd-name" type="text" required maxlength="80" placeholder="e.g. Karim's Night Fuchka Cart"
                class="w-full px-3 py-2 border border-[#1b3d6a] bg-[#0c233f] text-white rounded-xl text-sm focus:border-brand focus:outline-none">
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label for="crowd-type" class="block text-xs font-semibold text-slate-300 mb-1">Cart type <span class="text-brand">*</span></label>
                <select id="crowd-type" class="w-full px-3 py-2 border border-[#1b3d6a] bg-[#0c233f] text-white rounded-xl text-sm focus:border-brand focus:outline-none">
                  ${CART_TYPES.map((type) => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`).join('')}
                </select>
              </div>
              <div>
                <label for="crowd-phone" class="block text-xs font-semibold text-slate-300 mb-1">Phone (optional)</label>
                <input id="crowd-phone" type="tel" maxlength="30" placeholder="+8801..."
                  class="w-full px-3 py-2 border border-[#1b3d6a] bg-[#0c233f] text-white rounded-xl text-sm focus:border-brand focus:outline-none">
              </div>
            </div>

            <div class="p-3.5 bg-[#0c233f] rounded-xl border border-[#1b3d6a] space-y-2.5">
              <div class="flex items-center justify-between gap-2">
                <div>
                  <span class="text-xs font-bold text-white flex items-center gap-1.5">
                    <i class="fa-solid fa-map-pin text-brand"></i> Location on map <span class="text-red-500">*</span>
                  </span>
                  <p class="text-[11px] text-slate-400">Tap the map to move the pin, or drag the pin itself.</p>
                </div>
                <button id="crowd-gps" type="button" class="shrink-0 bg-[#07192f] hover:bg-brand hover:text-white text-brand border border-[#1b3d6a] px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition">
                  <i class="fa-solid fa-crosshairs"></i> Use GPS
                </button>
              </div>

              <div class="relative w-full h-56 rounded-xl border border-[#1b3d6a] overflow-hidden bg-[#07192f]">
                <div id="crowd-map" class="w-full h-full"></div>
                <div class="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-white text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1.5 pointer-events-none">
                  <i class="fa-solid fa-hand-pointer text-orange-400"></i> Tap / drag to set the exact cart spot
                </div>
              </div>

              <div class="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <span class="font-mono bg-[#07192f] text-slate-200 px-2.5 py-1 rounded-lg border border-[#1b3d6a] inline-flex items-center gap-1" id="crowd-coords">
                  <i class="fa-solid fa-location-dot text-brand text-[10px]"></i> ${currentLat.toFixed(5)}, ${currentLng.toFixed(5)}
                </span>
                <span class="text-slate-500">Tap “Use GPS” if you are standing at the cart.</span>
              </div>

              <input id="crowd-lat" type="hidden" value="${currentLat.toFixed(6)}">
              <input id="crowd-lng" type="hidden" value="${currentLng.toFixed(6)}">
            </div>

            <div>
              <label for="crowd-address" class="block text-xs font-semibold text-slate-300 mb-1">Landmark / address (optional)</label>
              <input id="crowd-address" type="text" maxlength="140" placeholder="e.g. Near Dhanmondi Lake, opposite Rapa Plaza"
                class="w-full px-3 py-2 border border-[#1b3d6a] bg-[#0c233f] text-white rounded-xl text-sm focus:border-brand focus:outline-none">
            </div>

            <div>
              <label for="crowd-notes" class="block text-xs font-semibold text-slate-300 mb-1">What do they sell? (optional)</label>
              <textarea id="crowd-notes" rows="2" maxlength="300" placeholder="Best items, opening hours, price range…"
                class="w-full px-3 py-2 border border-[#1b3d6a] bg-[#0c233f] text-white rounded-xl text-sm resize-none focus:border-brand focus:outline-none"></textarea>
            </div>

            <!-- 1. Ground Presence Confirmation & Ground Rating -->
            <div class="fh-verif-box p-3 bg-[#0c233f] rounded-xl border border-emerald-500/30 space-y-2.5">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-white flex items-center gap-1.5">
                  <i class="fa-solid fa-map-location-dot text-emerald-400"></i> Ground Presence Confirmation
                </span>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">Location Only</span>
              </div>
              <p class="text-xs text-slate-200 leading-relaxed italic bg-[#07192f] p-2.5 rounded-lg border border-[#1b3d6a]">
                "Note: This ground confirmation is strictly to verify that the spot is in the 100% correct physical location on the map so users can find it in person."
              </p>
              <label class="flex items-center gap-2 cursor-pointer pt-0.5">
                <input id="crowd-confirm-loc" type="checkbox" checked required class="w-4 h-4 accent-emerald-500 rounded">
                <span class="text-xs font-semibold text-emerald-300">I confirm this spot physically exists at this exact 100% accurate location.</span>
              </label>

              <!-- Live Ground Presence Rating -->
              <div class="p-2.5 rounded-lg bg-[#07192f] border border-[#1b3d6a] space-y-1.5">
                <div class="flex items-center justify-between">
                  <span class="text-[11px] font-bold text-white flex items-center gap-1">
                    <i class="fa-solid fa-award text-amber-400"></i> Ground Presence Rating
                  </span>
                  <div class="flex items-center gap-1">
                    <span class="text-xs font-black text-amber-400 font-mono">0.4</span>
                    <span class="text-[10px] text-slate-400">/ 10.0</span>
                    <span class="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-500/30 ml-1">1/25 Confirmed</span>
                  </div>
                </div>
                <div class="w-full bg-[#143054] h-1.5 rounded-full overflow-hidden">
                  <div class="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full" style="width: 4%"></div>
                </div>
                <p class="text-[10px] text-slate-300 leading-snug">
                  <b>২৫ জনের কনফার্মেশন কোটা:</b> আপনার ১ম কনফার্মেশনে রেটিং ০.৪/১০.০। লোকাল ভোজনরসিকদের ২৫টি কনফার্মেশন পূর্ণ হলে এটি ১০.০/১০.০ ফুল ভেরিফাইড রেটিং অর্জন করবে।
                </p>
              </div>
            </div>

            <!-- 2. Separate Food & Hygiene Reviews Notice -->
            <div class="p-2.5 bg-[#07192f] rounded-xl border border-[#1b3d6a] flex items-center justify-between gap-2.5 text-xs">
              <div class="flex items-start gap-2">
                <i class="fa-solid fa-utensils text-amber-400 text-xs mt-0.5 shrink-0"></i>
                <div class="text-[11px] text-slate-300">
                  <b class="text-white">খাবারের রিভিউ ও রেটিং:</b> পাবলিশ হওয়ার পর স্পটের ড্রয়ার থেকে স্টার রেটিং ও বিস্তারিত রিভিউ দেওয়া যাবে।
                </div>
              </div>
              <span class="text-[9px] font-semibold text-slate-400 border border-[#1b3d6a] px-1.5 py-0.5 rounded shrink-0">Post-Publish</span>
            </div>

            <div class="bg-sky-950/40 border border-sky-500/30 rounded-xl p-3 text-[11px] text-sky-200 flex items-start gap-2">
              <i class="fa-solid fa-circle-info text-sky-400 mt-0.5"></i>
              <div>Added as <b>${escapeHtml(user.email)}</b>. The cart creator (vendor) can later toggle its live Open / Closed status and download a QR code.</div>
            </div>

            <button id="crowd-submit" type="submit" class="w-full bg-brand hover:bg-brand-hover text-white font-semibold py-3 rounded-xl text-sm transition shadow-lg shadow-brand/25 flex items-center justify-center gap-2">
              <i class="fa-solid fa-plus-circle"></i> Publish cart to the map
            </button>
          </form>
        </div>`;

      modal.classList.remove('hidden');
      modal.classList.add('flex');

      const closeSelf = () => {
        closed = true;
        if (pickerApi) {
          try { pickerApi.remove(); } catch (e) { /* already gone */ }
          pickerApi = null;
        }
        FH.closeModal();
      };

      document.getElementById('crowd-close').onclick = closeSelf;
      modal.onclick = (event) => { if (event.target === modal) closeSelf(); };

      const updateCoords = (lat, lng) => {
        currentLat = lat;
        currentLng = lng;
        const latField = document.getElementById('crowd-lat');
        const lngField = document.getElementById('crowd-lng');
        const badge = document.getElementById('crowd-coords');
        if (latField) latField.value = lat.toFixed(6);
        if (lngField) lngField.value = lng.toFixed(6);
        if (badge) badge.innerHTML = `<i class="fa-solid fa-location-dot text-brand text-[10px]"></i> ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      };

      // Initialise a small draggable-pin map (Mapbox when configured, Leaflet otherwise).
      FH.mapEngine.create('crowd-map', {
        center: [currentLng, currentLat],
        zoom: 15,
        theme: (FH.theme && FH.theme.get()) || 'dark',
        controls: false
      }).then((api) => {
        if (closed) { api.remove(); return; }
        pickerApi = api;

        pin = api.addMarker({
          lat: currentLat,
          lng: currentLng,
          html: '<div class="fh-picker-pin"><i class="fa-solid fa-location-dot"></i></div>',
          iconSize: [42, 52],
          anchor: 'bottom',
          draggable: true,
          onDrag: (p) => updateCoords(p.lat, p.lng),
          onDragEnd: (p) => updateCoords(p.lat, p.lng)
        });

        api.onClick((p) => {
          pin.setLatLng(p.lat, p.lng);
          updateCoords(p.lat, p.lng);
        });
      }).catch((err) => {
        console.warn('[FH.crowd] Picker map failed:', err);
      });

      document.getElementById('crowd-gps').onclick = () => {
        if (!navigator.geolocation) {
          FH.toast('Geolocation is not supported by this browser.');
          return;
        }
        FH.toast('Detecting your location…');
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            updateCoords(lat, lng);
            if (pin) pin.setLatLng(lat, lng);
            if (pickerApi) pickerApi.flyTo(lat, lng, 17);
            FH.toast('Pin placed at your current location.');
          },
          () => FH.toast('Could not access GPS. Tap the map to place the pin instead.'),
          { enableHighAccuracy: true, timeout: 9000 }
        );
      };

      document.getElementById('crowd-form').onsubmit = (event) => {
        event.preventDefault();

        const name = document.getElementById('crowd-name').value.trim();
        const cartType = document.getElementById('crowd-type').value;
        const phone = document.getElementById('crowd-phone').value.trim();
        const address = document.getElementById('crowd-address').value.trim();
        const notes = document.getElementById('crowd-notes').value.trim();
        const lat = parseFloat(document.getElementById('crowd-lat').value);
        const lng = parseFloat(document.getElementById('crowd-lng').value);
        const submit = document.getElementById('crowd-submit');

        if (!name) return FH.toast('Please enter the cart name.');
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return FH.toast('Please set the cart location on the map.');

        const spot = {
          id: newId(),
          name,
          lat,
          lng,
          food: [cartType],
          cartKind: cartType,
          type: 'Food Cart',
          rating: 8.5,
          reviews: 0,
          hygiene: null,
          price: '৳',
          token: 0,
          delivery: 'none',
          hasBooking: false,
          status: 'open',
          statusUpdatedAt: Date.now(),
          statusUpdatedBy: user.email,
          phone,
          address,
          about: notes || `${name} — a ${cartType} cart discovered by the খাLaS community.`,
          creator: user.email,
          confirmations: [user.email],
          photos: [],
          createdAt: Date.now(),
          foodpanda: 'https://www.foodpanda.com.bd/',
          pathao: 'https://pathao.com/bn/food/'
        };

        if (submit) {
          submit.disabled = true;
          submit.classList.add('opacity-70');
          submit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Publishing…';
        }

        FH.store.addSpot(spot);
        closeSelf();
        FH.toast(`"${name}" is now on the map. Location confirmed (1/25)!`);

      };
    }
  };
})();
