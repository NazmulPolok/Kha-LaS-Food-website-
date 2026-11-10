(function () {
  FH.booking = {
    mount(s, el) {
      if (!el) return;
      const hasBooking = Boolean(s.hasBooking);
      el.innerHTML = `
        <div class="rounded-xl border p-3 flex items-center justify-between ${hasBooking ? 'bg-[#0c233f] border-emerald-500/40 shadow-sm' : 'bg-[#0c233f] border-[#16365f]'}">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg ${hasBooking ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30' : 'bg-[#07192f] text-slate-500 border border-[#1b3d6a]'} flex items-center justify-center text-sm shrink-0">
              <i class="fa-solid ${hasBooking ? 'fa-calendar-check' : 'fa-calendar-xmark'}"></i>
            </div>
            <div>
              <div class="font-semibold text-xs md:text-sm text-white flex items-center gap-1.5">
                <span>Table Booking Facility</span>
              </div>
              <div class="text-[11px] ${hasBooking ? 'text-emerald-400 font-medium' : 'text-slate-400'}">
                ${hasBooking ? 'Table reservation is available at this spot' : 'Walk-in only (No table booking facility)'}
              </div>
            </div>
          </div>
          <span class="text-[10px] md:text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${hasBooking ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40' : 'bg-[#07192f] text-slate-400 border border-[#1b3d6a]'}">
            ${hasBooking ? 'Available' : 'No Booking'}
          </span>
        </div>
      `;
    }
  };
})();
