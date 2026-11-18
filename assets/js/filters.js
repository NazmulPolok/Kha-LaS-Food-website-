(function () {
  FH.filters = {
    mount(el) {
      const C = FH.CATS;
      el.innerHTML = `
        <div class="relative">
          <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-3 text-slate-400 text-xs"></i>
          <input id="q" type="search" placeholder="Search spot, food or type" aria-label="Search spots" class="w-full rounded-xl border border-[#183a64] bg-[#0c233f] pl-9 pr-3.5 py-2 text-sm text-white placeholder-slate-400 focus:border-brand focus:ring-1 focus:ring-brand shadow-inner">
        </div>

        <div id="fc" class="flex flex-wrap gap-1.5 py-0.5" role="group" aria-label="Food category">
          ${C.food.map(f => `<button type="button" class="chip" data-f="${f}" aria-pressed="false">${f}</button>`).join('')}
        </div>

        <div class="grid grid-cols-2 gap-2 text-sm items-end pt-1">
          <label class="text-xs text-slate-300 font-medium">Spot type
            <select id="ft" class="w-full rounded-lg border border-[#183a64] bg-[#0c233f] text-white px-2 py-1.5 mt-1 text-xs focus:border-brand">
              <option value="">All Types</option>
              ${C.types.map(t => `<option value="${t}">${t}</option>`).join('')}
            </select>
          </label>
          <label class="text-xs text-slate-300 font-medium">Min score <output id="mo" class="font-bold text-brand ml-1">1.0</output>
            <input id="fm" type="range" min="1" max="10" step="0.5" value="1" class="w-full mt-1.5 accent-brand cursor-pointer">
          </label>
        </div>

        <div class="flex flex-wrap gap-3 text-xs text-slate-300 pt-2 border-t border-[#14355f]">
          <label class="flex items-center gap-1.5 cursor-pointer hover:text-white"><input id="fd" type="checkbox" class="accent-brand rounded"> Delivery</label>
          <label class="flex items-center gap-1.5 cursor-pointer hover:text-white"><input id="fb" type="checkbox" class="accent-brand rounded"> Booking</label>
          <label class="flex items-center gap-1.5 cursor-pointer font-semibold text-emerald-400 hover:text-emerald-300" title="ম্যাপে বাস্তবেই আছে কি না তা ২৫+ জন স্থানীয় ব্যবহারকারী নিশ্চিত করেছেন (Ground Presence)"><input id="fv" type="checkbox" class="accent-brand rounded"> <i class="fa-solid fa-location-dot"></i> Confirmed Spot (25+)</label>
        </div>`;

      const set = p => FH.store.setFilter(p), $ = s => el.querySelector(s);
      $('#q').oninput = e => set({ q: e.target.value });
      $('#ft').onchange = e => set({ type: e.target.value });
      $('#fm').oninput = e => { $('#mo').textContent = (+e.target.value).toFixed(1); set({ min: +e.target.value }); };
      $('#fd').onchange = e => set({ delivery: e.target.checked });
      $('#fb').onchange = e => set({ booking: e.target.checked });
      $('#fv').onchange = e => set({ verified: e.target.checked });
      $('#fc').onclick = e => {
        const b = e.target.closest('[data-f]'); if (!b) return;
        b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true');
        set({ food: [...el.querySelectorAll('[data-f][aria-pressed="true"]')].map(x => x.dataset.f) });
      };
    }
  };
})();
