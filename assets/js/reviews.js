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
    { id: 'must_try', icon: 'fa-solid fa-fire text-amber-400', en: 'Must Try', bn: 'অবশ্যই ট্রাই করুন' },
    { id: 'tasty', icon: 'fa-solid fa-thumbs-up text-emerald-400', en: 'Super Tasty', bn: 'অসাধারণ স্বাদ' },
    { id: 'clean', icon: 'fa-solid fa-shield-heart text-sky-400', en: 'Neat & Clean', bn: 'পরিচ্ছন্ন পরিবেশ' },
    { id: 'budget', icon: 'fa-solid fa-wallet text-indigo-400', en: 'Pocket Friendly', bn: 'বাজেট ফ্রেন্ডলি' },
    { id: 'quick', icon: 'fa-solid fa-bolt text-yellow-400', en: 'Quick Service', bn: 'দ্রুত সার্ভিস' },
    { id: 'spicy', icon: 'fa-solid fa-pepper-hot text-rose-400', en: 'Spicy Delight', bn: 'স্পাইসি ও মজাদার' },
    { id: 'fresh', icon: 'fa-solid fa-leaf text-emerald-400', en: 'Fresh Items', bn: 'তাজা উপাদান' },
    { id: 'family', icon: 'fa-solid fa-users text-blue-400', en: 'Family Friendly', bn: 'ফ্যামিলি ফ্রেন্ডলি' }
  ];

  const TASTE_DESCRIPTIONS = {
    5: { en: '5.0 — Outstanding Taste', bn: '৫.০ — অসাধারণ স্বাদ' },
    4: { en: '4.0 — Very Good', bn: '৪.০ — বেশ ভালো স্বাদ' },
    3: { en: '3.0 — Average', bn: '৩.০ — সাধারণ স্বাদ' },
    2: { en: '2.0 — Below Average', bn: '২.০ — চলনসই' },
    1: { en: '1.0 — Disappointing', bn: '১.০ — ভালো নয়' }
  };

  const HYGIENE_DESCRIPTIONS = {
    5: { en: '5.0 — Spotless & Clean', bn: '৫.০ — অত্যন্ত পরিচ্ছন্ন ও স্বাস্থ্যকর' },
    4: { en: '4.0 — Good Hygiene', bn: '৪.০ — পরিচ্ছন্ন ও গোছানো' },
    3: { en: '3.0 — Basic Hygiene', bn: '৩.০ — সাধারণ স্ট্রিট ফুড হাইজিন' },
    2: { en: '2.0 — Needs Improvement', bn: '২.০ — পরিচ্ছন্নতার ঘাটতি রয়েছে' },
    1: { en: '1.0 — Unclean', bn: '১.০ — অপরিচ্ছন্ন' }
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

  function renderTagBadge(tag) {
    const isBn = FH.i18n && FH.i18n.get() === 'bn';
    const found = FOOD_TAGS.find(t => t.id === tag || t.en === tag || t.bn === tag || String(tag).includes(t.en) || String(tag).includes(t.id));
    if (found) {
      return `<span class="inline-flex items-center gap-1 text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md font-medium">
        <i class="${found.icon} text-[9px]"></i> <span>${escapeHtml(isBn ? found.bn : found.en)}</span>
      </span>`;
    }
    const cleanStr = String(tag).replace(/[\uD83C-\uDBFF\uDC00-\uDFFF\u2600-\u27bf]/g, '').trim();
    return `<span class="inline-flex items-center gap-1 text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md font-medium">
      <i class="fa-solid fa-tag text-amber-400 text-[9px]"></i> <span>${escapeHtml(cleanStr || tag)}</span>
    </span>`;
  }

  function reviewCard(review) {
    const isBn = FH.i18n && FH.i18n.get() === 'bn';
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
          <div class="text-[10px] text-sky-300 mt-0.5"><i class="fa-solid fa-hands-bubbles"></i> ${isBn ? 'হাইজিন' : 'Hygiene'} ${FH.num(Number(review.hygiene || 5).toFixed(1))}/৫</div>
        </div>
      </div>

      ${review.tags && review.tags.length ? `
        <div class="flex flex-wrap gap-1">
          ${review.tags.map(renderTagBadge).join('')}
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
      const selectedTags = new Set(['tasty']);

      const isBn = FH.i18n && FH.i18n.get() === 'bn';
      const lang = isBn ? 'bn' : 'en';

      m.innerHTML = `
        <div class="bg-[#07192f] border border-[#1b3d6a] w-full max-w-lg rounded-2xl p-5 md:p-6 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto relative text-white" role="dialog" aria-modal="true" aria-label="${FH.t('write_review_modal_title', 'Write Food & Hygiene Review')}">
          <!-- Modal Header -->
          <div class="flex items-start justify-between border-b border-[#1b3d6a] pb-3">
            <div>
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-xs">
                  <i class="fa-solid fa-utensils"></i>
                </div>
                <h3 class="font-bold text-base md:text-lg text-white">${FH.t('write_review_modal_title', 'Rate Food & Hygiene')}</h3>
              </div>
              <p class="text-xs text-slate-400 mt-0.5">
                ${isBn ? 'রিভিউ দিচ্ছেন: ' : 'Reviewing: '} <b class="text-slate-200">${escapeHtml(spot.name)}</b>
              </p>
            </div>
            <button id="review-modal-close" type="button" aria-label="Close" class="text-slate-400 hover:text-white text-2xl leading-none">&times;</button>
          </div>

          <form id="food-review-dialog-form" class="space-y-4">
            <!-- 1. Food Taste & Flavor Stars (Interactive) -->
            <div class="p-3.5 rounded-xl bg-[#0c233f] border border-[#1b3d6a] space-y-2">
              <div class="flex items-center justify-between">
                <label class="text-xs font-bold text-white flex items-center gap-1.5">
                  <i class="fa-solid fa-burger text-amber-400"></i> ${FH.t('taste_score_label', 'Food Taste & Quality')}
                </label>
                <output id="food-taste-val" class="text-xs font-bold font-mono text-amber-400">${FH.num('5.0')} / ${FH.num('5.0')}</output>
              </div>

              <div class="flex items-center gap-2 pt-1" id="star-row-taste" role="radiogroup" aria-label="Food taste rating">
                ${[1, 2, 3, 4, 5].map(n => `
                  <button type="button" data-val="${n}" class="text-2xl text-amber-400 hover:scale-110 active:scale-95 transition-transform" aria-label="${n} star">
                    <i class="fa-solid fa-star"></i>
                  </button>
                `).join('')}
              </div>

              <div id="food-taste-desc" class="text-[11px] font-medium text-amber-300">
                ${TASTE_DESCRIPTIONS[5][lang]}
              </div>
            </div>

            <!-- 2. Hygiene & Cleanliness Stars (Interactive) -->
            <div class="p-3.5 rounded-xl bg-[#0c233f] border border-[#1b3d6a] space-y-2">
              <div class="flex items-center justify-between">
                <label class="text-xs font-bold text-white flex items-center gap-1.5">
                  <i class="fa-solid fa-hands-bubbles text-sky-400"></i> ${FH.t('hygiene_score_label', 'Cart Hygiene & Cleanliness')}
                </label>
                <output id="food-hygiene-val" class="text-xs font-bold font-mono text-sky-400">${FH.num('5.0')} / ${FH.num('5.0')}</output>
              </div>

              <div class="flex items-center gap-2 pt-1" id="star-row-hygiene" role="radiogroup" aria-label="Hygiene rating">
                ${[1, 2, 3, 4, 5].map(n => `
                  <button type="button" data-val="${n}" class="text-2xl text-sky-400 hover:scale-110 active:scale-95 transition-transform" aria-label="${n} star">
                    <i class="fa-solid fa-star"></i>
                  </button>
                `).join('')}
              </div>

              <div id="food-hygiene-desc" class="text-[11px] font-medium text-sky-300">
                ${HYGIENE_DESCRIPTIONS[5][lang]}
              </div>
            </div>

            <!-- 3. Foodie Reaction Badges / Tags -->
            <div class="space-y-1.5">
              <label class="block text-xs font-semibold text-slate-300">${FH.t('select_tags_label', 'Quick Foodie Badges')}</label>
              <div class="flex flex-wrap gap-1.5" id="review-tag-cloud">
                ${FOOD_TAGS.map(tag => {
                  const active = selectedTags.has(tag.id);
                  return `
                    <button type="button" data-tag="${escapeHtml(tag.id)}" class="text-xs px-2.5 py-1.5 rounded-lg border font-medium inline-flex items-center gap-1.5 transition ${active ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm' : 'bg-[#0c233f] text-slate-300 border-[#1b3d6a] hover:border-slate-400'}">
                      <i class="${tag.icon}"></i>
                      <span>${escapeHtml(isBn ? tag.bn : tag.en)}</span>
                    </button>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- 4. Review Comment Textarea -->
            <div>
              <label for="food-review-textarea" class="block text-xs font-semibold text-slate-300 mb-1">
                ${FH.t('comment_label', 'Your Foodie Recommendation & Experience')}
              </label>
              <textarea id="food-review-textarea" rows="3" maxlength="600" placeholder="${escapeHtml(FH.t('comment_placeholder', 'Which items did you eat? How was the spice level, portion size, and overall satisfaction?'))}" class="w-full px-3 py-2 border border-[#1b3d6a] bg-[#0c233f] text-white rounded-xl text-xs focus:border-brand focus:outline-none resize-none"></textarea>
            </div>

            <!-- User Auth Indicator -->
            <div class="text-[11px] text-slate-400 flex items-center justify-between">
              <span class="flex items-center gap-1.5">
                <i class="fa-solid fa-circle-check text-emerald-400"></i> ${isBn ? 'পোস্ট করছেন:' : 'Posting as'} <b class="text-white">${escapeHtml(user.email)}</b>
              </span>
              <span class="text-[10px] text-slate-500">${isBn ? 'যাচাইকৃত ফুডি রিভিউ' : 'Verified Foodie Review'}</span>
            </div>

            <!-- Submit Button -->
            <button type="submit" class="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-3 rounded-xl text-sm transition shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2">
              <i class="fa-solid fa-paper-plane"></i>
              <span>${FH.t('submit_review', 'Post Food Review')}</span>
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
          tasteVal.textContent = FH.num(selectedTaste.toFixed(1)) + ' / ' + FH.num('5.0');
          tasteDesc.textContent = (TASTE_DESCRIPTIONS[selectedTaste] && TASTE_DESCRIPTIONS[selectedTaste][lang]) || '';
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
          hygieneVal.textContent = FH.num(selectedHygiene.toFixed(1)) + ' / ' + FH.num('5.0');
          hygieneDesc.textContent = (HYGIENE_DESCRIPTIONS[selectedHygiene] && HYGIENE_DESCRIPTIONS[selectedHygiene][lang]) || '';
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
            btn.className = 'text-xs px-2.5 py-1.5 rounded-lg border font-medium inline-flex items-center gap-1.5 transition bg-[#0c233f] text-slate-300 border-[#1b3d6a] hover:border-slate-400';
          } else {
            selectedTags.add(t);
            btn.className = 'text-xs px-2.5 py-1.5 rounded-lg border font-medium inline-flex items-center gap-1.5 transition bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm';
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
        FH.toast(isBn ? 'ধন্যবাদ! আপনার খাবার ও হাইজিন রিভিউ সফলভাবে জমা হয়েছে।' : 'Thank you! Your food & hygiene review has been posted.');

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
      const isBn = FH.i18n && FH.i18n.get() === 'bn';

      el.innerHTML = `
        <div class="fh-review-box rounded-xl border border-[#1b3d6a] bg-gradient-to-br from-[#0c233f] to-[#07192f] p-3.5 space-y-3">
          <!-- Section Title & Badge -->
          <div class="flex items-start justify-between gap-3 border-b border-[#14355f] pb-2.5">
            <div>
              <h3 class="font-bold text-sm text-white flex items-center gap-1.5">
                <i class="fa-solid fa-utensils text-amber-400"></i>
                <span>${FH.t('food_and_hygiene_reviews', 'Food Quality & Hygiene Reviews')}</span>
              </h3>
              <p class="text-[11px] text-slate-300 mt-0.5">${isBn ? 'খাবারের স্বাদ, মান ও পরিচ্ছন্নতার উপর কমিউনিটি রিভিউ' : 'Community ratings on food taste, quality & cleanliness'}</p>
            </div>
            <span class="text-[10px] font-mono text-slate-200 bg-[#07192f] border border-[#1b3d6a] px-2.5 py-1 rounded-full shrink-0">
              ${FH.num(avg.count)} ${FH.t('reviews_count', 'reviews')}
            </span>
          </div>

          <!-- Explanatory note in English -->
          <div class="p-2.5 rounded-lg bg-[#07192f] border border-[#1b3d6a] text-xs text-slate-300 italic leading-relaxed">
            ${FH.t('ground_presence_note')}
          </div>

          <!-- Score Overview Cards -->
          <div class="grid grid-cols-2 gap-2">
            <div class="rounded-xl border border-[#1b3d6a] bg-[#07192f] p-3">
              <div class="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
                <i class="fa-solid fa-burger text-amber-400"></i> ${FH.t('food_taste_rating', 'Food Taste')}
              </div>
              <div class="text-xl font-black text-white mt-1">
                ${avg.count ? FH.num(avg.overall.toFixed(1)) : '—'}<span class="text-xs text-slate-500 font-medium">/5</span>
              </div>
              <div class="mt-1">
                ${stars(avg.count ? avg.overall : 0, 'text-amber-400 text-xs')}
              </div>
            </div>

            <div class="rounded-xl border border-[#1b3d6a] bg-[#07192f] p-3">
              <div class="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
                <i class="fa-solid fa-hands-bubbles text-sky-400"></i> ${FH.t('hygiene_rating', 'Cart Hygiene')}
              </div>
              <div class="text-xl font-black text-white mt-1">
                ${avg.count ? FH.num(avg.hygiene.toFixed(1)) : '—'}<span class="text-xs text-slate-500 font-medium">/5</span>
              </div>
              <div class="mt-1">
                ${stars(avg.count ? avg.hygiene : 0, 'text-sky-400 text-xs')}
              </div>
            </div>
          </div>

          <!-- Primary CTA Button: Opens Food Review Modal -->
          <button id="btn-open-review-dialog" type="button" class="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs md:text-sm shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition active:scale-[0.98]">
            <i class="fa-solid fa-star text-white"></i>
            <span>${FH.t('write_review_modal_title', 'Write Food & Hygiene Review')}</span>
          </button>

          <!-- Community Reviews Feed -->
          <div class="space-y-2 pt-1 border-t border-[#14355f]">
            <div class="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>${isBn ? `কমিউনিটি রিভিউ (${FH.num(reviews.length)})` : `Community Reviews (${reviews.length})`}</span>
              <span class="text-[10px] text-slate-500 font-normal">${isBn ? 'সর্বশেষ' : 'Latest first'}</span>
            </div>

            <div id="review-list" class="space-y-2">
              ${reviews.length
                ? reviews.slice(0, 8).map(reviewCard).join('')
                : `<div class="p-4 rounded-xl border border-[#1b3d6a] bg-[#07192f] text-center text-xs text-slate-400">${FH.t('no_reviews_yet')}</div>`}
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
