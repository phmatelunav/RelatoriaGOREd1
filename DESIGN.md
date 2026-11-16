# Diseño · "Cuaderno del valle"

Mundo visual cálido e institucional, inspirado en el paisaje de O'Higgins: papel, greda, viñedos y cerros. Los colores no son el manual de marca oficial del Gobierno Regional; si se dispone de él, reemplazar los tokens de `assets/site.css`.

## Modo
Lectura (guías, glosario) con componentes de operación (filtrar y copiar prompts).

## Color (tokens en `:root`, con modo oscuro)
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
