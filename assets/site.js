// Navegación, botones de copiar y filtros compartidos por todas las páginas.
(function () {
  const PAGES = [
    ['index.html', 'Inicio'],
    ['areas.html', 'Por área'],
    ['agentes.html', 'Agentes'],
    ['skills.html', 'Skills'],
    ['comunicaciones.html', 'Comunicaciones'],
    ['tips.html', 'Tips'],
    ['grupos.html', 'En grupo'],
    ['glosario.html', 'Glosario'],
    ['material.html', 'Material del curso']
  ];
  const here = (location.pathname.split('/').pop() || 'index.html').replace(/^$/, 'index.html');
  const head = document.getElementById('site-head');
  if (head) {
    head.className = 'site-head';
    head.innerHTML = '<div class="wrap"><a class="brand" href="index.html"><span class="dot" aria-hidden="true">IA</span><span class="full">IA · GORE O\'Higgins</span></a><nav class="nav" aria-label="Secciones">' +
      PAGES.map(([h, t]) => `<a href="${h}"${h === here || (here === '' && h === 'index.html') ? ' aria-current="page"' : ''}>${t}</a>`).join('') + '</nav></div>';
    const cur = head.querySelector('[aria-current]');
    if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: 'nearest', inline: 'center' });
    window.scrollTo(0, 0);
  }
  const foot = document.getElementById('site-foot');
  if (foot) {
    foot.className = 'site-foot';
    foot.innerHTML = '<div class="wrap"><div>Capacitación en IA · Gobierno Regional de O\'Higgins · Noviembre de 2026<br>Relatores: Patricio Mateluna y Cristian Pavez</div><div><a href="Presentacion_Relator.html">Presentación de la jornada</a> · <a href="material.html">Documentos del curso</a></div></div>';
  }

  // Copiar: cualquier .prompt con <pre>
  document.querySelectorAll('.prompt').forEach(p => {
    const pre = p.querySelector('pre');
    if (!pre) return;
    let lbl = p.querySelector('.lbl');
    if (!lbl) { lbl = document.createElement('div'); lbl.className = 'lbl'; lbl.innerHTML = '<span>Prompt</span>'; p.prepend(lbl); }
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'copy'; b.textContent = 'Copiar';
    b.addEventListener('click', async () => {
      const txt = pre.innerText;
      try { await navigator.clipboard.writeText(txt); }
      catch (e) {
        const r = document.createRange(); r.selectNodeContents(pre);
        const s = getSelection(); s.removeAllRanges(); s.addRange(r);
        try { document.execCommand('copy'); } catch (_) {}
        s.removeAllRanges();
      }
      b.textContent = 'Copiado'; b.classList.add('ok');
      setTimeout(() => { b.textContent = 'Copiar'; b.classList.remove('ok'); }, 1600);
    });
    lbl.appendChild(b);
  });

  // Filtros: <div class="filters" data-target="#lista"> con .search y .chip[data-f="clave:valor"]
  const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  document.querySelectorAll('.filters[data-target]').forEach(f => {
    const list = document.querySelector(f.dataset.target);
    if (!list) return;
    const items = [...list.querySelectorAll('[data-item]')];
    items.forEach(it => { it._t = norm(it.textContent); });
    const input = f.querySelector('.search');
    const chips = [...f.querySelectorAll('.chip')];
    const count = document.querySelector(f.dataset.count || '#none');
    const state = {};
    const apply = () => {
      const q = norm(input ? input.value.trim() : '');
      let n = 0;
      items.forEach(it => {
        let ok = !q || it._t.includes(q);
        for (const k in state) if (state[k] && !(` ${it.dataset[k] || ''} `).includes(` ${state[k]} `)) ok = false;
        it.classList.toggle('hide', !ok); if (ok) n++;
      });
      chips.forEach(c => { const [k, v] = c.dataset.f.split(':'); c.setAttribute('aria-pressed', String((state[k] || '') === v)); });
      if (count) count.textContent = n === items.length ? `${n} elementos` : `${n} de ${items.length}`;
      list.querySelectorAll('[data-group]').forEach(g => g.classList.toggle('hide', !g.querySelector('[data-item]:not(.hide)')));
    };
    if (input) input.addEventListener('input', apply);
    chips.forEach(c => c.addEventListener('click', () => { const [k, v] = c.dataset.f.split(':'); state[k] = v; apply(); }));
    apply();
  });
})();
