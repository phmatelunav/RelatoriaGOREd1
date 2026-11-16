// Mejoras progresivas: el contenido y la navegación ya están en el HTML.
(function () {
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  // "dictamenes" encuentra "dictamen", "licitaciones" encuentra "licitacion"
  const stem = t => t.length > 4 && t.endsWith('es') ? t.slice(0, -2) : (t.length > 3 && t.endsWith('s') ? t.slice(0, -1) : t);
  const tokens = q => norm(q).split(/\s+/).filter(Boolean).map(stem);
  const live = document.createElement('div');
  live.className = 'sr'; live.setAttribute('aria-live', 'polite'); document.body.appendChild(live);
  const say = t => { live.textContent = ''; setTimeout(() => { live.textContent = t; }, 30); };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ICON_COPY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>';
  const COPILOT = 'https://m365.cloud.microsoft/chat';

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
    const old = b.innerHTML; b.classList.add('ok'); b.innerHTML = ICON_COPY + label;
    setTimeout(() => { b.classList.remove('ok'); b.innerHTML = old; }, 2200);
  }
  const mkBtn = (pre, name) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'copy'; b.dataset.copy = '#' + pre.id;
    b.setAttribute('aria-label', 'Copiar: ' + name);
    b.innerHTML = ICON_COPY + 'Copiar';
    return b;
  };

  // Botones de copiar con nombres únicos
  $$('.prompt').forEach((p, i) => {
    const pre = p.querySelector('pre'); if (!pre) return;
    if (!pre.id) pre.id = 'pr' + i;
    if (p.closest('.pc')) return;
    let lbl = p.querySelector('.lbl');
    if (!lbl) { lbl = document.createElement('div'); lbl.className = 'lbl'; lbl.innerHTML = '<span>Prompt</span>'; p.prepend(lbl); }
    const own = (lbl.querySelector('span') || lbl).textContent.trim();
    const ctx = p.closest('details') ? p.closest('details').querySelector('summary') : null;
    const sec = p.closest('section') ? p.closest('section').querySelector('h2') : null;
    const where = ctx ? ctx.textContent : (sec ? sec.textContent : '');
    const name = /^(Prompt|Instrucciones)$/.test(own) && where ? `${own} · ${where.trim()}` : own;
    lbl.appendChild(mkBtn(pre, name));
  });
  $$('.pc').forEach(c => {
    const pre = c.querySelector('pre');
    c.querySelector('.head').appendChild(mkBtn(pre, 'prompt «' + c.querySelector('h3').textContent + '»'));
  });
  document.addEventListener('click', async e => {
    const b = e.target.closest('[data-copy]'); if (!b) return;
    const el = document.querySelector(b.dataset.copy);
    if (!el || !(await copyText(el.textContent.trim()))) return;
    flash(b, 'Copiado');
    const card = b.closest('.pc');
    if (card) {
      const d = card.querySelector('details'); if (d) d.open = true; // que se vea lo que se copió y qué revisar
      if (!card.querySelector('.after')) {
        const a = document.createElement('p'); a.className = 'after';
        a.innerHTML = `Copiado. Pégalo en <a href="${COPILOT}" target="_blank" rel="noopener">Copilot Chat</a> y revisa el resultado.`;
        card.querySelector('details').after(a);
      }
      say('Prompt copiado. Revisa el texto antes de usarlo.');
    } else say('Copiado');
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
    const az = $$('.az a', f);
    const noun = f.dataset.noun || 'elementos';
    const state = {};
    const keys = new Set(chips.map(c => c.dataset.f.split(':')[0]).concat(sel ? [sel.dataset.f] : []));
    const params = new URLSearchParams(location.search);
    keys.forEach(k => { if (params.get(k)) state[k] = params.get(k); });
    if (input && params.get('q')) input.value = params.get('q');

    const qs = (withQ) => {
      const p = new URLSearchParams();
      for (const k in state) if (state[k]) p.set(k, state[k]);
      if (withQ && input && input.value.trim()) p.set('q', input.value.trim());
      return p.toString();
    };
    const apply = (announce) => {
      const toks = tokens(input ? input.value : '');
      let n = 0;
      items.forEach(it => {
        let ok = toks.every(t => it._t.includes(t));
        for (const k in state) if (state[k] && !(' ' + (it.dataset[k] || '') + ' ').includes(' ' + state[k] + ' ')) ok = false;
        it.classList.toggle('hide', !ok); if (ok) n++;
      });
      $$('[data-group]', list).forEach(g => g.classList.toggle('hide', !g.querySelector('[data-item]:not(.hide)')));
      chips.forEach(c => { const [k, v] = c.dataset.f.split(':'); c.setAttribute('aria-pressed', String((state[k] || '') === v)); });
      if (sel) sel.value = state[sel.dataset.f] || '';
      az.forEach(a => { const g = document.querySelector(a.getAttribute('href')); const off = !g || g.classList.contains('hide'); a.classList.toggle('dim', off); off ? a.setAttribute('title', 'Sin resultados con el filtro actual: al tocarla se quitan los filtros') : a.removeAttribute('title'); });
      const filtered = n !== items.length;
      const txt = filtered ? `${n} de ${items.length} ${noun}` : `${items.length} ${noun}`;
      if (count) count.textContent = txt;
      if (announce) say(n ? txt : 'Sin resultados');
      if (reset) reset.classList.toggle('hide', !filtered);
      if (share) share.classList.toggle('hide', !Object.values(state).some(Boolean));
      if (empty) {
        empty.classList.toggle('hide', n > 0);
        const w = empty.querySelector('[data-q]'); if (w) w.textContent = input && input.value.trim() ? '«' + input.value.trim() + '»' : 'ese filtro';
        const where = empty.querySelector('[data-where]'); const all = empty.querySelector('[data-alldiv]');
        const div = sel && state[sel.dataset.f] ? sel.options[sel.selectedIndex].text : '';
        if (where) where.textContent = div ? ' en ' + div : '';
        if (all) all.classList.toggle('hide', !(div && input && input.value.trim()));
      }
      try { const s = qs(true); history.replaceState(null, '', (s ? '?' + s : location.pathname) + location.hash); } catch (_) {}
    };
    const jump = () => {
      const first = list.querySelector('[data-group]:not(.hide)') || list.querySelector('[data-item]:not(.hide)') || empty;
      if (!first) return;
      const r = first.getBoundingClientRect();
      if (r.top > innerHeight * 0.7 || r.top < 0) scrollTo({ top: scrollY + r.top - 76, behavior: reduced ? 'auto' : 'smooth' });
    };
    let tm;
    if (input) input.addEventListener('input', () => { clearTimeout(tm); apply(false); tm = setTimeout(() => apply(true), 600); });
    chips.forEach(c => c.addEventListener('click', () => { const [k, v] = c.dataset.f.split(':'); state[k] = v; apply(true); jump(); }));
    if (sel) sel.addEventListener('change', () => { state[sel.dataset.f] = sel.value; apply(true); jump(); });
    const clear = () => { for (const k in state) state[k] = ''; if (input) input.value = ''; apply(true); };
    if (reset) reset.addEventListener('click', clear);
    if (empty) {
      $$('[data-reset]', empty).forEach(b => b.addEventListener('click', () => { clear(); if (input) input.focus(); }));
      $$('[data-alldiv]', empty).forEach(b => b.addEventListener('click', () => { if (sel) state[sel.dataset.f] = ''; apply(true); jump(); }));
    }
    // Letras sin resultados: al tocarlas se quitan los filtros y se llega igual
    az.forEach(a => a.addEventListener('click', () => { if (a.classList.contains('dim')) { clear(); } }));
    if (share) share.addEventListener('click', async () => {
      const s = qs(false);
      const url = location.origin + location.pathname + (s ? '?' + s : '');
      const ok = await copyText(url);
      const old = share.textContent; share.textContent = ok ? 'Enlace copiado' : 'Copia el enlace de la barra de direcciones';
      say(share.textContent); setTimeout(() => { share.textContent = old; }, 1800);
    });
    // Enlace a un prompt o término: asegurar que esté visible y abierto
    const reveal = (scroll) => {
      let target = null; try { target = location.hash && list.querySelector(location.hash); } catch (_) {}
      if (!target || !target.matches('[data-item]')) return false;
      if (target.classList.contains('hide')) { for (const k in state) state[k] = ''; if (input) input.value = ''; }
      const d = target.querySelector('details'); if (d) d.open = true;
      apply(false);
      if (scroll) setTimeout(() => target.scrollIntoView({ block: 'start' }), 0);
      return true;
    };
    if (!reveal(true)) apply(false);
    addEventListener('hashchange', () => reveal(true));
  });

  // Menús desplegables: cerrar al elegir, al tocar fuera o con Esc
  const drops = $$('.menu, .more');
  drops.forEach(d => d.addEventListener('click', e => { if (e.target.closest('a')) d.open = false; }));
  document.addEventListener('click', e => drops.forEach(d => { if (d.open && !d.contains(e.target)) d.open = false; }));
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    drops.forEach(d => { if (d.open) { d.open = false; d.querySelector('summary').focus(); } });
  });

  // Volver arriba
  const top = document.querySelector('.totop');
  if (top) {
    const on = () => top.classList.toggle('on', scrollY > innerHeight * 1.5);
    addEventListener('scroll', on, { passive: true }); on();
  }
})();
