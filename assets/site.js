// Mejoras progresivas: el contenido y la navegación ya están en el HTML.
(function () {
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const live = document.createElement('div');
  live.className = 'sr'; live.setAttribute('aria-live', 'polite'); document.body.appendChild(live);
  const say = t => { live.textContent = ''; setTimeout(() => { live.textContent = t; }, 30); };
  const ICON_COPY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>';

  async function copyText(txt) {
    try { await navigator.clipboard.writeText(txt); return true; }
    catch (e) {
      const ta = document.createElement('textarea'); ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch (_) {}
      ta.remove(); return ok;
    }
  }
  function flash(b, label) {
    const old = b.innerHTML; b.classList.add('ok'); b.innerHTML = ICON_COPY + label; say(label);
    setTimeout(() => { b.classList.remove('ok'); b.innerHTML = old; }, 1600);
  }

  // Botones de copiar: [data-copy="#id"] o .prompt con <pre>
  $$('.prompt').forEach((p, i) => {
    const pre = p.querySelector('pre'); if (!pre) return;
    if (!pre.id) pre.id = 'pr' + i;
    if (p.closest('.pc')) return; // las tarjetas de Por área traen su propio botón
    let lbl = p.querySelector('.lbl');
    if (!lbl) { lbl = document.createElement('div'); lbl.className = 'lbl'; lbl.innerHTML = '<span>Prompt</span>'; p.prepend(lbl); }
    const name = (lbl.querySelector('span') || lbl).textContent.trim();
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'copy'; b.dataset.copy = '#' + pre.id;
    b.setAttribute('aria-label', 'Copiar: ' + name);
    b.innerHTML = ICON_COPY + 'Copiar';
    lbl.appendChild(b);
  });
  $$('.pc').forEach(c => {
    const pre = c.querySelector('pre'); const h = c.querySelector('h3');
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'copy'; b.dataset.copy = '#' + pre.id;
    b.setAttribute('aria-label', 'Copiar prompt: ' + h.textContent);
    b.innerHTML = ICON_COPY + 'Copiar';
    c.querySelector('.head').appendChild(b);
  });
  document.addEventListener('click', async e => {
    const b = e.target.closest('[data-copy]'); if (!b) return;
    const el = document.querySelector(b.dataset.copy);
    if (el && await copyText(el.textContent.trim())) flash(b, 'Copiado');
  });

  // Filtros
  $$('.filters[data-target]').forEach(f => {
    const list = document.querySelector(f.dataset.target);
    const empty = document.querySelector(f.dataset.empty || '#none');
    const items = $$('[data-item]', list);
    items.forEach(it => { it._t = norm(it.textContent); });
    const input = f.querySelector('.search');
    const chips = $$('.chip', f);
    const sel = f.querySelector('.sel');
    const count = f.querySelector('.count');
    const reset = f.querySelector('.reset');
    const share = f.querySelector('.share');
    const noun = f.dataset.noun || 'elementos';
    const state = {};
    const params = new URLSearchParams(location.search);
    chips.concat(sel ? [sel] : []).forEach(c => { const k = (c.dataset.f || '').split(':')[0]; if (params.get(k)) state[k] = params.get(k); });
    if (input && params.get('q')) input.value = params.get('q');

    const sync = () => {
      const p = new URLSearchParams();
      for (const k in state) if (state[k]) p.set(k, state[k]);
      if (input && input.value.trim()) p.set('q', input.value.trim());
      const qs = p.toString();
      try { history.replaceState(null, '', qs ? '?' + qs : location.pathname); } catch (_) {}
      return qs;
    };
    const apply = (announce) => {
      const q = norm(input ? input.value.trim() : '');
      let n = 0;
      items.forEach(it => {
        let ok = !q || it._t.includes(q);
        for (const k in state) if (state[k] && !(' ' + (it.dataset[k] || '') + ' ').includes(' ' + state[k] + ' ')) ok = false;
        it.classList.toggle('hide', !ok); if (ok) n++;
      });
      $$('[data-group]', list).forEach(g => g.classList.toggle('hide', !g.querySelector('[data-item]:not(.hide)')));
      chips.forEach(c => { const [k, v] = c.dataset.f.split(':'); c.setAttribute('aria-pressed', String((state[k] || '') === v)); });
      if (sel) sel.value = state[sel.dataset.f] || '';
      const filtered = n !== items.length;
      const txt = filtered ? `${n} de ${items.length} ${noun}` : `${items.length} ${noun}`;
      if (count) count.textContent = txt;
      if (announce) say(n ? txt : 'Sin resultados');
      if (reset) reset.classList.toggle('hide', !filtered);
      if (share) share.classList.toggle('hide', !Object.values(state).some(Boolean));
      if (empty) {
        empty.classList.toggle('hide', n > 0);
        const w = empty.querySelector('[data-q]'); if (w) w.textContent = input && input.value.trim() ? '«' + input.value.trim() + '»' : 'ese filtro';
      }
      sync();
    };
    const jump = () => {
      const first = list.querySelector('[data-group]:not(.hide)') || list.querySelector('[data-item]:not(.hide)') || empty;
      if (!first) return;
      const r = first.getBoundingClientRect();
      if (r.top > innerHeight * 0.7 || r.top < 0) {
        const off = 76;
        scrollTo({ top: scrollY + r.top - off, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      }
    };
    let tm;
    if (input) input.addEventListener('input', () => { clearTimeout(tm); apply(false); tm = setTimeout(() => apply(true), 600); });
    chips.forEach(c => c.addEventListener('click', () => { const [k, v] = c.dataset.f.split(':'); state[k] = v; apply(true); jump(); }));
    if (sel) sel.addEventListener('change', () => { state[sel.dataset.f] = sel.value; apply(true); jump(); });
    const clear = () => { for (const k in state) state[k] = ''; if (input) input.value = ''; apply(true); };
    if (reset) reset.addEventListener('click', clear);
    $$('[data-reset]').forEach(b => b.addEventListener('click', () => { clear(); if (input) input.focus(); }));
    if (share) share.addEventListener('click', async () => {
      const ok = await copyText(location.href);
      const old = share.textContent; share.textContent = ok ? 'Enlace copiado' : 'Copia el enlace de la barra de direcciones';
      say(share.textContent); setTimeout(() => { share.textContent = old; }, 1800);
    });
    apply(false);
  });

  // Menú móvil: cerrar al elegir o con Esc
  const menu = document.querySelector('.menu');
  if (menu) {
    menu.addEventListener('click', e => { if (e.target.closest('a')) menu.open = false; });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && menu.open) { menu.open = false; menu.querySelector('summary').focus(); } });
  }

  // Volver arriba
  const top = document.querySelector('.totop');
  if (top) {
    const on = () => top.classList.toggle('on', scrollY > innerHeight * 1.5);
    addEventListener('scroll', on, { passive: true }); on();
  }
})();
