"""Genera las partes repetidas del sitio directamente en el HTML (sin depender de JavaScript).

Uso:  python3 tools/build.py
Reemplaza el contenido entre marcadores <!--@nombre--> y <!--/@nombre--> en cada página.
Datos: data/prompts.json, data/glosario.json, data/material.json.
"""
import html, json, re, unicodedata, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
E = lambda s: html.escape(str(s), quote=True)
PAGES = ['index', 'areas', 'agentes', 'skills', 'comunicaciones', 'tips', 'grupos', 'glosario', 'material']

NAV = [
    ('', [('index.html', 'Inicio')]),
    ('Usar', [('areas.html', 'Por área'), ('tips.html', 'Tips')]),
    ('Crear', [('agentes.html', 'Agentes'), ('skills.html', 'Skills'), ('comunicaciones.html', 'Comunicaciones')]),
    ('Practicar', [('grupos.html', 'En grupo'), ('material.html', 'Material')]),
    ('Consultar', [('glosario.html', 'Glosario')]),
]

MARK = ('<svg viewBox="0 0 34 34" aria-hidden="true"><rect width="34" height="34" rx="9" fill="var(--accent)"/>'
        '<path d="M4 23c4-5 7-7 10-4 3-6 7-9 10-6 2-2 4-2 6 0" fill="none" stroke="var(--accent-ink)" stroke-width="2" stroke-linecap="round"/>'
        '<path d="M6 28h22" stroke="var(--accent-ink)" stroke-width="2" stroke-linecap="round" opacity=".55"/>'
        '<circle cx="24" cy="9" r="2.5" fill="var(--accent-ink)"/></svg>')
ICON_MENU = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'
ICON_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 11l3 3 8-8"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/></svg>'
ICON_UP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>'


def nav(cur, label):
    out = [f'<nav class="nav" aria-label="{label}">']
    for g, links in NAV:
        out.append('<div class="grp">' + (f'<span class="gl">{g}</span>' if g else '<span class="gl">General</span>') + '<ul>')
        for h, t in links:
            a = ' aria-current="page"' if h == cur else ''
            out.append(f'<li><a href="{h}"{a}>{t}</a></li>')
        out.append('</ul></div>')
    out.append('</nav>')
    return ''.join(out)


def header(page):
    cur = page + '.html'
    return ('<a class="skip" href="#contenido">Saltar al contenido</a>'
            '<header class="site-head"><div class="wrap">'
            f'<a class="brand" href="index.html">{MARK}<span><b>IA en el GORE</b><small>Gobierno Regional de O\'Higgins</small></span></a>'
            + nav(cur, 'Secciones') +
            f'<details class="menu"><summary>{ICON_MENU}Secciones</summary><div class="panel">{nav(cur, "Secciones del sitio")}</div></details>'
            '</div></header>')


def footer(page):
    return ('<footer class="site-foot"><div class="wrap">'
            '<p class="m0">Capacitación en IA · Gobierno Regional de O\'Higgins · Noviembre de 2026<br>Relatores: Patricio Mateluna y Cristian Pavez</p>'
            '<ul><li><a href="material.html">Documentos del curso</a></li><li><a href="Presentacion_Relator.html">Presentación de la jornada (para computador)</a></li></ul>'
            '</div></footer>'
            f'<a class="totop" href="#top" aria-label="Volver arriba">{ICON_UP}</a>')


def mark_brackets(s):
    return re.sub(r'(\[[^\]\n]{1,80}\])', r'<mark>\1</mark>', E(s))


def areas():
    d = json.loads((ROOT / 'data/prompts.json').read_text(encoding='utf-8'))
    A, P = d['areas'], d['prompts']
    opts = ''.join(f'<option value="{k}">{E(v)}</option>' for k, v in A.items())
    chips = ''.join(f'<button type="button" class="chip" data-f="area:{k}">{E(v)}</button>' for k, v in A.items())
    out = [
        '<div class="filters" data-target="#list" data-empty="#empty" data-noun="prompts">',
        '<div class="frow"><label class="sr" for="q">Buscar en los prompts</label>',
        '<input id="q" class="search" type="search" placeholder="Busca: acta, licitación, comunicado, oficio…" autocomplete="off">',
        f'<label class="sr" for="div">Tu división</label><select id="div" class="sel only-m" data-f="area"><option value="">Todas las divisiones</option>{opts}</select></div>',
        f'<div class="chips only-d" role="group" aria-label="Filtrar por división"><button type="button" class="chip" data-f="area:">Todas</button>{chips}</div>',
        '<div class="fmeta"><span class="count">' + f'{len(P)} prompts' + '</span>',
        '<button type="button" class="linkbtn share hide">Copiar enlace de esta división</button>',
        '<button type="button" class="linkbtn reset hide">Quitar filtros</button></div>',
        '</div>',
        '<p class="sub mt">Cambia lo que está <mark>[destacado]</mark> por tus datos. Si el prompt dice «adjunto», sube el archivo al chat; si tiene datos personales, anonimízalo antes o no lo subas.</p>',
        '<div id="list">'
    ]
    extra = {'com': ('comunicaciones.html', 'Imagen, video y audio con IA en la página de Comunicaciones'),
             'jur': ('skills.html#dictamenes', 'Cómo buscar dictámenes de la Contraloría con IA')}
    for k, v in A.items():
        items = [p for p in P if p['area'] == k]
        out.append(f'<section data-group id="{k}"><div class="ghead"><h2>{E(v)}</h2>')
        if k in extra:
            out.append(f'<a class="more" href="{extra[k][0]}">{E(extra[k][1])} →</a>')
        out.append('</div><div class="grid g2">')
        for i, p in enumerate(items, 1):
            pid = f'p-{k}-{i}'
            rev = (f'<p class="check">{ICON_CHECK}<span><b>Revisa:</b> {E(p["revisa"])}</span></p>' if p.get('revisa') else '')
            link = (f'<a class="more" href="{p["enlace"][0]}">{E(p["enlace"][1])} →</a>' if p.get('enlace') else '')
            out.append(f'<article class="card pc" data-item data-area="{k}"><div class="head"><h3>{E(p["titulo"])}</h3></div>'
                       f'<p class="sit">{E(p["situacion"])}</p>'
                       f'<details><summary>Ver prompt</summary><div class="prompt"><pre id="{pid}">{mark_brackets(p["prompt"])}</pre></div></details>'
                       f'{rev}{link}</article>')
        out.append('</div></section>')
    out.append('</div>')
    out.append('<div class="empty hide" id="empty" role="status"><p>No encontramos prompts para <b data-q>esa búsqueda</b>.</p>'
               '<p>Prueba con otra palabra, revisa todas las divisiones o arma tu propio prompt con la fórmula de abajo.</p>'
               '<button type="button" class="btn ghost" data-reset>Ver todos los prompts</button></div>')
    return '\n'.join(out), len(P)


def slug(t):
    t = unicodedata.normalize('NFD', t.lower()).encode('ascii', 'ignore').decode()
    t = re.sub(r'\(.*?\)', '', t)
    return re.sub(r'[^a-z0-9]+', '-', t).strip('-')


def glosario():
    G = json.loads((ROOT / 'data/glosario.json').read_text(encoding='utf-8'))
    first = lambda t: unicodedata.normalize('NFD', t[0].upper()).encode('ascii', 'ignore').decode() or t[0].upper()
    letters = []
    for g in G:
        L = first(g['termino'])
        if not letters or letters[-1][0] != L:
            letters.append((L, []))
        letters[-1][1].append(g)
    nb = sum(1 for g in G if g['nivel'] == 'b')
    out = ['<div class="filters" data-target="#gl-list" data-empty="#gl-empty" data-noun="conceptos">',
           '<div class="frow"><label class="sr" for="gq">Buscar en el glosario</label><input id="gq" class="search" type="search" placeholder="Busca un concepto: token, RAG, agente…" autocomplete="off">',
           '<div class="chips" role="group" aria-label="Nivel">',
           '<button type="button" class="chip" data-f="nivel:">Todos</button>',
           f'<button type="button" class="chip" data-f="nivel:b">Básicos ({nb})</button>',
           f'<button type="button" class="chip" data-f="nivel:a">Avanzados ({len(G) - nb})</button></div></div>',
           '<div class="fmeta"><span class="count">' + f'{len(G)} conceptos' + '</span><button type="button" class="linkbtn reset hide">Quitar filtros</button></div>',
           '<ul class="az" aria-label="Ir a la letra">' + ''.join(f'<li><a href="#letra-{L}">{L}</a></li>' for L, _ in letters) + '</ul>',
           '</div><div id="gl-list">']
    for L, items in letters:
        out.append(f'<section class="letter" data-group id="letra-{L}"><h2>{L}</h2><div class="gl">')
        for g in items:
            tag = '<span class="tag adv">Avanzado</span>' if g['nivel'] == 'a' else '<span class="tag">Básico</span>'
            out.append(f'<article class="gi" id="{slug(g["termino"])}" data-item data-nivel="{g["nivel"]}"><div class="tags">{tag}</div><h3>{E(g["termino"])}</h3><p>{E(g["definicion"])}</p></article>')
        out.append('</div></section>')
    out.append('</div><div class="empty hide" id="gl-empty" role="status"><p>No encontramos <b data-q>ese concepto</b> en el glosario.</p>'
               '<p>Prueba con otra palabra o pregúntale a Copilot: «Explícame qué es [concepto] en palabras simples, con un ejemplo de un gobierno regional».</p>'
               '<button type="button" class="btn ghost" data-reset>Ver todo el glosario</button></div>')
    return '\n'.join(out), len(G)


def material():
    F = json.loads((ROOT / 'data/material.json').read_text(encoding='utf-8'))
    res = {}
    for g in ('g1', 'g2'):
        rows = []
        for f in (x for x in F if x['grupo'] == g):
            ex = f['ejercicio'].replace('G1-', 'Ejercicio ').replace('G2-', 'Ejercicio ')
            rows.append(f'<div class="file"><div class="code">{E(f["codigo"])}</div><div><h3>{E(f["titulo"])}</h3><p>{E(f["descripcion"])}</p>'
                        f'<div class="tags"><span class="tag">{E(f["formato"])}</span><span class="tag">{E(ex)}</span></div></div>'
                        f'<a class="dl" href="Kit_participantes/{E(f["archivo"])}" download aria-label="Descargar {E(f["codigo"])}: {E(f["titulo"])}">Descargar</a></div>')
        res[g] = '\n'.join(rows)
    return res


def put(s, name, content):
    pat = re.compile(r'(<!--@' + name + r'-->)(.*?)(<!--/@' + name + r'-->)', re.S)
    assert pat.search(s), name
    return pat.sub(lambda m: m.group(1) + content + m.group(3), s)


def main():
    a_html, a_n = areas()
    g_html, g_n = glosario()
    mat = material()
    for p in PAGES:
        f = ROOT / f'{p}.html'
        s = f.read_text(encoding='utf-8')
        s = put(s, 'header', header(p))
        s = put(s, 'footer', footer(p))
        if '<!--@nprompts-->' in s: s = put(s, 'nprompts', str(a_n))
        if '<!--@nglos-->' in s: s = put(s, 'nglos', str(g_n))
        if p == 'areas': s = put(s, 'areas', a_html)
        if p == 'glosario': s = put(s, 'glosario', g_html)
        if p == 'material':
            s = put(s, 'g1', mat['g1']); s = put(s, 'g2', mat['g2'])
        f.write_text(s, encoding='utf-8')
    print('ok', a_n, 'prompts,', g_n, 'conceptos')


if __name__ == '__main__':
    main()
