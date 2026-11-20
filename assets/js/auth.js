(function () {
  const $ = s => document.querySelector(s);
  const STORAGE_USER_KEY = 'foodhub_current_user_v2';
  const STORAGE_TOKEN_KEY = 'foodhub_access_token_v1';

  FH.auth = {
    getUser() {
      try { return JSON.parse(localStorage.getItem(STORAGE_USER_KEY) || 'null'); }
      catch (_) { return null; }
    },
    getToken() { return localStorage.getItem(STORAGE_TOKEN_KEY); },

    async login(email, password, name, mode = 'login') {
      email = (email || '').trim().toLowerCase();
      try {
        const result = await FH.db.authenticate(mode, email, password, name);
        localStorage.setItem(STORAGE_TOKEN_KEY, result.access_token);
        const user = { email: result.email, name: result.name, loggedInAt: Date.now() };
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
        if (FH.db && FH.db.enabled) {
          FH.db.listCarts().then(rows => FH.store.mergeRemote(rows.map(FH.db._rowToSpot)))
            .catch(err => console.warn('[FH.auth] Could not refresh account carts:', err));
        }
        FH.toast(mode === 'signup' ? 'Account created and signed in.' : `Signed in as ${user.email}`);
        FH.closeModal();
        FH.store.emit();
        return user;
      } catch (err) {
        const error = $('#auth-error');
        if (error) error.textContent = err.message || 'Could not sign in. Check the backend connection.';
        return null;
      }
    },

    logout() {
      localStorage.removeItem(STORAGE_USER_KEY);
      localStorage.removeItem(STORAGE_TOKEN_KEY);
      FH.toast('Logged out.');
      FH.store.emit();
    },

    requireAuth(callback, message) {
      const user = this.getUser();
      if (user && this.getToken()) {
        if (typeof callback === 'function') callback(user);
        return true;
      }
      this.openAuthModal(callback, message);
      return false;
    },

    openAuthModal(callback, message) {
      const m = $('#modal');
      const isBn = FH.i18n && FH.i18n.get() === 'bn';
      m.innerHTML = `
        <div class="bg-[#07192f] border border-[#1b3d6a] w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl relative text-white" role="dialog" aria-modal="true" aria-label="${FH.t('auth_title', 'Account sign in or registration')}">
          <button id="auth-close" type="button" aria-label="Close" class="absolute top-4 right-4 text-slate-400 hover:text-white text-2xl leading-none">&times;</button>
          <div class="text-center space-y-1">
            <div class="w-12 h-12 rounded-full bg-brand/10 border border-brand/30 text-brand flex items-center justify-center mx-auto text-xl"><i class="fa-solid fa-user-shield"></i></div>
            <h2 class="text-lg font-bold text-white">${FH.t('auth_title', 'খাLaS Account')}</h2>
            <p class="text-xs text-slate-400">${FH.esc(message || FH.t('auth_desc', 'Sign in or create an account to confirm spots and add new locations.'))}</p>
          </div>
          <div class="flex rounded-xl border border-[#1b3d6a] p-1 bg-[#0c233f]">
            <button type="button" id="auth-mode-login" class="flex-1 py-2 text-sm font-semibold rounded-lg bg-brand text-white">${FH.t('login_btn', 'Sign in')}</button>
            <button type="button" id="auth-mode-signup" class="flex-1 py-2 text-sm font-semibold rounded-lg text-slate-300">${FH.t('signup_btn', 'Create account')}</button>
          </div>
          <form id="auth-form" class="space-y-3">
            <div id="auth-name-wrap" class="hidden">
              <label for="auth-name" class="block text-xs font-semibold text-slate-300 mb-1">${FH.t('name_label', 'Display name')}</label>
              <input id="auth-name" type="text" maxlength="100" autocomplete="name" placeholder="${isBn ? 'যেমন: রহিম আহমেদ' : 'e.g. Rahim Ahmed'}" class="w-full px-3 py-2 border border-[#1b3d6a] bg-[#0c233f] text-white rounded-xl text-sm focus:border-brand focus:outline-none">
            </div>
            <div>
              <label for="auth-email" class="block text-xs font-semibold text-slate-300 mb-1">${FH.t('email_label', 'Email address')} <span class="text-brand">*</span></label>
              <input id="auth-email" type="email" required autocomplete="email" placeholder="your.name@example.com" class="w-full px-3 py-2 border border-[#1b3d6a] bg-[#0c233f] text-white rounded-xl text-sm focus:border-brand focus:outline-none">
            </div>
            <div>
              <label for="auth-password" class="block text-xs font-semibold text-slate-300 mb-1">${FH.t('password_label', 'Password')} <span class="text-brand">*</span></label>
              <input id="auth-password" type="password" required minlength="8" maxlength="128" autocomplete="current-password" placeholder="${isBn ? 'কমপক্ষে ৮টি অক্ষর' : 'At least 8 characters'}" class="w-full px-3 py-2 border border-[#1b3d6a] bg-[#0c233f] text-white rounded-xl text-sm focus:border-brand focus:outline-none">
            </div>
            <p id="auth-error" class="text-xs text-rose-300 min-h-4" role="alert"></p>
            <button id="auth-submit" type="submit" class="w-full bg-brand hover:bg-brand-hover text-white font-semibold py-2.5 rounded-xl text-sm transition shadow-lg shadow-brand/20"><i class="fa-solid fa-arrow-right-to-bracket mr-1.5"></i> ${FH.t('login_btn', 'Sign in')}</button>
          </form>
        </div>`;
      m.classList.remove('hidden');
      m.classList.add('flex');
      $('#auth-close').onclick = () => FH.closeModal();
      m.onclick = e => { if (e.target === m) FH.closeModal(); };
      let mode = 'login';
      const setMode = next => {
        mode = next;
        const signup = mode === 'signup';
        $('#auth-name-wrap').classList.toggle('hidden', !signup);
        $('#auth-password').autocomplete = signup ? 'new-password' : 'current-password';
        $('#auth-mode-login').className = `flex-1 py-2 text-sm font-semibold rounded-lg ${signup ? 'text-slate-300' : 'bg-brand text-white'}`;
        $('#auth-mode-signup').className = `flex-1 py-2 text-sm font-semibold rounded-lg ${signup ? 'bg-brand text-white' : 'text-slate-300'}`;
        $('#auth-submit').innerHTML = signup ? `<i class="fa-solid fa-user-plus mr-1.5"></i> ${FH.t('signup_btn', 'Create account')}` : `<i class="fa-solid fa-arrow-right-to-bracket mr-1.5"></i> ${FH.t('login_btn', 'Sign in')}`;
        $('#auth-error').textContent = '';
      };
      $('#auth-mode-login').onclick = () => setMode('login');
      $('#auth-mode-signup').onclick = () => setMode('signup');
      $('#auth-form').onsubmit = async e => {
        e.preventDefault();
        const submit = $('#auth-submit');
        submit.disabled = true;
        const user = await this.login($('#auth-email').value, $('#auth-password').value, $('#auth-name').value, mode);
        submit.disabled = false;
        if (user && typeof callback === 'function') callback(user);
      };
    },

    renderHeader(container) {
      if (!container) return;
      const user = this.getUser();
      if (!user || !this.getToken()) {
        container.innerHTML = `<button id="btn-login-header" type="button" class="flex items-center gap-1.5 border border-[#1b3d6a] hover:border-brand hover:text-brand bg-[#0c233f] text-white text-xs md:text-sm font-medium px-3 py-1.5 rounded-xl transition shadow-sm"><i class="fa-regular fa-user"></i><span>Sign in</span></button>`;
        $('#btn-login-header').onclick = () => this.openAuthModal();
        return;
      }
      const initials = (user.name || user.email).charAt(0).toUpperCase();
      const myCount = FH.store.getUserSpots ? FH.store.getUserSpots(user.email).length : 0;
      container.innerHTML = `<div class="flex items-center gap-2">
        <button id="btn-my-spots-header" type="button" class="flex items-center gap-1.5 bg-[#0c233f] hover:bg-[#102d50] border border-[#1b3d6a] hover:border-brand text-white text-xs font-semibold px-2.5 py-1.5 rounded-xl transition shadow-sm" title="View your ${myCount} spot(s)"><i class="fa-solid fa-list-check"></i><span class="hidden sm:inline">My Spots</span><b class="bg-brand text-white px-1.5 py-0.2 rounded-full text-[10px] ml-0.5">${myCount}</b></button>
        <button id="btn-user-profile" type="button" class="flex items-center gap-2 bg-[#0c233f] hover:bg-[#102d50] border border-[#1b3d6a] rounded-full py-1 pl-1 pr-2 sm:pr-3 text-xs transition" title="Signed in as ${FH.esc(user.email)}"><span class="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center font-bold text-xs shadow-sm">${FH.esc(initials)}</span><span class="hidden sm:inline font-medium text-slate-200 max-w-[140px] truncate">${FH.esc(user.email)}</span></button>
        <button id="btn-logout" type="button" title="Sign out" class="text-slate-400 hover:text-brand text-sm p-1.5 transition"><i class="fa-solid fa-arrow-right-from-bracket"></i></button></div>`;
      $('#btn-my-spots-header').onclick = () => FH.spotModal.openMySpots(user);
      $('#btn-user-profile').onclick = () => this.openAuthModal();
      $('#btn-logout').onclick = () => this.logout();
    }
  };
})();
