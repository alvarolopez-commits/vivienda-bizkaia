# Presentación del Resumen · Fase 1

Fecha: 2026-11-13 · Rama `feat/inteligencia-territorial` · **Nada commiteado ni subido.** Diseño: `docs/superpowers/specs/2026-11-13-resumen-presentacion-design.md`. Plan: `docs/superpowers/plans/2026-11-13-resumen-presentacion-fase-1.md`.

## Qué se hizo

La estructura de la presentación (navegación por dirección `#/diapositiva/paso`, teclado, botones, modos Presentar y Leer, notas, pantalla completa, movimiento) y **tres diapositivas** del Resumen:

1. **Gancho** — «Falta vivienda asequible» sobre el mapa 3D de los 113 municipios.
2. **Las cuatro cifras** — 34 de 35 · 55,8 % (Bilbao) · 47,1 (Mundaka) · 53 de 63 (pueblos pequeños). El mapa cambia de cámara y de dato en cada paso; con las fotos y el panel de créditos.
3. **Calculadora** — «¿Cuántos años para la entrada?», con la función del propio Resumen (`entry()`), más el panel «Cómo se calcula».

Verla: `python presentacion/servidor.py` → http://localhost:4180/ (Leer) o `?modo=presentar`. Capturas a 1920×1080 y 1280×720 en `docs/presentacion/capturas/`.

## Estilo (cambios pedidos durante la fase)

- Estilo «High Beam» de Astara Intelligence (`SOLUTIONS/13 HIGH BEAM/PRESENTACION`): titulares enormes en Manrope ligera con la palabra clave en degradado celeste, tarjetas de vidrio finas, barra inferior con marca, pastillas de diapositiva, progreso y flechas redondas, y línea de avance arriba.
- **Azul noche** (#221e41, el de la muestra) en lugar del casi negro, y **alternancia con diapositivas en claro**: las que llevan el mapa (1 y 2) van en azul noche; la calculadora (3) va en claro. Cada diapositiva declara su `tema`; el fondo claro entra por opacidad. En la fase 2 se alternan las demás.
- La versión anterior (clara, Geist/Montserrat) queda guardada fuera del repositorio por si se prefiere volver.

## Lo que garantizan las pruebas

| Prueba | Resultado | Qué comprueba |
|---|---|---|
| `integridad.py` | 4 PASS | 16 ficheros de `original/` idénticos al Resumen (sha256) y 50 cadenas de `textos.json` literales en su `index.html` |
| `estado.test.mjs` | 9/9 | direcciones, límites, recorrido |
| `qa-navegacion` | 129/129 (43 × 3 tamaños) | teclas, botones, modos, Atrás/Adelante, direcciones inválidas, teclas ignoradas en campos y diálogos, pantalla completa rechazada |
| `qa-mapa` | 49/49 | cinco estados del mapa, plan B en SVG sin WebGL (113 municipios), lienzo único persistente |
| `qa-cifras` | 207/207 (69 × 3) | texto literal por paso, estado del mapa, fotos, Leer y Presentar, créditos |
| `qa-calculadora` | 72/72 (24 × 3) | 15 combinaciones hogar × precio **iguales a `entry()` del Resumen**; precios vacío/`abc`/1/99999999/−5/0 ajustados; teclado, panel, anuncio |
| `qa-notas` | 31/31 | ninguna cifra inventada en las notas; solo en Presentar |
| `qa-movimiento` | 31/31 (1920 y 1280) + 16/16 con «reducir movimiento» | 420/240 ms, solo `transform` y `opacity`, pulsaciones rápidas, momento firma, sin View Transitions |
| `qa-calidad` | 225/225 (75 × 3) | sin desborde, un h1, nombres accesibles, texto solo del Resumen, tema por diapositiva |
| `correr.mjs foco` | 61 paradas, 0 sin anillo de 2 px | Tab real |
| `correr.mjs contraste` | 0 líneas bajo AA | medido sobre los píxeles renderizados (mapa, fotos, vidrio): todos los estados a 1920×1080 y 1280×720; la diapositiva 1 también a 1440×900 |

Todas se ejecutaron en Chrome sin pantalla a 1920×1080, 1440×900 y 1280×720 (salvo lo indicado).

## Decisiones tomadas (la spec o el plan no las fijaban)

- **Notas del orador solo en Presentar**: la spec dice que en Leer no se muestran; el plan las abría en ambos.
- **Velo azul a la izquierda del mapa** y cabecera sin atenuar en Presentar: el contraste medido sobre píxeles lo exigía (texto claro sobre zonas claras del mapa: hasta 1,4:1 sin velo).
- **Un `h1` por diapositiva**: en la 2 es solo para lectores de pantalla («Cuatro cifras del problema»); en la 3 el titular de la calculadora.
- **Pastillas de diapositiva** («El problema», «Las cifras», «La calculadora») y la línea de avance: etiquetas de interfaz nuevas, marcadas como propuesta.
- **Sin GSAP más allá del núcleo**: ni ScrollTrigger, SplitText, Lenis ni el escenario `taste` (producen el scroll secuestrado).
- **Contrato de diapositiva ampliado** (superset): `alEntrar(dir)` y `tema` opcionales.
- **`correr.mjs`**: ejecutor con Chrome sin pantalla; un panel oculto del navegador integrado pausa `requestAnimationFrame` y GSAP, y las animaciones no avanzaban.

## Pendiente del autor / no verificado

1. **Fuentes**: Manrope se carga de Google Fonts solo en local. Para publicar hay que autoalojarla (CSP `font-src 'self'`) y no está en el equipo: hace falta tu permiso para descargarla (Manrope, licencia OFL).
2. **«BM30»** y el título del cierre «Vivienda cerca del empleo» (fase 2; no se tocan).
3. **Notas del orador** (texto nuevo) y las **etiquetas nuevas** de la barra: a aprobar.
4. **Publicación**: enlace privado o público y dónde. No se ha publicado ni subido nada.
5. **Móvil**: fuera de la fase 1.
6. **Fotos de `MATERIALES/`**: procedencia y licencia antes de cualquier uso.
7. **Sin verificar**: rendimiento del mapa 3D en un portátil modesto y con proyector, Safari y Firefox, lector de pantalla real, y la medida de contraste completa a 1440×900.
8. Revisión final con un revisor independiente: **no se hizo** (se pidió cerrar); la revisión fue la de los autores de las pruebas.
9. `favicon.ico` da 404 en la raíz (menor).

## Fase 2

Siete Bizkaias, Lo que viene, Qué se puede hacer, Diez conclusiones, BM30 y Cierre, más los paneles de fuentes. Con el mecanismo de `tema` ya listo para alternar azul noche y claro.
