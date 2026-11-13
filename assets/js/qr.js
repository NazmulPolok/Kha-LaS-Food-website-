/* ============================================================
   Vendor QR code — qrcode.js (davidshimjs)
   ------------------------------------------------------------
   Generates a scannable, downloadable QR code that points to
   the cart profile deep link (`?cart=<id>`). The app opens that
   cart automatically when the link is scanned.
   ============================================================ */
(function () {
  const CDN_PRIMARY = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
  const CDN_FALLBACK = 'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js';
  let loadPromise = null;

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => window.QRCode ? resolve(window.QRCode) : reject(new Error('QRCode missing'));
      script.onerror = () => reject(new Error('Could not load ' + src));
      document.head.appendChild(script);
    });
  }

  function loadLibrary() {
    if (window.QRCode) return Promise.resolve(window.QRCode);
    if (loadPromise) return loadPromise;
    loadPromise = loadScript(CDN_PRIMARY)
      .catch(() => loadScript(CDN_FALLBACK))
      .then((QRCode) => QRCode);
    return loadPromise;
  }

  function profileUrl(spot) {
    const url = new URL(window.location.href);
    url.hash = '';
    url.search = '';
    url.searchParams.set('cart', spot.id);
    return url.toString();
  }

  FH.qr = {
    profileUrl,
    open(spot) {
      if (!spot) return;
      const modal = document.getElementById('modal');
      if (!modal) return;
      const url = profileUrl(spot);

      modal.innerHTML = `
        <div class="bg-[#07192f] border border-[#1b3d6a] w-full max-w-sm rounded-2xl p-5 space-y-4 shadow-2xl relative text-white" role="dialog" aria-modal="true" aria-label="Share cart QR code">
          <button id="qr-close" type="button" aria-label="Close" class="absolute top-3.5 right-4 text-slate-400 hover:text-white text-2xl leading-none">&times;</button>

          <div class="text-center space-y-1 pr-6">
            <div class="w-11 h-11 rounded-full bg-brand/10 border border-brand/30 text-brand flex items-center justify-center mx-auto text-lg">
              <i class="fa-solid fa-qrcode"></i>
            </div>
            <h2 class="text-base font-bold text-white">Vendor QR Code</h2>
            <p class="text-[11px] text-slate-400">Scan to open <b class="text-slate-200">${escapeHtml(spot.name)}</b> — print it and stick it on the cart.</p>
          </div>

          <div class="qr-box mx-auto w-full max-w-[248px] rounded-2xl bg-white p-3 border border-[#1b3d6a] shadow-xl min-h-[248px] flex items-center justify-center">
            <div id="qr-target" class="w-full">
              <div class="text-slate-500 text-xs flex items-center justify-center gap-2 py-16">
                <i class="fa-solid fa-spinner fa-spin"></i> Generating…
              </div>
            </div>
          </div>

          <div class="rounded-lg border border-[#1b3d6a] bg-[#0c233f] p-2">
            <div class="text-[9px] uppercase tracking-wider text-slate-500 font-bold mb-1">Profile link</div>
            <div class="text-[10px] text-slate-300 break-all font-mono leading-relaxed">${escapeHtml(url)}</div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <button id="qr-download" type="button" disabled class="rounded-xl bg-brand hover:bg-brand-hover disabled:opacity-50 text-white text-xs font-bold py-2.5 flex items-center justify-center gap-1.5 shadow-lg shadow-brand/20 transition">
              <i class="fa-solid fa-download"></i> Download PNG
            </button>
            <button id="qr-copy" type="button" class="rounded-xl bg-[#0c233f] hover:bg-[#102d50] border border-[#1b3d6a] text-slate-200 text-xs font-semibold py-2.5 flex items-center justify-center gap-1.5 transition">
              <i class="fa-solid fa-link"></i> Copy link
            </button>
          </div>

          <button id="qr-open" type="button" class="w-full text-[11px] text-slate-400 hover:text-brand transition">
            <i class="fa-solid fa-arrow-up-right-from-square mr-1"></i> Preview cart profile
          </button>
        </div>`;

      modal.classList.remove('hidden');
      modal.classList.add('flex');

      const close = () => FH.closeModal();
      document.getElementById('qr-close').onclick = close;
      modal.onclick = (e) => { if (e.target === modal) close(); };

      document.getElementById('qr-copy').onclick = async () => {
        try {
          await navigator.clipboard.writeText(url);
          FH.toast('Profile link copied.');
        } catch (e) {
          window.prompt('Copy this cart link:', url);
        }
      };
      document.getElementById('qr-open').onclick = () => { window.location.href = url; };

      loadLibrary().then((QRCode) => {
        const target = document.getElementById('qr-target');
        if (!target) return;
        target.innerHTML = '';
        new QRCode(target, {
          text: url,
          width: 512,
          height: 512,
          colorDark: '#07192f',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.H
        });

        const download = document.getElementById('qr-download');
        if (download) {
          download.disabled = false;
          download.onclick = () => {
            const canvas = target.querySelector('canvas');
            const img = target.querySelector('img');
            const dataUrl = canvas ? canvas.toDataURL('image/png') : (img && img.src);
            if (!dataUrl) {
              FH.toast('QR image is not ready yet. Please try again.');
              return;
            }
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `khalas-qr-${String(spot.id).replace(/[^a-z0-9_-]/gi, '-')}.png`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            FH.toast('QR code downloaded.');
          };
        }
      }).catch((err) => {
        console.warn('[FH.qr] Library failed:', err);
        const target = document.getElementById('qr-target');
        if (target) {
          target.innerHTML = `<p class="text-rose-500 text-xs text-center p-4">Could not load the QR library. Check your connection and try again.</p>`;
        }
      });
    }
  };
})();
