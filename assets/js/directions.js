/* ============================================================
   Google Maps-Style Directions & Live Routing Engine (Driving & Walking)
   ------------------------------------------------------------
   Provides real-time road routing (driving) and pedestrian paths (walking)
   using OSRM routers with turn-by-turn navigation steps and
   immediate fallback presets for Dhaka neighborhoods.
   ============================================================ */
(function () {
  window.FH = window.FH || {};

  const OSRM_DRIVING_URL = 'https://router.project-osrm.org/route/v1/driving/';
  const OSRM_WALKING_URL = 'https://routing.openstreetmap.de/routed-foot/route/v1/driving/';

  const DHAKA_PRESETS = {
    gps: { name: 'My Current Location (GPS)', bn: 'আমার বর্তমান লোকেশন (GPS)' },
    dhanmondi: { name: 'Dhanmondi 27', bn: 'ধানমন্ডি ২৭', lat: 23.7533, lng: 90.3768 },
    gulshan: { name: 'Gulshan-2 Circle', bn: 'গুলশান-২ সার্কেল', lat: 23.7925, lng: 90.4152 },
    banani: { name: 'Banani 11', bn: 'বনানী ১১', lat: 23.7937, lng: 90.4046 },
    uttara: { name: 'Uttara Sector 3', bn: 'উত্তরা সেক্টর ৩', lat: 23.8683, lng: 90.3986 },
    old_dhaka: { name: 'Old Dhaka (Nazira Bazar)', bn: 'পুরান ঢাকা (নাজিরা বাজার)', lat: 23.7188, lng: 90.4041 },
    mirpur: { name: 'Mirpur-10 Circle', bn: 'মিরপুর-১০ গোলচত্বর', lat: 23.8069, lng: 90.3687 },
    shahbagh: { name: 'Shahbagh Square', bn: 'শাহবাগ চত্বর', lat: 23.7383, lng: 90.3957 },
    khilgaon: { name: 'Khilgaon Taltola', bn: 'খিলগাঁও তালতলা', lat: 23.7511, lng: 90.4225 },
    bashundhara: { name: 'Bashundhara Gate', bn: 'বসুন্ধরা গেট', lat: 23.8189, lng: 90.4285 }
  };

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  let activeSpot = null;
  let currentMode = 'driving'; // 'driving' or 'walking'
  let currentOriginKey = 'gps';
  let userGeoCache = null;
  let activeRequestId = 0;
  let isStepsOpen = false;

  function isBn() {
    return FH.i18n && typeof FH.i18n.getLang === 'function' && FH.i18n.getLang() === 'bn';
  }

  function formatTime(seconds) {
    if (!isFinite(seconds) || seconds <= 0) return '';
    const mins = Math.max(1, Math.round(seconds / 60));
    if (mins < 60) {
      return isBn() ? `${FH.num(mins)} মিনিট` : `${mins} min`;
    }
    const hours = Math.floor(mins / 60);
    const rest = mins % 60;
    if (isBn()) {
      return rest ? `${FH.num(hours)} ঘণ্টা ${FH.num(rest)} মি.` : `${FH.num(hours)} ঘণ্টা`;
    }
    return rest ? `${hours} hr ${rest} min` : `${hours} hr`;
  }

  function formatDist(meters) {
    if (!isFinite(meters) || meters <= 0) return '';
    if (meters < 1000) {
      const m = Math.round(meters);
      return isBn() ? `${FH.num(m)} মিটার` : `${m} m`;
    }
    const km = (meters / 1000).toFixed(1);
    return isBn() ? `${FH.num(km)} কিমি` : `${km} km`;
  }

  function getStepInstruction(step, isWalking, destName) {
    const maneuver = step.maneuver || {};
    const type = maneuver.type || 'turn';
    const modifier = (maneuver.modifier || '').toLowerCase();
    const street = (step.name || '').trim();
    const bn = isBn();

    if (type === 'depart') {
      if (street) {
        return bn ? `${street} ধরে যাত্রা শুরু করুন` : `Head out on ${street}`;
      }
      return bn ? 'যাত্রা শুরু করুন' : 'Head out toward destination';
    }

    if (type === 'arrive') {
      return bn
        ? `গন্তব্যে পৌঁছে গেছেন: ${destName || 'স্পট'}`
        : `Arrive at ${destName || 'destination'}`;
    }

    if (type === 'roundabout' || type === 'rotary') {
      return bn ? 'গোলচত্বর অতিক্রম করুন' : 'Enter the roundabout';
    }

    if (modifier.includes('uturn')) {
      return bn ? 'ইউ-টার্ন (U-turn) নিন' : 'Make a U-turn';
    }

    const actionText = isWalking
      ? (bn ? 'হাঁটুন' : 'Walk')
      : (bn ? 'মোড় নিন' : 'Turn');

    let dirTextEn = 'Continue';
    let dirTextBn = 'সোজা চলুন';

    if (modifier.includes('slight right')) {
      dirTextEn = 'Slight right';
      dirTextBn = 'সামান্য ডানে মোড় নিন';
    } else if (modifier.includes('sharp right')) {
      dirTextEn = 'Sharp right';
      dirTextBn = 'তীব্র ডানে মোড় নিন';
    } else if (modifier.includes('right')) {
      dirTextEn = 'Turn right';
      dirTextBn = 'ডানে মোড় নিন';
    } else if (modifier.includes('slight left')) {
      dirTextEn = 'Slight left';
      dirTextBn = 'সামান্য বাঁয়ে মোড় নিন';
    } else if (modifier.includes('sharp left')) {
      dirTextEn = 'Sharp left';
      dirTextBn = 'তীব্র বাঁয়ে মোড় নিন';
    } else if (modifier.includes('left')) {
      dirTextEn = 'Turn left';
      dirTextBn = 'বাঁয়ে মোড় নিন';
    } else if (modifier.includes('straight')) {
      dirTextEn = 'Continue straight';
      dirTextBn = 'সোজা এগিয়ে চলুন';
    }

    if (street) {
      return bn ? `${dirTextBn}: ${street}` : `${dirTextEn} onto ${street}`;
    }
    return bn ? dirTextBn : dirTextEn;
  }

  function getStepIcon(step) {
    const maneuver = step.maneuver || {};
    const type = maneuver.type || '';
    const modifier = (maneuver.modifier || '').toLowerCase();

    if (type === 'depart') return 'fa-solid fa-circle-dot text-brand';
    if (type === 'arrive') return 'fa-solid fa-location-dot text-rose-500';
    if (type === 'roundabout' || type === 'rotary') return 'fa-solid fa-rotate-right text-amber-400';
    if (modifier.includes('uturn')) return 'fa-solid fa-arrow-rotate-left text-amber-400';
    if (modifier.includes('right')) return 'fa-solid fa-arrow-turn-right text-sky-400';
    if (modifier.includes('left')) return 'fa-solid fa-arrow-turn-left text-sky-400';
    return 'fa-solid fa-arrow-up text-slate-300';
  }

  async function resolveOriginCoords(key) {
    if (key !== 'gps') {
      const p = DHAKA_PRESETS[key];
      if (p && p.lat && p.lng) return { lat: p.lat, lng: p.lng, name: isBn() ? p.bn : p.name };
    }

    // Try user GPS
    if (userGeoCache) return userGeoCache;
    if (FH.geo && FH.geo.user) {
      userGeoCache = { lat: FH.geo.user.lat, lng: FH.geo.user.lng, name: 'My Location' };
      return userGeoCache;
    }

    if (!navigator.geolocation) {
      console.warn('[FH.directions] Geolocation not supported, falling back to Dhanmondi');
      return { lat: 23.7533, lng: 90.3768, name: 'Dhanmondi' };
    }

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        console.warn('[FH.directions] GPS timeout, fallback to Dhanmondi');
        resolve({ lat: 23.7533, lng: 90.3768, name: 'Dhanmondi' });
      }, 4500);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(timer);
          userGeoCache = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            name: isBn() ? 'আমার অবস্থান' : 'My Location'
          };
          if (FH.geo) FH.geo.user = { lat: userGeoCache.lat, lng: userGeoCache.lng };
          resolve(userGeoCache);
        },
        (err) => {
          clearTimeout(timer);
          console.warn('[FH.directions] GPS denied or failed:', err);
          resolve({ lat: 23.7533, lng: 90.3768, name: 'Dhanmondi' });
        },
        { enableHighAccuracy: true, timeout: 4000, maximumAge: 60000 }
      );
    });
  }

  async function fetchRoute(from, to, mode) {
    const isWalking = mode === 'walking';
    const primaryUrl = isWalking ? OSRM_WALKING_URL : OSRM_DRIVING_URL;

    // Helper for fetch with timeout
    async function queryOsrm(baseUrl) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 6500);
      try {
        const url = `${baseUrl}${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson&steps=true&annotations=false`;
        const res = await fetch(url, { signal: ctrl.signal });
        if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`);
        const data = await res.json();
        const route = data && data.routes && data.routes[0];
        const coords = route && route.geometry && route.geometry.coordinates;
        if (!coords || coords.length < 2) throw new Error('Empty route geometry');
        return {
          mode,
          distance: route.distance,
          duration: route.duration,
          coords: coords.map(([lng, lat]) => ({ lat, lng })),
          steps: (route.legs && route.legs[0] && route.legs[0].steps) || []
        };
      } finally {
        clearTimeout(timer);
      }
    }

    try {
      return await queryOsrm(primaryUrl);
    } catch (err) {
      console.warn(`[FH.directions] Primary router failed (${mode}):`, err);
      if (isWalking) {
        // Fallback: query driving router and adjust pace for walking
        try {
          const drivingRes = await queryOsrm(OSRM_DRIVING_URL);
          // Walking speed: ~1.33 meters/second (~4.8 km/h)
          drivingRes.mode = 'walking';
          drivingRes.duration = Math.round(drivingRes.distance / 1.33);
          return drivingRes;
        } catch (subErr) {
          console.warn('[FH.directions] Driving fallback also failed:', subErr);
        }
      }

      // Straight direct line if completely offline or blocked
      const dist = FH.geo && FH.geo.distanceKm ? FH.geo.distanceKm(from, to) * 1000 : 3000;
      return {
        mode,
        isDirect: true,
        distance: dist,
        duration: isWalking ? Math.round(dist / 1.33) : Math.round((dist / 1000) * 180),
        coords: [from, to],
        steps: [
          { maneuver: { type: 'depart' }, name: isBn() ? 'সরাসরি রুট' : 'Direct line', distance: dist },
          { maneuver: { type: 'arrive' }, name: to.name || '', distance: 0 }
        ]
      };
    }
  }

  function renderStepsList(steps, isWalking, destName) {
    const listEl = $('#route-steps-list');
    const countEl = $('#route-steps-count');
    if (!listEl) return;

    if (!steps || !steps.length) {
      listEl.innerHTML = `<div class="py-2 text-slate-400 text-center">${isBn() ? 'কোনো ধাপ পাওয়া যায়নি' : 'No steps available'}</div>`;
      if (countEl) countEl.textContent = '0';
      return;
    }

    const filtered = steps.filter((st, idx) => {
      // Keep depart, arrive, or steps with distance > 0
      return idx === 0 || idx === steps.length - 1 || (st.distance && st.distance > 5);
    });

    if (countEl) countEl.textContent = FH.num(filtered.length);

    listEl.innerHTML = filtered.map((st, idx) => {
      const icon = getStepIcon(st);
      const text = getStepInstruction(st, isWalking, destName);
      const dist = formatDist(st.distance);

      return `
        <div class="py-2 flex items-start gap-2.5">
          <div class="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center shrink-0 mt-0.5 border border-slate-700">
            <i class="${icon} text-[10px]"></i>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-slate-200 font-medium leading-tight">${FH.esc(text)}</p>
            ${dist ? `<span class="text-[10px] text-slate-400 font-mono mt-0.5 inline-block">${dist}</span>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  function updatePanelUI(spot, from, route) {
    const panel = $('#route-panel');
    if (!panel) return;

    // Dest name
    const destNameEl = $('#route-dest-name');
    if (destNameEl) destNameEl.textContent = spot.name || 'Restaurant';

    // Stats
    const etaEl = $('#route-eta');
    const distEl = $('#route-distance');
    const modeBadge = $('#route-mode-badge');
    const taglineEl = $('#route-tagline');

    const isWalking = currentMode === 'walking';

    if (etaEl) {
      etaEl.textContent = formatTime(route.duration) || (isBn() ? 'হিসাবকৃত' : 'Ready');
    }
    if (distEl) {
      distEl.textContent = `(${formatDist(route.distance)})`;
    }

    if (modeBadge) {
      if (isWalking) {
        modeBadge.className = 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20';
        modeBadge.innerHTML = `<i class="fa-solid fa-person-walking mr-1"></i> ${isBn() ? 'হাঁটার পথ' : 'Walking'}`;
      } else {
        modeBadge.className = 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand/10 text-brand border border-brand/20';
        modeBadge.innerHTML = `<i class="fa-solid fa-car mr-1"></i> ${isBn() ? 'ড্রাইভিং' : 'Driving'}`;
      }
    }

    if (taglineEl) {
      if (route.isDirect) {
        taglineEl.textContent = isBn() ? 'সরাসরি রেখা (লাইভ রুট ড্রয়িং সীমা)' : 'Direct line preview';
      } else if (isWalking) {
        taglineEl.textContent = isBn() ? 'হাঁটা ও পথচারী ফুটপাত রুট' : 'Pedestrian & sidewalk route';
      } else {
        taglineEl.textContent = isBn() ? 'সবচেয়ে দ্রুত ও সুবিধাজনক সড়ক রুট' : 'Fastest driving route now';
      }
    }

    // Steps list
    renderStepsList(route.steps, isWalking, spot.name);

    // Google Maps outbound link
    const gmapsLink = $('#route-google');
    if (gmapsLink) {
      const travelMode = isWalking ? 'walking' : 'driving';
      gmapsLink.href = `https://www.google.com/maps/dir/?api=1&origin=${from.lat},${from.lng}&destination=${spot.lat},${spot.lng}&travelmode=${travelMode}`;
    }

    // Update Mode tabs visual state
    $$('.route-mode-btn').forEach((btn) => {
      const mode = btn.dataset.mode;
      const active = mode === currentMode;
      btn.className = active
        ? 'route-mode-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition bg-brand text-white shadow-sm'
        : 'route-mode-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition text-slate-400 hover:text-white';
    });

    panel.classList.remove('hidden');
  }

  function setRouteLoading(isLoading) {
    const etaEl = $('#route-eta');
    if (!etaEl) return;
    if (isLoading) {
      etaEl.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-sm text-brand mr-1"></i> ${isBn() ? 'রুট খোঁজা হচ্ছে...' : 'Routing...'}`;
    }
  }

  async function calculateAndDisplay(spot, mode, originKey) {
    if (!spot || !isFinite(Number(spot.lat)) || !isFinite(Number(spot.lng))) return;

    const reqId = ++activeRequestId;
    activeSpot = spot;
    currentMode = mode || currentMode;
    currentOriginKey = originKey || currentOriginKey;

    setRouteLoading(true);

    try {
      const mapApi = await FH.map.init();
      if (!mapApi) throw new Error('Map is not ready');

      const from = await resolveOriginCoords(currentOriginKey);
      if (reqId !== activeRequestId) return;

      const to = { lat: Number(spot.lat), lng: Number(spot.lng), name: spot.name };

      // Plot user/origin marker
      if (FH.map.showUser) FH.map.showUser(from);

      // Fetch route geometry and steps
      const route = await fetchRoute(from, to, currentMode);
      if (reqId !== activeRequestId) return;

      // Draw route on map
      FH.map.clearRoute();
      FH.map.drawRoute(route.coords, {
        mode: currentMode,
        isWalking: currentMode === 'walking'
      });

      // Fit map bounds
      const isMobile = window.matchMedia && window.matchMedia('(max-width: 767px)').matches;
      FH.map.fit(route.coords, {
        maxZoom: 16,
        padding: isMobile
          ? { top: 220, right: 30, bottom: 60, left: 30 }
          : { top: 80, right: 460, bottom: 80, left: 390 }
      });

      // Render updated Directions card
      updatePanelUI(spot, from, route);

      // On mobile, close detail drawer so route is immediately front and center
      if (isMobile) {
        setTimeout(() => {
          const detail = $('#detail');
          if (detail && detail.classList.contains('open')) {
            detail.classList.remove('open');
          }
        }, 300);
      }
    } catch (err) {
      console.error('[FH.directions] Error calculating route:', err);
      FH.toast(isBn() ? 'রুট তৈরি করতে সমস্যা হয়েছে, সংযোগ পরীক্ষা করুন।' : 'Could not build route. Please try again.');
    } finally {
      if (reqId === activeRequestId) setRouteLoading(false);
    }
  }

  FH.directions = {
    open(spot, mode) {
      if (!spot) return;
      calculateAndDisplay(spot, mode || currentMode, currentOriginKey);
    },

    setMode(mode) {
      if (mode === currentMode) return;
      currentMode = mode;
      if (activeSpot) {
        calculateAndDisplay(activeSpot, currentMode, currentOriginKey);
      }
    },

    setOrigin(key) {
      currentOriginKey = key;
      if (activeSpot) {
        calculateAndDisplay(activeSpot, currentMode, currentOriginKey);
      }
    },

    toggleSteps() {
      isStepsOpen = !isStepsOpen;
      const list = $('#route-steps-list');
      const chev = $('#route-steps-chevron');
      if (list) list.classList.toggle('hidden', !isStepsOpen);
      if (chev) {
        chev.className = isStepsOpen
          ? 'fa-solid fa-chevron-up text-brand text-[11px] transition-transform duration-200'
          : 'fa-solid fa-chevron-down text-slate-400 text-[11px] transition-transform duration-200';
      }
    },

    close() {
      activeRequestId++;
      activeSpot = null;
      const panel = $('#route-panel');
      if (panel) panel.classList.add('hidden');
      if (FH.map) FH.map.clearRoute();
    },

    get spot() {
      return activeSpot;
    },

    get mode() {
      return currentMode;
    }
  };

  // Bind DOM Event listeners
  document.addEventListener('DOMContentLoaded', () => {
    // Mode switcher buttons
    const btnDriving = $('#route-mode-driving');
    const btnWalking = $('#route-mode-walking');

    if (btnDriving) {
      btnDriving.onclick = () => FH.directions.setMode('driving');
    }
    if (btnWalking) {
      btnWalking.onclick = () => FH.directions.setMode('walking');
    }

    // Origin selector dropdown
    const originSelect = $('#route-origin-select');
    if (originSelect) {
      originSelect.onchange = (e) => {
        FH.directions.setOrigin(e.target.value);
      };
    }

    // Turn-by-turn accordion toggle
    const stepsToggle = $('#route-steps-toggle');
    if (stepsToggle) {
      stepsToggle.onclick = () => FH.directions.toggleSteps();
    }

    // Close button
    const closeBtn = $('#route-close');
    if (closeBtn) {
      closeBtn.onclick = () => FH.directions.close();
    }
  });
})();
