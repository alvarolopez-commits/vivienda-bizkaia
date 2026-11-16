# Presentación del Resumen · Fase 2

Fecha: 2026-11-13. Continúa `FASE_1.md` (estructura y las tres primeras diapositivas).

## Qué se hizo

- **Seis diapositivas nuevas**, en el orden del Resumen y con sus textos literales: 4 Siete Bizkaias (7 pasos, uno por tipo de municipio, con el mapa del Resumen) · 5 Lo que viene (3 pasos, uno por ritmo de construcción; la frase la recalcula el modelo del propio Resumen) · 6 Qué se puede hacer (tabla de 34 medidas) · 7 Diez conclusiones (2 pasos) · 8 BM30 (Impulsar 3 · Facilitar 21 · Pedir 10) · 9 Cierre (enlaces, «Sigue el dato», paneles de Fuentes y de Créditos). En total, 21 estados.
- **Tema por diapositiva**: azul noche (1, 2, 5, 7, 9) y claro (3, 4, 6, 8), con fundido por opacidad.
- **Autocontenida**: Manrope propia (`presentacion/fonts/`), copias de `tokens.css` y `typography.css`, sin recursos externos; `integridad.py` lo comprueba.
- **Panel de créditos único** con las cuatro fotos, abierto desde tres diapositivas (el foco vuelve al botón que lo abrió).
- **Notas del orador** para las nueve diapositivas (texto nuevo, solo cifras del Resumen; solo en Presentar).
- Corrección de contraste en «Diez conclusiones» (tarjetas casi opacas) y mapa más atenuado cuando no es protagonista.

## Qué está verificado (Chrome sin pantalla, 1920×1080, 1440×900 y 1280×720)

| Prueba | Resultado |
|---|---|
| `integridad.py` | 12 PASS (18 ficheros idénticos al Resumen, 184 cadenas literales, sin recursos externos) |
| `estado.test.mjs` | 10/10 |
| `qa-navegacion` | 138/138 |
| `qa-fase2` | 42/42 por tamaño (126 en total), incluida la coincidencia de las frases de «Lo que viene» con el modelo del Resumen y las sumas cruzadas (113 municipios, 34 medidas, 10 conclusiones, 3 + 21 + 10) |
| `qa-calidad` | 255/255 por tamaño: sin desborde, un h1, nombres accesibles, texto solo del Resumen, tema por diapositiva |
| `qa-cifras` · `qa-calculadora` · `qa-mapa` · `qa-notas` · `qa-movimiento` | 207 · 72 · 49 · 30 · 31 (+16 con movimiento reducido), todos PASS |
| `correr.mjs foco` | 170 paradas con Tab real, todas con anillo de 2 px |

## Sin verificar o por repetir

- **Contraste sobre píxeles tras el último ajuste de opacidad**: solo se remidieron cuatro estados (conclusiones 7/1 y 7/2, 5/1 y 9/1, a 1920 y 1280) con 0 fallos. La pasada completa a 1920×1080 había dado 12 fallos, todos en «Diez conclusiones» (lo corregido). No se repitió el resto de estados ni 1440×900 con la opacidad final.
- **Capturas**: las de las diapositivas 1 a 3 son del estilo final; las de las 4 a 9 (1920×1080, modo Leer) se hicieron antes del último ajuste de opacidad. Falta capturar el modo Presentar de las seis nuevas.
- Rendimiento del mapa 3D con proyector o portátil modesto, Safari, Firefox y lector de pantalla real.

## Pendiente del autor

1. **«BM30»** y el título del cierre «Vivienda cerca del empleo»: no se han tocado.
2. **Notas del orador** y **etiquetas nuevas** de la barra (El problema · Las cifras · La calculadora).
3. **Licencia de Manrope** (OFL 1.1): añadir el texto original de la licencia (`presentacion/fonts/LEEME.txt` lo recuerda).
4. **Fotos de `MATERIALES/`** (procedencia y licencia) antes de usarlas.
5. **Móvil**: fuera de alcance.
6. **Despliegue**: decidir dónde publicarla (CSP original: todo `'self'`, ya cumplida).

## Publicación y conexión con el Análisis y el Radar (2026-11-13)

- **Publicada** en Vercel como proyecto nuevo (no sustituye al Resumen original): https://vivienda-bizkaia-presentacion.vercel.app. Mismas cabeceras de seguridad que el Resumen original (`vercel.json`); se excluyen del despliegue las pruebas, los documentos y el servidor local (`.vercelignore`). El repositorio de GitHub está conectado a Vercel: cada push a `main` despliega.
- **Resumen → Análisis y Radar**: el cierre enlaza al **Análisis rediseñado** (GitHub Pages, `js/enlaces.js`) y al Radar original; además hay un acceso «Análisis ↗ · Radar ↗» arriba a la derecha en modo Leer (etiquetas nuevas, propuesta). Es la **única divergencia deliberada** con los textos del Resumen: la dirección que se muestra y a la que apunta el enlace al Análisis.
- **Análisis → nuevo Resumen**: las cuatro puertas del Análisis (cabecera, menú, hero y portada) apuntan a la presentación en lugar del Resumen antiguo; cambio aplicado en el repositorio `vivienda-bizkaia-analisis`.
- **Radar → Resumen**: no se ha tocado; el Radar publicado es un proyecto del autor.
- **Pendiente**: la versión del Análisis que sirve GitHub Pages es `ux/leyendas-arriba`; las mejoras A–E (`feat/inteligencia-territorial`) no están publicadas.
