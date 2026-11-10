(function () {
  const $ = s => document.querySelector(s);
  const THRESHOLD = FH.VERIFIED_THRESHOLD || 25;

  FH.esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  FH.badge = r => `<span class="rounded-full px-2 py-0.5 text-xs font-bold text-white shadow-sm" style="background:${FH.scoreColor(r)}">${r.toFixed(1)}</span>`;
  FH.toast = m => { const t = $('#toast'); t.textContent = m; t.classList.remove('hidden'); clearTimeout(FH._t); FH._t = setTimeout(() => t.classList.add('hidden'), 3500); };
  let shown = null;

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
      <div class="rounded-xl border border-[#1b3d6a] p-3.5 space-y-3 bg-gradient-to-br from-[#0c233f] to-[#07192f]">
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
          <div class="flex items-center gap-2">
            <h2 class="font-bold text-lg text-white truncate">${FH.esc(s.name)}</h2>
            ${canEdit ? `
              <button id="btn-edit-spot-header" type="button" class="text-xs bg-brand/10 hover:bg-brand/20 text-brand border border-brand/30 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition shrink-0" title="Edit this spot">
                <i class="fa-solid fa-pen-to-square"></i> Edit
              </button>
            ` : ''}
          </div>
          <p class="text-xs text-slate-400">${FH.esc(s.type)}, ${s.food.map(FH.esc).join(', ')}, ${s.price}</p>
        </div>
        <button id="dx" type="button" aria-label="Close details" class="text-2xl leading-none px-2 text-slate-400 hover:text-white">&times;</button>
      </div>
      <div class="p-4 space-y-4 text-white">
        <!-- Interactive 3-5 Photo Gallery -->
        <div id="spot-gallery"></div>

        <div id="d-head" class="flex items-center gap-2"></div>
        <p class="text-sm text-slate-300 leading-relaxed">${FH.esc(s.about)}</p>

        <!-- Verification & Confirmation Section -->
        <div id="verif-card"></div>

        <!-- Facilities & Services Info (Booking & Delivery) -->
        <div class="space-y-2">
          <div class="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <i class="fa-solid fa-bell-concierge text-brand"></i> Facilities & Services (সুযোগ-সুবিধা)
          </div>
          <div id="bk"></div>
          <div id="dl"></div>
        </div>

        <form id="rf" class="rounded-xl border border-[#1b3d6a] bg-[#0c233f] p-3 space-y-2">
          <label class="text-sm font-medium text-slate-200" for="rv">Your rating: <output id="ro" class="text-brand font-bold">8.0</output>/10</label>
          <input id="rv" type="range" min="1" max="10" step="0.5" value="8" class="w-full accent-brand">
          <button class="w-full rounded-lg bg-brand hover:bg-brand-hover text-white py-2 text-sm font-semibold transition shadow-md shadow-brand/20">Submit review</button>
        </form>

        <div id="chat"></div>
      </div>`;

    $('#detail').classList.add('open');
    $('#dx').onclick = () => FH.store.select(null);
    $('#rv').oninput = e => { $('#ro').textContent = (+e.target.value).toFixed(1); };
    $('#rf').onsubmit = e => {
      e.preventDefault();
      FH.store.addReview(s.id, +$('#rv').value);
      FH.toast('Review added. Thanks!');
    };

    const btnEditHeader = $('#btn-edit-spot-header');
    if (btnEditHeader) {
      btnEditHeader.onclick = () => FH.spotModal.open(s);
    }

    if (FH.gallery) FH.gallery.mount(s, $('#spot-gallery'));
    renderVerification(s, $('#verif-card'));
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
    FH.booking.mount(s, $('#bk'));
    FH.delivery.render(s, $('#dl'));
    FH.community.feed(s.id);
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (FH.theme && typeof FH.theme.init === 'function') FH.theme.init();
    FH.map.init();
    FH.filters.mount($('#filters'));
    $('#list').onclick = e => {
      const b = e.target.closest('[data-id]');
      if (b) FH.store.select(b.dataset.id);
    };
    $('#btn-add-spot').onclick = () => {
      FH.auth.requireAuth(() => FH.spotModal.open(), "Please sign in with your email to add a new food spot.");
    };
    FH.store.on(sync);
    sync();
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && $('#modal').classList.contains('hidden')) {
        FH.store.select(null);
      }
    });
  });
})();
