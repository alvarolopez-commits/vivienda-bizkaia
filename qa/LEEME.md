# Pruebas (qa/)

## Auditoría visual y técnica de todo el proyecto: `auditoria-visual.mjs`

Es la prueba vigente y se ejecuta antes de cada publicación. Usa Chrome sin pantalla (Node 22 o posterior, sin dependencias) y recorre 21 rutas (portada, las 6 vistas del Análisis con el comparador, las 4 del Radar y las 9 diapositivas del Resumen) a 1280×720, 1440×900, 1920×1080 y 390×844 con emulación táctil: 84 comprobaciones.

```bash
python -m http.server 4195 --directory site                       # en una terminal
node qa/auditoria-visual.mjs http://localhost:4195 auditoria.json  # en otra (opcional: tamaño y filtro de ruta como 3.º y 4.º argumento)
node qa/auditoria-visual.mjs https://alvarolopez-commits.github.io/vivienda-bizkaia   # contra el sitio publicado
```

Mide, dentro de cada página: desborde horizontal; elementos que se salen de la pantalla (salvo dentro de cajas con desplazamiento propio); errores de consola, excepciones y peticiones fallidas; controles por debajo de 24 px (límite AA de WCAG 2.2, 2.5.8) y, en móvil, de 44 px (recomendado; el área ampliada con `::after` y los enlaces dentro de una frase cuentan como válidos); imágenes rotas; fuentes sin cargar; avisos `role="alert"` visibles; número de `h1`; y reglas propias (la portada y Situación caben en la pantalla; en escritorio ninguna diapositiva del Resumen recorta su contenido; en móvil el Resumen está en lectura vertical).

**No mide** contraste, lectura con lector de pantalla ni comportamiento en Safari o en un teléfono real. Ignora el aviso conocido de View Transitions («Page already revealed»).

Resultado de la última ejecución (2026-11-17, rama `ux/radar-resumen`): 84 de 84 sin fallos tras corregir los 36 que salieron en la primera pasada (tamaños de controles; ningún desborde, error de consola, petición fallida, imagen rota ni fuente sin cargar).

## Auditoría DEC de accesibilidad y UX: `auditoria-dec.mjs`

Segunda prueba vigente, basada en el protocolo DEC (BRAND/REPORTS/BASE UI). Misma mecánica que la visual (Chrome sin pantalla, Node 22 o posterior, sin dependencias) sobre las mismas 21 rutas. Mide **contraste de texto** (confirmado sobre píxeles cuando el fondo no se deduce de los antecesores), **recorrido con Tab** (trampas e indicador de foco), **nombre accesible** (incluida la coherencia con el texto visible), estructura (`lang`, título, `main`, `alt`), **reflujo a 320 px** y **movimiento reducido**. Cada resultado es `fail`, `needs_review`, `pass` o `not_evaluated`; no hay puntuación global.

```bash
node qa/auditoria-dec.mjs http://localhost:4195 auditoria-dec.json
node qa/auditoria-dec.mjs http://localhost:4195 salida.json "radar/#datos"   # una vista (sin «/» inicial en Git Bash)
node qa/auditoria-dec.mjs http://localhost:4195 movil.json "" 390x844            # móvil táctil (también 360x740): añade texto <12 px y zoom bloqueado
```

Última ejecución (2026-11-17, rama `ux/radar-resumen`): 167 comprobaciones, 0 `fail`, 1 `needs_review` (foco del mapa de Situación), 166 `pass`. Informe, falsos positivos descartados y límites en [`docs/DEC_REPASO.md`](../docs/DEC_REPASO.md). **No mide** lectura con lector de pantalla, Safari o móvil real, contraste de estados hover/error ni indicadores no textuales.

## Pruebas heredadas

Estas pruebas vienen de los repos que se integran en este proyecto. Se guardan aquí para no perderlas; **no se han vuelto a ejecutar contra la estructura unificada** y varias suponen las rutas de la app original, así que hay que adaptarlas antes de usarlas.

| Carpeta | Origen | Qué prueba | Estado |
|---|---|---|---|
| `qa/analisis/` | `vivienda-bizkaia-analisis`, `sprint-03-1/_qa` (rama `feat/inteligencia-territorial`, commit de noviembre de 2026) | Las vistas del Análisis: situación, municipios, acceso, medidas, normas, método; contexto y URL compartible, comparador, información del dato, exportación a PDF, contraste, desborde, movimiento. Se ejecutan en el navegador (`import('/_qa/qa-….js').then(m => m.run())`) y `integridad.py` en Python. | Pasaban 1440 px y 1280 px sobre la app original (`sprint-03-1/app`). Aquí la app cuelga de `/analisis/`: las rutas absolutas (`/js/…`, `/original/…`) hay que cambiarlas por `/analisis/js/…`. Las pruebas de la portada (`qa-inicio.js`) ya no aplican: el hero se retiró. |
| `qa/resumen/` | `vivienda-bizkaia-presentacion`, `presentacion/_qa` | La presentación del Resumen: navegación, cifras, mapa, calculadora, notas, movimiento, calidad y la comprobación de integridad contra el Resumen original. `correr.mjs` lanza Chrome sin pantalla. | Escritas para la presentación en la raíz (puerto 4180). Aquí vive en `/resumen/`. No cubren la lectura vertical de móvil ni la escala de Leer, que son posteriores. |
| Radar | — | El Radar no traía pruebas en el repo `radar-vivienda-bizkaia`. | Sin pruebas automáticas. |

Lo que sí se ha comprobado en este proyecto, a mano y con Chrome sin pantalla (no automatizado): desborde horizontal y zonas táctiles a 390 y 360 px en Radar y Resumen; Situación en una pantalla a 1440×900; plano de Medidas; portada sin scroll a 1280×720, 1440×900 y 1920×1080.

Para volver a tener una batería automática hay que (1) servir la carpeta `site/`, (2) adaptar las rutas y (3) ejecutar cada suite desde una carga limpia, una a una (encadenarlas provoca interferencias de orden).
