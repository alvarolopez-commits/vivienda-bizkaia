# Migración del Análisis (estado a 2026-11-16)

Origen: rama `ux/leyendas-arriba` del repo `vivienda-bizkaia-analisis`, carpeta `sprint-03-1/app/` (la que sirve GitHub Pages). Destino: `site/analisis/`. Los textos, datos y cálculos no se han tocado.

## Qué se conserva de Astara (la piel del producto)
- **Design System «Astara × Liquid Glass»** completo: `css/tokens.css` y `css/typography.css` sin cambios (azul noche, hielo, acento azul, radios, elevaciones, movimiento).
- **Tres capas de material:** L0 contenido opaco (mapa, cifras, tablas), L1 vidrio funcional (navegación y controles), L2 vidrio de foco. Coincide con la regla de Apple de usar el cristal solo en controles y navegación.
- **Cabecera con la píldora de vistas** (azul noche para la activa), hero inmersivo con el fondo «flow» y cifra rodante, tipografía Montserrat + Geist, fondo ambiental, movimiento «expresivo» con sus tres intensidades (`?mov=`).
- **Las seis vistas** (Situación, Municipios, Acceso, Medidas, Normas y Método) con sus rutas `#…` exactas.

## Qué cambia en la migración
| Cambio | Detalle |
|---|---|
| Selector de secciones | En la cabecera, a la derecha, en vidrio L1 y en tono suave de acento (no compite con la píldora oscura de las vistas). Sustituye a los enlaces «Resumen ↗» y «Ver el radar ↗». También en el menú pequeño. |
| Pie con acordeón | Común a las tres secciones, vestido con el azul noche de Astara. |
| Hero | Se quita el bloque de «puertas» a los tres productos (lo hacen el portal y el selector). «Ver el resumen» abre la sección Resumen del mismo sitio. El logo lleva al portal. |
| Fuentes | Alojadas en el proyecto; ya no se piden a Google Fonts (privacidad y velocidad). |
| Cabecera del documento | Favicon, `apple-touch-icon`, `theme-color`, manifiesto y descripción. |
| Safari < 16.4 (P0 del estudio) | Dos expresiones regulares con lookbehind reescritas (`js/medidas/calculo.js`, `original/js/medidas/ficha.js`) y separador de miles hecho a mano en lugar de `useGrouping:"always"` (`original/js/ui.js`). Comprobado contra el comportamiento anterior con más de 20.000 casos: mismo resultado. |
| Hover | Los 41 efectos `:hover` van dentro de `@media (hover: hover) and (pointer: fine)`; los selectores de foco no se tocan. |

## Lo que el estudio dijo del Radar y aquí **no** aplica
- La devolución de foco al cerrar paneles ya usa referencias explícitas (`origin`, `boton`), no `document.activeElement`: no hay fallo en Safari.
- El menú ya es un `<dialog>` nativo y las pestañas de vistas son enlaces reales.
- Ya existen `prefers-contrast`, `prefers-reduced-transparency`, `prefers-reduced-motion` y degradación sin `backdrop-filter`.

## Comprobado (Chrome, escritorio y emulación)
- Las seis vistas montan, con la ruta directa y por cambio de hash, sin errores de consola y sin peticiones externas.
- Cifras con separador de miles (346.933, 1.000…).
- Selector y pie funcionan; el actual se marca con `aria-current`.

## Fase móvil (hecha el 2026-11-16)
Archivo nuevo `css/movil.css` (se carga el último y solo actúa por debajo de 1099 px; **escritorio no cambia**) y pequeños retoques de JS. Resultado: las 15 rutas probadas (las seis vistas y sus modos) no desbordan a 375 px ni a 768 px.

| Qué | Cómo |
|---|---|
| Cabecera | La cabecera compacta (logo · vista activa · Menú) estaba definida solo en `situacion.css`, que únicamente está activa en Situación; en las otras cinco vistas la píldora de seis pestañas desbordaba. Ahora vale para todas. |
| Menú pequeño | Lleva el selector de secciones y el botón de compartir. Botón de menú de 44 px. |
| Compartir | En iPhone/iPad (puntero táctil y Web Share) abre la hoja de compartir del sistema; en el resto copia el enlace. Mismo botón en la cabecera y en el menú. |
| Situación | El mapa tenía **altura 0** en pantallas pequeñas (un `flex: 1 1 0` de escritorio anulaba el `height`) y el cristal de los botones se estiraba en óvalo (`top` y `bottom` a la vez). Corregido; botones de zoom de 44 px y la página se sigue desplazando con el dedo sobre el mapa. |
| Medidas | Los modos pasan a 4 columnas (2×2 en móvil); las líneas, a rejilla de 2–3 columnas; el escenario y la lista, en una columna; el plano de burbujas conserva ancho legible y se desliza con el dedo; los pop-over de criterios y pesos, como hoja desde abajo; comparar con tabla desplazable y primera columna fija; matriz desplazable. |
| Lectura (Municipios, Normas, Método, Acceso) | Columna única que no crece más que la pantalla; tarjetas con menos relleno lateral; «En esta página» pasa de tarjeta alta a una fila de chips que se desliza y queda fija bajo la cabecera. |
| Comparar dos municipios | Cada indicador pasa de cinco columnas a tres líneas; la tabla de hogares se desplaza dentro de su caja. |
| Acceso | Resultados en una columna. |
| Texto para lectores de pantalla | Los `.sr-only` de celdas dentro de cajas con scroll horizontal ampliaban el ancho de toda la página; ahora quedan recortados con su caja. |

## Pulido del móvil (2026-11-16, segunda pasada)
| Qué | Cómo |
|---|---|
| Zonas táctiles | Auditoría automática de todos los controles de las 13 rutas a 375 px: ninguno por debajo de 44 px (botones, chips, campos, selectores, resúmenes, enlaces de lista). Los botones «i» se ven igual de pequeños pero su área pulsable llega a 44 px con un pseudo-elemento. Las casillas de la matriz son de 24 px con 10 px de margen. Excepción deliberada: los enlaces dentro de texto corrido. |
| Pestañas de sección | Una sola fila que se desliza, fija bajo la cabecera (en dos filas tapaban un tercio de la pantalla al desplazarse). |
| Normas | La tabla de competencias de 640 px pasa a tarjetas: cada instrumento con su nombre y, debajo, qué hace cada nivel de gobierno. Los textos de nivel se añaden a cada celda, así que el lector de pantalla las lee con su contexto. |
| Matriz de medidas | Solo la casilla y el nombre quedan fijos; orden y nota se desplazan con el resto. |
| Ficha de una medida | Hoja inferior anclada a la pantalla, con el fondo atenuado y el botón de cierre de 44 px. Al cerrarla, el foco vuelve a la fila equivalente aunque la lista se haya redibujado (antes se perdía: Safari tampoco enfoca los botones al hacer clic). |
| Criterios y pesos | Pop-over como hoja desde abajo. |
| Causa común de dos fallos | Un antecesor con `backdrop-filter` o con la animación de entrada (`translate`) se convierte en el bloque contenedor de los hijos con `position: fixed`; por eso las hojas no quedaban pegadas a la pantalla. En móvil se quitan ese filtro y esa animación de `.m-side` y `.m-barra`. |
| Comprobación | 13 rutas a 375 px y 10 rutas a 430 px sin desbordes ni errores; escritorio (1440 px) sin cambios. Todo con emulación de Chrome. |

## Pendiente
1. **Probar en iPhone/iPad reales** (todo lo anterior es emulación de Chrome): gestos sobre el mapa y las burbujas, teclado en pantalla, barra de Safari que se contrae, orientación horizontal y la hoja de compartir.
2. **Plano de burbujas en móvil:** se desliza a 760 px de ancho; valorar una lista agrupada por línea como alternativa principal.
3. **Gestos de hoja:** las hojas se cierran con el botón y con Escape; falta arrastrar hacia abajo para cerrar y un asa (HIG).
4. **Bloqueo del desplazamiento de fondo** mientras una hoja está abierta.
5. **Texto ampliado al 200 %**, VoiceOver real en mapa, burbujas y matriz, y Aumentar contraste en el pie y el selector.
6. **Teclado en Safari por defecto:** los chips que son `<button>` no se alcanzan con Tab salvo que el usuario lo active; valorar enlaces reales donde lleven a otro estado.
7. **Cabecera en anchos medios (900–1200 px)** con el selector nuevo.
