(function () {
  const $ = s => document.querySelector(s);
  const STORAGE_USER_KEY = 'foodhub_current_user_v2';
  const STORAGE_ACCOUNTS_KEY = 'foodhub_all_accounts_v2';

  const DEMO_SUGGESTIONS = [
    'rahim.foodie@gmail.com',
    'karim.taster@gmail.com',
    'sultana.dhaka@gmail.com',
    'anika.explorer@gmail.com',
    'tanvir.chow@gmail.com'
  ];

  FH.auth = {
    getUser() {
      try {
        const u = localStorage.getItem(STORAGE_USER_KEY);
        return u ? JSON.parse(u) : null;
      } catch (e) {
        return null;
      }
    },

    getAccounts() {
      try {
        const a = localStorage.getItem(STORAGE_ACCOUNTS_KEY);
        const list = a ? JSON.parse(a) : [];
        return Array.isArray(list) ? list : [];
      } catch (e) {
        return [];
      }
    },

    login(email, name) {
      email = (email || '').trim().toLowerCase();
      if (!email || !email.includes('@')) {
        FH.toast('Please enter a valid email address.');
        return false;
      }
      name = (name || '').trim() || email.split('@')[0];
      const user = { email, name, loggedInAt: Date.now() };
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));

      // Save to saved accounts list
      const accounts = this.getAccounts();
      if (!accounts.some(a => a.email === email)) {
        accounts.unshift({ email, name });
        localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts.slice(0, 10)));
      }

      FH.toast(`Signed in as ${email}`);
      FH.closeModal();
      FH.store.emit();
      return true;
    },

    logout() {
      localStorage.removeItem(STORAGE_USER_KEY);
      FH.toast('Logged out.');
      FH.store.emit();
    },

    requireAuth(callback, message) {
      const user = this.getUser();
      if (user) {
        if (typeof callback === 'function') callback(user);
        return true;
      }
      this.openAuthModal(callback, message);
      return false;
    },

    openAuthModal(callback, message) {
      const m = $('#modal');
      const accounts = this.getAccounts();
      const suggestions = accounts.length ? accounts.map(a => a.email) : DEMO_SUGGESTIONS;

      m.innerHTML = `
        <div class="bg-[#07192f] border border-[#1b3d6a] w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl relative text-white" role="dialog" aria-modal="true" aria-label="Account Login / Registration">
          <button id="auth-close" type="button" aria-label="Close" class="absolute top-4 right-4 text-slate-400 hover:text-white text-2xl leading-none">&times;</button>
          
          <div class="text-center space-y-1">
            <div class="w-12 h-12 rounded-full bg-brand/10 border border-brand/30 text-brand flex items-center justify-center mx-auto text-xl">
              <i class="fa-solid fa-user-shield"></i>
            </div>
            <h2 class="text-lg font-bold text-white">খাLaS Account</h2>
            <p class="text-xs text-slate-400">${message || 'Sign in or create an account with your Email ID to confirm spots and add new locations.'}</p>
          </div>

          <form id="auth-form" class="space-y-3">
            <div>
              <label for="auth-email" class="block text-xs font-semibold text-slate-300 mb-1">Email Address <span class="text-brand">*</span></label>
              <div class="relative">
                <i class="fa-regular fa-envelope absolute left-3 top-3 text-gray-400 text-sm"></i>
                <input id="auth-email" type="email" required placeholder="your.name@example.com" class="w-full pl-9 pr-3 py-2 border border-[#1b3d6a] bg-[#0c233f] text-white rounded-xl text-sm focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none">
              </div>
            </div>

            <div>
              <label for="auth-name" class="block text-xs font-semibold text-slate-300 mb-1">Display Name (Optional)</label>
              <div class="relative">
                <i class="fa-regular fa-user absolute left-3 top-3 text-gray-400 text-sm"></i>
                <input id="auth-name" type="text" placeholder="e.g. Rahim Ahmed" class="w-full pl-9 pr-3 py-2 border border-[#1b3d6a] bg-[#0c233f] text-white rounded-xl text-sm focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none">
              </div>
            </div>

            <button type="submit" class="w-full bg-brand hover:bg-brand-hover text-white font-semibold py-2.5 rounded-xl text-sm transition shadow-lg shadow-brand/20">
              <i class="fa-solid fa-arrow-right-to-bracket mr-1.5"></i> Continue with Email
            </button>
          </form>

          <div class="pt-2 border-t border-[#1b3d6a] space-y-2">
            <div class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <i class="fa-solid fa-bolt text-amber-500"></i> Quick Test Accounts (One-Click)
            </div>
            <p class="text-[11px] text-slate-500">Click any email below to instantly switch/test multiple user confirmations:</p>
            <div class="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              ${suggestions.map(em => `
                <button type="button" class="quick-email-chip text-xs bg-[#0c233f] hover:bg-[#102d50] hover:text-white text-slate-300 px-2 py-1 rounded-lg border border-[#1b3d6a] text-left transition" data-email="${FH.esc(em)}">
                  <i class="fa-solid fa-at text-[10px] text-slate-500 mr-1"></i>${FH.esc(em)}
                </button>
              `).join('')}
            </div>
          </div>
        </div>
      `;

      m.classList.remove('hidden');
      m.classList.add('flex');

      $('#auth-close').onclick = () => FH.closeModal();
      m.onclick = e => { if (e.target === m) FH.closeModal(); };

      m.querySelectorAll('.quick-email-chip').forEach(btn => {
        btn.onclick = () => {
          const email = btn.dataset.email;
          if (FH.auth.login(email)) {
            if (typeof callback === 'function') callback(FH.auth.getUser());
          }
        };
      });

      $('#auth-form').onsubmit = e => {
        e.preventDefault();
        const email = $('#auth-email').value;
        const name = $('#auth-name').value;
        if (FH.auth.login(email, name)) {
          if (typeof callback === 'function') callback(FH.auth.getUser());
        }
      };
    },

    renderHeader(container) {
      if (!container) return;
      const user = this.getUser();
      if (!user) {
        container.innerHTML = `
          <button id="btn-login-header" type="button" class="flex items-center gap-1.5 border border-[#1b3d6a] hover:border-brand hover:text-brand bg-[#0c233f] text-white text-xs md:text-sm font-medium px-3 py-1.5 rounded-xl transition shadow-sm">
            <i class="fa-regular fa-user"></i>
            <span>Sign In</span>
          </button>
        `;
        $('#btn-login-header').onclick = () => FH.auth.openAuthModal();
      } else {
        const initials = (user.name || user.email).charAt(0).toUpperCase();
        const userSpots = FH.store.getUserSpots ? FH.store.getUserSpots(user.email) : [];
        const myCount = userSpots.length;

        container.innerHTML = `
          <div class="flex items-center gap-2">
            <!-- My Spots Button showing how many spots this user has added -->
            <button id="btn-my-spots-header" type="button" class="flex items-center gap-1.5 bg-[#0c233f] hover:bg-[#102d50] border border-[#1b3d6a] hover:border-brand text-white text-xs font-semibold px-2.5 py-1.5 rounded-xl transition shadow-sm" title="View all ${myCount} spot(s) added by you">
              <i class="fa-solid fa-list-check"></i>
              <span class="hidden sm:inline">My Spots</span>
              <b class="bg-brand text-white px-1.5 py-0.2 rounded-full text-[10px] ml-0.5">${myCount}</b>
            </button>

            <!-- User profile avatar/button -->
            <button id="btn-user-profile" type="button" class="flex items-center gap-2 bg-[#0c233f] hover:bg-[#102d50] border border-[#1b3d6a] rounded-full py-1 pl-1 pr-2 sm:pr-3 text-xs transition" title="Signed in as ${FH.esc(user.email)} (Click to switch account)">
              <span class="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center font-bold text-xs shadow-sm">${initials}</span>
              <span class="hidden sm:inline font-medium text-slate-200 max-w-[90px] sm:max-w-[140px] truncate">${FH.esc(user.email)}</span>
            </button>

            <button id="btn-logout" type="button" title="Sign Out" class="text-slate-400 hover:text-brand text-sm p-1.5 transition">
              <i class="fa-solid fa-arrow-right-from-bracket"></i>
            </button>
          </div>
        `;

        $('#btn-my-spots-header').onclick = () => FH.spotModal.openMySpots(user);
        $('#btn-user-profile').onclick = () => FH.auth.openAuthModal(null, "Switch user account or test with another email:");
        $('#btn-logout').onclick = () => FH.auth.logout();
      }
    }
  };
})();
