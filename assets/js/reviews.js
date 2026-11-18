/* ============================================================
   Reviews + hygiene (1-5 stars)
   ------------------------------------------------------------
   Two independent ratings per review:
   - overall food taste & quality (1-5 stars)
   - hygiene & cart cleanliness (1-5 stars)
   - foodie reaction tags (Must Try, Super Tasty, Clean Cart, etc.)
   Reviews are separate from 25+ Ground Location Confirmations.
   ============================================================ */
(function () {
  const STORAGE_KEY = 'foodhub_reviews_v1';
  const remoteLoaded = new Set();
  let cache = null;

  const FOOD_TAGS = [
    '🔥 Must Try',
    '😋 Super Tasty',
    '🧼 Neat & Clean',
    '💰 Pocket Friendly',
    '⚡ Quick Service',
    '🌶️ Spicy Bang!',
    '🌿 Fresh Items',
    '👨‍👩‍👧 Family Friendly'
  ];

  const TASTE_DESCRIPTIONS = {
    5: '⭐⭐⭐⭐⭐ 5.0 — অসাধারণ স্বাদ! (Outstanding Taste)',
    4: '⭐⭐⭐⭐ 4.0 — বেশ ভালো স্বাদ (Very Good)',
    3: '⭐⭐⭐ 3.0 — সাধারণ স্বাদ (Average)',
    2: '⭐⭐ 2.0 — চলনসই (Below Average)',
    1: '⭐ 1.0 — ভালো নয় (Disappointing)'
  };

  const HYGIENE_DESCRIPTIONS = {
    5: '⭐⭐⭐⭐⭐ 5.0 — অত্যন্ত পরিচ্ছন্ন ও স্বাস্থ্যকর (Spotless & Clean)',
    4: '⭐⭐⭐⭐ 4.0 — পরিচ্ছন্ন ও গোছানো (Good Hygiene)',
    3: '⭐⭐⭐ 3.0 — সাধারণ স্ট্রিট ফুড হাইজিন (Basic Hygiene)',
    2: '⭐⭐ 2.0 — পরিচ্ছন্নতার ঘাটতি রয়েছে (Needs Improvement)',
    1: '⭐ 1.0 — অপরিচ্ছন্ন (Unclean)'
  };

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

  function reviewCard(review) {
    return `<article class="rounded-xl border border-[#16365f] bg-[#0c233f] p-3 space-y-2">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <div class="flex items-center gap-1.5 flex-wrap">
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
          <div class="text-[10px] text-sky-300 mt-0.5"><i class="fa-solid fa-hands-bubbles"></i> Hygiene ${Number(review.hygiene || 5).toFixed(1)}/5</div>
        </div>
      </div>

      ${review.tags && review.tags.length ? `
        <div class="flex flex-wrap gap-1">
          ${review.tags.map(t => `<span class="text-[9px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-medium">${escapeHtml(t)}</span>`).join('')}
        </div>
      ` : ''}

      ${review.comment ? `<p class="text-xs text-slate-200 leading-relaxed bg-[#07192f] p-2 rounded-lg border border-[#1b3d6a]/60">${escapeHtml(review.comment)}</p>` : ''}
    </article>`;
  }

  FH.reviews = {
    forSpot: reviewsFor,
    getAverages: averages,

    // Open dedicated modern modal for Food & Hygiene Review
    openModal(spot) {
      if (!spot) return;
      const user = FH.auth.getUser();
      if (!user) {
        FH.auth.openAuthModal(
          () => FH.reviews.openModal(spot),
          `Please sign in with your email to rate and review "${spot.name}".`
        );
        return;
      }

      const m = document.getElementById('modal');
      if (!m) return;

      let selectedTaste = 5;
      let selectedHygiene = 5;
      const selectedTags = new Set(['😋 Super Tasty']);

      m.innerHTML = `
        <div class="bg-[#07192f] border border-[#1b3d6a] w-full max-w-lg rounded-2xl p-5 md:p-6 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto relative text-white" role="dialog" aria-modal="true" aria-label="Write Food & Hygiene Review">
          <!-- Modal Header -->
          <div class="flex items-start justify-between border-b border-[#1b3d6a] pb-3">
            <div>
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-xs">
                  <i class="fa-solid fa-utensils"></i>
                </div>
                <h3 class="font-bold text-base md:text-lg text-white">Rate Food & Hygiene</h3>
              </div>
              <p class="text-xs text-slate-400 mt-0.5">
                Reviewing: <b class="text-slate-200">${escapeHtml(spot.name)}</b>
              </p>
            </div>
            <button id="review-modal-close" type="button" aria-label="Close" class="text-slate-400 hover:text-white text-2xl leading-none">&times;</button>
          </div>

          <form id="food-review-dialog-form" class="space-y-4">
            <!-- 1. Food Taste & Flavor Stars (Interactive) -->
            <div class="p-3.5 rounded-xl bg-[#0c233f] border border-[#1b3d6a] space-y-2">
              <div class="flex items-center justify-between">
                <label class="text-xs font-bold text-white flex items-center gap-1.5">
                  <i class="fa-solid fa-burger text-amber-400"></i> Food Taste & Quality (খাবারের স্বাদ ও মান)
                </label>
                <output id="food-taste-val" class="text-xs font-bold font-mono text-amber-400">5.0 / 5.0</output>
              </div>

              <div class="flex items-center gap-2 pt-1" id="star-row-taste" role="radiogroup" aria-label="Food taste rating">
                ${[1, 2, 3, 4, 5].map(n => `
                  <button type="button" data-val="${n}" class="text-2xl text-amber-400 hover:scale-110 active:scale-95 transition-transform" aria-label="${n} star">
                    <i class="fa-solid fa-star"></i>
                  </button>
                `).join('')}
              </div>

              <div id="food-taste-desc" class="text-[11px] font-medium text-amber-300">
                ${TASTE_DESCRIPTIONS[5]}
              </div>
            </div>

            <!-- 2. Hygiene & Cleanliness Stars (Interactive) -->
            <div class="p-3.5 rounded-xl bg-[#0c233f] border border-[#1b3d6a] space-y-2">
              <div class="flex items-center justify-between">
                <label class="text-xs font-bold text-white flex items-center gap-1.5">
                  <i class="fa-solid fa-hands-bubbles text-sky-400"></i> Cart Hygiene & Cleanliness (পরিচ্ছন্নতা ও স্বাস্থ্যবিধি)
                </label>
                <output id="food-hygiene-val" class="text-xs font-bold font-mono text-sky-400">5.0 / 5.0</output>
              </div>

              <div class="flex items-center gap-2 pt-1" id="star-row-hygiene" role="radiogroup" aria-label="Hygiene rating">
                ${[1, 2, 3, 4, 5].map(n => `
                  <button type="button" data-val="${n}" class="text-2xl text-sky-400 hover:scale-110 active:scale-95 transition-transform" aria-label="${n} star">
                    <i class="fa-solid fa-star"></i>
                  </button>
                `).join('')}
              </div>

              <div id="food-hygiene-desc" class="text-[11px] font-medium text-sky-300">
                ${HYGIENE_DESCRIPTIONS[5]}
              </div>
            </div>

            <!-- 3. Foodie Reaction Badges / Tags -->
            <div class="space-y-1.5">
              <label class="block text-xs font-semibold text-slate-300">Quick Foodie Badges (ট্যাপ করে যুক্ত করুন)</label>
              <div class="flex flex-wrap gap-1.5" id="review-tag-cloud">
                ${FOOD_TAGS.map(tag => {
                  const active = selectedTags.has(tag);
                  return `
                    <button type="button" data-tag="${escapeHtml(tag)}" class="text-xs px-2.5 py-1 rounded-lg border font-medium transition ${active ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm' : 'bg-[#0c233f] text-slate-300 border-[#1b3d6a] hover:border-slate-400'}">
                      ${escapeHtml(tag)}
                    </button>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- 4. Review Comment Textarea -->
            <div>
              <label for="food-review-textarea" class="block text-xs font-semibold text-slate-300 mb-1">
                Your Foodie Recommendation & Experience (খাবারের বিস্তারিত রিভিউ)
              </label>
              <textarea id="food-review-textarea" rows="3" maxlength="600" placeholder="Which items did you eat? How was the spice level, portion size, and overall satisfaction?" class="w-full px-3 py-2 border border-[#1b3d6a] bg-[#0c233f] text-white rounded-xl text-xs focus:border-brand focus:outline-none resize-none"></textarea>
            </div>

            <!-- User Auth Indicator -->
            <div class="text-[11px] text-slate-400 flex items-center justify-between">
              <span class="flex items-center gap-1.5">
                <i class="fa-solid fa-circle-check text-emerald-400"></i> Posting as <b class="text-white">${escapeHtml(user.email)}</b>
              </span>
              <span class="text-[10px] text-slate-500">Verified Foodie Review</span>
            </div>

            <!-- Submit Button -->
            <button type="submit" class="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-3 rounded-xl text-sm transition shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2">
              <i class="fa-solid fa-paper-plane"></i>
              <span>Post Food Review</span>
            </button>
          </form>
        </div>
      `;

      m.classList.remove('hidden');
      m.classList.add('flex');

      const closeSelf = () => {
        m.classList.add('hidden');
        m.classList.remove('flex');
        m.innerHTML = '';
      };

      const btnClose = m.querySelector('#review-modal-close');
      if (btnClose) btnClose.onclick = closeSelf;
      m.onclick = (e) => { if (e.target === m) closeSelf(); };

      // Bind Food Taste Stars
      const tasteButtons = m.querySelectorAll('#star-row-taste button');
      const tasteVal = m.querySelector('#food-taste-val');
      const tasteDesc = m.querySelector('#food-taste-desc');
      tasteButtons.forEach((btn) => {
        btn.onclick = () => {
          selectedTaste = Number(btn.dataset.val);
          tasteVal.textContent = selectedTaste.toFixed(1) + ' / 5.0';
          tasteDesc.textContent = TASTE_DESCRIPTIONS[selectedTaste] || '';
          tasteButtons.forEach(b => {
            const val = Number(b.dataset.val);
            b.querySelector('i').className = val <= selectedTaste ? 'fa-solid fa-star text-amber-400' : 'fa-regular fa-star text-slate-600';
          });
        };
      });

      // Bind Hygiene Stars
      const hygieneButtons = m.querySelectorAll('#star-row-hygiene button');
      const hygieneVal = m.querySelector('#food-hygiene-val');
      const hygieneDesc = m.querySelector('#food-hygiene-desc');
      hygieneButtons.forEach((btn) => {
        btn.onclick = () => {
          selectedHygiene = Number(btn.dataset.val);
          hygieneVal.textContent = selectedHygiene.toFixed(1) + ' / 5.0';
          hygieneDesc.textContent = HYGIENE_DESCRIPTIONS[selectedHygiene] || '';
          hygieneButtons.forEach(b => {
            const val = Number(b.dataset.val);
            b.querySelector('i').className = val <= selectedHygiene ? 'fa-solid fa-star text-sky-400' : 'fa-regular fa-star text-slate-600';
          });
        };
      });

      // Bind Tag Cloud Toggles
      const tagButtons = m.querySelectorAll('#review-tag-cloud button');
      tagButtons.forEach(btn => {
        btn.onclick = () => {
          const t = btn.dataset.tag;
          if (selectedTags.has(t)) {
            selectedTags.delete(t);
            btn.className = 'text-xs px-2.5 py-1 rounded-lg border font-medium transition bg-[#0c233f] text-slate-300 border-[#1b3d6a] hover:border-slate-400';
          } else {
            selectedTags.add(t);
            btn.className = 'text-xs px-2.5 py-1 rounded-lg border font-medium transition bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm';
          }
        };
      });

      // Form Submit
      const form = m.querySelector('#food-review-dialog-form');
      form.onsubmit = async (e) => {
        e.preventDefault();
        const commentField = m.querySelector('#food-review-textarea');
        const comment = commentField ? commentField.value.trim() : '';

        const authorName = (user.name || user.email.split('@')[0]) || 'Foodie';
        const review = {
          id: uid(),
          cartId: spot.id,
          authorName,
          overall: selectedTaste,
          hygiene: selectedHygiene,
          tags: Array.from(selectedTags),
          comment,
          createdAt: Date.now(),
          pending: Boolean(FH.db && FH.db.enabled)
        };

        const all = load();
        all[spot.id] = all[spot.id] || [];
        all[spot.id].unshift(review);
        save();

        // Update spot rating
        FH.store.addReview(spot.id, selectedTaste * 2);
        const latest = FH.store.get(spot.id) || spot;
        const avgNow = averages(reviewsFor(spot.id));
        latest.hygiene = Math.round(avgNow.hygiene * 10) / 10;
        FH.store.save();
        FH.store.emit();

        closeSelf();
        FH.toast(`🎉 Thank you! ${selectedTaste}★ Food · ${selectedHygiene}★ Hygiene review posted.`);

        // Re-mount drawer review view
        const revEl = document.getElementById('reviews');
        if (revEl) {
          FH.reviews.mount(latest, revEl);
        }

        // Sync to backend if configured
        if (FH.db && FH.db.enabled) {
          try {
            await FH.db.addReview(spot.id, review);
          } catch (err) {
            console.warn('[FH.reviews] Could not sync review:', err);
          }
        }
      };
    },

    mount(spot, el) {
      if (!el || !spot) return;
      const reviews = reviewsFor(spot.id);
      const avg = averages(reviews);

      el.innerHTML = `
        <div class="fh-review-box rounded-xl border border-[#1b3d6a] bg-gradient-to-br from-[#0c233f] to-[#07192f] p-3.5 space-y-3">
          <!-- Section Title & Badge -->
          <div class="flex items-start justify-between gap-3 border-b border-[#14355f] pb-2.5">
            <div>
              <h3 class="font-bold text-sm text-white flex items-center gap-1.5">
                <i class="fa-solid fa-utensils text-amber-400"></i>
                <span>Food Quality & Hygiene Reviews</span>
              </h3>
              <p class="text-[11px] text-slate-300 mt-0.5">খাবারের স্বাদ, মান ও পরিচ্ছন্নতার উপর কমিউনিটি রিভিউ</p>
            </div>
            <span class="text-[10px] font-mono text-slate-200 bg-[#07192f] border border-[#1b3d6a] px-2.5 py-1 rounded-full shrink-0">
              ${avg.count} review${avg.count === 1 ? '' : 's'}
            </span>
          </div>

          <!-- Explanatory note in English -->
          <div class="p-2.5 rounded-lg bg-[#07192f] border border-[#1b3d6a] text-xs text-slate-300 italic leading-relaxed">
            "Note: The 25+ ground confirmation above is strictly to verify that the spot is in the 100% correct physical location on the map. This section is to rate food taste, quality, and hygiene."
          </div>

          <!-- Score Overview Cards -->
          <div class="grid grid-cols-2 gap-2">
            <div class="rounded-xl border border-[#1b3d6a] bg-[#07192f] p-3">
              <div class="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
                <i class="fa-solid fa-burger text-amber-400"></i> Food Taste
              </div>
              <div class="text-xl font-black text-white mt-1">
                ${avg.count ? avg.overall.toFixed(1) : '—'}<span class="text-xs text-slate-500 font-medium">/5</span>
              </div>
              <div class="mt-1">
                ${stars(avg.count ? avg.overall : 0, 'text-amber-400 text-xs')}
              </div>
            </div>

            <div class="rounded-xl border border-[#1b3d6a] bg-[#07192f] p-3">
              <div class="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
                <i class="fa-solid fa-hands-bubbles text-sky-400"></i> Cart Hygiene
              </div>
              <div class="text-xl font-black text-white mt-1">
                ${avg.count ? avg.hygiene.toFixed(1) : '—'}<span class="text-xs text-slate-500 font-medium">/5</span>
              </div>
              <div class="mt-1">
                ${stars(avg.count ? avg.hygiene : 0, 'text-sky-400 text-xs')}
              </div>
            </div>
          </div>

          <!-- Primary CTA Button: Opens Food Review Modal -->
          <button id="btn-open-review-dialog" type="button" class="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs md:text-sm shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition active:scale-[0.98]">
            <i class="fa-solid fa-star text-white"></i>
            <span>Write Food & Hygiene Review (খাবার রিভিউ দিন)</span>
          </button>

          <!-- Community Reviews Feed -->
          <div class="space-y-2 pt-1 border-t border-[#14355f]">
            <div class="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Community Reviews (${reviews.length})</span>
              <span class="text-[10px] text-slate-500 font-normal">Latest first</span>
            </div>

            <div id="review-list" class="space-y-2">
              ${reviews.length
                ? reviews.slice(0, 8).map(reviewCard).join('')
                : '<div class="p-4 rounded-xl border border-[#1b3d6a] bg-[#07192f] text-center text-xs text-slate-400">No community food reviews yet. Be the first to rate the food!</div>'}
            </div>
          </div>
        </div>`;

      const btnWrite = el.querySelector('#btn-open-review-dialog');
      if (btnWrite) {
        btnWrite.onclick = () => FH.reviews.openModal(spot);
      }

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
