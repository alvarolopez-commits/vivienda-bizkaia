# Presentación interactiva del Resumen · Fase 1 · Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir `presentacion/`: la estructura (navegación, modos Presentar/Leer, movimiento) y las tres primeras diapositivas del Resumen (Gancho, Las cuatro cifras, Calculadora), con los textos, cifras y cálculos del Resumen publicado.

**Architecture:** Página HTML estática con un enrutador propio de ~3 pantallas (`#/<diapositiva>/<paso>`). Los módulos del Resumen (mapa 3D, calculadora, modelo de acceso) se copian sin cambios a `presentacion/original/` con manifiesto sha256, igual que en el Análisis; el código nuevo solo los monta. Un único lienzo 3D persiste entre las diapositivas 1 y 2; el estado del mapa se lleva con el núcleo de GSAP.

**Tech Stack:** HTML/CSS/JS de módulos ES sin framework ni build; Three.js y GSAP core ya autoalojados en el Resumen; Python 3 (`python -I`) para integridad y servidor; Node 24 (`node --test`) para la lógica pura; pruebas de navegador `_qa/qa-*.js` ejecutadas desde la consola con la página abierta (patrón de `sprint-03-1/_qa`).

**Spec:** `docs/superpowers/specs/2026-11-13-resumen-presentacion-design.md` (aprobado 2026-11-13). Leer también el `index.html` del Resumen en `DATA/vizcaya-vivienda-main/web-resumen/` (fuente de textos y de módulos).

## Global Constraints

- **Contenido literal:** textos y cifras de las tres diapositivas = `index.html` del Resumen (sección `#territorio` y bloque `#entrada`), incluidas las etiquetas «Cálculo propio» / «Dato oficial» y las fuentes. Ningún texto de contenido nuevo; lo nuevo (notas del orador) va con `data-propuesta`.
- **«BM30»** no se desarrolla nunca.
- **Sin scroll secuestrado:** la rueda y el scroll nativo no cambian de diapositiva. Sin ScrollTrigger, SplitText, Lenis ni el escenario `taste`; solo `gsap.min.js` (núcleo).
- **Sin View Transitions.** Animar solo `transform` y `opacity` (nunca `width/height/top/left/margin`); `will-change` solo durante la animación.
- **Movimiento (DCI §9):** 150 / 240 / 420 / 700 ms; curva `cubic-bezier(.16, 1, .3, 1)`; salida más rápida que la entrada; un momento firma por diapositiva; presentar = `expressive`, leer = `restrained`; con `prefers-reduced-motion` solo fundidos.
- **CSP original:** `script/style/font/img/connect 'self'`. Todo autoalojado al publicar (ver Task 1, fuentes).
- **Fotos:** solo Bilbao, Mundaka y Elantxobe del Resumen, con sus créditos. Nada de `MATERIALES/`.
- **Tamaños de prueba:** 1920×1080, 1440×900, 1280×720 (16:9). Solo escritorio.
- **Git:** no hacer commit ni push salvo que el usuario lo pida; nunca `git add -A` en la raíz (hay `MATERIALES/`, `REFERENCIAS/`, `DATA/` sin seguimiento). Los pasos «Punto de control» solo verifican y dejan los cambios sin commitear.
- **Escritura:** español, tono del proyecto; sin emoji.

## Review Focus

1. **Teclas dentro de un campo:** con el foco en el precio de la calculadora, `←`, `→` y `Espacio` editan el campo y NO cambian de diapositiva. (Task 3.)
2. **Direcciones inválidas o a medias:** `#/9/9`, `#/0`, `#/2/9`, `#/abc`, vacío y los botones Atrás/Adelante del navegador caen en una diapositiva y paso válidos. (Task 2.)
3. **Precio de la calculadora fuera de rango o no numérico** (vacío, `abc`, `1`, `99999999`): se ajusta a 60.000–900.000 € sin romper el resultado. (Task 6.)
4. **Sin WebGL o contexto perdido:** el mapa pasa al SVG de `mapa.js`; la presentación sigue navegable y los pasos siguen cambiando el texto. (Task 4.)
5. **Pulsaciones rápidas y movimiento reducido:** `→ → → →` en menos de un segundo deja exactamente el estado final (sin diapositivas a medio fundir) y con movimiento reducido no hay recorrido. (Task 7.)

---

## File Structure

```
presentacion/
  index.html                 marco: escenario, indicador, paneles (notas, cómo se calcula, créditos)
  servidor.py                servidor local sin caché, puerto 4180; alias /_app/ → sprint-03-1/app y /_qa/ → presentacion/_qa
  original/                  copias sin cambios del Resumen (misma estructura que web-resumen/)
    js/{calculadora,comun,mapa,territorio}.js  js/modelo/{calculo-acceso,escenarios}.js
    data/{resumen.json,municipios.geojson}
    vendor/gsap/gsap.min.js  vendor/three/three.module.min.js (+ LICENSE)
    fonts/montserrat-latin.woff2 (+ OFL)
  css/presentacion.css       marco, modos, diapositivas
  css/movimiento.css         transiciones, pasos, momento firma, movimiento reducido
  js/estado.js               lógica pura: diapositivas, hash, siguiente/anterior
  js/modos.js                modo inicial, pantalla completa, intensidad de movimiento
  js/mapa3d.js               envoltorio del mapa persistente (estado S por pasos)
  js/movimiento.js           transiciones entre diapositivas y pasos
  js/notas.js                notas del orador (propuesta)
  js/app.js                  arranque, teclado, hash, paneles
  js/diapositivas/{gancho,cifras,calculadora}.js
  _qa/                       integridad.py, extraer_textos.py, textos.json, original-hashes.json, estado.test.mjs, qa-*.js
```

---

### Task 1: Andamio, copias originales, integridad y servidor

**Files:**
- Create: `presentacion/servidor.py`, `presentacion/index.html` (mínimo), `presentacion/_qa/integridad.py`, `presentacion/_qa/original-hashes.json`
- Create (copias sin cambios): todo `presentacion/original/**` de la lista de arriba, desde `DATA/vizcaya-vivienda-main/web-resumen/`
- Modify: `.gitattributes` (añadir `presentacion/original/** -text` y `presentacion/_qa/original-hashes.json -text`)

**Interfaces:**
- Produces: `integridad.py` (sale con 1 si algo falla); servidor en `http://localhost:4180/` que sirve `presentacion/` en `/`, `sprint-03-1/app/` en `/_app/` y `presentacion/_qa/` en `/_qa/`, con `Cache-Control: no-store` y tipos `.js` → `text/javascript`, `.geojson` → `application/geo+json`.

- [ ] **Step 1: Write the failing test** — `integridad.py` con la comprobación 1: «cada fichero de `original/` existe y su sha256 (ignorando CRLF) coincide con el de `original-hashes.json` y, si existe `DATA/`, con el de `DATA/.../web-resumen/`»; comprobación 2: «`original/` contiene exactamente los 13 ficheros de la lista de arriba».
- [ ] **Step 2: Run it** — `python -I presentacion/_qa/integridad.py` → FAIL (no existe `original/`).
- [ ] **Step 3: Copy the originals** preservando bytes (`cp`, no editores) y generar `original-hashes.json` con el mismo formato que `sprint-03-1/_qa/original-hashes.json`. Escribir `servidor.py` siguiendo `sprint-03-1/servidor.py`.
- [ ] **Step 4: Fuentes.** Copiar `montserrat-latin.woff2` y `OFL-Montserrat.txt` del Resumen. **Geist no está en el equipo** (ni en `DCI DESIGN SYSTEM`). No descargar nada sin permiso del usuario: pedirle autorización indicando archivo, origen (paquete oficial `geist` de Vercel, licencia OFL) y tamaño. Mientras tanto, en local `index.html` enlaza las mismas Google Fonts que `sprint-03-1/app/index.html`; añadir a `integridad.py` una comprobación **informativa** (no bloqueante) «fuentes no autoalojadas: bloquea la publicación».
- [ ] **Step 5: Run** `python -I presentacion/_qa/integridad.py` → todo PASS salvo el aviso informativo de fuentes. Arrancar `python presentacion/servidor.py` y comprobar con `curl -sI http://localhost:4180/original/data/resumen.json` → `200` y `Cache-Control: no-store`.
- [ ] **Step 6: Punto de control** — dejar sin commit; anotar en el informe de la tarea el estado.

### Task 2: Estado y navegación (lógica pura)

**Files:**
- Create: `presentacion/js/estado.js`, `presentacion/_qa/estado.test.mjs`

**Interfaces:**
- Produces:
  - `export const DIAPOSITIVAS: readonly [{id:'gancho',pasos:1},{id:'cifras',pasos:4},{id:'calculadora',pasos:1}]`
  - `export type Estado = {d:number, p:number}` (1-based; `1 ≤ d ≤ 3`, `1 ≤ p ≤ DIAPOSITIVAS[d-1].pasos`)
  - `export function leerHash(hash: string): Estado` — acepta `#/2/3`, `#/2`, `''`, basura; siempre devuelve un Estado válido (inválido → ajusta al más cercano; vacío o ilegible → `{d:1,p:1}`)
  - `export function escribirHash(e: Estado): string` → `'#/2/3'`
  - `export function siguiente(e: Estado): Estado | null` / `anterior(e: Estado): Estado | null` — avanzan de paso y, al agotarlos, de diapositiva; `null` en los extremos
  - `export function inicio(): Estado` / `fin(): Estado` → `{d:1,p:1}` / `{d:3,p:1}`

- [ ] **Step 1: Write the failing tests** (`node --test presentacion/_qa/estado.test.mjs`), con estas aserciones exactas:
  - `leerHash('#/2/3')` → `{d:2,p:3}`; `leerHash('#/2')` → `{d:2,p:1}`; `leerHash('')` y `leerHash('#/abc')` → `{d:1,p:1}`
  - `leerHash('#/9/9')` → `{d:3,p:1}`; `leerHash('#/0')` → `{d:1,p:1}`; `leerHash('#/2/9')` → `{d:2,p:4}`; `leerHash('#/1/4')` → `{d:1,p:1}`
  - `siguiente({d:1,p:1})` → `{d:2,p:1}`; `siguiente({d:2,p:4})` → `{d:3,p:1}`; `siguiente({d:3,p:1})` → `null`
  - `anterior({d:2,p:1})` → `{d:1,p:1}`; `anterior({d:3,p:1})` → `{d:2,p:4}` (entra por el último paso); `anterior({d:1,p:1})` → `null`
  - `escribirHash(leerHash(h))` es idempotente para cada hash válido.
- [ ] **Step 2: Run** → FAIL (módulo inexistente).
- [ ] **Step 3: Implement** `estado.js` como módulo ES sin DOM.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Punto de control** (sin commit).

### Task 3: Marco, navegación, modos, notas y pantalla completa

**Files:**
- Create: `presentacion/js/app.js`, `presentacion/js/modos.js`, `presentacion/css/presentacion.css`, `presentacion/_qa/qa-navegacion.js`
- Modify: `presentacion/index.html` (marco completo)

**Interfaces:**
- Consumes: `estado.js` (Task 2); tokens y tipografía de `/_app/css/tokens.css` y `/_app/css/typography.css`.
- Produces:
  - `modos.js`: `export function modoInicial(search: string): 'presentar' | 'leer'` (`?modo=presentar` → `'presentar'`; cualquier otro → `'leer'`); `export function intensidad(modo): 'expressive' | 'restrained'`; `export async function entrarPantallaCompleta(): Promise<boolean>` (devuelve `false` si el navegador lo rechaza, sin lanzar).
  - `app.js`: contrato de diapositiva `{ id: string, pasos: number, raiz: HTMLElement, ir(paso: number, dir: 1|-1|0): void }` y registro `registrar(d)`; `ctx = { mapa, datos:{resumen,geo}, modo(): string, anunciar(texto: string): void }`.
  - El `<body>` lleva `data-modo` y `data-motion` (`expressive` en presentar, `restrained` en leer); `[data-anuncio]` es una región `role="status"` (la usa `comun.js`).
- Teclado: `ArrowRight`/`PageDown`/`Space` → `siguiente`; `ArrowLeft`/`PageUp` → `anterior`; `Home`/`End`; `p` presentar, `l` leer, `n` notas, `Escape` cierra panel o sale de pantalla completa. **Ignorar todo el teclado cuando `event.target` es `input`, `textarea`, `select`, `button` con foco de formulario o está dentro de un `dialog` abierto** (Review Focus 1). Botones visibles (anterior, siguiente, Presentar/Leer, Notas) con `aria-label` y foco visible de 2 px; indicador «diapositiva d de 3 · paso p de n».

- [ ] **Step 1: Write the failing test** `qa-navegacion.js` (módulo que exporta `run()` y devuelve `{pass, fail, detalles}`): carga `/` y comprueba, a los tres tamaños: (a) `location.hash` pasa a `#/1/1` al abrir; (b) `ArrowRight` ×5 llega a `#/2/4`… y al final `#/3/1`, un `ArrowRight` más no cambia; (c) `ArrowLeft` desde `#/3/1` → `#/2/4`; (d) **con foco en `#precio` (diapositiva 3), `ArrowLeft`, `ArrowRight` y `Space` no cambian el hash**; (e) `?modo=presentar` pone `data-modo="presentar"` y `data-motion="expressive"`, sin parámetro `leer`/`restrained`; (f) `n` abre el panel de notas y `Escape` lo cierra; (g) la rueda (`WheelEvent`) y `scrollBy` no cambian el hash; (h) con `entrarPantallaCompleta` rechazada la página no lanza y mantiene el modo; (i) Atrás/Adelante del navegador restauran el estado.
- [ ] **Step 2: Run** (consola con la página abierta en `http://localhost:4180/`): `import('/_qa/qa-navegacion.js').then(m=>m.run())` → FAIL.
- [ ] **Step 3: Implement** marco, `app.js`, `modos.js` y `presentacion.css`. Layout 16:9: el escenario ocupa el viewport (`100dvh`), con cabecera mínima (marca «Vivienda en Bizkaia» + controles) y el indicador abajo; en presentar la cabecera se atenúa. Las diapositivas se registran como marcadores vacíos hasta las Tasks 4–6.
- [ ] **Step 4: Run** → PASS a los tres tamaños.
- [ ] **Step 5: Punto de control** (sin commit).

### Task 4: Mapa 3D persistente y diapositiva 1 (Gancho)

**Files:**
- Create: `presentacion/js/mapa3d.js`, `presentacion/js/diapositivas/gancho.js`, `presentacion/_qa/extraer_textos.py`, `presentacion/_qa/textos.json`, `presentacion/_qa/qa-mapa.js`
- Modify: `presentacion/index.html`, `presentacion/css/presentacion.css`, `presentacion/_qa/integridad.py`

**Interfaces:**
- Consumes: `original/js/territorio.js` (`S`, `territory(host, geo, data)`), `original/js/mapa.js`, `original/js/comun.js` (`reduced()`), `original/vendor/gsap/gsap.min.js` (global `gsap`).
- Produces:
  - `export const PASOS_MAPA: readonly [Partial<typeof S> ×5]` — estados finales del mapa, sacados de la línea de tiempo original (`territorio.js`, `registerScene`): índice 0 = portada `{cam:0,wH:1,wA:0,wV:0,wN:0,lB:0,lM:0}`; 1 = «34 de 35» `{cam:1,wH:0,wA:1,wV:0,wN:0,lB:0,lM:0}`; 2 = Bilbao `{cam:2,wH:0,wA:1,wV:0,wN:0,lB:1,lM:0}`; 3 = Mundaka `{cam:3,wH:0,wA:0,wV:1,wN:0,lB:0,lM:1}`; 4 = pueblos `{cam:4,wH:0,wA:0,wV:0,wN:1,lB:0,lM:0}`.
  - `export async function montarMapa(host: HTMLElement, datos: {resumen: object, geo: object}): Promise<{ irA(indice: 0|1|2|3|4, opciones?: {inmediato?: boolean}): void, atenuar(on: boolean): void, plano: boolean }>` — crea la estructura que `territory` espera (`host` dentro de un `.scene` con clase `is-live`, y un `.terr-labels` con `[data-l="bilbao"]` y `[data-l="mundaka"]` con los rótulos «Bilbao 55,8 %» y «Mundaka 47,1 por 1.000» del Resumen), llama a `territory(host, geo, resumen)` y mueve `S` con `gsap.to(S, {...PASOS_MAPA[i], duration: 0.7, ease: 'power3.out', overwrite: true})` (o asignación directa si `inmediato` o `reduced()`). `plano` es `true` si quedó el SVG de plan B.
  - `gancho.js`: `export function crearGancho(ctx): Diapositiva` con `h1` «Falta vivienda asequible», lead y acción «Calcula tu entrada →» (lleva a `#/3/1`).
  - `textos.json`: `{ gancho: string[], cifras: {...}, calculadora: string[] }` generado por `extraer_textos.py` desde `DATA/.../index.html` con `html.parser` (texto con espacios normalizados, **conservando el NBSP** de «30 %»).

- [ ] **Step 1: Write the failing tests.** (a) `integridad.py`: cada cadena de `textos.json` aparece literal en `DATA/.../web-resumen/index.html` renderizado a texto. (b) `qa-mapa.js`: `montarMapa` con datos reales devuelve un objeto con `irA`; tras `irA(2,{inmediato:true})` `S.cam === 2 && S.lB === 1`; con `WebGLRenderer` forzado a lanzar (monkey-patch de `HTMLCanvasElement.prototype.getContext` → `null`) `plano === true`, el host contiene un `svg[role=img]` con 113 `path` y `irA` no lanza (Review Focus 4). (c) El texto visible de la diapositiva 1 contiene cada cadena de `textos.gancho`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** `extraer_textos.py` (selectores del Resumen), `mapa3d.js` y `gancho.js`. El lienzo se monta **una sola vez** en un contenedor del escenario que no pertenece a ninguna diapositiva (persistente); la diapositiva 3 lo atenúa. Cargar `resumen.json` y `municipios.geojson` una vez en `app.js`.
- [ ] **Step 4: Run** → PASS; abrir `http://localhost:4180/#/1/1` y comprobar visualmente el mapa 3D en portada (captura).
- [ ] **Step 5: Punto de control** (sin commit).

### Task 5: Diapositiva 2 (Las cuatro cifras) con fotos y créditos

**Files:**
- Create: `presentacion/js/diapositivas/cifras.js`, `presentacion/_qa/qa-cifras.js`
- Copy: las tres fotos (`bilbao.jpg`, `mundaka.jpg`, `elantxobe.jpg`) de `web-resumen/img/` a `presentacion/original/img/` sin cambios y añadirlas a `original-hashes.json`; ampliar la lista de `integridad.py`.
- Modify: `index.html`, `presentacion.css`, `textos.json` (regenerar)

**Interfaces:**
- Consumes: `montarMapa(...).irA`, `PASOS_MAPA`; `ctx.modo()`.
- Produces: `export function crearCifras(ctx): Diapositiva` con `pasos: 4`. `ir(p, dir)` llama a `mapa.irA(p)` (paso `p` ↔ índice de mapa `p`), enciende el bloque `p` (cifra, titular y meta literales) y su foto con pie. Panel «Créditos de las imágenes» (lenguaje y enlaces de los tres créditos del Resumen más su párrafo de licencias). En **Leer** los cuatro bloques se ven como una lista seleccionable (clic o teclado) al lado del mapa; en **Presentar** solo el actual, en grande.

- [ ] **Step 1: Write the failing tests** (`qa-cifras.js`): para `p=1..4`, tras `ir(p)` el texto visible contiene exactamente las cadenas del bloque `p` de `textos.json` (incluida la etiqueta «Cálculo propio» o «Dato oficial») y **no** las de otro bloque; `S.cam === p` al final del tween; la foto visible de los pasos 2, 3 y 4 es Bilbao, Mundaka, Elantxobe y no hay foto en el paso 1; el panel de créditos cita a Paul Arps, Jules Verne Times Two y Ander Abadia Zallo y abre/cierra con `Escape`; en **Leer**, clic en el 3.er elemento de la lista → `#/2/3`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** `cifras.js` y estilos.
- [ ] **Step 4: Run** → PASS a los tres tamaños; capturas de los cuatro pasos en ambos modos.
- [ ] **Step 5: Punto de control** (sin commit).

### Task 6: Diapositiva 3 (Calculadora)

**Files:**
- Create: `presentacion/js/diapositivas/calculadora.js`, `presentacion/_qa/qa-calculadora.js`
- Modify: `index.html`, `presentacion.css`, `textos.json` (regenerar)

**Interfaces:**
- Consumes: `original/js/calculadora.js` → `calculator(root: HTMLElement, supuestos: object): void`, `entry(price: number, net: number, s: object): {years:[number,number], effort:[number,number]}`, `between(lo: number, hi: number, d?: number): string`; `resumen.calculadora.supuestos`. `calculator` espera dentro de `root`: `[data-calc]` (formulario) con radios `name="hogar"` (valores 20637, 36766 —marcado—, 58436, 33959, 27420), `#precio` (número, `min 60000`, `max 900000`, valor inicial 265733), botones `[data-paso="-10000"|"10000"]`, `[data-precio="265733"|"558211"]`, y fuera del formulario `[data-anos]` y `[data-cuota]`. Reproducir este HTML **literal** del Resumen.
- Produces: `export function crearCalculadora(ctx, supuestos): Diapositiva` con `pasos: 1`; el panel «Cómo se calcula» (literal del Resumen) con botón «Cómo se calcula →» y cierre con `Escape`; atenúa el mapa (`mapa.atenuar(true)`) al entrar y lo restablece al salir.

- [ ] **Step 1: Write the failing tests** (`qa-calculadora.js`): (a) con los valores iniciales `[data-anos]` = «10,8 a 16,9» y `[data-cuota]` = «del 29,0 al 32,6 %»; (b) rejilla: para cada hogar × precios `[60000, 150000, 265733, 558211, 900000]`, tras fijar los controles y esperar 800 ms, `[data-anos]` es igual a `between(...entry(precio, hogar, supuestos).years)` (equivalencia con la función original); (c) **Review Focus 3**: escribir en `#precio` `''`, `'abc'`, `'1'`, `'99999999'` y disparar `change` deja el campo en un valor de 60000 a 900000 y `[data-anos]` sigue con formato «N a M» o «N»; (d) los ejemplos «Media de Bizkaia» → 265733 y «Un piso en Abando» → 558211; (e) `ArrowLeft/ArrowRight/Space` en `#precio` no cambian la diapositiva (con Task 3); (f) el texto del panel «Cómo se calcula» y las cadenas de `textos.calculadora` coinciden literalmente.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** `calculadora.js` (HTML literal del bloque `#entrada` adaptado al marco; `calculator(root, supuestos)` sin tocar el módulo).
- [ ] **Step 4: Run** → PASS; captura del resultado inicial y de «Un piso en Abando».
- [ ] **Step 5: Punto de control** (sin commit).

### Task 7: Movimiento entre diapositivas y pasos

**Files:**
- Create: `presentacion/js/movimiento.js`, `presentacion/css/movimiento.css`, `presentacion/_qa/qa-movimiento.js`
- Modify: `app.js` (usar `transicionar`), `index.html`

**Interfaces:**
- Consumes: variables de `/_app/css/tokens.css` (`--t-fast` 150 ms, `--t-base` 240 ms, `--t-layout` 420 ms, `--t-focal`, `--ease-out`, `--ease-inout`) y `body[data-motion]`.
- Produces: `export function transicionar(salida: HTMLElement | null, entrada: HTMLElement, dir: 1 | -1): Promise<void>` — entrada 420 ms (`--t-layout`), salida 240 ms (`--t-base`), fundido con desplazamiento de `±16px` en `expressive`, `±4px` en `restrained`, **0px** con movimiento reducido; resuelve al terminar y es **interrumpible** (una llamada nueva completa o cancela la anterior sin dejar estilos intermedios). `export function refrescar(el: HTMLElement): void` — el «tick» de 240 ms de una cifra que cambia (sin interpolar). Momento firma por diapositiva en `expressive` (700 ms): titular de la 1, cambio de dato del mapa en la 2 (ya lo da `irA`), resultado de la calculadora en la 3.

- [ ] **Step 1: Write the failing tests** (`qa-movimiento.js`): (a) con `data-motion="expressive"`, una transición dura entre 380 y 520 ms y la salida entre 200 y 300 ms (medido con `performance.now()` y `getAnimations()`); (b) las animaciones solo tocan `transform` y `opacity` (inspeccionar `getKeyframes()` de cada `Animation` de las diapositivas: ninguna propiedad fuera de ese par); (c) **Review Focus 5**: cinco `ArrowRight` en 400 ms terminan en `#/3/1`, solo una diapositiva visible con `opacity: 1` y ninguna con `transform` ≠ `none`, tras 800 ms; (d) con `matchMedia` forzado a reducido (usar `emulateMedia` del navegador o el parámetro `?mov=quieto`) el desplazamiento es 0 y solo hay fundido; (e) no hay `view-transition-name` ni `startViewTransition` en el código (`grep`); (f) el bucle del mapa se para fuera de pantalla (`renderer.setAnimationLoop` ya lo hace por `IntersectionObserver`; comprobar que con la diapositiva 3 oculta el mapa no consume fotogramas visibles).
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** con Web Animations API (`element.animate`) sobre `transform`/`opacity`; `will-change` solo mientras dura la animación; cabecera e indicador sin movimiento.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Punto de control** (sin commit).

### Task 8: Notas del orador (propuesta)

**Files:**
- Create: `presentacion/js/notas.js`, `presentacion/_qa/qa-notas.js`
- Modify: `app.js`, `index.html`

**Interfaces:**
- Produces: `export const NOTAS: Record<'1'|'2'|'3', string[]>` — dos o tres frases por diapositiva (la 2 lleva una por paso), **construidas solo con cifras y frases ya presentes en `textos.json`**; el panel las marca `data-propuesta`. `export function textoNotas(e: Estado): string[]`.

- [ ] **Step 1: Write the failing tests** (`qa-notas.js`): toda cifra (secuencia de dígitos con coma o punto) de `NOTAS` aparece en `textos.json` (ninguna cifra inventada); `textoNotas({d:2,p:3})` contiene «47,1»; el panel tiene `data-propuesta` y `aria-label` «Notas del orador»; se abre con `n` y cierra con `Escape` sin cambiar de diapositiva.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** `notas.js` y el panel.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Punto de control** (sin commit).

### Task 9: Verificación final, capturas y documentación de la fase 1

**Files:**
- Create: `presentacion/README.md`, `presentacion/Abrir presentacion.bat`, `presentacion/_qa/qa-calidad.js`, `docs/presentacion/FASE_1.md`, `docs/presentacion/capturas/` (PNG de las 3 diapositivas, pasos y ambos modos, a 1920×1080, 1440×900 y 1280×720)

- [ ] **Step 1: Write `qa-calidad.js`** (falla hasta cumplirse): contraste WCAG AA del texto de las tres diapositivas en ambos modos (medido sobre el píxel renderizado donde hay mapa o foto, como `sprint-03-1/_qa/qa-inicio.js`); sin desborde horizontal ni vertical a los tres tamaños; foco visible de 2 px en botones y campos; un solo `h1` visible por diapositiva; `[data-anuncio]` recibe el anuncio de la calculadora; sin texto fuera de `textos.json` salvo etiquetas de interfaz y notas (`data-propuesta`).
- [ ] **Step 2: Run toda la batería:** `python -I presentacion/_qa/integridad.py`, `node --test presentacion/_qa/estado.test.mjs`, y desde el navegador `qa-navegacion`, `qa-mapa`, `qa-cifras`, `qa-calculadora`, `qa-movimiento`, `qa-notas`, `qa-calidad` a los tres tamaños (ejecutar cada módulo en una pestaña limpia: dos baterías en la misma pestaña se corrompen entre sí). Esperado: todo PASS, con el aviso informativo de fuentes si Geist sigue sin autoalojar.
- [ ] **Step 3: Rendimiento.** Medir fotogramas del mapa 3D (`requestAnimationFrame` durante 5 s en la diapositiva 2) con la ventana a 1920×1080; anotar el resultado y que **la medida en un portátil modesto y con proyector queda pendiente** (no hay equipo real en esta sesión).
- [ ] **Step 4: Escribir `FASE_1.md` y `README.md`:** qué se hizo, cómo verlo (`python presentacion/servidor.py` → http://localhost:4180/ o el `.bat`), atajos, resultados de las pruebas con números, capturas, decisiones pendientes del autor (BM30 y cierre —fase 2—, notas, publicación, móvil, fotos de `MATERIALES/`, fuentes Geist) y lo no verificado (rendimiento en equipo real, Safari y Firefox, lector de pantalla real).
- [ ] **Step 5: Punto de control final:** `git status` (solo cambios en `presentacion/`, `docs/presentacion/`, `docs/superpowers/` y `.gitattributes`); **parar y pedir al usuario que revise las capturas antes de la fase 2**; preguntar si quiere commit.

---

## Self-Review

- **Cobertura de la spec:** §2 fases → Tasks 1–9 (la fase 2 queda fuera, anotada en Task 9); §3 objetivos → Tasks 4–6 (diapositivas) y 3 (modos); antiobjetivos «scroll secuestrado» y «cifra cambiada» → Constraints + tests de rueda (Task 3g) y de equivalencia (Task 6b); §4 restricciones → Global Constraints y Task 1 (CSP/fuentes, hashes); §5 aproximación → Architecture + Task 1; §6.1 estructura → File Structure; §6.2 navegación → Tasks 2–3; §6.3 modos → Task 3 y 5; §6.4 las tres diapositivas → Tasks 4–6; §6.5 movimiento → Task 7; §6.6 notas → Task 8; §7 pruebas → Tasks 1, 2–8 y 9; §8 pendientes → Task 9 (informe).
- **Hallazgo que la spec no recogía:** el Análisis carga Montserrat/Geist de Google Fonts y la spec exige autoalojar; Geist no está en el equipo. Resuelto en Task 1 (pedir permiso para descargarlo; aviso no bloqueante hasta publicar).
- **Consistencia de tipos:** `Estado {d,p}` (Task 2) lo usan `app.js` (3), `notas.js` (8) y las pruebas; `Diapositiva {id, pasos, raiz, ir}` se define en Task 3 y se implementa en 4–6; `montarMapa(...)` devuelve `{irA, atenuar, plano}` (Task 4) y lo usan Tasks 5–6; `PASOS_MAPA` índice `p` = paso `p` de la diapositiva 2.
- **Proporción:** el plan es más corto que cuatro veces la spec y casi no contiene cuerpos de función: define firmas, valores y aserciones.
