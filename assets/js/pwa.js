/* ============================================================
   PWA bootstrap
   ------------------------------------------------------------
   Registers the service worker, exposes an "Install" action when
   the browser fires beforeinstallprompt, and shows simple online
   / offline feedback.
   ============================================================ */
(function () {
  let installPrompt = null;

  function makeInstallButton() {
    if (document.getElementById('btn-install-app')) return;

    const target = document.getElementById('map-actions');
    const button = document.createElement('button');
    button.id = 'btn-install-app';
    button.type = 'button';
    button.className = 'hidden items-center gap-2 bg-[#0c233f] border border-[#14355f] text-white hover:text-brand hover:border-brand px-3 py-2 rounded-xl text-xs font-bold shadow-2xl transition active:scale-95';
    button.title = 'Install খাLaS on this device';
    button.innerHTML = '<i class="fa-solid fa-download text-brand"></i><span>Install</span>';

    if (target) {
      target.appendChild(button);
    } else {
      button.classList.add('fixed');
      button.style.bottom = '1rem';
      button.style.left = '1rem';
      button.style.zIndex = '1200';
      document.body.appendChild(button);
    }

    button.onclick = async () => {
      if (!installPrompt) {
        FH.toast('On iPhone: Share → Add to Home Screen.');
        return;
      }
      installPrompt.prompt();
      const result = await installPrompt.userChoice;
      if (result && result.outcome === 'accepted') FH.toast('Installing খাLaS…');
      installPrompt = null;
      button.classList.add('hidden');
      button.classList.remove('flex');
    };
  }

  FH.pwa = {
    init() {
      if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('./sw.js?v=20').then((reg) => {
            if (reg) reg.update();
          }).catch((err) => {
            console.warn('[FH.pwa] Service worker registration failed:', err);
          });
        });
      }

      window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        installPrompt = event;
        makeInstallButton();
        const button = document.getElementById('btn-install-app');
        if (button) {
          button.classList.remove('hidden');
          button.classList.add('flex');
        }
      });

      window.addEventListener('appinstalled', () => {
        installPrompt = null;
        const button = document.getElementById('btn-install-app');
        if (button) button.remove();
        if (typeof FH.toast === 'function') FH.toast('খাLaS installed. Find it on your home screen!');
      });

      if (typeof FH.toast === 'function') {
        window.addEventListener('offline', () => FH.toast('You are offline — cached map screens still work.'));
        window.addEventListener('online', () => FH.toast('Back online — live cart status and reviews are syncing.'));
      }
    }
  };

  // Exposed so the map action button can be created for iOS manual installs too.
  FH.pwa.showInstallHint = () => {
    makeInstallButton();
    const button = document.getElementById('btn-install-app');
    if (button) {
      button.classList.remove('hidden');
      button.classList.add('flex');
    }
  };
})();
