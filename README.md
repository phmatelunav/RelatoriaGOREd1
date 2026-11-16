# IA en el GORE O'Higgins

Sitio estático de contenido sobre inteligencia artificial para funcionarios del Gobierno Regional de O'Higgins, creado a partir de la capacitación del 12 y 13 de noviembre de 2026.

- `index.html`: portada y mapa de secciones.
- `curso.html`: curso por niveles (básico, intermedio, avanzado) con seis módulos cada uno y avance guardado en el navegador.
- `areas.html`: prompts por división, con buscador y filtros.
- `agentes.html`: guía para crear agentes en Copilot Chat y plantillas.
- `skills.html`: Skills, caso de búsqueda de dictámenes de la Contraloría y descargas (`skills/`).
- `comunicaciones.html`: IA generativa para imagen, video, audio, música y animación.
- `tips.html`: buenas prácticas, técnicas avanzadas, marco normativo y cursos.
- `grupos.html`: dinámicas para practicar en equipo.
- `glosario.html`: glosario básico y avanzado.
- `plataformas.html`: agentes, Skills y conectores MCP en Claude, ChatGPT y Gemini; aplicación de escritorio y harness.
- `ia-local.html`: IA local (Ollama, LM Studio, Hermes y otros).
- `material.html`: documentos ficticios del curso (K1 a K10) y presentación.
- `Presentacion_Relator.html`: presentación de la jornada (funciona sin internet).
- `assets/`: estilos y scripts compartidos.
- `skills/src/`: fuentes de las Skills; los ZIP se generan comprimiendo cada carpeta.

- `data/`: prompts, glosario y material en JSON.
- `tools/build.py`: escribe en el HTML el menú, el pie de página y las listas generadas desde `data/`. Ejecutar `python3 tools/build.py` después de cambiar los datos o el menú, y subir el resultado.
- `PRODUCT.md` y `DESIGN.md`: público, tono y sistema visual.

En Vercel no hay paso de compilación: preset "Other" y sin comando de build. Los archivos HTML ya están generados.
