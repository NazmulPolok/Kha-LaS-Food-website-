(function () {
  const DELIVERY_LABELS = {
    both: 'Available via Vendor & Online Apps (Foodpanda / Pathao)',
    aggregator: 'Available via Foodpanda & Pathao',
    vendor: 'Available via Direct Vendor Delivery',
    none: 'Dine-in only (No delivery facility)'
  };

  FH.delivery = {
    render(s, el) {
      if (!el) return;
      const hasDelivery = Boolean(s.delivery && s.delivery !== 'none');
      const label = DELIVERY_LABELS[s.delivery] || 'Dine-in only (No delivery facility)';

      el.innerHTML = `
        <div class="rounded-xl border p-3 flex items-center justify-between ${hasDelivery ? 'bg-[#0c233f] border-sky-500/40 shadow-sm' : 'bg-[#0c233f] border-[#16365f]'}">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg ${hasDelivery ? 'bg-sky-950/80 text-sky-400 border border-sky-500/30' : 'bg-[#07192f] text-slate-500 border border-[#1b3d6a]'} flex items-center justify-center text-sm shrink-0">
              <i class="fa-solid ${hasDelivery ? 'fa-motorcycle' : 'fa-ban'}"></i>
            </div>
            <div>
              <div class="font-semibold text-xs md:text-sm text-white flex items-center gap-1.5">
                <span>Delivery Facility</span>
              </div>
              <div class="text-[11px] ${hasDelivery ? 'text-sky-400 font-medium' : 'text-slate-400'}">
                ${label}
              </div>
            </div>
          </div>
          <span class="text-[10px] md:text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${hasDelivery ? 'bg-sky-950/80 text-sky-300 border border-sky-500/40' : 'bg-[#07192f] text-slate-400 border border-[#1b3d6a]'}">
            ${hasDelivery ? 'Available' : 'No Delivery'}
          </span>
        </div>
      `;
    },
    simulate() {}
  };
})();
