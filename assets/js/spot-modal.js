(function () {
  const $ = s => document.querySelector(s);
  let pickerMap = null;
  let pickerCounter = 0;

  const BANGLADESH_AREAS = [
    { name: '-- Quick Jump to Area (Bangladesh) --', lat: '', lng: '', zoom: 12 },
    // Dhaka
    { name: '📍 Dhaka: Dhanmondi (Satmasjid Road)', lat: 23.7461, lng: 90.3742, zoom: 16 },
    { name: '📍 Dhaka: Banani (Road 11)', lat: 23.7937, lng: 90.4046, zoom: 16 },
    { name: '📍 Dhaka: Gulshan 1 & 2', lat: 23.7850, lng: 90.4165, zoom: 16 },
    { name: '📍 Dhaka: Uttara (Sector 3 & 7)', lat: 23.8680, lng: 90.3980, zoom: 16 },
    { name: '📍 Dhaka: Old Dhaka (Nazira Bazar)', lat: 23.7145, lng: 90.4022, zoom: 16 },
    { name: '📍 Dhaka: Mirpur 10', lat: 23.8071, lng: 90.3687, zoom: 16 },
    { name: '📍 Dhaka: Khilgaon Taltola', lat: 23.7516, lng: 90.4227, zoom: 16 },
    { name: '📍 Dhaka: Bailey Road', lat: 23.7410, lng: 90.4045, zoom: 16 },
    { name: '📍 Dhaka: Mohammadpur (Ring Road)', lat: 23.7570, lng: 90.3620, zoom: 16 },
    // Chittagong
    { name: '📍 Chittagong: GEC Circle', lat: 22.3587, lng: 91.8215, zoom: 16 },
    { name: '📍 Chittagong: Agrabad', lat: 22.3276, lng: 91.8123, zoom: 16 },
    // Sylhet
    { name: '📍 Sylhet: Zindabazar', lat: 24.8968, lng: 91.8687, zoom: 16 },
    // Cox's Bazar
    { name: '📍 Cox\'s Bazar: Kolatoli Beach Road', lat: 21.4272, lng: 91.9806, zoom: 16 },
    // Rajshahi
    { name: '📍 Rajshahi: Shaheb Bazar', lat: 24.3636, lng: 88.6008, zoom: 16 },
    // Khulna
    { name: '📍 Khulna: Shibbari Circle', lat: 22.8200, lng: 89.5500, zoom: 16 }
  ];

  const SAMPLE_PHOTO_SETS = {
    'Biryani': [
      'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80'
    ],
    'Burger': [
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop&q=80'
    ],
    'Kabab': [
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80'
    ],
    'Cafe': [
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800&auto=format&fit=crop&q=80'
    ]
  };

  FH.spotModal = {
    open(spotOrCoords) {
      const user = FH.auth.getUser();
      if (!user) {
        FH.auth.openAuthModal(() => FH.spotModal.open(spotOrCoords), "Please sign in with your email to add or edit food spots.");
        return;
      }

      const isEdit = Boolean(spotOrCoords && spotOrCoords.id);
      const editSpot = isEdit ? spotOrCoords : null;

      const m = $('#modal');
      const selectedFoods = new Set(isEdit ? editSpot.food : ['Fast Food']);
      let currentLat = isEdit ? editSpot.lat : (spotOrCoords && spotOrCoords.lat ? spotOrCoords.lat : 23.7800);
      let currentLng = isEdit ? editSpot.lng : (spotOrCoords && spotOrCoords.lng ? spotOrCoords.lng : 90.4100);
      let spotPhotos = isEdit ? [...editSpot.photos] : [...SAMPLE_PHOTO_SETS.Burger];

      // Cleanup any previous picker map
      if (pickerMap) {
        try { pickerMap.remove(); } catch (e) {}
        pickerMap = null;
      }

      m.innerHTML = `
        <div class="bg-[#07192f] border border-[#1b3d6a] w-full max-w-xl rounded-2xl p-6 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto relative text-white" role="dialog" aria-modal="true" aria-label="${isEdit ? 'Edit Spot' : 'Add New Spot'}">
          <div class="flex items-start justify-between border-b border-[#1b3d6a] pb-3">
            <div>
              <h2 class="text-lg font-bold text-white flex items-center gap-2">
                <i class="fa-solid ${isEdit ? 'fa-pen-to-square text-brand' : 'fa-map-location-dot text-brand'}"></i>
                <span>${isEdit ? 'Edit Food Spot' : 'Add New Food Spot'}</span>
              </h2>
              <p class="text-xs text-slate-400">
                ${isEdit ? `Editing: <b class="text-white">${FH.esc(editSpot.name)}</b>` : `Spot Creator: <span class="font-medium text-brand">${FH.esc(user.email)}</span>`}
              </p>
            </div>
            <button id="add-spot-close" type="button" aria-label="Close" class="text-slate-400 hover:text-white text-2xl leading-none">&times;</button>
          </div>

          <form id="add-spot-form" class="space-y-4">
            <div>
              <label for="new-spot-name" class="block text-xs font-semibold text-slate-300 mb-1">Spot / Restaurant Name <span class="text-brand">*</span></label>
              <input id="new-spot-name" required value="${isEdit ? FH.esc(editSpot.name) : ''}" placeholder="e.g. Sultan's Dine, Chillox Banani" class="w-full px-3 py-2 border border-[#1b3d6a] bg-[#0c233f] text-white rounded-xl text-sm focus:border-brand focus:outline-none">
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="new-spot-type" class="block text-xs font-semibold text-slate-300 mb-1">Place Type <span class="text-brand">*</span></label>
                <select id="new-spot-type" class="w-full px-3 py-2 border border-[#1b3d6a] bg-[#0c233f] text-white rounded-xl text-sm focus:border-brand focus:outline-none">
                  ${FH.CATS.types.map(t => `<option value="${t}" ${isEdit && editSpot.type === t ? 'selected' : ''}>${t}</option>`).join('')}
                </select>
              </div>
              <div>
                <label for="new-spot-price" class="block text-xs font-semibold text-slate-300 mb-1">Price Range <span class="text-brand">*</span></label>
                <select id="new-spot-price" class="w-full px-3 py-2 border border-[#1b3d6a] bg-[#0c233f] text-white rounded-xl text-sm focus:border-brand focus:outline-none">
                  <option value="৳" ${isEdit && editSpot.price === '৳' ? 'selected' : ''}>৳ (Budget friendly - under 200)</option>
                  <option value="৳৳" ${(!isEdit || editSpot.price === '৳৳') ? 'selected' : ''}>৳৳ (Moderate - 200 to 500)</option>
                  <option value="৳৳৳" ${isEdit && editSpot.price === '৳৳৳' ? 'selected' : ''}>৳৳৳ (Upscale - 500 to 1200)</option>
                  <option value="৳৳৳৳" ${isEdit && editSpot.price === '৳৳৳৳' ? 'selected' : ''}>৳৳৳৳ (Fine dining - 1200+)</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Food / Cuisine Categories (Click to select) <span class="text-brand">*</span></label>
              <div id="new-spot-cats" class="flex flex-wrap gap-1.5 p-2 bg-[#0c233f] rounded-xl border border-[#1b3d6a] max-h-24 overflow-y-auto">
                ${FH.CATS.food.map(f => `
                  <button type="button" class="chip spot-cat-chip ${selectedFoods.has(f) ? 'bg-brand border-brand text-white' : ''}" data-cat="${f}" aria-pressed="${selectedFoods.has(f)}">${f}</button>
                `).join('')}
              </div>
              <div class="mt-1 flex gap-2">
                <input id="custom-cat-input" type="text" placeholder="Or add custom category (e.g. Pizza, Coffee)" class="flex-1 px-3 py-1 border border-[#1b3d6a] bg-[#0c233f] text-white rounded-lg text-xs focus:border-brand focus:outline-none">
                <button id="btn-add-custom-cat" type="button" class="bg-[#102d50] hover:bg-brand text-slate-200 hover:text-white text-xs px-2.5 py-1 rounded-lg font-medium transition">+ Add</button>
              </div>
            </div>

            <!-- PHOTOS SECTION (3 - 5 PICTURES REQUIRED) -->
            <div class="p-3.5 bg-gradient-to-br from-[#0c233f] to-[#07192f] rounded-xl border border-[#1b3d6a] space-y-3">
              <div class="flex items-center justify-between">
                <div>
                  <span class="text-xs font-bold text-white flex items-center gap-1.5">
                    <i class="fa-solid fa-camera text-brand"></i> Spot Photos (3 to 5 Pictures) <span class="text-red-500">*</span>
                  </span>
                  <p class="text-[11px] text-slate-400">Provide photos of food, menu and dining area so users can verify how it looks.</p>
                </div>
                <span id="photo-count-badge" class="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-brand/20 text-brand border border-brand/40">
                  ${spotPhotos.length} / 5 Photos
                </span>
              </div>

              <!-- Upload / URL input -->
              <div class="space-y-2">
                <div>
                  <label class="block text-[11px] font-semibold text-slate-300 mb-1">Upload from your Device (Select up to 5 images):</label>
                  <input id="new-spot-file-input" type="file" multiple accept="image/*" class="w-full text-xs text-slate-300 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand file:text-white hover:file:bg-brand-hover cursor-pointer">
                </div>

                <div class="flex gap-2 items-center">
                  <input id="new-spot-url-input" type="url" placeholder="Or paste image URL (https://...)" class="flex-1 px-2.5 py-1.5 border border-[#1b3d6a] bg-[#0c233f] text-white rounded-lg text-xs focus:border-brand focus:outline-none">
                  <button id="btn-add-url-photo" type="button" class="bg-brand hover:bg-brand-hover text-white text-xs px-3 py-1.5 rounded-lg font-medium shrink-0 shadow-sm transition">+ Add URL</button>
                </div>
              </div>

              <!-- Quick Presets -->
              <div>
                <div class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Or Pick Instant Photo Presets:</div>
                <div class="flex flex-wrap gap-1.5">
                  <button type="button" class="preset-photo-btn text-[11px] bg-[#0c233f] hover:bg-[#102d50] hover:text-white text-slate-300 px-2 py-0.5 rounded border border-[#1b3d6a] transition" data-set="Biryani">🍗 Kacchi Biryani (4)</button>
                  <button type="button" class="preset-photo-btn text-[11px] bg-[#0c233f] hover:bg-[#102d50] hover:text-white text-slate-300 px-2 py-0.5 rounded border border-[#1b3d6a] transition" data-set="Burger">🍔 Burgers & Fries (4)</button>
                  <button type="button" class="preset-photo-btn text-[11px] bg-[#0c233f] hover:bg-[#102d50] hover:text-white text-slate-300 px-2 py-0.5 rounded border border-[#1b3d6a] transition" data-set="Kabab">🍢 Charcoal Kababs (4)</button>
                  <button type="button" class="preset-photo-btn text-[11px] bg-[#0c233f] hover:bg-[#102d50] hover:text-white text-slate-300 px-2 py-0.5 rounded border border-[#1b3d6a] transition" data-set="Cafe">☕ Cafe & Tea (4)</button>
                </div>
              </div>

              <!-- Preview Grid -->
              <div id="photos-preview-grid" class="grid grid-cols-4 sm:grid-cols-5 gap-2 pt-1"></div>
            </div>

            <!-- INTERACTIVE PIN MAP LOCATION PICKER -->
            <div class="p-3.5 bg-[#0c233f] rounded-xl border border-[#1b3d6a] space-y-3">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span class="text-xs font-bold text-white flex items-center gap-1.5">
                    <i class="fa-solid fa-map-pin text-brand"></i> Pin Exact Location on Map <span class="text-red-500">*</span>
                  </span>
                  <p class="text-[11px] text-slate-400">Drag the orange pin or click on the map to set the exact restaurant spot.</p>
                </div>
                <div class="flex items-center gap-2">
                  <span id="picker-coords-badge" class="font-mono text-xs bg-[#07192f] text-white px-2.5 py-1 rounded-lg border border-[#1b3d6a] font-bold shadow-sm">
                    📍 ${currentLat.toFixed(5)}, ${currentLng.toFixed(5)}
                  </span>
                </div>
              </div>

              <!-- Quick Area Jump & GPS Detect -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div class="sm:col-span-2">
                  <select id="new-spot-area" class="w-full px-2.5 py-1.5 border border-[#1b3d6a] bg-[#07192f] text-white rounded-lg text-xs focus:border-brand focus:outline-none">
                    ${BANGLADESH_AREAS.map((p, i) => `<option value="${i}">${p.name}</option>`).join('')}
                  </select>
                </div>
                <div>
                  <button id="btn-use-gps" type="button" class="w-full bg-[#07192f] hover:bg-brand hover:text-white text-brand border border-[#1b3d6a] px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition">
                    <i class="fa-solid fa-crosshairs"></i> Use My GPS
                  </button>
                </div>
              </div>

              <!-- Live Interactive Map Container -->
              <div class="relative w-full h-64 rounded-xl border border-[#1b3d6a] overflow-hidden shadow-inner bg-[#07192f]">
                <div id="spot-picker-map" class="w-full h-full z-0"></div>
                <div class="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-white text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1.5 pointer-events-none z-10">
                  <i class="fa-solid fa-hand-pointer text-orange-400"></i>
                  <span>Click anywhere or drag pin to position</span>
                </div>
              </div>

              <!-- Lat / Lng auto-filled fields -->
              <div class="grid grid-cols-2 gap-2.5 pt-1">
                <div>
                  <label for="new-spot-lat" class="block text-[11px] font-semibold text-slate-300 mb-0.5">Latitude (Auto-calculated)</label>
                  <div class="relative">
                    <input id="new-spot-lat" type="number" step="any" required value="${currentLat.toFixed(5)}" class="w-full px-2.5 py-1.5 border border-[#1b3d6a] rounded-lg text-xs font-mono bg-[#07192f] font-bold text-white focus:border-brand focus:outline-none">
                    <span class="absolute right-2 top-1.5 text-[10px] text-gray-400 font-sans">N</span>
                  </div>
                </div>
                <div>
                  <label for="new-spot-lng" class="block text-[11px] font-semibold text-slate-300 mb-0.5">Longitude (Auto-calculated)</label>
                  <div class="relative">
                    <input id="new-spot-lng" type="number" step="any" required value="${currentLng.toFixed(5)}" class="w-full px-2.5 py-1.5 border border-[#1b3d6a] rounded-lg text-xs font-mono bg-[#07192f] font-bold text-white focus:border-brand focus:outline-none">
                    <span class="absolute right-2 top-1.5 text-[10px] text-gray-400 font-sans">E</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- FACILITIES SECTION (DEFAULT: NO BOOKING & NO DELIVERY) -->
            <div class="p-3.5 bg-[#0c233f] rounded-xl border border-[#1b3d6a] space-y-3">
              <div>
                <span class="text-xs font-bold text-white flex items-center gap-1.5">
                  <i class="fa-solid fa-bell-concierge text-brand"></i> Facilities & Services (সুযোগ-সুবিধাসমূহ)
                </span>
                <p class="text-[11px] text-slate-400">ডিফল্টভাবে "No Booking" এবং "No Delivery" থাকবে। সুবিধা থাকলে তা অন করুন।</p>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <!-- Table Booking Option -->
                <div class="p-2.5 bg-[#07192f] rounded-lg border border-[#1b3d6a]">
                  <label class="flex items-start gap-2.5 cursor-pointer">
                    <input id="new-spot-booking-cb" type="checkbox" ${isEdit && editSpot.hasBooking ? 'checked' : ''} class="w-4 h-4 mt-0.5 accent-orange-500 rounded cursor-pointer">
                    <div>
                      <span class="text-xs font-bold text-white flex items-center gap-1">
                        <i class="fa-solid fa-calendar-check text-emerald-600"></i> Table Booking Facility
                      </span>
                      <p class="text-[10px] text-slate-400 mt-0.5">Enable if this spot allows table reservations. (Default: No Booking)</p>
                    </div>
                  </label>
                </div>

                <!-- Delivery Option -->
                <div class="p-2.5 bg-[#07192f] rounded-lg border border-[#1b3d6a]">
                  <label for="new-spot-delivery" class="block text-xs font-bold text-white mb-1 flex items-center gap-1">
                    <i class="fa-solid fa-motorcycle text-blue-600"></i> Delivery Facility
                  </label>
                  <select id="new-spot-delivery" class="w-full px-2.5 py-1.5 border border-[#1b3d6a] rounded-lg text-xs bg-[#0c233f] text-white focus:border-brand focus:outline-none">
                    <option value="none" ${(!isEdit || editSpot.delivery === 'none') ? 'selected' : ''}>No Delivery (Dine-in only / Default)</option>
                    <option value="both" ${isEdit && editSpot.delivery === 'both' ? 'selected' : ''}>Available (Vendor & Foodpanda / Pathao)</option>
                    <option value="aggregator" ${isEdit && editSpot.delivery === 'aggregator' ? 'selected' : ''}>Available (Foodpanda / Pathao Apps)</option>
                    <option value="vendor" ${isEdit && editSpot.delivery === 'vendor' ? 'selected' : ''}>Available (Direct Vendor Delivery)</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label for="new-spot-phone" class="block text-xs font-semibold text-slate-300 mb-1">Contact Phone (Optional)</label>
              <input id="new-spot-phone" type="tel" value="${isEdit && editSpot.phone ? FH.esc(editSpot.phone) : ''}" placeholder="+8801..." class="w-full px-3 py-2 border border-[#1b3d6a] bg-[#0c233f] text-white rounded-xl text-sm focus:border-brand focus:outline-none">
            </div>

            <div>
              <label for="new-spot-about" class="block text-xs font-semibold text-slate-300 mb-1">About / Specialties</label>
              <textarea id="new-spot-about" rows="2" placeholder="Tell what this spot is known for, best dishes, seating atmosphere..." class="w-full px-3 py-2 border border-[#1b3d6a] bg-[#0c233f] text-white rounded-xl text-sm focus:border-brand focus:outline-none">${isEdit ? FH.esc(editSpot.about) : ''}</textarea>
            </div>

            <div class="bg-amber-950/40 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-300 flex items-start gap-2">
              <i class="fa-solid fa-circle-info text-amber-600 mt-0.5"></i>
              <div>
                <b>Verification Policy:</b> Requires <b>at least 25 community confirmations (lower limit)</b> from registered users to receive the official "Community Verified" badge. There is <b>no upper limit</b>.
              </div>
            </div>

            <button type="submit" class="w-full bg-brand hover:bg-brand-hover text-white font-semibold py-3 rounded-xl text-sm transition shadow-lg shadow-brand/25">
              <i class="fa-solid ${isEdit ? 'fa-floppy-disk' : 'fa-plus-circle'} mr-1.5"></i>
              <span>${isEdit ? 'Save Changes' : 'Publish Food Spot'}</span>
            </button>
          </form>
        </div>
      `;

      m.classList.remove('hidden');
      m.classList.add('flex');

      const closeSelf = () => {
        if (pickerMap) {
          try { pickerMap.remove(); } catch (e) {}
          pickerMap = null;
        }
        FH.closeModal();
      };

      $('#add-spot-close').onclick = closeSelf;
      m.onclick = e => { if (e.target === m) closeSelf(); };

      // Initialize Interactive Picker Map (Mapbox when configured, Leaflet fallback)
      const pickerSeq = ++pickerCounter;
      setTimeout(() => {
        const mapContainer = document.getElementById('spot-picker-map');
        if (!mapContainer) return;

        FH.mapEngine.create('spot-picker-map', {
          center: [currentLng, currentLat],
          zoom: 15,
          theme: (FH.theme && FH.theme.get()) || 'dark',
          controls: true
        }).then(api => {
          if (pickerSeq !== pickerCounter || !document.getElementById('spot-picker-map')) {
            api.remove();
            return;
          }
          pickerMap = api;

          const marker = api.addMarker({
            lat: currentLat,
            lng: currentLng,
            html: `
              <div class="fh-picker-pin">
                <div class="fh-picker-pin-head"><i class="fa-solid fa-location-dot"></i></div>
                <div class="fh-picker-pin-tail"></div>
                <div class="fh-picker-pin-shadow"></div>
              </div>`,
            iconSize: [42, 54],
            anchor: 'bottom',
            draggable: true,
            title: 'Drag me to the exact spot!',
            onDrag: p => updatePickerCoords(p.lat, p.lng),
            onDragEnd: p => {
              updatePickerCoords(p.lat, p.lng);
              api.panTo(p.lat, p.lng);
            }
          });

          const updatePickerCoords = (lat, lng) => {
            currentLat = lat;
            currentLng = lng;
            $('#new-spot-lat').value = lat.toFixed(5);
            $('#new-spot-lng').value = lng.toFixed(5);
            const badge = $('#picker-coords-badge');
            if (badge) badge.textContent = `📍 ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          };

          // Clicking on map moves the pin immediately
          api.onClick(p => {
            marker.setLatLng(p.lat, p.lng);
            updatePickerCoords(p.lat, p.lng);
          });

          // Area Presets
          $('#new-spot-area').onchange = e => {
            const idx = +e.target.value;
            const item = BANGLADESH_AREAS[idx];
            if (item && item.lat) {
              api.flyTo(item.lat, item.lng, item.zoom || 16);
              marker.setLatLng(item.lat, item.lng);
              updatePickerCoords(item.lat, item.lng);
            }
          };

          // Manual Lat/Lng input typing moves pin
          const syncManualInput = () => {
            const latVal = parseFloat($('#new-spot-lat').value);
            const lngVal = parseFloat($('#new-spot-lng').value);
            if (!isNaN(latVal) && !isNaN(lngVal)) {
              marker.setLatLng(latVal, lngVal);
              api.panTo(latVal, lngVal);
              const badge = $('#picker-coords-badge');
              if (badge) badge.textContent = `📍 ${latVal.toFixed(5)}, ${lngVal.toFixed(5)}`;
            }
          };

          $('#new-spot-lat').oninput = syncManualInput;
          $('#new-spot-lng').oninput = syncManualInput;

          // GPS Detect
          $('#btn-use-gps').onclick = () => {
            if ('geolocation' in navigator) {
              FH.toast('Detecting your GPS location...');
              navigator.geolocation.getCurrentPosition(
                pos => {
                  const lat = pos.coords.latitude;
                  const lng = pos.coords.longitude;
                  api.flyTo(lat, lng, 17);
                  marker.setLatLng(lat, lng);
                  updatePickerCoords(lat, lng);
                  FH.toast('Pin placed at your current location!');
                },
                () => {
                  FH.toast('Could not access GPS. Please drag the pin manually.');
                },
                { enableHighAccuracy: true, timeout: 8000 }
              );
            } else {
              FH.toast('Geolocation is not supported by your browser.');
            }
          };

          api.invalidateSize();
        }).catch(err => {
          console.warn('[FH.spotModal] Picker map failed:', err);
          FH.toast('Location picker could not load. You can still type coordinates below.');
        });
      }, 250);

      // Photo rendering helper
      const renderPhotoPreviews = () => {
        const grid = $('#photos-preview-grid');
        const badge = $('#photo-count-badge');
        const isValid = spotPhotos.length >= 3 && spotPhotos.length <= 5;

        badge.textContent = `${spotPhotos.length} / 5 Photos`;
        if (isValid) {
          badge.className = 'text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300';
        } else {
          badge.className = 'text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300';
        }

        grid.innerHTML = spotPhotos.map((url, i) => `
          <div class="relative w-full h-16 rounded-lg overflow-hidden border border-gray-300 group shadow-sm bg-gray-100">
            <img src="${url}" class="w-full h-full object-cover">
            <button type="button" data-del-photo="${i}" class="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center opacity-80 hover:opacity-100 transition shadow" title="Remove photo">&times;</button>
            <span class="absolute bottom-0.5 left-0.5 bg-black/60 text-white text-[9px] px-1 rounded font-mono">#${i + 1}</span>
          </div>
        `).join('');

        grid.querySelectorAll('[data-del-photo]').forEach(btn => {
          btn.onclick = () => {
            const idx = +btn.dataset.delPhoto;
            spotPhotos.splice(idx, 1);
            renderPhotoPreviews();
          };
        });
      };

      renderPhotoPreviews();

      // Handle file uploads
      $('#new-spot-file-input').onchange = e => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        const availableSlots = 5 - spotPhotos.length;
        if (availableSlots <= 0) {
          return FH.toast('Maximum 5 photos allowed. Remove a photo to add more.');
        }

        files.slice(0, availableSlots).forEach(file => {
          const reader = new FileReader();
          reader.onload = ev => {
            if (spotPhotos.length < 5) {
              spotPhotos.push(ev.target.result);
              renderPhotoPreviews();
            }
          };
          reader.readAsDataURL(file);
        });
      };

      // Add URL photo
      $('#btn-add-url-photo').onclick = () => {
        const input = $('#new-spot-url-input');
        const url = input.value.trim();
        if (!url) return;
        if (spotPhotos.length >= 5) return FH.toast('Maximum 5 photos reached.');
        spotPhotos.push(url);
        input.value = '';
        renderPhotoPreviews();
      };

      // Presets
      m.querySelectorAll('.preset-photo-btn').forEach(btn => {
        btn.onclick = () => {
          const setKey = btn.dataset.set;
          if (SAMPLE_PHOTO_SETS[setKey]) {
            spotPhotos = [...SAMPLE_PHOTO_SETS[setKey]];
            renderPhotoPreviews();
            FH.toast(`Added 4 sample photos for ${setKey}.`);
          }
        };
      });

      // Handle category toggles
      $('#new-spot-cats').onclick = e => {
        const btn = e.target.closest('[data-cat]');
        if (!btn) return;
        const cat = btn.dataset.cat;
        if (selectedFoods.has(cat)) {
          if (selectedFoods.size > 1) {
            selectedFoods.delete(cat);
            btn.classList.remove('bg-brand', 'border-brand', 'text-white');
            btn.setAttribute('aria-pressed', 'false');
          } else {
            FH.toast('Please keep at least one category selected.');
          }
        } else {
          selectedFoods.add(cat);
          btn.classList.add('bg-brand', 'border-brand', 'text-white');
          btn.setAttribute('aria-pressed', 'true');
        }
      };

      // Add custom category
      $('#btn-add-custom-cat').onclick = () => {
        const input = $('#custom-cat-input');
        const val = input.value.trim();
        if (!val) return;
        if (!selectedFoods.has(val)) {
          selectedFoods.add(val);
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'chip spot-cat-chip bg-brand border-brand text-white';
          btn.dataset.cat = val;
          btn.setAttribute('aria-pressed', 'true');
          btn.textContent = val;
          $('#new-spot-cats').appendChild(btn);
        }
        input.value = '';
      };

      // Form submission
      $('#add-spot-form').onsubmit = e => {
        e.preventDefault();
        const name = $('#new-spot-name').value.trim();
        const type = $('#new-spot-type').value;
        const price = $('#new-spot-price').value;
        const delivery = $('#new-spot-delivery').value; // 'none' default or selected
        const hasBooking = $('#new-spot-booking-cb').checked; // false default unless checked
        const phone = $('#new-spot-phone').value.trim();
        const about = $('#new-spot-about').value.trim() || `${name} located in Bangladesh.`;
        const lat = parseFloat($('#new-spot-lat').value);
        const lng = parseFloat($('#new-spot-lng').value);

        if (!name) return FH.toast('Please enter a spot name.');
        if (isNaN(lat) || isNaN(lng)) return FH.toast('Please place the pin on the map to set valid coordinates.');
        if (!selectedFoods.size) return FH.toast('Select at least one food category.');

        // Photo validation (3 to 5 pictures)
        if (spotPhotos.length < 3) {
          return FH.toast(`Please add at least 3 photos (currently ${spotPhotos.length}/3) so users can clearly see the spot.`);
        }
        if (spotPhotos.length > 5) {
          return FH.toast('Maximum 5 photos allowed.');
        }

        if (isEdit) {
          FH.store.updateSpot(editSpot.id, {
            name,
            type,
            price,
            food: Array.from(selectedFoods),
            photos: [...spotPhotos],
            lat,
            lng,
            hasBooking,
            delivery,
            phone,
            about
          });
          closeSelf();
          FH.toast(`Spot "${name}" updated successfully!`);
          FH.map.focus({ lat, lng });
        } else {
          const id = 'user_spot_' + Date.now();
          const newSpot = {
            id,
            name,
            lat,
            lng,
            food: Array.from(selectedFoods),
            type,
            rating: 8.5,
            reviews: 1,
            price,
            token: 0,
            delivery,
            hasBooking,
            status: 'open',
            phone,
            about,
            creator: user.email,
            confirmations: [user.email], // Creator is the first confirmation
            photos: [...spotPhotos],
            createdAt: Date.now(),
            foodpanda: 'https://www.foodpanda.com.bd/',
            pathao: 'https://pathao.com/bn/food/'
          };

          FH.store.addSpot(newSpot);
          closeSelf();
          const threshold = FH.VERIFIED_THRESHOLD || 25;
          FH.toast(`Spot "${name}" added! Confirmed by you (1/${threshold}).`);
          FH.map.focus(newSpot);
        }
      };
    },

    openMySpots(user) {
      if (!user) user = FH.auth.getUser();
      if (!user) {
        FH.auth.openAuthModal(u => FH.spotModal.openMySpots(u), "Please sign in to view your added spots.");
        return;
      }

      const m = $('#modal');
      const userSpots = FH.store.getUserSpots(user.email);
      const threshold = FH.VERIFIED_THRESHOLD || 25;

      m.innerHTML = `
        <div class="bg-[#07192f] border border-[#1b3d6a] w-full max-w-xl rounded-2xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto relative text-white" role="dialog" aria-modal="true" aria-label="My Added Spots">
          <div class="flex items-start justify-between border-b border-[#1b3d6a] pb-3">
            <div>
              <h2 class="text-lg font-bold text-white flex items-center gap-2">
                <i class="fa-solid fa-utensils text-brand"></i> My Added Food Spots
              </h2>
              <p class="text-xs text-gray-500">
                Logged in as: <span class="font-medium text-brand">${FH.esc(user.email)}</span> • Total: <b>${userSpots.length}</b> spot(s)
              </p>
            </div>
            <button id="myspots-close" type="button" aria-label="Close" class="text-slate-400 hover:text-white text-2xl leading-none">&times;</button>
          </div>

          ${userSpots.length === 0 ? `
            <div class="text-center py-8 space-y-3">
              <div class="w-14 h-14 rounded-full bg-brand/10 border border-brand/30 text-brand flex items-center justify-center mx-auto text-2xl">
                <i class="fa-solid fa-map-location-dot"></i>
              </div>
              <h3 class="font-bold text-white">You haven't added any spots yet</h3>
              <p class="text-xs text-slate-400 max-w-sm mx-auto">
                Help fellow foodies across Bangladesh discover great food! Add your favorite restaurants, carts, or cafes.
              </p>
              <button id="btn-add-from-empty" type="button" class="bg-brand hover:bg-brand-hover text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-lg shadow-brand/20 transition">
                <i class="fa-solid fa-plus-circle mr-1"></i> Add Your First Spot
              </button>
            </div>
          ` : `
            <div class="space-y-3">
              ${userSpots.map(s => {
                const confs = (s.confirmations && s.confirmations.length) || 0;
                const isVer = confs >= threshold;
                const thumb = (s.photos && s.photos[0]) || (FH.gallery && FH.gallery.fallback) || '';
                const hasBooking = Boolean(s.hasBooking);
                const hasDelivery = Boolean(s.delivery && s.delivery !== 'none');

                return `
                  <div class="p-3 rounded-xl border border-[#16365f] bg-[#0c233f] hover:border-brand/50 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
                    <div class="flex items-center gap-3 min-w-0">
                      <div class="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-[#07192f] border border-[#1b3d6a]">
                        <img src="${thumb}" alt="${FH.esc(s.name)}" class="w-full h-full object-cover">
                      </div>
                      <div class="min-w-0">
                        <h4 class="font-bold text-sm text-white truncate">${FH.esc(s.name)}</h4>
                        <p class="text-xs text-slate-400 truncate">${FH.esc(s.type)} • ${s.food.map(FH.esc).join(', ')} • ${s.price}</p>
                        
                        <div class="flex flex-wrap items-center gap-1.5 mt-1">
                          ${isVer
                            ? `<span class="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full"><i class="fa-solid fa-certificate text-emerald-600"></i> Verified (${confs})</span>`
                            : `<span class="inline-flex items-center gap-1 text-[10px] font-medium text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full"><i class="fa-regular fa-clock text-amber-600"></i> Pending (${confs}/${threshold})</span>`
                          }
                          ${hasBooking
                            ? `<span class="inline-flex items-center gap-0.5 text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded"><i class="fa-solid fa-calendar-check"></i> Booking</span>`
                            : `<span class="inline-flex items-center gap-0.5 text-[9px] text-slate-400 bg-[#07192f] border border-[#1b3d6a] px-1.5 py-0.5 rounded">No Booking</span>`
                          }
                          ${hasDelivery
                            ? `<span class="inline-flex items-center gap-0.5 text-[9px] text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded"><i class="fa-solid fa-motorcycle"></i> Delivery</span>`
                            : `<span class="inline-flex items-center gap-0.5 text-[9px] text-slate-400 bg-[#07192f] border border-[#1b3d6a] px-1.5 py-0.5 rounded">No Delivery</span>`
                          }
                        </div>
                      </div>
                    </div>

                    <!-- Action buttons -->
                    <div class="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button type="button" data-view-id="${s.id}" class="text-xs bg-[#07192f] hover:bg-[#102d50] text-slate-200 hover:text-white px-2.5 py-1.5 rounded-lg border border-[#1b3d6a] font-medium transition" title="View on map">
                        <i class="fa-solid fa-map-location-dot"></i> View
                      </button>
                      <button type="button" data-edit-id="${s.id}" class="text-xs bg-brand hover:bg-brand-hover text-white px-2.5 py-1.5 rounded-lg font-medium shadow-md shadow-brand/20 transition" title="Edit this spot">
                        <i class="fa-solid fa-pen-to-square"></i> Edit
                      </button>
                      <button type="button" data-qr-id="${s.id}" class="text-xs bg-[#07192f] hover:bg-[#102d50] text-slate-200 px-2 py-1.5 rounded-lg border border-[#1b3d6a] font-medium transition" title="Vendor QR code">
                        <i class="fa-solid fa-qrcode"></i>
                      </button>
                      <button type="button" data-del-id="${s.id}" class="text-xs bg-red-950/50 hover:bg-red-900/60 text-red-300 px-2 py-1.5 rounded-lg border border-red-500/30 font-medium transition" title="Delete spot">
                        <i class="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>
      `;

      m.classList.remove('hidden');
      m.classList.add('flex');

      $('#myspots-close').onclick = () => FH.closeModal();
      m.onclick = e => { if (e.target === m) FH.closeModal(); };

      const btnEmptyAdd = $('#btn-add-from-empty');
      if (btnEmptyAdd) {
        btnEmptyAdd.onclick = () => {
          FH.closeModal();
          FH.spotModal.open();
        };
      }

      // View handlers
      m.querySelectorAll('[data-view-id]').forEach(btn => {
        btn.onclick = () => {
          const id = btn.dataset.viewId;
          FH.closeModal();
          FH.store.select(id);
          const s = FH.store.get(id);
          if (s) FH.map.focus(s);
        };
      });

      // Edit handlers
      m.querySelectorAll('[data-edit-id]').forEach(btn => {
        btn.onclick = () => {
          const id = btn.dataset.editId;
          const s = FH.store.get(id);
          if (s) {
            FH.closeModal();
            FH.spotModal.open(s);
          }
        };
      });

      // Vendor QR handlers
      m.querySelectorAll('[data-qr-id]').forEach(btn => {
        btn.onclick = () => {
          const s = FH.store.get(btn.dataset.qrId);
          if (s) FH.qr.open(s);
        };
      });

      // Delete handlers
      m.querySelectorAll('[data-del-id]').forEach(btn => {
        btn.onclick = () => {
          const id = btn.dataset.delId;
          const s = FH.store.get(id);
          if (s && confirm(`Are you sure you want to delete "${s.name}"?`)) {
            FH.store.deleteSpot(id);
            FH.toast(`Spot "${s.name}" deleted.`);
            FH.spotModal.openMySpots(user);
          }
        };
      });
    }
  };
})();
