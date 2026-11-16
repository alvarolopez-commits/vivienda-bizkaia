# Pruebas heredadas (qa/)

Estas pruebas vienen de los repos que se integran en este proyecto. Se guardan aquí para no perderlas; **no se han vuelto a ejecutar contra la estructura unificada** y varias suponen las rutas de la app original, así que hay que adaptarlas antes de usarlas.

| Carpeta | Origen | Qué prueba | Estado |
|---|---|---|---|
| `qa/analisis/` | `vivienda-bizkaia-analisis`, `sprint-03-1/_qa` (rama `feat/inteligencia-territorial`, commit de noviembre de 2026) | Las vistas del Análisis: situación, municipios, acceso, medidas, normas, método; contexto y URL compartible, comparador, información del dato, exportación a PDF, contraste, desborde, movimiento. Se ejecutan en el navegador (`import('/_qa/qa-….js').then(m => m.run())`) y `integridad.py` en Python. | Pasaban 1440 px y 1280 px sobre la app original (`sprint-03-1/app`). Aquí la app cuelga de `/analisis/`: las rutas absolutas (`/js/…`, `/original/…`) hay que cambiarlas por `/analisis/js/…`. Las pruebas de la portada (`qa-inicio.js`) ya no aplican: el hero se retiró. |
| `qa/resumen/` | `vivienda-bizkaia-presentacion`, `presentacion/_qa` | La presentación del Resumen: navegación, cifras, mapa, calculadora, notas, movimiento, calidad y la comprobación de integridad contra el Resumen original. `correr.mjs` lanza Chrome sin pantalla. | Escritas para la presentación en la raíz (puerto 4180). Aquí vive en `/resumen/`. No cubren la lectura vertical de móvil ni la escala de Leer, que son posteriores. |
| Radar | — | El Radar no traía pruebas en el repo `radar-vivienda-bizkaia`. | Sin pruebas automáticas. |

Lo que sí se ha comprobado en este proyecto, a mano y con Chrome sin pantalla (no automatizado): desborde horizontal y zonas táctiles a 390 y 360 px en Radar y Resumen; Situación en una pantalla a 1440×900; plano de Medidas; portada sin scroll a 1280×720, 1440×900 y 1920×1080.

Para volver a tener una batería automática hay que (1) servir la carpeta `site/`, (2) adaptar las rutas y (3) ejecutar cada suite desde una carga limpia, una a una (encadenarlas provoca interferencias de orden).
