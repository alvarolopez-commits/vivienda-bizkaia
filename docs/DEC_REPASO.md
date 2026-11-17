# Repaso DEC de Análisis, Radar, Resumen y portada

Fecha: 2026-11-17 · Rama `ux/radar-resumen` · Protocolo: `CLAUDE_APPLY_TO_APP.md` y `DEC_RULES.json` (BRAND/REPORTS/BASE UI).

Este documento separa tres cosas que el protocolo pide no mezclar: lo **verificado con medidas**, lo **pendiente de decisión o de revisión humana** y lo que **no se ha evaluado**. No hay puntuación global.

## 1. Qué se ha evaluado (y qué no)

Herramienta nueva: [`qa/auditoria-dec.mjs`](../qa/auditoria-dec.mjs). Recorre 21 vistas (portada, 6 de Análisis con comparador, 4 del Radar, 9 diapositivas del Resumen) y comprueba:

| Regla | Qué se mide | Cómo |
|---|---|---|
| DEC-004 contraste de texto | Cada texto visible frente a su fondo; mínimo 4,5:1 (3:1 si es grande) | Se calcula por los fondos de los antecesores; toda sospecha se confirma sobre píxeles de una captura |
| DEC-007 teclado y foco | Recorrido con Tab (hasta 60 pasos): trampas y controles sin indicador de foco | Pulsaciones reales por CDP |
| DEC-008 nombre accesible | Todo control tiene nombre; el nombre contiene el texto visible (WCAG 2.5.3) | Cálculo del nombre accesible en la página |
| Estructura | `lang`, título, un `main`, imágenes con `alt` | DOM |
| WCAG 1.4.10 | Sin desplazamiento horizontal a 320 px | Emulación de móvil de 320×568 |
| Movimiento | Animaciones infinitas con `prefers-reduced-motion: reduce` | `document.getAnimations()` |

**No evaluado** (`not_evaluated`, no debe leerse como aprobado):

- Lectura real con lector de pantalla (VoiceOver, NVDA) y orden de lectura.
- Safari, iPhone y Android reales; todo se ha medido en Chrome sin pantalla.
- Contraste en estados `:hover`, `:focus` y de error, y contraste de indicadores no textuales (DEC-005).
- Reglas heurísticas de jerarquía, consistencia y orientación (DEC-001, 011, 013, 016, 018, 019, 020, 022, 029): no hay revisión formal con usuarios (DEC-023), solo la conversación de diseño de las sesiones anteriores.
- Los textos de la interfaz marcados `data-propuesta` siguen pendientes de tu confirmación.

**Límite de la medida de contraste.** Cuando el fondo es una imagen o un degradado, el fondo se estima como el promedio de una banda de luminosidad del rectángulo del texto. Es una estimación, no una cota; por eso se ha calibrado con un control negativo (ver 4).

## 2. Resultado de la auditoría

| | Antes (sitio publicado) | Después (esta rama) |
|---|---|---|
| Vistas con algún `fail` confirmado | Radar · Datos, Radar · Escenarios (contraste); Análisis · Acceso (320 px) | 0 de 21 |
| `needs_review` | 1 de nombre accesible en el Radar; foco del mapa de Situación | 1: foco del mapa de Situación |
| Comprobaciones | — | 167: 0 `fail`, 1 `needs_review`, 166 `pass` |

Salida completa: ejecutar `node qa/auditoria-dec.mjs http://localhost:4195 salida.json`.

## 3. Intervenciones (formato de entrega DEC)

### 3.1 Gris de apoyo del Radar

1. **Objetivo.** Que el texto secundario del Radar se lea con el contraste mínimo.
2. **Problema y evidencia.** `#64748b` daba 4,31:1 sobre `#f0f4f9` (Escenarios) y 4,48:1 sobre `#f7f8fb` (Datos). Texto de 12 a 16 px: el mínimo es 4,5:1. Medido sobre píxeles en el sitio publicado.
3. **Decisión y regla.** DEC-004. Un gris algo más oscuro, `#566478` (≥5,3:1 sobre ambos fondos), que sigue leyéndose como texto secundario. No se añade ningún color nuevo a la paleta.
4. **Archivos.** [`site/radar/css/integracion.css`](../site/radar/css/integracion.css): `--pci-text-muted`, `--muted`, `--faint` en `.radar-integrado`.
5. **Comportamiento.** Solo cambia el tono del texto de apoyo (notas, fuentes, cabeceras de tabla, enlaces secundarios). Sin cambios de estado.
6. **Pruebas.** Auditoría DEC en Radar · Escenarios y Datos: de `fail` a `pass`. Control negativo contra el sitio publicado: sigue detectando el fallo antiguo.
7. **Riesgos.** El gris es ligeramente más fuerte; si no gusta, un valor que también cumple (4,65:1 sobre `#f0f4f9`) es `#5f6f84`. Pendiente: ver el cambio a ojo en pantalla.

### 3.2 Reflujo a 320 px en Acceso

1. **Objetivo.** Que «Acceso» no obligue a desplazar la página en horizontal en pantallas de 320 px.
2. **Problema y evidencia.** Ancho de contenido de 382 px frente a 320 px. La columna única de la rejilla `.alcance` no podía encogerse por debajo del mínimo de su contenido (349 px).
3. **Decisión y regla.** WCAG 1.4.10 (reflujo) y DEC-015 (responsive). Corrección acotada de CSS, sin rediseñar.
4. **Archivos.** [`site/analisis/css/acceso.css`](../site/analisis/css/acceso.css) (final del archivo).
5. **Comportamiento.** Columna `minmax(0, 1fr)` y `min-width: 0` en los hijos. En escritorio no cambia nada.
6. **Pruebas.** Medida de elementos que se salen a 320 px: de varios bloques desbordados (controles, cuerpo, mapa y leyenda) a 0 (quedan solo los chips con desplazamiento propio, que son correctos). Auditoría DEC y batería visual de 84 comprobaciones.
7. **Riesgos.** Solo verificado a 320 px en Chrome; no en un teléfono real.

### 3.3 Nombre accesible del logo del Radar

1. **Objetivo.** Que quien activa por voz pueda decir el texto que ve.
2. **Problema y evidencia.** Texto visible «Radar de vivienda Bizkaia»; nombre accesible «Radar de vivienda, volver a Situación». WCAG 2.5.3 (la etiqueta visible debe estar en el nombre).
3. **Decisión y regla.** DEC-008. El nombre empieza por el texto visible.
4. **Archivos.** [`site/radar/index.html`](../site/radar/index.html) (`aria-label` y `title`).
5. **Comportamiento.** Mismo enlace y destino; solo cambia el nombre anunciado: «Radar de vivienda Bizkaia, volver a Situación».
6. **Pruebas.** Auditoría DEC: el aviso de DEC-008 desaparece en las 4 vistas del Radar.
7. **Riesgos.** Es una cadena de interfaz nueva (`aria-label`); confírmala o corrígela.

### 3.4 Catálogo del Radar: estado vacío y filtro visible

1. **Objetivo.** Que una búsqueda sin resultados explique qué ocurre y que el filtro activo no engañe.
2. **Problema y evidencia (lectura de código, `site/radar/js/indicadores.js`).** Con cero resultados la tabla se quedaba con la cabecera y sin filas ni mensaje. Además la búsqueda ignora el selector «Dimensión», que seguía mostrando «Clave» mientras los resultados venían de todas las dimensiones.
3. **Decisión y regla.** DEC-028 (estados vacíos) y DEC-027 (filtros visibles). No es una norma, es una heurística de claridad.
4. **Archivos.** [`site/radar/js/indicadores.js`](../site/radar/js/indicadores.js), función `drawList`.
5. **Comportamiento.** Con búsqueda: «14 de 52 indicadores contienen «alquiler» (la búsqueda mira todas las dimensiones).» Sin resultados: una fila «Ningún indicador contiene «zzz». Borra la búsqueda para volver a ver el catálogo.» Sin búsqueda: el recuento de siempre.
6. **Pruebas.** Comprobado en Chrome sin pantalla escribiendo «zzz» y «alquiler» en el campo: los dos textos salen como se describe. Sin prueba automática permanente.
7. **Riesgos.** Dos cadenas de interfaz nuevas marcadas `data-propuesta` (pendientes de tu visto bueno). El texto muestra la búsqueda en minúsculas.

## 4. Falsos positivos descartados y control negativo

La primera pasada dio fallos que no eran reales; se corrigió la herramienta, no el sitio:

- Enlace «Saltar al contenido»: está fuera de pantalla hasta recibir el foco; su fondo real es el color de tinta con texto blanco.
- Etiquetas del dock plegado del Radar: opacidad 0.
- Botón «Todos» de Normas y otros estados activos: el fondo oscuro es una píldora hermana que no se ve en la cadena de antecesores.
- Resumen: el fondo claro es una capa aparte; medido sobre píxeles pasa en las 9 diapositivas.
- Hero del Radar · Indicadores: el color de fondo dominante en texto denso eran los píxeles de borde suavizado; con la banda de luminosidad pasa.
- «Trampas de teclado» en botones o enlaces repetidos: la herramienta confundía controles consecutivos idénticos.

**Control negativo:** contra el sitio publicado, sin las correcciones, la herramienta sigue detectando el gris de 4,48:1 del Radar y el desborde de 382 px de Acceso. Así se sabe que la herramienta no aprueba por defecto.

## 5. Pendiente de revisión humana (`needs_review`)

- **Mapa de municipios de Situación.** Al tabular, el foco no lleva contorno CSS propio (`.munis path` tiene `outline: none`). El indicador es el trazo de acento de 3 px de `.marca-hover` bajo `.con-foco` (`mapa-atlas.js`, `situacion.css`). Verificado leyendo el código, no medido sobre píxeles. Conviene mirarlo con el teclado una vez.

## 6. Cómo repetirlo

```bash
python -m http.server 4195 --directory site
node qa/auditoria-dec.mjs http://localhost:4195 auditoria-dec.json
node qa/auditoria-dec.mjs http://localhost:4195 salida.json "radar/#datos"   # una sola vista (sin barra inicial: Git Bash la reescribe)
```

## 7. Fase móvil (2026-11-17)

La auditoría DEC de la primera fase solo midió contraste, teclado y nombres a 1440 px. Esta fase la repite con emulación de móvil táctil a **390×844** y **360×740** sobre las mismas 21 vistas, y añade dos comprobaciones: texto por debajo de 12 px (heurística) y bloqueo del zoom del usuario (WCAG 1.4.4). Se lanza con `node qa/auditoria-dec.mjs http://localhost:4195 salida.json "" 390x844`.

**Resultado antes de corregir (390 px):** 192 comprobaciones, 3 `fail`, 7 `needs_review`. **A 360 px, ya con las correcciones:** 189 comprobaciones, 0 `fail`, 2 `needs_review`.

| # | Hallazgo (evidencia) | Regla y tipo | Cambio | Estado |
|---|---|---|---|---|
| M1 | Radar, barra de secciones y caja de cifras: texto secundario `#bccae9` daba 4,27:1 («Situación») y 3,71:1 (texto de apoyo del hero) sobre el fondo más claro que tienen en móvil. Medido sobre píxeles en Indicadores, Escenarios y Datos | DEC-004 · norma | `--fg-2: #dbe5fa` y `--muted: #a9b6da` en `.ink` ([`radar/css/integracion.css`](../site/radar/css/integracion.css)) | Verificado: 0 `fail` a 390 px en las tres vistas |
| M2 | Resumen en móvil: ningún enlace al inicio del proyecto (Análisis y Radar llevan el logo; el Resumen solo el selector). Comprobado en captura y en el código (`marco.js` no monta `.gmarca` en el hueco `.ecosistema`) | DEC-013 · heurística | Logo en blanco a la izquierda de la barra superior, solo en lectura vertical; 44 px de alto ([`shared/marco.js`](../site/shared/marco.js), [`resumen/index.html`](../site/resumen/index.html), [`resumen/css/lectura-vertical.css`](../site/resumen/css/lectura-vertical.css)) | Verificado a 390 px: sin desborde; oculto en escritorio |
| M3 | Texto de 11 a 11,5 px en móvil: «Elige cómo entrar» y «Prototipo» (portada), «Lo que eliges» y «Lo que no cambia» (Acceso), leyenda de líneas (Medidas), etiquetas «Cálculo propio» y «Obligatorio» (Radar) | Legibilidad · heurística (no es una norma de contraste) | A 12 px con `@media (max-width: 760px)` en `home.css`, `acceso.css`, `medidas-diseno.css`, `escenarios-datos.css` | Verificado en las vistas del Radar y en la leyenda de Medidas |

**Pendiente de decisión (no lo he tocado):** en el Resumen de **escritorio** tampoco hay enlace al inicio. Está así porque la presentación a pantalla completa no tiene cabecera y un logo a la izquierda se pelearía con los títulos. Si lo quieres, la opción menos intrusiva es un logo pequeño en la esquina inferior izquierda de Leer.

**Límites de esta fase.** Es emulación de Chrome: no sustituye a un iPhone o Android reales (barra de direcciones que se oculta, teclado en pantalla, zonas seguras, Safari). Los gestos táctiles, el zoom con pellizco y la lectura con VoiceOver o TalkBack no están evaluados. La batería visual de 84 comprobaciones ya cubría 390 px: tamaños de zonas táctiles, desborde y errores.
