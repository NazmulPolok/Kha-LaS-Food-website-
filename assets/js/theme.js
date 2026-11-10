(function () {
  window.FH = window.FH || {};

  const $ = s => document.querySelector(s);
  const STORAGE_THEME = 'foodhub_theme';
  const STORAGE_SIDEBAR = 'foodhub_sidebar';

  FH.theme = {
    get() {
      try {
        return localStorage.getItem(STORAGE_THEME) || 'dark';
      } catch (e) {
        return 'dark';
      }
    },

    set(mode) {
      if (mode !== 'light' && mode !== 'dark') mode = 'dark';
      
      document.documentElement.setAttribute('data-theme', mode);
      document.body.setAttribute('data-theme', mode);
      try {
        localStorage.setItem(STORAGE_THEME, mode);
      } catch (e) {}

      const icon = $('#theme-toggle-icon');
      const text = $('#theme-toggle-text');
      if (icon) icon.textContent = mode === 'light' ? '☀️' : '🌙';
      if (text) text.textContent = mode === 'light' ? 'Light' : 'Dark';

      // Update map tile layer if map is initialized
      if (FH.map && typeof FH.map.setTheme === 'function') {
        FH.map.setTheme(mode);
      }
    },

    toggle() {
      const current = this.get();
      const next = current === 'light' ? 'dark' : 'light';
      this.set(next);
      if (typeof FH.toast === 'function') {
        FH.toast(next === 'light' ? '☀️ Switched to Off-White Light Mode' : '🌙 Switched to Midnight Navy Dark Mode');
      }
    },

    isSidebarCollapsed() {
      const sb = $('#sidebar');
      return sb ? sb.classList.contains('collapsed') : true;
    },

    setSidebar(open) {
      const sb = $('#sidebar');
      if (!sb) return;

      if (open) {
        sb.classList.remove('collapsed');
        try { localStorage.setItem(STORAGE_SIDEBAR, 'open'); } catch (e) {}
      } else {
        sb.classList.add('collapsed');
        try { localStorage.setItem(STORAGE_SIDEBAR, 'collapsed'); } catch (e) {}
      }

      this.updateSidebarUI(open);

      // Re-calculate map dimensions after sidebar transition completes
      setTimeout(() => {
        if (FH.map && typeof FH.map.invalidate === 'function') {
          FH.map.invalidate();
        }
      }, 320);
    },

    toggleSidebar() {
      const isCurrentlyCollapsed = this.isSidebarCollapsed();
      // If collapsed, unhide it; if open, collapse it
      this.setSidebar(isCurrentlyCollapsed);
    },

    updateSidebarUI(isOpen) {
      const btnToggle = $('#btn-sidebar-toggle');
      if (btnToggle) {
        if (isOpen) {
          btnToggle.classList.add('border-brand', 'text-brand', 'ring-2', 'ring-brand/30');
          btnToggle.setAttribute('aria-expanded', 'true');
        } else {
          btnToggle.classList.remove('border-brand', 'text-brand', 'ring-2', 'ring-brand/30');
          btnToggle.setAttribute('aria-expanded', 'false');
        }
      }

      const floatBtn = $('#btn-floating-sidebar');
      const floatLabel = $('#floating-btn-label');
      if (floatBtn && floatLabel) {
        if (isOpen) {
          floatLabel.textContent = 'Hide Spots';
          floatBtn.classList.remove('animate-pulse');
        } else {
          floatLabel.textContent = 'Show Food Spots';
        }
      }
    },

    syncSpotCount(count) {
      const badge = $('#floating-count-badge');
      if (badge) badge.textContent = count;
    },

    init() {
      // 1. Initialize Theme (Dark default or saved)
      const currentTheme = this.get();
      this.set(currentTheme);

      // 2. Initialize Sidebar state
      let savedSidebar = null;
      try { savedSidebar = localStorage.getItem(STORAGE_SIDEBAR); } catch (e) {}
      
      const shouldOpen = savedSidebar === 'open';
      const sb = $('#sidebar');
      if (sb) {
        if (shouldOpen) {
          sb.classList.remove('collapsed');
        } else {
          sb.classList.add('collapsed');
        }
        this.updateSidebarUI(shouldOpen);
      }

      // 3. Attach click handlers
      const btnTheme = $('#btn-theme-toggle');
      if (btnTheme) {
        btnTheme.onclick = (e) => {
          e.preventDefault();
          this.toggle();
        };
      }

      const btnSidebarToggle = $('#btn-sidebar-toggle');
      if (btnSidebarToggle) {
        btnSidebarToggle.onclick = (e) => {
          e.preventDefault();
          this.toggleSidebar();
        };
      }

      const btnFloating = $('#btn-floating-sidebar');
      if (btnFloating) {
        btnFloating.onclick = (e) => {
          e.preventDefault();
          this.toggleSidebar();
        };
      }
    }
  };

  // Auto-init as soon as DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => FH.theme.init());
  } else {
    FH.theme.init();
  }
})();
