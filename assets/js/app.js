(function () {
  const $ = s => document.querySelector(s);
  const THRESHOLD = FH.VERIFIED_THRESHOLD || 25;

  FH.esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  FH.badge = r => `<span class="rounded-full px-2 py-0.5 text-xs font-bold text-white shadow-sm" style="background:${FH.scoreColor(r)}">${r.toFixed(1)}</span>`;
  FH.toast = m => { const t = $('#toast'); t.textContent = m; t.classList.remove('hidden'); clearTimeout(FH._t); FH._t = setTimeout(() => t.classList.add('hidden'), 3500); };
  let shown = null;
  let deepLinkHandled = false;
  let actionHandled = false;
  let findActionHandled = false;

  function openDeepLink() {
    if (deepLinkHandled) return;
    const cartId = new URLSearchParams(location.search).get('cart');
    if (!cartId) return;
    const spot = FH.store.get(cartId);
    if (!spot) return;
    deepLinkHandled = true;
    FH.store.select(cartId);
    setTimeout(() => FH.map.focus(spot), 450);
  }

  function openAddAction() {
    if (actionHandled) return;
    const params = new URLSearchParams(location.search);
    if (params.get('action') !== 'add') return;
    actionHandled = true;
    try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) { /* file:// */ }
    if (FH.crowd) {
      FH.auth.requireAuth(
        () => FH.crowd.open(),
        'Sign in with your email to add a newly discovered food cart.'
      );
    }
  }

  function openFindAction() {
    if (findActionHandled) return;
    const params = new URLSearchParams(location.search);
    if (params.get('action') !== 'find') return;
    findActionHandled = true;
    try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) { /* file:// */ }
    setTimeout(() => FH.map.findNearMe(), 900);
  }

  function list() {
    const a = FH.store.filtered(), sel = FH.store.S.sel;
    const countStr = FH.num(a.length) + ' ' + (a.length === 1 ? FH.t('spot_single', 'spot') : FH.t('spots_plural', 'spots'));
    $('#count').textContent = countStr;
    if (FH.theme && FH.theme.syncSpotCount) FH.theme.syncSpotCount(a.length);
    $('#list').innerHTML = a.length ? a.map(s => {
      const confs = (s.confirmations && s.confirmations.length) || 0;
      const isVer = confs >= THRESHOLD;
      const hasBooking = Boolean(s.hasBooking);
      const hasDelivery = Boolean(s.delivery && s.delivery !== 'none');
      const photos = s.photos || [];
      const thumb = photos[0] || (FH.gallery && FH.gallery.fallback) || '';
      const dist = FH.geo && FH.geo.distances ? FH.geo.distances[s.id] : null;
      const isOpen = s.status !== 'closed';

      return `<li><button type="button" data-id="${s.id}" class="w-full text-left p-2.5 rounded-xl border flex gap-3 items-center transition ${s.id === sel ? 'bg-[#102d50] border-brand shadow-lg shadow-brand/20 ring-1 ring-brand' : 'bg-[#0c233f] border-[#16365f] hover:bg-[#102d50] hover:border-brand/40'}">
        <!-- Thumbnail with photo count badge -->
        <div class="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-[#07192f] border border-[#1b3d6a]">
          <img src="${thumb}" alt="${FH.esc(s.name)}" class="w-full h-full object-cover" onerror="this.src='${FH.gallery && FH.gallery.fallback}'">
          <span class="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-[9px] px-1 rounded flex items-center gap-0.5 font-mono">
            <i class="fa-solid fa-camera text-[8px] text-brand"></i> ${FH.num(photos.length || 1)}
          </span>
        </div>

        <div class="flex-1 min-w-0">
          <div class="font-semibold text-sm truncate text-white">${FH.esc(s.name)}</div>
          <div class="text-xs text-slate-400 truncate mt-0.5">${FH.esc(FH.t(s.type, s.type))}, ${s.food.map(f => FH.esc(FH.t(f, f))).join(', ')}, ${s.price}</div>
          <div class="flex flex-wrap items-center gap-1.5 mt-1">
            ${isVer
              ? `<span class="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300 bg-emerald-950/70 border border-emerald-500/40 px-1.5 py-0.5 rounded-full" title="${FH.t('spot_confirmed')}"><i class="fa-solid fa-location-dot text-emerald-400"></i> ${FH.t('spot_confirmed', 'Spot Confirmed')} (${FH.num(confs)})</span>`
              : `<span class="inline-flex items-center gap-1 text-[10px] font-medium text-amber-300 bg-amber-950/70 border border-amber-500/40 px-1.5 py-0.5 rounded-full" title="${FH.t('location_pending')}"><i class="fa-regular fa-clock text-amber-400"></i> ${FH.t('location_pending', 'Location Pending')} (${FH.num(confs)}/${FH.num(THRESHOLD)})</span>`
            }
            ${hasBooking
              ? `<span class="inline-flex items-center gap-1 text-[10px] text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-1.5 py-0.5 rounded" title="${FH.t('booking')}"><i class="fa-solid fa-calendar-check text-emerald-400"></i> ${FH.t('booking', 'Booking')}</span>`
              : `<span class="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-[#07192f] border border-[#1b3d6a] px-1.5 py-0.5 rounded" title="${FH.t('no_booking')}"><i class="fa-solid fa-calendar-xmark text-slate-500"></i> ${FH.t('no_booking', 'No Booking')}</span>`
            }
            ${hasDelivery
              ? `<span class="inline-flex items-center gap-1 text-[10px] text-sky-300 bg-sky-950/60 border border-sky-500/40 px-1.5 py-0.5 rounded" title="${FH.t('delivery')}"><i class="fa-solid fa-motorcycle text-sky-400"></i> ${FH.t('delivery', 'Delivery')}</span>`
              : `<span class="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-[#07192f] border border-[#1b3d6a] px-1.5 py-0.5 rounded" title="${FH.t('no_delivery')}"><i class="fa-solid fa-ban text-slate-500"></i> ${FH.t('no_delivery', 'No Delivery')}</span>`
            }
            ${dist != null
              ? `<span class="inline-flex items-center gap-1 text-[10px] text-brand bg-brand/10 border border-brand/30 px-1.5 py-0.5 rounded font-semibold" title="Distance from you"><i class="fa-solid fa-location-arrow"></i> ${FH.geo.label(dist)}</span>`
              : ''
            }
            ${s.hygiene
              ? `<span class="inline-flex items-center gap-1 text-[10px] text-sky-300 bg-sky-950/50 border border-sky-500/30 px-1.5 py-0.5 rounded" title="Average hygiene rating"><i class="fa-solid fa-hands-bubbles"></i> ${Number(s.hygiene).toFixed(1)}</span>`
              : ''
            }
            <span class="inline-flex items-center gap-1 text-[10px] ${isOpen ? 'text-emerald-300 bg-emerald-950/60 border-emerald-500/40' : 'text-rose-300 bg-rose-950/60 border-rose-500/40'} border px-1.5 py-0.5 rounded">
              <i class="fa-solid fa-circle text-[6px]"></i> ${FH.t(isOpen ? 'open_now' : 'closed_now', isOpen ? 'Open' : 'Closed')}
            </span>
          </div>
        </div>

        <div class="shrink-0 flex flex-col items-end gap-1.5">
          ${FH.badge(s.rating)}
          <span data-dir-id="${s.id}" class="w-6 h-6 rounded-md bg-[#07192f] hover:bg-brand text-slate-400 hover:text-white border border-[#1b3d6a] flex items-center justify-center transition cursor-pointer" title="${FH.t('view_directions', 'গাড়ি ও হাঁটার দিকনির্দেশ')}">
            <i class="fa-solid fa-diamond-turn-right text-[10px]"></i>
          </span>
        </div>
      </button></li>`;
    }).join('')
    : `<li class="p-6 text-sm text-slate-400 text-center">${FH.t('no_spots_match', 'No spots match these filters. Clear a filter to see more.')}</li>`;
  }

  function head(s) {
    const confs = (s.confirmations && s.confirmations.length) || 0;
    const isVer = confs >= THRESHOLD;
    const photoCount = (s.photos && s.photos.length) || 0;

    $('#d-head').innerHTML = `
      ${FH.badge(s.rating)}
      <span class="text-sm text-slate-400">${FH.num(s.reviews)} ${FH.t('reviews_count', 'reviews')}</span>
      <span class="text-slate-600">|</span>
      <span class="text-xs ${isVer ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-medium'} flex items-center gap-1">
        <i class="fa-solid ${isVer ? 'fa-certificate text-emerald-400' : 'fa-clock text-amber-400'}"></i>
        ${isVer ? FH.t('spot_confirmed', 'Community Verified') + ' (' + FH.num(confs) + ')' : FH.t('location_pending', 'Pending') + ' (' + FH.num(confs) + '/' + FH.num(THRESHOLD) + ')'}
      </span>
      ${photoCount > 0 ? `
        <span class="text-slate-600">|</span>
        <span class="text-xs text-slate-400 flex items-center gap-1">
          <i class="fa-solid fa-camera text-brand"></i> ${FH.num(photoCount)} ${FH.t('photos_count', 'Photos')}
        </span>
      ` : ''}
    `;
  }

  function renderVerification(s, el) {
    if (!el) return;
    const confs = s.confirmations || [];
    const count = confs.length;
    const isVerified = count >= THRESHOLD;
    const user = FH.auth.getUser();
    const hasConfirmed = user ? confs.includes(user.email) : false;
    const progressPct = isVerified ? 100 : Math.min(100, Math.round((count / THRESHOLD) * 100));
    const isOwner = user && user.email === s.creator;
    const groundScore = Math.min(10, Math.round((count / THRESHOLD) * 10 * 10) / 10);

    el.innerHTML = `
      <div class="fh-verified-card rounded-xl border border-[#1b3d6a] p-3.5 space-y-3 bg-gradient-to-br from-[#0c233f] to-[#07192f]">
        <!-- Header: Physical Spot Existence Verification -->
        <div class="flex items-start justify-between gap-2 border-b border-[#14355f] pb-2.5">
          <div>
            <div class="flex items-center gap-1.5">
              ${isVerified
                ? `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                     <i class="fa-solid fa-location-dot text-emerald-400"></i> ${FH.t('spot_confirmed', 'Ground Presence Confirmed')}
                   </span>`
                : `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40">
                     <i class="fa-solid fa-map-pin text-amber-400"></i> ${FH.t('location_pending', 'Location Verification Pending')}
                   </span>`
              }
            </div>
            <div class="text-[11px] font-bold text-slate-300 mt-1 flex items-center gap-1">
              <span>${FH.t('ground_presence_title', 'ম্যাপে স্পট উপস্থিতি নিশ্চিতকরণ (Ground Presence)')}</span>
            </div>
          </div>
          <div class="text-right shrink-0">
            <div class="text-xs font-semibold text-slate-200 font-mono">
              ${isVerified
                ? `<b class="text-emerald-400 text-sm">${FH.num(count)}</b> <span class="text-slate-400 text-[11px] font-sans font-normal">Confirms (&infin;)</span>`
                : `<b class="text-amber-400">${FH.num(count)}</b> / ${FH.num(THRESHOLD)} Confirms`
              }
            </div>
            <div class="text-[9px] text-slate-400 uppercase font-semibold">Locals Confirmed</div>
          </div>
        </div>

        <!-- Explicit clarification banner: THIS IS NOT A FOOD REVIEW -->
        <div class="bg-blue-950/40 border border-blue-500/30 rounded-xl p-3 text-xs text-blue-200/90 leading-snug space-y-2">
          <div class="font-bold flex items-center justify-between text-blue-300 text-xs">
            <span class="flex items-center gap-1.5"><i class="fa-solid fa-map-pin text-blue-400"></i> ${FH.t('ground_presence_title', 'Ground Presence Verification')}</span>
            <span class="text-[10px] bg-blue-900/60 border border-blue-400/40 px-2 py-0.5 rounded font-mono">${FH.t('ground_presence_badge', 'Location Check')}</span>
          </div>
          <div class="p-2.5 rounded-lg bg-[#07192f]/90 border border-blue-500/30 text-slate-200 text-xs italic font-medium leading-relaxed">
            ${FH.t('ground_presence_note')}
          </div>
          <p class="text-[11px] text-slate-300 leading-relaxed">
            ${FH.t('ground_presence_desc')}
          </p>
        </div>

        <!-- Live Ground Presence Rating (tied directly to 25 confirmations) -->
        <div class="p-3 rounded-xl bg-[#07192f] border border-[#1b3d6a] space-y-2">
          <div class="flex items-center justify-between">
            <div>
              <span class="text-xs font-bold text-white flex items-center gap-1.5">
                <i class="fa-solid fa-award text-amber-400"></i> ${FH.t('ground_presence_rating', 'Ground Presence Rating')}
              </span>
              <span class="text-[10px] text-slate-400 block mt-0.5">${FH.t('ground_rating_sub')}</span>
            </div>
            <div class="text-right">
              <div class="text-base font-black ${isVerified ? 'text-emerald-400' : 'text-amber-400'} font-mono">
                ${FH.num(groundScore.toFixed(1))} <span class="text-xs text-slate-400 font-medium font-sans">/ ${FH.num('10.0')}</span>
              </div>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded ${isVerified ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-amber-950 text-amber-300 border border-amber-500/40'}">
                ${FH.num(count)}/${FH.num(THRESHOLD)} Confirmed
              </span>
            </div>
          </div>

          <div class="w-full bg-[#143054] h-2 rounded-full overflow-hidden">
            <div class="h-full ${isVerified ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-amber-500 to-emerald-400'} rounded-full transition-all duration-300" style="width: ${progressPct}%"></div>
          </div>

          <div class="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>0</span>
            <span>25 Min</span>
            <span>Unlimited &infin;</span>
          </div>
        </div>

        <p class="text-xs text-slate-300 leading-relaxed">
          ${isVerified
            ? `<i class="fa-solid fa-circle-check text-emerald-400 mr-1"></i>${FH.t('ground_verified_msg').replace('{count}', `<b>${FH.num(count)}</b>`)}`
            : `<i class="fa-solid fa-circle-info text-amber-400 mr-1"></i>${FH.t('ground_unverified_msg').replace('{remaining}', `<b>${FH.num(THRESHOLD - count)}</b>`)}`
          }
        </p>

        <!-- Action Button -->
        <div>
          ${hasConfirmed
            ? `<button id="btn-toggle-confirm" type="button" class="w-full rounded-xl bg-[#0f2d52] hover:bg-[#143966] border border-emerald-500/50 text-emerald-300 py-2.5 px-3 text-xs md:text-sm font-semibold flex items-center justify-center gap-2 transition active:scale-[0.98]">
                 <i class="fa-solid fa-check-double text-emerald-400"></i> ${FH.t('confirm_btn_done')}
               </button>`
            : `<button id="btn-toggle-confirm" type="button" class="w-full rounded-xl bg-brand hover:bg-brand-hover text-white py-2.5 px-3 text-xs md:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand/20 transition active:scale-[0.98]">
                 <i class="fa-solid fa-map-location-dot"></i> ${user ? FH.t('confirm_btn_action') : FH.t('confirm_btn_login')}
               </button>`
          }
        </div>

        <!-- Direct trigger for Separate Food & Hygiene Reviews -->
        <div class="bg-[#07192f]/70 border border-[#14355f] rounded-xl p-2.5 flex items-center justify-between text-xs gap-2">
          <div class="text-[11px] text-slate-300 flex items-center gap-1.5">
            <i class="fa-solid fa-utensils text-amber-400"></i>
            <span>${FH.t('separate_review_prompt', 'খাবারের স্বাদ ও পরিচ্ছন্নতার আলাদা রিভিউ:')}</span>
          </div>
          <button id="btn-open-review-from-verif" type="button" class="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-lg font-bold text-xs shrink-0 inline-flex items-center gap-1.5 transition active:scale-95">
            <i class="fa-solid fa-star text-amber-400"></i>
            <span>${FH.t('give_food_review', 'খাবার রিভিউ দিন')}</span>
          </button>
        </div>

        <!-- Confirmed Users list -->
        ${count > 0 ? `
          <details class="text-xs text-slate-400 pt-1 border-t border-[#1b3d6a]">
            <summary class="cursor-pointer hover:text-white font-medium select-none flex items-center justify-between py-1">
              <span><i class="fa-solid fa-users text-slate-500 mr-1"></i> Confirmed by ${count} foodie${count === 1 ? '' : 's'} (No limit)</span>
              <span class="text-[10px] text-slate-500">View list &blacktriangledown;</span>
            </summary>
            <div class="mt-2 max-h-32 overflow-y-auto space-y-1 bg-[#07192f] p-2.5 rounded-lg border border-[#1b3d6a] text-[11px]">
              ${confs.map(email => `
                <div class="flex items-center justify-between py-0.5 text-slate-300">
                  <span class="flex items-center gap-1.5 truncate">
                    <i class="fa-solid fa-circle-check text-emerald-400 text-[10px]"></i>
                    <span class="font-mono text-xs text-slate-200">${FH.esc(email)}</span>
                  </span>
                  ${email === s.creator ? '<span class="text-[9px] bg-brand/20 text-brand border border-brand/30 px-1.5 py-0.5 rounded font-medium ml-2 shrink-0">Creator</span>' : ''}
                </div>
              `).join('')}
            </div>
          </details>
        ` : ''}

        ${s.creator && s.creator !== 'system' ? `
          <div class="text-[11px] text-slate-400 flex items-center justify-between pt-1">
            <span>Added by: <b class="text-slate-200">${FH.esc(s.creator)}</b></span>
            ${isOwner ? `
              <button id="btn-edit-from-verif" type="button" class="text-brand hover:text-brand-hover hover:underline font-semibold flex items-center gap-1">
                <i class="fa-solid fa-pen-to-square"></i> Edit Spot
              </button>
            ` : ''}
          </div>
        ` : ''}
      </div>
    `;

    const btnConfirm = el.querySelector('#btn-toggle-confirm');
    if (btnConfirm) {
      btnConfirm.onclick = () => {
        const u = FH.auth.getUser();
        if (!u) {
          FH.auth.openAuthModal(loggedInUser => {
            FH.store.confirmSpot(s.id, loggedInUser.email);
            FH.toast(`Confirmed! You verified "${s.name}".`);
          }, `Sign in with your Email to confirm "${s.name}". An account is required to verify spots.`);
          return;
        }

        if (hasConfirmed) {
          FH.store.unconfirmSpot(s.id, u.email);
          FH.toast(`Confirmation removed for "${s.name}".`);
        } else {
          FH.store.confirmSpot(s.id, u.email);
          const newCount = (s.confirmations || []).length;
          if (newCount === THRESHOLD) {
            FH.toast(`🎉 Hooray! "${s.name}" reached the lower limit of 25 confirmations and is now officially Community Verified!`);
          } else {
            FH.toast(`Thank you! You confirmed "${s.name}" (${newCount} total confirmations).`);
          }
        }
      };
    }

    const btnOpenRevFromVerif = el.querySelector('#btn-open-review-from-verif');
    if (btnOpenRevFromVerif) {
      btnOpenRevFromVerif.onclick = () => FH.reviews.openModal(s);
    }

    const editFromVerif = el.querySelector('#btn-edit-from-verif');
    if (editFromVerif) {
      editFromVerif.onclick = () => FH.spotModal.open(s);
    }
  }

  function openDetail(s) {
    const user = FH.auth.getUser();
    const canEdit = user && user.email === s.creator;

    $('#detail').innerHTML = `
      <div class="sticky top-0 bg-[#07192f]/95 backdrop-blur border-b border-[#14355f] p-4 flex items-start gap-3 z-10">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <h2 class="font-bold text-lg text-white truncate">${FH.esc(s.name)}</h2>
            <button id="btn-write-review-header" type="button" class="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition shrink-0 active:scale-95" title="${FH.t('review_food', 'Write a food review')}">
              <i class="fa-solid fa-star text-amber-400"></i> ${FH.t('review_food', 'Review Food')}
            </button>
            <button id="btn-qr-spot-header" type="button" class="text-xs bg-[#0c233f] hover:bg-[#102d50] text-slate-200 border border-[#1b3d6a] hover:border-brand px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition shrink-0" title="Share cart / vendor QR code">
              <i class="fa-solid fa-qrcode"></i> QR
            </button>
            ${canEdit ? `
              <button id="btn-edit-spot-header" type="button" class="text-xs bg-brand/10 hover:bg-brand/20 text-brand border border-brand/30 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition shrink-0" title="${FH.t('edit_spot', 'Edit this spot')}">
                <i class="fa-solid fa-pen-to-square"></i> ${FH.t('edit_spot', 'Edit')}
              </button>
            ` : ''}
          </div>
          <p class="text-xs text-slate-400">${FH.esc(FH.t(s.type, s.type))}, ${(s.food || []).map(f => FH.esc(FH.t(f, f))).join(', ')}, ${s.price}</p>
        </div>
        <button id="dx" type="button" aria-label="Close details" class="text-2xl leading-none px-2 text-slate-400 hover:text-white">&times;</button>
      </div>
      <div class="p-4 space-y-4 text-white">
        <!-- Route from the visitor's current location (Google Maps style) -->
        <button id="btn-directions" type="button" class="w-full flex items-center justify-between gap-2 rounded-xl border border-brand/40 bg-gradient-to-r from-brand/15 to-[#0c233f] hover:border-brand px-3.5 py-3 text-left transition shadow-md group active:scale-[0.99]" title="Google Maps style directions">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-brand text-white flex items-center justify-center shadow-md shadow-brand/30 group-hover:scale-105 transition">
              <i class="fa-solid fa-diamond-turn-right text-base"></i>
            </div>
            <div>
              <div class="text-white text-sm font-bold flex items-center gap-2">
                <span>${FH.t('view_directions', 'গাড়ি ও হাঁটার দিকনির্দেশনা')}</span>
              </div>
              <div class="text-[11px] font-medium text-slate-400 flex items-center gap-2 mt-0.5">
                <span class="text-sky-400"><i class="fa-solid fa-car text-[10px] mr-1"></i>${FH.t('driving_mode', 'গাড়ি')}</span>
                <span class="text-slate-600">•</span>
                <span class="text-emerald-400"><i class="fa-solid fa-person-walking text-[10px] mr-1"></i>${FH.t('walking_mode', 'হাঁটা')}</span>
              </div>
            </div>
          </div>
          <span class="text-xs font-bold text-brand bg-brand/10 border border-brand/30 rounded-lg px-2.5 py-1 flex items-center gap-1 group-hover:bg-brand group-hover:text-white transition">
            <i class="fa-solid fa-route"></i>
            <span>${FH.t('directions', 'রুট')}</span>
          </span>
        </button>

        <!-- Interactive 3-5 Photo Gallery -->
        <div id="spot-gallery"></div>

        <div id="d-head" class="flex items-center gap-2"></div>
        <p class="text-sm text-slate-300 leading-relaxed">${FH.esc(s.about)}</p>

        <!-- Verification & Confirmation Section -->
        <div id="verif-card"></div>

        <!-- 1-5 star reviews + hygiene rating placed directly under verif-card -->
        <div id="reviews"></div>

        <!-- Live Open / Closed status (vendor toggle) -->
        <div id="live-status"></div>

        <!-- Facilities & Services Info (Booking & Delivery) -->
        <div class="space-y-2">
          <div class="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <i class="fa-solid fa-bell-concierge text-brand"></i> ${FH.t('facilities_and_services', 'Facilities & Services (সুযোগ-সুবিধা)')}
          </div>
          <div id="bk"></div>
          <div id="dl"></div>
        </div>

        <div id="chat"></div>
      </div>`;

    $('#detail').classList.add('open');
    $('#dx').onclick = () => FH.store.select(null);

    const btnWriteReview = $('#btn-write-review-header');
    if (btnWriteReview) {
      btnWriteReview.onclick = () => FH.reviews.openModal(s);
    }

    const btnEditHeader = $('#btn-edit-spot-header');
    if (btnEditHeader) {
      btnEditHeader.onclick = () => FH.spotModal.open(s);
    }

    const btnQrHeader = $('#btn-qr-spot-header');
    if (btnQrHeader) {
      btnQrHeader.onclick = () => FH.qr.open(s);
    }

    const btnDirections = $('#btn-directions');
    if (btnDirections && FH.directions) {
      btnDirections.onclick = () => FH.directions.open(s);
    }

    if (FH.gallery) FH.gallery.mount(s, $('#spot-gallery'));
    renderVerification(s, $('#verif-card'));
    if (FH.reviews) FH.reviews.mount(s, $('#reviews'));
    if (FH.status) FH.status.mount(s, $('#live-status'));
    if (FH.reviews) FH.reviews.mount(s, $('#reviews'));
    FH.booking.mount(s, $('#bk'));
    FH.delivery.render(s, $('#dl'));
    FH.community.feed(s.id);
  }

  function sync() {
    list();
    FH.map.render(FH.store.filtered());
    FH.auth.renderHeader($('#auth-header'));
    const s = FH.store.get(FH.store.S.sel);
    if (!s) { $('#detail').classList.remove('open'); shown = null; return; }
    if (shown !== s.id) { shown = s.id; openDetail(s); FH.map.focus(s); }
    head(s);
    if (FH.gallery) FH.gallery.mount(s, $('#spot-gallery'));
    renderVerification(s, $('#verif-card'));
    if (FH.reviews) FH.reviews.mount(s, $('#reviews'));
    if (FH.status) FH.status.mount(s, $('#live-status'));
    FH.booking.mount(s, $('#bk'));
    FH.delivery.render(s, $('#dl'));
    FH.community.feed(s.id);
  }

  window.FH_reopenSelectedModal = function () {
    const s = FH.store.get(FH.store.S.sel);
    if (s && $('#detail').classList.contains('open')) {
      openDetail(s);
      head(s);
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    if (FH.i18n && typeof FH.i18n.init === 'function') FH.i18n.init();
    if (FH.theme && typeof FH.theme.init === 'function') FH.theme.init();
    FH.map.init();
    if (FH.pwa) FH.pwa.init();

    FH.filters.mount($('#filters'));
    $('#list').onclick = e => {
      const dirBtn = e.target.closest('[data-dir-id]');
      if (dirBtn) {
        e.stopPropagation();
        const spot = FH.store.get(dirBtn.dataset.dirId);
        if (spot && FH.directions) {
          FH.store.select(spot.id);
          FH.directions.open(spot);
        }
        return;
      }
      const b = e.target.closest('[data-id]');
      if (b) FH.store.select(b.dataset.id);
    };
    $('#btn-add-spot').onclick = () => {
      FH.auth.requireAuth(() => FH.spotModal.open(), "Please sign in with your email to add a new food spot.");
    };

    const nearBtn = $('#btn-find-near');
    if (nearBtn) nearBtn.onclick = () => FH.map.findNearMe();

    const quickAddBtn = $('#btn-quick-add');
    if (quickAddBtn) {
      quickAddBtn.onclick = () => {
        FH.auth.requireAuth(
          () => FH.crowd.open(),
          'Sign in with your email to add a newly discovered food cart to the map.'
        );
      };
    }

    FH.store.on(sync);
    sync();
    openDeepLink();
    openAddAction();
    openFindAction();

    // Load persisted carts from FastAPI, then retry any cart deep link.
    if (FH.db && typeof FH.db.init === 'function') {
      FH.db.init().then(() => {
        sync();
        openDeepLink();
        openAddAction();
      });
    }

    // QR scans can land before the map engine has finished booting.
    setTimeout(openDeepLink, 1500);

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && $('#modal').classList.contains('hidden')) {
        FH.store.select(null);
      }
    });
  });
})();
