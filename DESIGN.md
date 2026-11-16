# Diseño · "Cuaderno del valle"

Mundo visual cálido e institucional, inspirado en el paisaje de O'Higgins: papel, greda, viñedos y cerros. Los colores no son el manual de marca oficial del Gobierno Regional; si se dispone de él, reemplazar los tokens de `assets/site.css`.

## Modo
Lectura (guías, glosario) con componentes de operación (filtrar y copiar prompts).

## Color (tokens en `:root`, con modo oscuro)
El modo sigue la preferencia del sistema, y el botón sol/luna del encabezado la reemplaza (se guarda en el navegador como `tema`). Los tokens oscuros están en `:root[data-theme="dark"]` y en `prefers-color-scheme: dark` cuando no se eligió claro.

- `--bg` papel cálido `#f6f1e8`, `--paper` superficies `#fffdf8`, `--ink` `#221c17`, `--muted` `#5d544b`.
- `--accent` greda `#9c3f1f`: acciones, enlaces, foco, selección.
- `--vine` verde viña `#2f5b45`: lo institucional, confirmaciones y recuadros de ayuda.
- Etiquetas con un solo significado: `.tag` categoría neutra, `.ok` institucional o seguro, `.warn` precaución o externa, `.bad` riesgo, `.adv` nivel avanzado.

## Tipografía
- Títulos: Literata (variable, opsz), peso 600, interlineado ajustado.
- Texto: Atkinson Hyperlegible Next, 17 px, pensada para legibilidad en público amplio.
- Código y prompts: monoespaciada del sistema.
- Fuentes alojadas en `assets/fonts/` (licencia OFL).

## Reglas
- Sin etiquetas en mayúsculas sobre los títulos.
- Los objetivos táctiles miden al menos 44 px en pantallas táctiles.
- Foco visible de 2 px en color greda en todos los controles.
- Contenido, navegación y listas se generan en el HTML con `tools/build.py`; JavaScript solo mejora (copiar, filtrar, enlaces compartibles).
- Un motivo propio: la línea de cerros e hileras de viñedo. Aparece en el inicio, en el logotipo, como separador antes del pie de página y en los mensajes de búsqueda sin resultados (`.divider`).
- Menú de escritorio: cinco secciones principales y «Más» (Tips, En grupo, Material). En el celular, menú «Secciones» agrupado en Usar, Crear, Practicar y Consultar.
- La primera mención de los términos clave en cada página se enlaza al glosario automáticamente (`tools/build.py`, lista `TERMS`), con subrayado punteado.
- Los controles que necesitan JavaScript llevan `js-only`; sin JavaScript se muestran enlaces equivalentes (`nojs-only`).
- Al copiar un prompt aparece, junto al botón, «Copiado · Abrir Copilot Chat»; el prompt no se abre solo.
- Las definiciones del glosario se despliegan al tocar un término (en el celular, como panel inferior), con «Ver en el glosario».
- La búsqueda compara desde el inicio de cada palabra, acepta plurales simples y muestra primero las coincidencias en el título.
- El cero tachado de Atkinson Hyperlegible se mantiene a propósito: distingue el 0 de la O.
- Niveles: la portada ofrece «Inicia tu curso» (básico, intermedio, avanzado). El nivel se guarda como `nivel` en el navegador y se aplica en `html[data-nivel]`. Las secciones con `data-min` se ocultan a niveles menores (con «Mostrar todo»), y las páginas con `data-nivel-pagina` muestran un aviso si están por sobre el nivel elegido. Sin JavaScript se ve todo.
