// Mejoras progresivas: el contenido y la navegación ya están en el HTML.
(function () {
  const root = document.documentElement;
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  // Plurales simples: "dictamenes" → "dictamen", "actas" → "acta"
  const stem = t => t.length > 4 && t.endsWith('es') ? t.slice(0, -2) : (t.length > 3 && t.endsWith('s') ? t.slice(0, -1) : t);
  const tokens = q => norm(q).split(/[^a-z0-9]+/).filter(Boolean).map(stem);
  const words = s => norm(s).split(/[^a-z0-9]+/).filter(Boolean);
  const live = document.createElement('div');
  live.className = 'sr'; live.setAttribute('aria-live', 'polite'); document.body.appendChild(live);
  const say = t => { live.textContent = ''; setTimeout(() => { live.textContent = t; }, 30); };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = { get: k => { try { return localStorage.getItem(k); } catch (_) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (_) {} } };
  const ICON_COPY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>';
  const ICON_X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
  const COPILOT = 'https://m365.cloud.microsoft/chat';
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  // ---------- Tema claro / oscuro ----------
  const dark = matchMedia('(prefers-color-scheme: dark)');
  const isDark = () => (root.getAttribute('data-theme') || (dark.matches ? 'dark' : 'light')) === 'dark';
  const syncTheme = () => {
    const d = isDark();
    $$('.theme').forEach(b => { b.setAttribute('aria-label', d ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'); b.setAttribute('aria-pressed', String(d)); });
    $$('meta[name="theme-color"]').forEach(m => { m.setAttribute('content', d ? '#191512' : '#f6f1e8'); m.removeAttribute('media'); });
  };
  $$('.theme').forEach(b => b.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    root.setAttribute('data-theme', next); store.set('tema', next); syncTheme();
    say(next === 'dark' ? 'Modo oscuro activado' : 'Modo claro activado');
  }));
  dark.addEventListener('change', syncTheme);
  syncTheme();

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

  // ---------- Botones de copiar ----------
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
    if (!card) { say('Copiado'); return; }
    // Confirmación junto al botón: siguiente paso y qué revisar
    let done = card.querySelector('.done');
    if (!done) {
      const rv = card.querySelector('.check span');
      done = document.createElement('div'); done.className = 'done';
      done.innerHTML = `<div class="row"><b>Copiado.</b><a href="${COPILOT}" target="_blank" rel="noopener">Abrir Copilot Chat →</a></div>` +
        (rv ? '<div class="rv">Pégalo allí y, antes de usar el resultado, revisa lo que indica el recuadro de esta tarjeta.</div>' : '');
      card.querySelector('.head').after(done);
    }
    say('Prompt copiado. Pégalo en Copilot Chat y revisa el resultado.');
  });
  // Enlace a un prompt: copia una dirección limpia, sin filtros
  document.addEventListener('click', async e => {
    const a = e.target.closest('[data-share]'); if (!a) return;
    e.preventDefault();
    const url = location.origin + location.pathname + '#' + a.dataset.share;
    const ok = await copyText(url);
    const old = a.innerHTML;
    a.lastChild.textContent = ok ? 'Enlace copiado' : 'No se pudo copiar';
    say(ok ? 'Enlace al prompt copiado' : 'No se pudo copiar el enlace');
    setTimeout(() => { a.innerHTML = old; }, 1800);
  });

  // ---------- Filtros ----------
  $$('.filters[data-target]').forEach(f => {
    const list = document.querySelector(f.dataset.target);
    const empty = document.querySelector(f.dataset.empty || '#none');
    const items = $$('[data-item]', list);
    items.forEach(it => {
      it._w = words(it.textContent);
      const h = it.querySelector('h3'); it._h = words(h ? h.textContent : '');
    });
    const input = f.querySelector('.search');
    const chips = $$('.chip', f);
    const sel = f.querySelector('.sel');
    const count = f.querySelector('.count');
    const reset = f.querySelector('.reset');
    const share = f.querySelector('.share');
    const az = $$('.az a', f);
    const stick = document.querySelector('.fstick');
    const noun = f.dataset.noun || 'elementos';
    const state = {};
    const keys = new Set(chips.map(c => c.dataset.f.split(':')[0]).concat(sel ? [sel.dataset.f] : []));
    const params = new URLSearchParams(location.search);
    let target = null; try { target = location.hash && list.querySelector(location.hash); } catch (_) {}
    if (target && !target.matches('[data-item]')) target = null;
    if (!target) {
      keys.forEach(k => { if (params.get(k) !== null) state[k] = params.get(k); });
      if (input && params.get('q')) input.value = params.get('q');
      if (f.dataset.default && !params.toString() && !['intermedio', 'avanzado'].includes(root.getAttribute('data-nivel'))) { const [k, v] = f.dataset.default.split('='); if (state[k] === undefined) state[k] = v; }
    }

    const qs = (withQ) => {
      const p = new URLSearchParams();
      for (const k in state) if (state[k] || (f.dataset.default && f.dataset.default.startsWith(k + '='))) p.set(k, state[k]);
      if (withQ && input && input.value.trim()) p.set('q', input.value.trim());
      return p.toString();
    };
    const label = () => sel && state[sel.dataset.f] ? sel.options[[...sel.options].findIndex(o => o.value === state[sel.dataset.f])].text : '';
    const apply = (announce) => {
      const toks = tokens(input ? input.value : '');
      let n = 0;
      items.forEach(it => {
        let ok = toks.every(t => it._w.some(w => w.startsWith(t)));
        for (const k in state) if (state[k] && !(' ' + (it.dataset[k] || '') + ' ').includes(' ' + state[k] + ' ')) ok = false;
        it.classList.toggle('hide', !ok); if (ok) n++;
        it.style.order = toks.length && toks.every(t => it._h.some(w => w.startsWith(t))) ? '-1' : '';
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
      if (share) share.classList.toggle('hide', !(sel && state[sel.dataset.f]));
      if (empty) {
        empty.classList.toggle('hide', n > 0);
        const w = empty.querySelector('[data-q]'); if (w) w.textContent = input && input.value.trim() ? '«' + input.value.trim() + '»' : 'ese filtro';
        const where = empty.querySelector('[data-where]'); const all = empty.querySelector('[data-alldiv]');
        if (where) where.textContent = label() ? ' en ' + label() : '';
        if (all) all.classList.toggle('hide', !(label() && input && input.value.trim()));
      }
      if (stick) {
        stick.querySelector('[data-fs-div]').textContent = label() || (input && input.value.trim() ? '«' + input.value.trim() + '»' : 'Todas las divisiones');
        stick.querySelector('[data-fs-n]').textContent = `${n} ${noun}`;
        stick._active = filtered;
        stick.classList.toggle('on', !!(stick._active && stick._out));
      }
      try { const s = qs(true); history.replaceState(null, '', (s ? '?' + s : location.pathname) + location.hash); } catch (_) {}
    };
    const jump = () => {
      const first = list.querySelector('[data-group]:not(.hide)') || list.querySelector('[data-item]:not(.hide)') || empty;
      if (!first) return;
      const r = first.getBoundingClientRect();
      if (r.top > innerHeight * 0.7 || r.top < 0) scrollTo({ top: scrollY + r.top - 110, behavior: reduced ? 'auto' : 'smooth' });
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
    az.forEach(a => a.addEventListener('click', () => { if (a.classList.contains('dim')) clear(); }));
    if (share) share.addEventListener('click', async () => {
      const s = qs(false);
      const ok = await copyText(location.origin + location.pathname + (s ? '?' + s : ''));
      const old = share.textContent; share.textContent = ok ? 'Enlace copiado' : 'Copia el enlace de la barra de direcciones';
      say(share.textContent); setTimeout(() => { share.textContent = old; }, 1800);
    });
    // Línea fija con el filtro activo cuando los controles salen de la vista
    if (stick && 'IntersectionObserver' in window) {
      new IntersectionObserver(([en]) => { stick._out = !en.isIntersecting && en.boundingClientRect.top < 0; stick.classList.toggle('on', !!(stick._active && stick._out)); }, { rootMargin: '-64px 0px 0px 0px' }).observe(f);
      stick.querySelector('[data-fs-change]').addEventListener('click', () => {
        scrollTo({ top: scrollY + f.getBoundingClientRect().top - 80, behavior: reduced ? 'auto' : 'smooth' });
        setTimeout(() => (sel || input).focus({ preventScroll: true }), reduced ? 0 : 400);
      });
    }
    // Llegar a un prompt o término por enlace: visible y abierto
    const reveal = () => {
      let t = null; try { t = location.hash && list.querySelector(location.hash); } catch (_) {}
      if (!t || !t.matches('[data-item]')) return;
      if (t.classList.contains('hide')) { for (const k in state) state[k] = ''; if (input) input.value = ''; apply(false); }
      const d = t.querySelector('details'); if (d) d.open = true;
      setTimeout(() => t.scrollIntoView({ block: 'start' }), 0);
    };
    apply(false);
    if (target) reveal();
    addEventListener('hashchange', reveal);
  });


  // ---------- Curso por niveles ----------
  const LV = { basico: 'Básico', intermedio: 'Intermedio', avanzado: 'Avanzado' };
  const RANK = { basico: 1, intermedio: 2, avanzado: 3 };
  const urlLv = new URLSearchParams(location.search).get('nivel');
  if (LV[urlLv] && document.querySelector('[data-route]')) store.set('nivel', urlLv);
  const level = () => root.getAttribute('data-nivel');
  const setLevel = v => { root.setAttribute('data-nivel', v); store.set('nivel', v); };
  let prog = {}; try { prog = JSON.parse(store.get('progreso') || '{}') || {}; } catch (_) { prog = {}; }
  const saveProg = () => store.set('progreso', JSON.stringify(prog));
  const routeDone = r => $$(`[data-route="${r}"] [data-mod]`).filter(c => prog[c.dataset.mod]).length;

  // Página del curso: mostrar la ruta elegida y el avance
  const routes = $$('[data-route]');
  if (routes.length) {
    const show = (v, scroll) => {
      if (!LV[v]) return;
      setLevel(v);
      routes.forEach(r => r.classList.toggle('show', r.dataset.route === v));
      $$('.seg [data-lvl]').forEach(a => a.setAttribute('aria-pressed', String(a.dataset.lvl === v)));
      try { history.replaceState(null, '', '?nivel=' + v + location.hash); } catch (_) {}
      if (scroll) document.getElementById(v).scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' });
    };
    $$('.seg [data-lvl]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); show(a.dataset.lvl, false); say('Nivel ' + LV[a.dataset.lvl]); }));
    const paint = () => routes.forEach(r => {
      const boxes = $$('[data-mod]', r); const d = routeDone(r.dataset.route);
      const pr = r.querySelector('.prog'); if (pr) { pr.querySelector('i').style.width = (100 * d / boxes.length) + '%'; pr.querySelector('span').textContent = `${d} de ${boxes.length}`; }
      boxes.forEach(c => { c.checked = !!prog[c.dataset.mod]; c.closest('.mod').classList.toggle('done', c.checked); });
    });
    $$('[data-mod]').forEach(c => c.addEventListener('change', () => {
      prog[c.dataset.mod] = c.checked; saveProg(); paint();
      const r = c.closest('[data-route]'); const n = $$('[data-mod]', r).length;
      say(c.checked ? `Módulo completado. ${routeDone(r.dataset.route)} de ${n}.` : 'Módulo marcado como pendiente');
    }));
    paint();
    if (level()) show(level(), location.hash === '#ruta');
  }

  // Portada: retomar el curso
  const resume = document.querySelector('[data-resume]');
  if (resume && LV[level()]) {
    const total = 6, d = Object.keys(prog).filter(k => prog[k] && k[0] === level()[0]).length;
    resume.innerHTML = `<span>Tu nivel: <b>${LV[level()]}</b> · ${d} de ${total} módulos</span><a class="btn" href="curso.html?nivel=${level()}#ruta">Continuar mi curso</a>`;
    resume.classList.remove('hide');
    $$('.lvl').forEach(a => a.setAttribute('aria-current', String(a.dataset.lvl === level())));
  }

  // Otras páginas: adaptar al nivel elegido
  const main = document.querySelector('main');
  if (main && LV[level()] && !routes.length && !resume) {
    const hidden = $$('[data-min]', main).filter(el => RANK[el.dataset.min] > RANK[level()]);
    const pageLv = main.dataset.nivelPagina;
    const above = pageLv && RANK[pageLv] > RANK[level()];
    if (hidden.length || above) {
      const note = document.createElement('div'); note.className = 'lvlnote'; note.setAttribute('role', 'note');
      const msg = above
        ? `Esta página es de nivel <b>${LV[pageLv]}</b> y tu curso es <b>${LV[level()]}</b>: puedes leerla igual o volver a tu ruta.`
        : `Estás en el nivel <b>${LV[level()]}</b>: ocultamos ${hidden.length === 1 ? 'una sección' : hidden.length + ' secciones'} de nivel más alto.`;
      note.innerHTML = `<span>${msg}</span>` + (hidden.length ? '<button type="button" data-all>Mostrar todo</button>' : '') + `<a href="curso.html?nivel=${level()}#ruta">Ir a mi ruta</a><a href="curso.html#elegir">Cambiar nivel</a>`;
      const head = main.querySelector('.page-head');
      (head || main.firstElementChild).after(note);
      const all = note.querySelector('[data-all]');
      if (all) all.addEventListener('click', () => { root.setAttribute('data-vertodo', ''); all.remove(); note.querySelector('span').textContent = 'Mostrando todo el contenido de esta página.'; });
      $$('.toc-nav a', main).forEach(a => { const t = document.querySelector(a.getAttribute('href')); if (t && hidden.includes(t)) a.addEventListener('click', () => root.setAttribute('data-vertodo', '')); });
    }
  }

  // ---------- Definición de términos del glosario ----------
  let pop = null, popFrom = null;
  const closePop = (focusBack) => { if (!pop) return; pop.remove(); pop = null; if (focusBack && popFrom) popFrom.focus(); popFrom = null; };
  document.addEventListener('click', e => {
    const a = e.target.closest('a.gt[data-def]');
    if (!a) { if (pop && !pop.contains(e.target)) closePop(false); return; }
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    if (popFrom === a) { closePop(true); return; }
    closePop(false);
    const term = (a.getAttribute('href').split('#')[1] || '');
    const title = { textContent: a.dataset.term || a.textContent };
    pop = document.createElement('div');
    pop.className = 'pop'; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Definición de ' + a.textContent);
    pop.innerHTML = `<button type="button" class="x" aria-label="Cerrar">${ICON_X}</button><h3>${esc(title ? title.textContent : a.textContent)}</h3><p>${esc(a.dataset.def)}</p><a href="${esc(a.getAttribute('href'))}">Ver en el glosario →</a>`;
    document.body.appendChild(pop);
    popFrom = a;
    const r = a.getBoundingClientRect();
    const w = Math.min(360, innerWidth - 24);
    pop.style.left = Math.max(12, Math.min(scrollX + r.left, scrollX + innerWidth - w - 12)) + 'px';
    pop.style.top = (scrollY + r.bottom + 8) + 'px';
    pop.querySelector('.x').addEventListener('click', () => closePop(true));
    pop.querySelector('.x').focus({ preventScroll: true });
  });

  // ---------- Menús desplegables ----------
  const drops = $$('.menu, .more');
  drops.forEach(d => d.addEventListener('click', e => { if (e.target.closest('a')) d.open = false; }));
  document.addEventListener('click', e => drops.forEach(d => { if (d.open && !d.contains(e.target)) d.open = false; }));
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (pop) { closePop(true); return; }
    drops.forEach(d => { if (d.open) { d.open = false; d.querySelector('summary').focus(); } });
  });

  // ---------- Volver arriba: solo al subir, para no tapar contenido mientras se lee ----------
  const top = document.querySelector('.totop');
  if (top) {
    let last = scrollY;
    const on = () => { const up = scrollY < last; top.classList.toggle('on', up && scrollY > innerHeight * 1.5); last = scrollY; };
    addEventListener('scroll', on, { passive: true });
  }
})();
