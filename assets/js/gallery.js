(function () {
  const $ = s => document.querySelector(s);
  const DEFAULT_FALLBACK = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80';

  FH.gallery = {
    fallback: DEFAULT_FALLBACK,

    mount(s, el) {
      if (!el) return;
      const photos = (s.photos && s.photos.length) ? s.photos : [DEFAULT_FALLBACK];
      let activeIndex = 0;

      const render = () => {
        el.innerHTML = `
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <i class="fa-solid fa-camera text-brand"></i> Spot Photos (${photos.length})
              </span>
              <button id="btn-add-spot-photo" type="button" class="text-xs text-brand hover:text-brand-hover hover:underline font-semibold flex items-center gap-1">
                <i class="fa-solid fa-plus-circle"></i> Add Photo
              </button>
            </div>

            <!-- Main Featured Image -->
            <div class="relative w-full h-52 sm:h-56 rounded-2xl overflow-hidden bg-[#07192f] border border-[#1b3d6a] group cursor-pointer shadow-md">
              <img id="gallery-main-img" src="${photos[activeIndex]}" alt="${FH.esc(s.name)}" class="w-full h-full object-cover transition duration-300 group-hover:scale-105" onerror="this.src='${DEFAULT_FALLBACK}'">
              
              <!-- Dark gradient overlay at bottom -->
              <div class="absolute inset-0 bg-gradient-to-t from-[#07192f]/80 via-transparent to-black/30 pointer-events-none"></div>

              <!-- Top photo counter badge -->
              <div class="absolute top-3 left-3 bg-[#07192f]/80 backdrop-blur-sm text-white text-[11px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow border border-white/10">
                <i class="fa-solid fa-camera text-brand"></i>
                <span id="gallery-counter">${activeIndex + 1} / ${photos.length}</span>
              </div>

              <!-- Zoom hint button -->
              <div class="absolute top-3 right-3 bg-[#07192f]/80 hover:bg-black/90 backdrop-blur-sm text-white w-8 h-8 rounded-full flex items-center justify-center text-xs shadow transition border border-white/10" title="Click to view full screen">
                <i class="fa-solid fa-expand"></i>
              </div>

              <!-- Bottom caption -->
              <div class="absolute bottom-3 inset-x-3 text-white text-xs flex items-center justify-between pointer-events-none">
                <span class="font-medium drop-shadow truncate pr-2">Photo ${activeIndex + 1} of ${FH.esc(s.name)}</span>
                <span class="text-[10px] text-slate-300 bg-black/60 px-2 py-0.5 rounded-full shrink-0">Click to expand</span>
              </div>

              <!-- Prev / Next arrows (if more than 1 photo) -->
              ${photos.length > 1 ? `
                <button id="gallery-prev" type="button" aria-label="Previous photo" class="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center text-xs backdrop-blur-sm transition z-10 border border-white/10">
                  <i class="fa-solid fa-chevron-left"></i>
                </button>
                <button id="gallery-next" type="button" aria-label="Next photo" class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center text-xs backdrop-blur-sm transition z-10 border border-white/10">
                  <i class="fa-solid fa-chevron-right"></i>
                </button>
              ` : ''}
            </div>

            <!-- Thumbnail Strip (3 to 5+ pictures) -->
            <div class="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5">
              ${photos.map((p, idx) => `
                <button type="button" data-idx="${idx}" class="gallery-thumb relative w-16 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition ${idx === activeIndex ? 'border-brand ring-2 ring-brand/40 scale-105 shadow-md shadow-brand/20' : 'border-[#1b3d6a] opacity-70 hover:opacity-100'}">
                  <img src="${p}" alt="Thumbnail ${idx + 1}" class="w-full h-full object-cover" onerror="this.src='${DEFAULT_FALLBACK}'">
                </button>
              `).join('')}
            </div>
          </div>
        `;

        // Image click opens lightbox
        const mainImgContainer = el.querySelector('#gallery-main-img').parentElement;
        mainImgContainer.onclick = e => {
          if (e.target.closest('#gallery-prev') || e.target.closest('#gallery-next')) return;
          FH.gallery.openLightbox(photos, activeIndex, s.name);
        };

        // Thumbnail clicks
        el.querySelectorAll('.gallery-thumb').forEach(btn => {
          btn.onclick = () => {
            activeIndex = +btn.dataset.idx;
            render();
          };
        });

        // Prev & Next buttons
        const prev = el.querySelector('#gallery-prev');
        if (prev) {
          prev.onclick = e => {
            e.stopPropagation();
            activeIndex = (activeIndex - 1 + photos.length) % photos.length;
            render();
          };
        }
        const next = el.querySelector('#gallery-next');
        if (next) {
          next.onclick = e => {
            e.stopPropagation();
            activeIndex = (activeIndex + 1) % photos.length;
            render();
          };
        }

        // Add photo button
        const btnAdd = el.querySelector('#btn-add-spot-photo');
        if (btnAdd) {
          btnAdd.onclick = () => {
            FH.auth.requireAuth(user => {
              FH.gallery.openUploadModal(s);
            }, "Please sign in with your email to add photos to this spot.");
          };
        }
      };

      render();
    },

    openLightbox(photos, startIndex, spotName) {
      const m = $('#modal');
      let curr = startIndex || 0;

      const renderLb = () => {
        m.innerHTML = `
          <div class="bg-black/95 fixed inset-0 flex flex-col items-center justify-between p-4 z-[2500]" role="dialog" aria-modal="true">
            <!-- Header bar -->
            <div class="w-full max-w-4xl flex items-center justify-between text-white py-2 border-b border-white/10">
              <div class="flex items-center gap-2">
                <i class="fa-solid fa-camera text-brand"></i>
                <span class="font-semibold text-sm md:text-base">${FH.esc(spotName)}</span>
                <span class="text-xs text-gray-400">(${curr + 1} of ${photos.length})</span>
              </div>
              <button id="lb-close" type="button" class="text-white hover:text-orange-400 text-3xl leading-none px-2">&times;</button>
            </div>

            <!-- Main Large Image Container -->
            <div class="relative flex-1 w-full max-w-4xl flex items-center justify-center my-3 overflow-hidden select-none">
              <img src="${photos[curr]}" alt="${FH.esc(spotName)}" class="max-h-[75vh] max-w-full rounded-xl object-contain shadow-2xl transition duration-200">
              
              ${photos.length > 1 ? `
                <button id="lb-prev" type="button" class="absolute left-2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-lg backdrop-blur-md transition">
                  <i class="fa-solid fa-chevron-left"></i>
                </button>
                <button id="lb-next" type="button" class="absolute right-2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-lg backdrop-blur-md transition">
                  <i class="fa-solid fa-chevron-right"></i>
                </button>
              ` : ''}
            </div>

            <!-- Thumbnails footer -->
            <div class="w-full max-w-2xl flex items-center justify-center gap-2 overflow-x-auto py-2">
              ${photos.map((p, i) => `
                <button type="button" data-lb-idx="${i}" class="w-14 h-12 rounded-lg overflow-hidden border-2 transition ${i === curr ? 'border-brand scale-110' : 'border-white/30 opacity-60 hover:opacity-100'}">
                  <img src="${p}" class="w-full h-full object-cover">
                </button>
              `).join('')}
            </div>
          </div>
        `;

        $('#lb-close').onclick = () => FH.closeModal();
        const pBtn = $('#lb-prev'), nBtn = $('#lb-next');
        if (pBtn) pBtn.onclick = () => { curr = (curr - 1 + photos.length) % photos.length; renderLb(); };
        if (nBtn) nBtn.onclick = () => { curr = (curr + 1) % photos.length; renderLb(); };

        m.querySelectorAll('[data-lb-idx]').forEach(b => {
          b.onclick = () => { curr = +b.dataset.lbIdx; renderLb(); };
        });
      };

      m.classList.remove('hidden');
      m.classList.add('flex');
      renderLb();
    },

    openUploadModal(s) {
      const m = $('#modal');
      m.innerHTML = `
        <div class="bg-[#07192f] border border-[#1b3d6a] w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl relative text-white" role="dialog" aria-modal="true" aria-label="Add Photo to Spot">
          <button id="upload-close" type="button" aria-label="Close" class="absolute top-4 right-4 text-slate-400 hover:text-white text-2xl leading-none">&times;</button>
          
          <div>
            <h2 class="text-lg font-bold text-white flex items-center gap-2">
              <i class="fa-solid fa-camera text-brand"></i> Add Photo to ${FH.esc(s.name)}
            </h2>
            <p class="text-xs text-slate-400">Upload an image file or paste an image URL to help the community verify this spot.</p>
          </div>

          <form id="upload-photo-form" class="space-y-3">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Select Image File</label>
              <input id="up-file" type="file" accept="image/*" class="w-full text-xs text-slate-300 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand file:text-white hover:file:bg-brand-hover cursor-pointer">
            </div>

            <div class="text-center text-xs text-slate-500 font-semibold">— OR —</div>

            <div>
              <label for="up-url" class="block text-xs font-semibold text-slate-300 mb-1">Image Web URL</label>
              <input id="up-url" type="url" placeholder="https://example.com/photo.jpg" class="w-full px-3 py-2 border border-[#1b3d6a] bg-[#0c233f] text-white rounded-xl text-xs focus:border-brand focus:outline-none">
            </div>

            <div id="up-preview" class="hidden w-full h-36 rounded-xl overflow-hidden border border-[#1b3d6a] bg-[#0c233f] relative">
              <img id="up-preview-img" src="" class="w-full h-full object-cover">
            </div>

            <button type="submit" class="w-full bg-brand hover:bg-brand-hover text-white font-semibold py-2.5 rounded-xl text-sm transition shadow-lg shadow-brand/20">
              <i class="fa-solid fa-cloud-arrow-up mr-1.5"></i> Add Photo
            </button>
          </form>
        </div>
      `;

      m.classList.remove('hidden');
      m.classList.add('flex');

      $('#upload-close').onclick = () => FH.closeModal();
      m.onclick = e => { if (e.target === m) FH.closeModal(); };

      let selectedDataUrl = '';

      $('#up-file').onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
          selectedDataUrl = ev.target.result;
          $('#up-preview-img').src = selectedDataUrl;
          $('#up-preview').classList.remove('hidden');
        };
        reader.readAsDataURL(file);
      };

      $('#up-url').oninput = e => {
        const url = e.target.value.trim();
        if (url) {
          selectedDataUrl = url;
          $('#up-preview-img').src = selectedDataUrl;
          $('#up-preview').classList.remove('hidden');
        }
      };

      $('#upload-photo-form').onsubmit = e => {
        e.preventDefault();
        const url = selectedDataUrl || $('#up-url').value.trim();
        if (!url) return FH.toast('Please select an image file or paste an image URL.');
        if (FH.store.addPhoto(s.id, url)) {
          FH.toast('Photo added successfully! Thanks for contributing.');
          FH.closeModal();
        }
      };
    }
  };
})();
