(function () {
  const bc = 'BroadcastChannel' in window ? new BroadcastChannel('foodhub-chat') : null;
  const anon = 'Foodie#' + Math.floor(100 + Math.random() * 900);
  const ago = ts => { const m = Math.round((Date.now() - ts) / 60000); return m < 1 ? 'now' : m + 'm ago'; };
  const QUICK = ['Long queue', 'No queue', 'Fresh and hot', 'Sold out'];
  FH.community = {
    mount(s, el) {
      el.innerHTML = `<h3 class="font-semibold text-sm text-white mb-2 flex items-center gap-1.5"><i class="fa-solid fa-comments text-brand"></i> Live community updates</h3>
        <div id="feed" class="h-44 overflow-y-auto rounded-xl border border-[#1b3d6a] bg-[#07192f] p-2.5 space-y-2 text-xs text-slate-300" aria-live="polite"></div>
        <div class="flex flex-wrap gap-1.5 my-2">${QUICK.map(q => `<button type="button" class="chip bg-[#0c233f] text-slate-300 border-[#1b3d6a] hover:border-brand hover:text-white" data-q="${q}">${q}</button>`).join('')}</div>
        <form id="cf" class="flex gap-2">
          <input id="ch" placeholder="Name" aria-label="Chat name (optional)" class="w-24 rounded-lg border border-[#1b3d6a] bg-[#0c233f] text-white px-2 py-1.5 text-xs focus:border-brand focus:outline-none">
          <input id="cm" placeholder="Share food / queue update..." aria-label="Message" class="flex-1 rounded-lg border border-[#1b3d6a] bg-[#0c233f] text-white px-2.5 py-1.5 text-xs focus:border-brand focus:outline-none">
          <button class="rounded-lg bg-brand hover:bg-brand-hover text-white px-3 shadow transition" aria-label="Send message"><i class="fa-solid fa-paper-plane text-xs"></i></button>
        </form>`;
      el.querySelectorAll('[data-q]').forEach(b => b.onclick = () => send(s.id, b.dataset.q));
      el.querySelector('#cf').onsubmit = e => {
        e.preventDefault();
        const i = el.querySelector('#cm'); if (i.value.trim()) send(s.id, i.value.trim()); i.value = '';
      };
    },
    feed(id) {
      const f = document.getElementById('feed'); if (!f) return;
      const a = FH.store.S.chat[id] || [];
      f.innerHTML = a.length ? a.map(m => `<div class="p-1.5 rounded-lg bg-[#0c233f] border border-[#14355f]"><b class="text-white">${FH.esc(m.u)}</b> <span class="text-[10px] text-slate-400 ml-1">${ago(m.ts)}</span><div class="text-slate-300 mt-0.5">${FH.esc(m.t)}</div></div>`).join('')
        : '<p class="text-slate-400 py-3 text-center">No messages yet. Share the first update about queue or food taste!</p>';
      f.scrollTop = f.scrollHeight;
    }
  };
  function send(id, t) {
    const name = (document.getElementById('ch') || {}).value;
    const m = { u: (name && name.trim()) || anon, t, ts: Date.now() };
    FH.store.addChat(id, m);
    if (bc) bc.postMessage({ id, m });
  }
  if (bc) bc.onmessage = e => FH.store.addChat(e.data.id, e.data.m);
})();
