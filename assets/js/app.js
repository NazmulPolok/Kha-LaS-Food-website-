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
    $('#count').textContent = a.length + (a.length === 1 ? ' spot' : ' spots');
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
            <i class="fa-solid fa-camera text-[8px] text-brand"></i> ${photos.length || 1}
          </span>
        </div>

        <div class="flex-1 min-w-0">
          <div class="font-semibold text-sm truncate text-white">${FH.esc(s.name)}</div>
          <div class="text-xs text-slate-400 truncate mt-0.5">${FH.esc(s.type)}, ${s.food.map(FH.esc).join(', ')}, ${s.price}</div>
          <div class="flex flex-wrap items-center gap-1.5 mt-1">
            ${isVer
              ? `<span class="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300 bg-emerald-950/70 border border-emerald-500/40 px-1.5 py-0.5 rounded-full"><i class="fa-solid fa-certificate text-emerald-400"></i> Verified (${confs})</span>`
              : `<span class="inline-flex items-center gap-1 text-[10px] font-medium text-amber-300 bg-amber-950/70 border border-amber-500/40 px-1.5 py-0.5 rounded-full"><i class="fa-regular fa-clock text-amber-400"></i> Pending (${confs}/${THRESHOLD})</span>`
            }
            ${hasBooking
              ? `<span class="inline-flex items-center gap-1 text-[10px] text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-1.5 py-0.5 rounded" title="Table Booking Available"><i class="fa-solid fa-calendar-check text-emerald-400"></i> Booking</span>`
              : `<span class="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-[#07192f] border border-[#1b3d6a] px-1.5 py-0.5 rounded" title="No Table Booking (Walk-in only)"><i class="fa-solid fa-calendar-xmark text-slate-500"></i> No Booking</span>`
            }
            ${hasDelivery
              ? `<span class="inline-flex items-center gap-1 text-[10px] text-sky-300 bg-sky-950/60 border border-sky-500/40 px-1.5 py-0.5 rounded" title="Delivery Available"><i class="fa-solid fa-motorcycle text-sky-400"></i> Delivery</span>`
              : `<span class="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-[#07192f] border border-[#1b3d6a] px-1.5 py-0.5 rounded" title="No Delivery (Dine-in only)"><i class="fa-solid fa-ban text-slate-500"></i> No Delivery</span>`
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
              <i class="fa-solid fa-circle text-[6px]"></i> ${isOpen ? 'Open' : 'Closed'}
            </span>
          </div>
        </div>

        <div class="shrink-0 flex flex-col items-end">
          ${FH.badge(s.rating)}
        </div>
      </button></li>`;
    }).join('')
    : '<li class="p-6 text-sm text-slate-400 text-center">No spots match these filters. Clear a filter to see more.</li>';
  }

  function head(s) {
    const confs = (s.confirmations && s.confirmations.length) || 0;
    const isVer = confs >= THRESHOLD;
    const photoCount = (s.photos && s.photos.length) || 0;

    $('#d-head').innerHTML = `
      ${FH.badge(s.rating)}
      <span class="text-sm text-slate-400">${s.reviews} reviews</span>
      <span class="text-slate-600">|</span>
      <span class="text-xs ${isVer ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-medium'} flex items-center gap-1">
        <i class="fa-solid ${isVer ? 'fa-certificate text-emerald-400' : 'fa-clock text-amber-400'}"></i>
        ${isVer ? 'Community Verified (' + confs + ')' : 'Pending (' + confs + '/' + THRESHOLD + ')'}
      </span>
      ${photoCount > 0 ? `
        <span class="text-slate-600">|</span>
        <span class="text-xs text-slate-400 flex items-center gap-1">
          <i class="fa-solid fa-camera text-brand"></i> ${photoCount} Photos
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
    const isOwner = user && (user.email === s.creator || s.creator === 'system');

    el.innerHTML = `
      <div class="fh-verified-card rounded-xl border border-[#1b3d6a] p-3.5 space-y-3 bg-gradient-to-br from-[#0c233f] to-[#07192f]">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1.5">
            ${isVerified
              ? `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                   <i class="fa-solid fa-certificate text-emerald-400"></i> Community Verified
                 </span>`
              : `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40">
                   <i class="fa-solid fa-clock text-amber-400"></i> Pending Verification
                 </span>`
            }
          </div>
          <span class="text-xs font-semibold text-slate-300 font-mono">
            ${isVerified
              ? `<b class="text-emerald-400 text-sm">${count}</b> <span class="text-slate-400 text-[11px] font-sans font-normal">Confirms (Unlimited &infin;)</span>`
              : `<b class="text-amber-400">${count}</b> / ${THRESHOLD} Confirms`
            }
          </span>
        </div>

        <!-- Verification Progress Bar towards Lower Limit of 25 -->
        <div class="space-y-1">
          <div class="relative w-full h-3 bg-[#143054] rounded-full overflow-hidden">
            <div class="h-full ${isVerified ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-brand'} rounded-full transition-all duration-300" style="width: ${Math.max(progressPct, count > 0 ? 4 : 0)}%"></div>
          </div>
          <div class="flex justify-between text-[10px] text-slate-400">
            <span>0</span>
            <span class="font-semibold ${isVerified ? 'text-emerald-400' : 'text-amber-400'}">
              ${isVerified ? '✓ 25 Lower Limit Passed' : '25 Minimum Lower Limit'}
            </span>
            <span class="text-slate-500 font-mono">Unlimited &infin;</span>
          </div>
        </div>

        <p class="text-xs text-slate-300 leading-relaxed">
          ${isVerified
            ? `<i class="fa-solid fa-circle-check text-emerald-400 mr-1"></i><b>Verified Authentic:</b> <b>${count}</b> registered foodies have confirmed this spot with rating and photos. There is <b>no upper limit</b>.`
            : `<i class="fa-solid fa-circle-info text-amber-400 mr-1"></i>Check the photos above and confirm if this spot exists and is authentic! Needs <b>${THRESHOLD - count} more confirmation(s)</b> to reach the <b>lower limit of 25</b>.`
          }
        </p>

        <!-- Action Button -->
        <div>
          ${hasConfirmed
            ? `<button id="btn-toggle-confirm" type="button" class="w-full rounded-xl bg-[#0f2d52] hover:bg-[#143966] border border-emerald-500/50 text-emerald-300 py-2.5 px-3 text-xs md:text-sm font-semibold flex items-center justify-center gap-2 transition active:scale-[0.98]">
                 <i class="fa-solid fa-check-double text-emerald-400"></i> You Confirmed this Spot (${FH.esc(user.email)}) <span class="text-[10px] font-normal underline ml-1 text-emerald-400">Undo</span>
               </button>`
            : `<button id="btn-toggle-confirm" type="button" class="w-full rounded-xl bg-brand hover:bg-brand-hover text-white py-2.5 px-3 text-xs md:text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-brand/20 transition active:scale-[0.98]">
                 <i class="fa-solid fa-circle-check"></i> ${user ? 'I Confirm this Spot is Real & Accurate' : 'Sign in with Email to Confirm this Spot'}
               </button>`
          }
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

    const editFromVerif = el.querySelector('#btn-edit-from-verif');
    if (editFromVerif) {
      editFromVerif.onclick = () => FH.spotModal.open(s);
    }
  }

  function openDetail(s) {
    const user = FH.auth.getUser();
    const canEdit = user && (user.email === s.creator || s.creator === 'system');

    $('#detail').innerHTML = `
      <div class="sticky top-0 bg-[#07192f]/95 backdrop-blur border-b border-[#14355f] p-4 flex items-start gap-3 z-10">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <h2 class="font-bold text-lg text-white truncate">${FH.esc(s.name)}</h2>
            <button id="btn-qr-spot-header" type="button" class="text-xs bg-[#0c233f] hover:bg-[#102d50] text-slate-200 border border-[#1b3d6a] hover:border-brand px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition shrink-0" title="Share cart / vendor QR code">
              <i class="fa-solid fa-qrcode"></i> QR
            </button>
            ${canEdit ? `
              <button id="btn-edit-spot-header" type="button" class="text-xs bg-brand/10 hover:bg-brand/20 text-brand border border-brand/30 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition shrink-0" title="Edit this spot">
                <i class="fa-solid fa-pen-to-square"></i> Edit
              </button>
            ` : ''}
          </div>
          <p class="text-xs text-slate-400">${FH.esc(s.type)}, ${(s.food || []).map(FH.esc).join(', ')}, ${s.price}</p>
        </div>
        <button id="dx" type="button" aria-label="Close details" class="text-2xl leading-none px-2 text-slate-400 hover:text-white">&times;</button>
      </div>
      <div class="p-4 space-y-4 text-white">
        <!-- Route from the visitor's current location -->
        <button id="btn-directions" type="button" class="w-full flex items-center justify-between gap-2 rounded-xl border border-brand/40 bg-brand/10 hover:bg-brand/20 px-3 py-2.5 text-left transition active:scale-[0.99]" title="Show a route from your location to this cart">
          <span class="flex items-center gap-2 text-sm font-bold text-brand">
            <i class="fa-solid fa-diamond-turn-right"></i>
            <span data-dir-label>Directions from my location</span>
          </span>
          <i class="fa-solid fa-chevron-right text-xs text-brand/80"></i>
        </button>

        <!-- Interactive 3-5 Photo Gallery -->
        <div id="spot-gallery"></div>

        <div id="d-head" class="flex items-center gap-2"></div>
        <p class="text-sm text-slate-300 leading-relaxed">${FH.esc(s.about)}</p>

        <!-- Verification & Confirmation Section -->
        <div id="verif-card"></div>

        <!-- Live Open / Closed status (vendor toggle) -->
        <div id="live-status"></div>

        <!-- Facilities & Services Info (Booking & Delivery) -->
        <div class="space-y-2">
          <div class="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <i class="fa-solid fa-bell-concierge text-brand"></i> Facilities & Services (সুযোগ-সুবিধা)
          </div>
          <div id="bk"></div>
          <div id="dl"></div>
        </div>

        <!-- 1-5 star reviews + hygiene rating -->
        <div id="reviews"></div>

        <div id="chat"></div>
      </div>`;

    $('#detail').classList.add('open');
    $('#dx').onclick = () => FH.store.select(null);

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
    if (FH.status) FH.status.mount(s, $('#live-status'));
    FH.booking.mount(s, $('#bk'));
    FH.delivery.render(s, $('#dl'));
    FH.community.feed(s.id);
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (FH.theme && typeof FH.theme.init === 'function') FH.theme.init();
    FH.map.init();
    if (FH.pwa) FH.pwa.init();

    FH.filters.mount($('#filters'));
    $('#list').onclick = e => {
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
