"""Genera las partes repetidas del sitio directamente en el HTML (sin depender de JavaScript).

Uso:  python3 tools/build.py
Reemplaza el contenido entre marcadores <!--@nombre--> y <!--/@nombre--> en cada página
y enlaza al glosario la primera mención de los términos clave dentro de <main>.
Datos: data/prompts.json, data/glosario.json, data/material.json.
"""
import html, json, re, unicodedata, pathlib
from html.parser import HTMLParser

ROOT = pathlib.Path(__file__).resolve().parent.parent
E = lambda s: html.escape(str(s), quote=True)
PAGES = ['index', 'areas', 'agentes', 'skills', 'comunicaciones', 'tips', 'grupos', 'glosario', 'material', 'plataformas', 'ia-local']
REVISADO = '16 de noviembre de 2026'

# Menú de escritorio: lo principal a la vista y el resto en "Más".
TOP = [('areas.html', 'Por área'), ('agentes.html', 'Agentes'), ('skills.html', 'Skills'),
       ('comunicaciones.html', 'Comunicaciones'), ('glosario.html', 'Glosario')]
MORE = [('plataformas.html', 'Claude, ChatGPT y Gemini'), ('ia-local.html', 'IA local'), ('tips.html', 'Tips'), ('grupos.html', 'En grupo'), ('material.html', 'Material del curso')]
# Menú móvil: agrupado por intención.
GROUPS = [
    ('General', [('index.html', 'Inicio')]),
    ('Usar', [('areas.html', 'Por área'), ('tips.html', 'Tips')]),
    ('Crear', [('agentes.html', 'Agentes'), ('skills.html', 'Skills'), ('comunicaciones.html', 'Comunicaciones')]),
    ('Profundizar', [('plataformas.html', 'Claude, ChatGPT y Gemini'), ('ia-local.html', 'IA local')]),
    ('Practicar', [('grupos.html', 'En grupo'), ('material.html', 'Material')]),
    ('Consultar', [('glosario.html', 'Glosario')]),
]

MARK = ('<svg viewBox="0 0 34 34" aria-hidden="true"><rect width="34" height="34" rx="9" fill="var(--accent)"/>'
        '<path d="M4 23c4-5 7-7 10-4 3-6 7-9 10-6 2-2 4-2 6 0" fill="none" stroke="var(--accent-ink)" stroke-width="2" stroke-linecap="round"/>'
        '<path d="M6 28h22" stroke="var(--accent-ink)" stroke-width="2" stroke-linecap="round" opacity=".55"/>'
        '<circle cx="24" cy="9" r="2.5" fill="var(--accent-ink)"/></svg>')
ICON_MENU = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'
ICON_DOWN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>'
ICON_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 11l3 3 8-8"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/></svg>'
ICON_UP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>'
ICON_SUN = '<svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg>'
ICON_MOON = '<svg class="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11z"/></svg>'
ICON_LINK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>'


def cur_attr(h, cur):
    return ' aria-current="page"' if h == cur else ''


def nav_desktop(cur):
    more_cur = any(h == cur for h, _ in MORE)
    items = ''.join(f'<li><a href="{h}"{cur_attr(h, cur)}>{t}</a></li>' for h, t in TOP)
    more = ''.join(f'<li><a href="{h}"{cur_attr(h, cur)}>{t}</a></li>' for h, t in MORE)
    return (f'<nav class="nav" aria-label="Secciones"><ul>{items}'
            f'<li><details class="more"><summary{" class=\"on\"" if more_cur else ""}>Más{ICON_DOWN}</summary><ul class="drop">{more}</ul></details></li>'
            '</ul></nav>')


def nav_mobile(cur):
    out = ['<nav class="mnav" aria-label="Secciones del sitio">']
    for g, links in GROUPS:
        out.append(f'<div class="mgrp"><span class="mlbl">{g}</span><ul>')
        out += [f'<li><a href="{h}"{cur_attr(h, cur)}>{t}</a></li>' for h, t in links]
        out.append('</ul></div>')
    out.append('</nav>')
    return ''.join(out)


def header(page):
    cur = page + '.html'
    return ('<a class="skip" href="#contenido">Saltar al contenido</a>'
            '<header class="site-head"><div class="wrap">'
            f'<a class="brand" href="index.html">{MARK}<span><b>IA en el GORE</b><small>Gobierno Regional de O\'Higgins</small></span></a>'
            + nav_desktop(cur) +
            f'<button type="button" class="theme js-only" aria-label="Cambiar a modo oscuro">{ICON_SUN}{ICON_MOON}</button>'
            f'<details class="menu"><summary>{ICON_MENU}<span class="ml">Secciones</span></summary><div class="panel">{nav_mobile(cur)}</div></details>'
            '</div></header>')


def footer(page):
    return ('<div class="wrap"><div class="divider" aria-hidden="true"></div></div>'
            '<footer class="site-foot"><div class="wrap">'
            '<p class="m0">Capacitación en IA · Gobierno Regional de O\'Higgins · Noviembre de 2026<br>Relatores: Patricio Mateluna y Cristian Pavez</p>'
            '<ul><li><a href="material.html">Documentos del curso</a></li><li><a href="Presentacion_Relator.html">Presentación de la jornada (para computador)</a></li></ul>'
            '</div></footer>'
            f'<a class="totop" href="#top" aria-label="Volver arriba">{ICON_UP}</a>')


def mark_brackets(s):
    return re.sub(r'(\[[^\]\n]{1,80}\])', r'<mark>\1</mark>', E(s))


EMPTY_ART = '<div class="divider sm" aria-hidden="true"></div>'


def areas():
    d = json.loads((ROOT / 'data/prompts.json').read_text(encoding='utf-8'))
    A, P = d['areas'], d['prompts'] + comms_prompts()
    opts = ''.join(f'<option value="{k}">{E(v)}</option>' for k, v in A.items())
    jumps = ''.join(f'<li><a href="#{k}">{E(v)}</a></li>' for k, v in A.items())
    out = [
        '<div class="filters js-only" data-target="#list" data-empty="#empty" data-noun="prompts" data-key="area">',
        '<div class="frow"><label class="sr" for="q">Buscar en los prompts</label>',
        '<input id="q" class="search" type="search" placeholder="Busca: acta, licitación, comunicado, oficio…" autocomplete="off">',
        f'<label class="sr" for="div">Tu división</label><select id="div" class="sel" data-f="area"><option value="">Todas las divisiones</option>{opts}</select></div>',
        '<div class="fmeta"><span class="count">' + f'{len(P)} prompts' + '</span>',
        '<button type="button" class="linkbtn share hide">Copiar enlace de esta división</button>',
        '<button type="button" class="linkbtn reset hide">Quitar filtros</button></div>',
        '</div>',
        '<div class="fstick js-only" aria-hidden="true"><span><b data-fs-div></b> · <span data-fs-n></span></span><button type="button" class="linkbtn" data-fs-change>Cambiar</button></div>',
        f'<nav class="jumps nojs-only" aria-label="Ir a una división"><ul>{jumps}</ul></nav>',
        '<p class="sub mt">Cambia lo que está <mark>[destacado]</mark> por tus datos. Si el prompt dice «adjunto», sube el archivo al chat; si tiene datos personales, anonimízalo antes o no lo subas.</p>',
        '<div id="list">'
    ]
    extra = {'com': ('comunicaciones.html', 'Imagen, video y audio con IA en la página de Comunicaciones'),
             'jur': ('skills.html#dictamenes', 'Cómo buscar dictámenes de la Contraloría con IA')}
    for k, v in A.items():
        items = [p for p in P if p['area'] == k]
        out.append(f'<section data-group id="{k}"><div class="ghead"><h2>{E(v)}</h2>')
        if k in extra:
            out.append(f'<a class="more-link" href="{extra[k][0]}">{E(extra[k][1])} →</a>')
        out.append('</div><div class="grid g2 pcs">')
        for i, p in enumerate(items, 1):
            cid = f'{k}-{i}'
            rev = (f'<p class="check">{ICON_CHECK}<span><b>Revisa:</b> {E(p["revisa"])}</span></p>' if p.get('revisa') else '')
            link = (f'<a class="more-link" href="{p["enlace"][0]}">{E(p["enlace"][1])} →</a>' if p.get('enlace') else '')
            out.append(f'<article class="card pc" id="{cid}" data-item data-area="{k}"><div class="head"><h3>{E(p["titulo"])}</h3></div>'
                       f'<p class="sit">{E(p["situacion"])}</p>'
                       f'<details><summary><span class="o">Ver prompt</span><span class="c">Ocultar prompt</span></summary><div class="prompt"><pre id="p-{cid}">{mark_brackets(p["prompt"])}</pre></div></details>'
                       f'{rev}<div class="foot"><a class="plink" href="#{cid}" data-share="{cid}">{ICON_LINK}Enlace a este prompt</a>{link}</div></article>')
        out.append('</div></section>')
    out.append('</div>')
    out.append('<div class="empty hide" id="empty" role="status">' + EMPTY_ART +
               '<p>No encontramos prompts para <b data-q>esa búsqueda</b><span data-where></span>.</p>'
               '<p>Prueba con otra palabra o arma tu propio prompt con la fórmula de abajo.</p>'
               '<div class="eact"><button type="button" class="btn ghost hide" data-alldiv>Buscar en todas las divisiones</button>'
               '<button type="button" class="btn ghost" data-reset>Ver todos los prompts</button></div></div>')
    out.append(f'<p class="updated">Revisado el {REVISADO}.</p>')
    return '\n'.join(out), len(P)


def comms_prompts():
    # Los prompts de la página de Comunicaciones también se buscan desde Por área.
    s = (ROOT / 'comunicaciones.html').read_text(encoding='utf-8')
    out = []
    for m in re.finditer(r'<div class="prompt"><div class="lbl"><span>(.*?)</span></div><pre>(.*?)</pre></div>', s, re.S):
        sec = re.findall(r'<section id="([^"]+)">\s*<h2>(.*?)</h2>', s[:m.start()])
        sid, sname = sec[-1] if sec else ('', 'Comunicaciones')
        label = html.unescape(re.sub('<[^>]+>', '', m.group(1)))
        text = html.unescape(re.sub('<[^>]+>', '', m.group(2)))
        out.append({'area': 'com', 'titulo': label, 'situacion': f'{html.unescape(sname)}: prompt de la página de Comunicaciones.',
                    'prompt': text, 'revisa': 'Que no aparezcan personas reales y que la herramienta permita uso institucional.',
                    'enlace': [f'comunicaciones.html#{sid}', 'Ver en contexto en Comunicaciones']})
    return out


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
    out = ['<div class="filters" data-target="#gl-list" data-empty="#gl-empty" data-noun="conceptos" data-default="nivel=b">',
           '<div class="frow js-only"><label class="sr" for="gq">Buscar en el glosario</label><input id="gq" class="search" type="search" placeholder="Busca un concepto: token, RAG, agente…" autocomplete="off">',
           '<div class="chips" role="group" aria-label="Nivel">',
           '<button type="button" class="chip" data-f="nivel:">Todos</button>',
           f'<button type="button" class="chip" data-f="nivel:b">Básicos ({nb})</button>',
           f'<button type="button" class="chip" data-f="nivel:a">Avanzados ({len(G) - nb})</button></div></div>',
           '<div class="fmeta js-only"><span class="count">' + f'{len(G)} conceptos' + '</span><button type="button" class="linkbtn reset hide">Quitar filtros</button></div>',
           '<ul class="az" aria-label="Ir a la letra">' + ''.join(f'<li><a href="#letra-{L}">{L}</a></li>' for L, _ in letters) + '</ul>',
           '</div><div id="gl-list">']
    for L, items in letters:
        out.append(f'<section class="letter" data-group id="letra-{L}"><h2>{L}</h2><div class="glg">')
        for g in items:
            tag = '<div class="tags"><span class="tag adv">Avanzado</span></div>' if g['nivel'] == 'a' else ''
            out.append(f'<article class="gi" id="{slug(g["termino"])}" data-item data-nivel="{g["nivel"]}">{tag}<h3>{E(g["termino"])}</h3><p>{crosslink(g["definicion"], slug(g["termino"]))}</p></article>')
        out.append('</div></section>')
    out.append('</div><div class="empty hide" id="gl-empty" role="status">' + EMPTY_ART +
               '<p>No encontramos <b data-q>ese concepto</b> en el glosario.</p>'
               '<p>Prueba con otra palabra o pregúntale a Copilot: «Explícame qué es [concepto] en palabras simples, con un ejemplo de un gobierno regional».</p>'
               '<div class="eact"><button type="button" class="btn ghost" data-reset>Ver todo el glosario</button></div></div>')
    return '\n'.join(out), len(G), {slug(g['termino']): (g['termino'], g['definicion']) for g in G}


def crosslink(text, own):
    # Enlaza hasta dos términos del glosario dentro de una definición (sin enlazarse a sí misma).
    t, n = E(text), 0
    for rx, anchor, _ in TERMS + GLOS_EXTRA:
        if anchor == own or n >= 2:
            continue
        m = re.search(rx, t, flags=0 if anchor in ('rag', 'mcp', 'llm') else re.I)
        if m and '<a' not in t[max(0, m.start() - 60):m.start()]:
            t = t[:m.start()] + f'<a href="#{anchor}">{m.group(0)}</a>' + t[m.end():]
            n += 1
    return t


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


# ---------- enlaces automáticos al glosario ----------
TERMS = [  # (expresión, ancla del glosario, páginas donde no se enlaza)
    (r'\bprompts?\b', 'prompt', ()),
    (r'\bCopilot Chat\b', 'copilot-chat', ()),
    (r'\bCopilot Studio\b', 'copilot-studio', ()),
    (r'\bagentes?\b', 'agente', ('agentes',)),
    (r'\bSkills?\b', 'skill', ('skills',)),
    (r'\bRAG\b', 'rag', ()),
    (r'\bMCP\b', 'mcp', ()),
    (r'\balucinaci(?:ón|ones)\b', 'alucinacion', ()),
    (r'\btokens?\b', 'token', ()),
    (r'\bventana de contexto\b', 'ventana-de-contexto', ()),
    (r'\banonimiz\w+', 'anonimizacion', ()),
    (r'\bdatos personales\b', 'datos-personales-y-sensibles', ()),
    (r'\bIA generativa\b', 'ia-generativa', ()),
    (r'\bdeepfakes?\b', 'deepfake', ()),
    (r'\binyección de instrucciones\b', 'inyeccion-de-instrucciones', ()),
    (r'\bmodelos? de razonamiento\b', 'modelo-de-razonamiento', ()),
    (r'\btexto a voz\b', 'texto-a-voz', ()),
    (r'\bmultimodal\b', 'multimodal', ()),
    (r'\bsemáforo de datos\b', 'semaforo-de-datos', ()),
    (r'\bharness\b', 'harness', ()),
    (r'\bIA local\b', 'ia-local', ('ia-local',)),
    (r'\bpesos abiertos\b', 'modelo-de-pesos-abiertos', ()),
]
GLOS_EXTRA = [
    (r'\bLLM\b', 'llm', ()),
    (r'\bembeddings?\b', 'embedding', ()),
    (r'\bredes neuronales\b', 'red-neuronal', ()),
    (r'\bparámetros\b', 'parametros', ()),
    (r'\bajuste fino\b', 'ajuste-fino', ()),
    (r'\bpersona en el circuito\b', 'persona-en-el-circuito', ()),
    (r'\bsemáforo de datos\b', 'semaforo-de-datos', ()),
    (r'\bharness\b', 'harness', ()),
    (r'\bIA local\b', 'ia-local', ('ia-local',)),
    (r'\bpesos abiertos\b', 'modelo-de-pesos-abiertos', ()),
]
SKIP_TAGS = {'b', 'strong', 'a', 'h1', 'h2', 'h3', 'pre', 'code', 'button', 'summary', 'script', 'style', 'nav', 'label', 'option', 'select', 'q', 'mark', 'svg', 'textarea'}
VOID = {'br', 'img', 'input', 'meta', 'link', 'hr', 'source', 'wbr', 'path', 'circle', 'rect'}


class Linker(HTMLParser):
    def __init__(self, page, defs):
        super().__init__(convert_charrefs=False)
        self.page, self.defs, self.out, self.stack, self.done = page, defs, [], [], set()

    def handle_starttag(self, tag, attrs):
        self.out.append(self.get_starttag_text())
        if tag not in VOID and not self.get_starttag_text().endswith('/>'):
            cls = dict(attrs).get('class') or ''
            self.stack.append('q' if 'tag' in cls.split() else tag)  # no enlazar dentro de etiquetas

    def handle_startendtag(self, tag, attrs):
        self.out.append(self.get_starttag_text())

    def handle_endtag(self, tag):
        self.out.append(f'</{tag}>')
        if self.stack:
            self.stack.pop()

    def handle_data(self, data):
        if any(t in SKIP_TAGS for t in self.stack) or not data.strip():
            self.out.append(data); return
        for rx, anchor, skip in TERMS:
            if anchor in self.done or self.page in skip:
                continue
            m = re.search(rx, data, flags=re.I if anchor not in ('rag', 'mcp') else 0)
            if not m:
                continue
            self.done.add(anchor)
            data = data[:m.start()] + f'\0{anchor}\1{m.group(0)}\2' + data[m.end():]
        data = re.sub('\0(.*?)\1(.*?)\2', lambda mm: f'<a class="gt" href="glosario.html#{mm.group(1)}" data-term="{E(self.defs[mm.group(1)][0])}" data-def="{E(self.defs[mm.group(1)][1])}">{mm.group(2)}</a>', data)
        self.out.append(data)

    def handle_entityref(self, name): self.out.append(f'&{name};')
    def handle_charref(self, name): self.out.append(f'&#{name};')
    def handle_comment(self, data): self.out.append(f'<!--{data}-->')


def autolink(s, page, defs):
    for _, a, _ in TERMS:
        assert a in defs, f'término sin entrada en el glosario: {a}'
    s = re.sub(r'<a class="gt" href="[^"]*"(?: (?:title|data-term|data-def)="[^"]*")+>(.*?)</a>', r'\1', s)  # idempotente
    i = s.index('<main'); j = s.index('</main>')
    p = Linker(page, defs); p.feed(s[i:j]); p.close()
    return s[:i] + ''.join(p.out) + s[j:]


def put(s, name, content):
    pat = re.compile(r'(<!--@' + name + r'-->)(.*?)(<!--/@' + name + r'-->)', re.S)
    assert pat.search(s), name
    return pat.sub(lambda m: m.group(1) + content + m.group(3), s)


def main():
    a_html, a_n = areas()
    g_html, g_n, defs = glosario()
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
        if p not in ('glosario',):
            s = autolink(s, p, defs)
        f.write_text(s, encoding='utf-8')
    print('ok', a_n, 'prompts,', g_n, 'conceptos')


if __name__ == '__main__':
    main()
