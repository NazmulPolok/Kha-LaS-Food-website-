/* ============================================================
   Live status card — Open / Closed
   ------------------------------------------------------------
   Sellers (cart creators) toggle the live status. The change is
   written to the local store immediately and to FastAPI when
   available. The frontend polls the API for updates on other devices.
   ============================================================ */
(function () {
  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function timeAgo(ts) {
    if (!ts) return '';
    const seconds = Math.max(0, (Date.now() - Number(ts)) / 1000);
    if (seconds < 60) return 'just now';
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.round(hours / 24)}d ago`;
  }

  FH.status = {
    canManage(spot) {
      const user = FH.auth.getUser();
      if (!user) return false;
      // Seeded/demo carts are manageable by any signed-in tester.
      return spot.creator === user.email || spot.creator === 'system' || !spot.creator;
    },

    mount(spot, el) {
      if (!el || !spot) return;

      const user = FH.auth.getUser();
      const isOpen = spot.status !== 'closed';
      const canManage = this.canManage(spot);
      const updated = spot.statusUpdatedAt ? timeAgo(spot.statusUpdatedAt) : '';

      el.innerHTML = `
        <div class="rounded-xl border ${isOpen ? 'border-emerald-500/40' : 'border-rose-500/40'} bg-gradient-to-br from-[#0c233f] to-[#07192f] p-3.5 space-y-2.5" id="live-status-card">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.14em] flex items-center gap-1.5">
                <i class="fa-solid fa-signal text-brand"></i> Live status
              </div>
              <div class="flex items-center gap-2 mt-1">
                <span class="fh-live-dot ${isOpen ? 'open' : 'closed'}"></span>
                <span class="font-bold text-base ${isOpen ? 'text-emerald-300' : 'text-rose-300'}">
                  ${isOpen ? 'Open now' : 'Closed'}
                </span>
              </div>
              <p class="text-[11px] text-slate-400 mt-0.5">
                ${updated ? `Updated ${updated}` : 'Freshly listed'}
                ${spot.statusUpdatedBy ? ` · by ${escapeHtml(String(spot.statusUpdatedBy).split('@')[0])}` : ''}
              </p>
            </div>

            <button type="button" data-status-toggle role="switch" aria-checked="${isOpen}"
              aria-label="Toggle cart live status"
              class="fh-switch ${isOpen ? 'is-on' : ''} ${canManage ? '' : 'is-locked'}"
              title="${canManage ? 'Toggle Open / Closed' : 'Sign in as the vendor to update status'}">
              <span class="fh-switch-knob"></span>
            </button>
          </div>

          <div class="flex items-center gap-1.5 text-[11px] ${canManage ? 'text-slate-400' : 'text-amber-300'}">
            <i class="fa-solid ${canManage ? 'fa-store' : 'fa-lock'}"></i>
            ${canManage
              ? '<span>Vendor control · updates live for everyone</span>'
              : `<span>${user ? 'Only the cart creator can update this status.' : 'Vendor? Sign in to update this cart.'}</span>`}
          </div>
        </div>`;

      const button = el.querySelector('[data-status-toggle]');
      if (!button) return;

      button.onclick = async () => {
        const activeUser = FH.auth.getUser();
        if (!activeUser) {
          FH.auth.openAuthModal(
            () => FH.status.mount(spot, el),
            `Sign in with the vendor email to change the live status of "${spot.name}".`
          );
          return;
        }
        if (!FH.status.canManage(spot)) {
          FH.toast('Only the cart creator can change its live status.');
          return;
        }

        const next = spot.status === 'closed' ? 'open' : 'closed';
        button.disabled = true;
        button.classList.add('opacity-60');

        spot.status = next;
        spot.statusUpdatedAt = Date.now();
        spot.statusUpdatedBy = activeUser.email;
        FH.store.save();
        FH.store.emit();

        FH.toast(next === 'open' ? '🟢 Cart marked Open — customers can see it live.' : '🔴 Cart marked Closed.');

        if (FH.db && FH.db.enabled) {
          try {
            await FH.db.updateStatus(spot, next);
          } catch (err) {
            console.warn('[FH.status] FastAPI update failed:', err);
            FH.toast('Status saved on this device. It will sync when the backend is reachable.');
          }
        }
      };
    }
  };
})();
