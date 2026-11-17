/* ============================================================
   Reviews + hygiene (1-5 stars)
   ------------------------------------------------------------
   Two ratings per review:
   - overall experience (food / service)
   - hygiene
   Reviews are written locally first, then to FastAPI when
   configured. The legacy 1-10 map score is kept in sync by
   converting the overall 5-star score to a 10-point score.
   ============================================================ */
(function () {
  const STORAGE_KEY = 'foodhub_reviews_v1';
  const remoteLoaded = new Set();
  let cache = null;

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function uid() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
    return 'review_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  }

  function load() {
    if (cache) return cache;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      cache = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch (e) {
      cache = {};
    }
    return cache;
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(load())); } catch (e) { /* quota */ }
  }

  function reviewsFor(spotId) {
    const all = load()[spotId];
    return Array.isArray(all) ? all.slice().sort((a, b) => b.createdAt - a.createdAt) : [];
  }

  function averages(reviews) {
    if (!reviews.length) return { overall: 0, hygiene: 0, count: 0 };
    const sum = (key) => reviews.reduce((total, r) => total + (Number(r[key]) || 0), 0);
    return {
      overall: sum('overall') / reviews.length,
      hygiene: sum('hygiene') / reviews.length,
      count: reviews.length
    };
  }

  function stars(value, extraClass) {
    const rounded = Math.round(Number(value) || 0);
    return `<span class="fh-star-row ${extraClass || ''}" aria-label="${Number(value || 0).toFixed(1)} out of 5">
      ${[1, 2, 3, 4, 5].map((n) => `<i class="fa-${n <= rounded ? 'solid' : 'regular'} fa-star"></i>`).join('')}
    </span>`;
  }

  function formatDate(ts) {
    try {
      return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return '';
    }
  }

  function refreshSpotHygiene(spot, el) {
    const reviews = reviewsFor(spot.id);
    const avg = averages(reviews);
    if (avg.count) {
      spot.hygiene = Math.round(avg.hygiene * 10) / 10;
      spot.reviewSample = avg.count;
      FH.store.save();
    }
    return { reviews, avg };
  }

  function bindStars(root, onChange) {
    root.querySelectorAll('.fh-star-input').forEach((group) => {
      const key = group.dataset.stars;
      const buttons = Array.from(group.querySelectorAll('.fh-star-btn'));

      const paint = (value) => {
        buttons.forEach((btn) => {
          const n = Number(btn.dataset.value);
          btn.classList.toggle('is-active', n <= value);
          btn.setAttribute('aria-checked', String(n === value));
        });
        const output = root.querySelector(`[data-star-output="${key}"]`);
        if (output) output.textContent = Number(value).toFixed(1);
      };

      buttons.forEach((btn) => {
        btn.onclick = () => {
          const value = Number(btn.dataset.value);
          group.dataset.value = String(value);
          paint(value);
          if (typeof onChange === 'function') onChange(key, value);
        };
        btn.onmouseenter = () => {
          const value = Number(btn.dataset.value);
          buttons.forEach((b) => b.classList.toggle('is-hover', Number(b.dataset.value) <= value));
        };
        btn.onmouseleave = () => buttons.forEach((b) => b.classList.remove('is-hover'));
      });

      paint(Number(group.dataset.value) || 5);
    });
  }

  function reviewCard(review) {
    return `<article class="rounded-xl border border-[#16365f] bg-[#0c233f] p-3 space-y-1.5">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <div class="flex items-center gap-1.5">
            <span class="w-6 h-6 rounded-full bg-brand/15 border border-brand/30 text-brand flex items-center justify-center text-[10px] font-bold shrink-0">
              ${escapeHtml((review.authorName || 'A').charAt(0).toUpperCase())}
            </span>
            <b class="text-xs text-white truncate">${escapeHtml(review.authorName || 'Anonymous Foodie')}</b>
            ${review.pending ? '<span class="text-[9px] text-amber-300 border border-amber-500/30 bg-amber-950/40 px-1.5 rounded-full">saving…</span>' : ''}
          </div>
          <div class="text-[10px] text-slate-500 mt-0.5">${formatDate(review.createdAt)}</div>
        </div>
        <div class="text-right shrink-0">
          ${stars(review.overall, 'text-amber-400')}
          <div class="text-[10px] text-sky-300 mt-0.5"><i class="fa-solid fa-hands-bubbles"></i> Hygiene ${Number(review.hygiene).toFixed(1)}/5</div>
        </div>
      </div>
      ${review.comment ? `<p class="text-xs text-slate-300 leading-relaxed">${escapeHtml(review.comment)}</p>` : ''}
    </article>`;
  }

  FH.reviews = {
    forSpot: reviewsFor,

    mount(spot, el) {
      if (!el || !spot) return;
      const user = FH.auth.getUser();
      const reviews = reviewsFor(spot.id);
      const avg = averages(reviews);

      el.innerHTML = `
        <div class="rounded-xl border border-[#1b3d6a] bg-gradient-to-br from-[#0c233f] to-[#07192f] p-3.5 space-y-3">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h3 class="font-bold text-sm text-white flex items-center gap-1.5">
                <i class="fa-solid fa-star text-amber-400"></i> Reviews & Hygiene
              </h3>
              <p class="text-[11px] text-slate-400 mt-0.5">Rate the food and the cart's cleanliness on a 1–5 scale.</p>
            </div>
            <span class="text-[10px] font-mono text-slate-300 bg-[#07192f] border border-[#1b3d6a] px-2 py-1 rounded-full shrink-0">
              ${avg.count} review${avg.count === 1 ? '' : 's'}
            </span>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div class="rounded-lg border border-[#1b3d6a] bg-[#07192f] p-2.5">
              <div class="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Overall</div>
              <div class="text-xl font-black text-white mt-0.5">${avg.count ? avg.overall.toFixed(1) : '—'}<span class="text-xs text-slate-500 font-medium">/5</span></div>
              ${stars(avg.count ? avg.overall : 0, 'text-amber-400')}
            </div>
            <div class="rounded-lg border border-[#1b3d6a] bg-[#07192f] p-2.5">
              <div class="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Hygiene</div>
              <div class="text-xl font-black text-white mt-0.5">${avg.count ? avg.hygiene.toFixed(1) : '—'}<span class="text-xs text-slate-500 font-medium">/5</span></div>
              ${stars(avg.count ? avg.hygiene : 0, 'text-sky-400')}
            </div>
          </div>

          <form id="review-form" class="rounded-lg border border-[#1b3d6a] bg-[#07192f]/70 p-3 space-y-3">
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Food / overall</label>
                <div class="fh-star-input flex items-center gap-1 mt-1" data-stars="overall" data-value="5" role="radiogroup" aria-label="Overall rating">
                  ${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="fh-star-btn" data-value="${n}" role="radio" aria-checked="${n === 5}" aria-label="${n} star${n === 1 ? '' : 's'}"><i class="fa-solid fa-star"></i></button>`).join('')}
                </div>
                <output data-star-output="overall" class="text-[11px] font-bold text-amber-400">5.0</output>
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Hygiene</label>
                <div class="fh-star-input flex items-center gap-1 mt-1 text-sky-400" data-stars="hygiene" data-value="5" role="radiogroup" aria-label="Hygiene rating">
                  ${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="fh-star-btn" data-value="${n}" role="radio" aria-checked="${n === 5}" aria-label="${n} star${n === 1 ? '' : 's'}"><i class="fa-solid fa-star"></i></button>`).join('')}
                </div>
                <output data-star-output="hygiene" class="text-[11px] font-bold text-sky-400">5.0</output>
              </div>
            </div>

            <textarea id="review-comment" rows="2" maxlength="500" placeholder="How was the food? Was the cart clean?" class="w-full px-2.5 py-2 border border-[#1b3d6a] bg-[#0c233f] text-white rounded-lg text-xs resize-none focus:border-brand focus:outline-none"></textarea>

            ${user
              ? `<div class="text-[10px] text-slate-400 flex items-center gap-1"><i class="fa-solid fa-user-check text-emerald-400"></i> Posting as <b class="text-slate-200">${escapeHtml(user.email)}</b></div>`
              : `<input id="review-name" type="text" maxlength="40" placeholder="Your name (optional)" class="w-full px-2.5 py-2 border border-[#1b3d6a] bg-[#0c233f] text-white rounded-lg text-xs focus:border-brand focus:outline-none">`}

            <button type="submit" class="w-full rounded-lg bg-brand hover:bg-brand-hover text-white py-2.5 text-xs font-bold transition shadow-lg shadow-brand/20 flex items-center justify-center gap-1.5">
              <i class="fa-solid fa-paper-plane"></i> Post review
            </button>
          </form>

          <div id="review-list" class="space-y-2">
            ${reviews.length
              ? reviews.slice(0, 8).map(reviewCard).join('')
              : '<p class="text-[11px] text-slate-500 text-center py-2">No community reviews yet. Be the first to rate this cart.</p>'}
          </div>
        </div>`;

      let selected = { overall: 5, hygiene: 5 };
      bindStars(el, (key, value) => { selected[key] = value; });

      const form = el.querySelector('#review-form');
      form.onsubmit = async (event) => {
        event.preventDefault();
        const currentUser = FH.auth.getUser();
        const nameField = el.querySelector('#review-name');
        const commentField = el.querySelector('#review-comment');
        const authorName = (currentUser && (currentUser.name || currentUser.email)) ||
          (nameField && nameField.value.trim()) || 'Anonymous Foodie';
        const comment = commentField ? commentField.value.trim() : '';

        const review = {
          id: uid(),
          cartId: spot.id,
          authorName,
          authorEmail: currentUser ? currentUser.email : '',
          overall: selected.overall,
          hygiene: selected.hygiene,
          comment,
          createdAt: Date.now(),
          pending: Boolean(FH.db && FH.db.enabled)
        };

        const all = load();
        all[spot.id] = all[spot.id] || [];
        all[spot.id].unshift(review);
        save();

        // Keep the legacy 10-point map score updated + store hygiene for sidebar chips.
        FH.store.addReview(spot.id, selected.overall * 2);
        const latest = FH.store.get(spot.id) || spot;
        const avgNow = averages(reviewsFor(spot.id));
        latest.hygiene = Math.round(avgNow.hygiene * 10) / 10;
        FH.store.save();
        FH.store.emit();

        commentField.value = '';
        const summary = refreshSpotHygiene(latest, el);
        el.querySelector('#review-list').innerHTML = summary.reviews.slice(0, 8).map(reviewCard).join('');
        FH.toast(`Thanks! ${selected.overall}★ food · ${selected.hygiene}★ hygiene`);

        if (FH.db && FH.db.enabled) {
          try {
            await FH.db.saveCart(latest);
            const saved = await FH.db.addReview(spot.id, review);
            if (saved) {
              const bucket = load()[spot.id] || [];
              const idx = bucket.findIndex((r) => r.id === review.id);
              if (idx !== -1) bucket[idx] = saved;
              save();
              el.querySelector('#review-list').innerHTML = reviewsFor(spot.id).slice(0, 8).map(reviewCard).join('');
            }
            await FH.db.saveSummary(latest);
          } catch (err) {
            console.warn('[FH.reviews] Could not sync review:', err);
            const bucket = load()[spot.id] || [];
            const localCopy = bucket.find((r) => r.id === review.id);
            if (localCopy) {
              localCopy.pending = false;
              save();
              el.querySelector('#review-list').innerHTML = reviewsFor(spot.id).slice(0, 8).map(reviewCard).join('');
            }
            FH.toast('Review saved on this device — it needs the backend connection to appear for everyone.');
          }
        }
      };

      this.loadRemote(spot, el);
    },

    async loadRemote(spot, el) {
      if (!FH.db || !FH.db.enabled) return;
      if (remoteLoaded.has(spot.id)) return;
      remoteLoaded.add(spot.id);

      try {
        const remote = await FH.db.listReviews(spot.id);
        if (!remote.length) return;

        const bucket = load()[spot.id] || [];
        const seen = new Set(bucket.map((r) => r.id));
        let changed = false;
        remote.forEach((review) => {
          if (!seen.has(review.id)) {
            bucket.push(review);
            seen.add(review.id);
            changed = true;
          }
        });
        if (!changed) return;

        bucket.sort((a, b) => b.createdAt - a.createdAt);
        load()[spot.id] = bucket;
        save();

        const summary = refreshSpotHygiene(spot, el);
        FH.store.emit();
        const list = el.querySelector('#review-list');
        if (list) list.innerHTML = summary.reviews.slice(0, 8).map(reviewCard).join('');
      } catch (err) {
        console.warn('[FH.reviews] Could not load remote reviews:', err);
      }
    }
  };
})();
