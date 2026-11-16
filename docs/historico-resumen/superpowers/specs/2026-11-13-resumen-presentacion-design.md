# Presentación interactiva del Resumen · Diseño

Fecha: 2026-11-13 · Estado: **borrador pendiente de aprobación** · Carpeta de trabajo prevista: `presentacion/` en la raíz del repositorio.

## 1. Intención

El Resumen publicado (https://vizcaya-vivienda-resumen.vercel.app/) cuenta bien la historia del acceso a la vivienda en Bizkaia, pero es una página larga de scroll (10.195 px a 1024×768, de los que 3.072 px son el gancho). No sirve para proyectarlo ante un grupo ni para enviarlo a quien debe revisarlo.

Se quiere una **presentación dinámica e interactiva** que:
- se **proyecte y se explique** en una reunión (Presentar), y
- se **envíe por enlace** a las personas a cargo del proyecto, que la recorren solas (Leer).

Las diapositivas **ya existen**: son los bloques del Resumen publicado, con sus textos y cifras. El trabajo es **adaptarlas**, no rehacerlas: mismo orden, mismos textos, mismos cálculos, en el estilo Astara del Análisis y del Radar.

## 2. Alcance y fases

| Fase | Contenido | Estado |
|---|---|---|
| **1** | La estructura (navegación, modos, movimiento) y **tres diapositivas**: 1 Gancho · 2 Las cuatro cifras sobre el mapa · 3 Calculadora | Se hace ahora |
| **2** | El resto, en el orden del Resumen: 4 Siete Bizkaias · 5 Lo que viene · 6 Qué se puede hacer · 7 Diez conclusiones · 8 BM30 · 9 Cierre, y los paneles de fuentes y créditos | Después de revisar la fase 1 |

La fase 1 se detiene al tener las tres diapositivas verificadas y con capturas, para que el usuario las revise antes de seguir. La fase 2 tendrá su propio plan.

## 3. Objetivos, no objetivos y antiobjetivos

**Objetivos**
- Cada diapositiva cabe en una pantalla 16:9 y se entiende de un vistazo en Presentar.
- La misma diapositiva se explica sola en Leer (texto completo, etiqueta de la naturaleza del dato y fuentes).
- La lógica interactiva (calculadora, mapa 3D, escenarios) es la del Resumen, sin reescribir cálculos.
- Las transiciones usan el sistema de movimiento Astara y explican continuidad, no decoran.

**No objetivos**
- No se escribe ningún texto de contenido nuevo ni se cambia ninguna cifra. Lo único nuevo son las notas del orador, marcadas como propuesta.
- No se toca el Resumen publicado, el Análisis ni el Radar.
- No hay exportación a `.pptx` ni a PDF en esta versión.
- Móvil queda fuera de la fase 1 (escritorio y proyector 16:9, como en el Análisis).

**Antiobjetivos** (fallaría aunque funcionase)
- Scroll secuestrado o cualquier avance que el usuario no controle.
- Una cifra que cambie respecto al Resumen, aunque sea un redondeo.
- Efectos que tapen el dato (el movimiento no puede restar lectura en la sala).
- Perder la legibilidad al proyectar: texto pequeño, contraste bajo.

## 4. Restricciones

- **Contenido**: los textos de las tres diapositivas se copian literales del `index.html` del Resumen (sección `territorio`, bloque `entrada`). Las etiquetas «Cálculo propio» y «Dato oficial» y las fuentes se conservan.
- **«BM30»** no se desarrolla nunca (afecta a la fase 2).
- **Fotos**: solo las cuatro del Resumen (Bilbao, Mundaka, Elantxobe, Bolueta), con sus créditos. Las de `MATERIALES/` no se usan hasta conocer su procedencia y licencia.
- **CSP estricta** del despliegue original (`script/style/font/img 'self'`): todo autoalojado, sin Google Fonts ni CDN.
- **Fuente de verdad del código**: `DATA/vizcaya-vivienda-main/web-resumen/` (idéntico a lo publicado; `DATA/` no se sube, está en `.gitignore`).
- **Diseño**: tokens y materiales de `sprint-03-1/app/css/tokens.css` (Astara × Liquid Glass; Montserrat solo en titulares, Geist para texto y cifras). Referencia del Radar rediseñado: `BRAND/DCI DESIGN SYSTEM/radar-vivienda-bizkaia/`.
- **Movimiento**: `BRAND/DCI DESIGN SYSTEM/DCI_DESIGN_SYSTEM.md` §9 y `BRAND/EL UNICO Y MEJOR SISTEMA DE DISEÑO/.claude/skills/impeccable/reference/animate.md` (principios).
- **Git**: no se hace commit ni push sin que lo pida el usuario. Nunca `git add -A` en la raíz.

## 5. Aproximaciones consideradas

**Qué se construye (elegida: A, por el usuario).**
- **A. Una presentación con dos modos (Presentar / Leer).** Mismo contenido, dos vistas. Elegida porque cubre proyectar y enviar sin duplicar contenido.
- B. Dos piezas separadas (presentación y página de lectura). Descartada: dos copias del mismo contenido que pueden divergir.
- C. Una sola vista para ambos usos. Descartada: proyectada pesa demasiado o enviada no se entiende.

**Cómo se construye (mi decisión, a revisar).**
- **Reutilizar los módulos del Resumen** (`calculadora.js`, `mapa.js`, `territorio.js`, `modelo/calculo-acceso.js`, `modelo/escenarios.js`, `comun.js`) copiados **sin cambios** a `presentacion/original/`, con manifiesto de hashes. Se comprueba que siguen siendo idénticos a `DATA/`. Es el método ya usado en el Análisis.
- **Enrutador propio y pequeño** en lugar de un motor de diapositivas (Reveal.js o similar): añade una dependencia, complica la CSP y obliga a pelear con su estilo para llevar el sistema Astara.
- **Solo el núcleo de GSAP** (`gsap.min.js`, ya autoalojado en el Resumen). `calculadora.js` lo usa para animar el resultado y yo lo uso para llevar el estado del mapa 3D. **Sin** ScrollTrigger, SplitText, Lenis ni el escenario `taste`: son lo que produce el scroll secuestrado.
- Descartado: el tipo de Artifact «Slides» (no lleva el mapa 3D ni la calculadora con su lógica y no carga los tokens Astara).

## 6. Diseño de la fase 1

### 6.1 Estructura
```
presentacion/
  index.html        marco: cabecera mínima, escenario, indicador de progreso, paneles
  servidor.py       servidor local sin caché (puerto 4180)
  original/         módulos y datos del Resumen, copiados sin cambios (+ manifiesto de hashes)
  css/              presentacion.css (marco y diapositivas), movimiento.css (transiciones)
  js/               app.js (enrutador y modos), diapositivas/ (una por pantalla), movimiento.js, notas.js
  _qa/              pruebas (integridad, navegación, textos, calculadora, contraste, desborde, movimiento)
```
Los tokens de `sprint-03-1/app/css/tokens.css` se enlazan por ruta relativa en local; al publicar se copian (una prueba comprueba que no divergen).

### 6.2 Navegación
- Dirección: `#/<diapositiva>/<paso>` (por ejemplo `#/2/3` = diapositiva 2, paso 3), compartible. `?modo=presentar` / `?modo=leer`.
- Teclado: `←` `→` `AvPág` `RePág` `Espacio` (avanzar/retroceder pasos y diapositivas), `Inicio` `Fin`, `P` Presentar, `L` Leer, `N` notas, `Esc` salir de pantalla completa o cerrar un panel.
- Botones visibles equivalentes, con foco visible de 2 px y etiquetas accesibles. Indicador de progreso (diapositiva y paso) siempre visible.
- Sin rueda ni gesto secuestrados: la rueda y el scroll nativo no cambian de diapositiva.

### 6.3 Los dos modos
| | Presentar | Leer (por defecto en el enlace) |
|---|---|---|
| Pantalla | Completa (API de pantalla completa), 16:9 | Marco normal del navegador |
| Texto | Mínimo: titular, cifra y una frase | Completo: frase, etiqueta de naturaleza del dato y fuentes |
| Pasos | Avanzan con las teclas | Se eligen en una lista (clic o teclado) |
| Notas del orador | `N` las abre en un panel | No se muestran |
| Movimiento | `expressive` | `restrained` |

### 6.4 Las tres diapositivas
1. **Gancho.** «Falta vivienda asequible» · «El alquiler expulsa a los ingresos bajos y reunir la entrada frena a los medios.» · acción «Calcula tu entrada →» (lleva a la 3). Fondo: el mapa 3D de los 113 municipios en la portada (`S.cam = 0`).
2. **Las cuatro cifras.** Cuatro pasos sobre el mismo mapa, con los textos y las etiquetas del Resumen: **34 de 35** (alquiler pasa del 30 % de unos ingresos bajos) · **55,8 %** (Bilbao; ingresos medios 30,4 %) con foto «Bilbao desde Artxanda» · **47,1** viviendas turísticas por 1.000 en Mundaka (Bizkaia 4,8) con foto «Puerto de Mundaka» · **53 de 63** pueblos pequeños con «Elantxobe». Cada paso mueve la cámara y mezcla el dato del mapa (`S.cam`, `S.wH/wA/wV/wN`, etiquetas Bilbao/Mundaka) como en la escena original, pero por pasos y no por scroll.
3. **Calculadora.** «¿Cuántos años para la entrada?» · cinco hogares · precio con − / + y los dos ejemplos (Media de Bizkaia, Un piso en Abando) · resultado «10,8 a 16,9 años» y la cuota · panel «Cómo se calcula». Misma función `entry()` y mismos supuestos (`resumen.json`).

Plan B igual que en el Resumen: si WebGL no está disponible o el usuario pide movimiento reducido, el mapa es el SVG de `mapa.js` y los pasos solo cambian de dato.

### 6.5 Movimiento (sistema DCI §9, `animate.md`)
- **Entre diapositivas**: entrada 420 ms, salida 240 ms (más rápida); fundido con 4–16 px de desplazamiento según la dirección; solo `transform` y `opacity`; curva `cubic-bezier(.16,1,.3,1)`. La cabecera y el indicador de progreso no se mueven (continuidad).
- **Entre pasos**: refresco de la cifra de 240 ms (`tick`), sin interpolarla; la cámara del mapa se mueve entre posiciones fijas.
- **Un momento firma por diapositiva (700 ms)**: la 1, la entrada del titular; la 2, la subida del mapa al cambiar de dato; la 3, el resultado de la calculadora.
- **Continuidad**: el lienzo 3D es un único elemento persistente entre la 1 y la 2; no se recrea. En la 3 queda atenuado.
- **Sin View Transitions** (se quitaron del Análisis por rendimiento y Firefox no las admite).
- **Movimiento reducido**: sin recorrido, solo fundidos de opacidad; el significado se conserva.
- Presupuesto: bucle de dibujo parado fuera de pantalla (como el original), `will-change` solo durante la animación, nada que anime `width/height/top/left`.

### 6.6 Notas del orador
Dos o tres frases por diapositiva escritas **solo con cifras y textos del Resumen**, marcadas `data-propuesta` para que el autor las apruebe o las cambie.

## 7. Pruebas de la fase 1 (1920×1080, 1440×900 y 1280×720)
- **Integridad**: los módulos de `original/` son idénticos a `DATA/web-resumen/` (hash, ignorando CRLF); los tokens enlazados no divergen.
- **Textos**: cada texto de las tres diapositivas coincide literalmente con el `index.html` del Resumen.
- **Calculadora**: para una rejilla de hogares × precios, el resultado coincide con `entry()` del Resumen (mismas cifras que la web publicada).
- **Navegación**: teclas, botones, dirección `#/n/p`, modos, límites (no pasa de la 1 ni de la última), pantalla completa y notas.
- **Movimiento**: duraciones y curva medidas; solo `transform`/`opacity`; ruta de movimiento reducido; sin bucle fuera de pantalla.
- **Calidad**: contraste (leyes del Análisis), sin desborde a los tres tamaños, foco visible, lector de pantalla (anuncios de la calculadora, como el original).
- **Rendimiento**: fotogramas del mapa 3D en un portátil modesto y con proyector (pendiente de medir en equipo real).
- Capturas en `docs/presentacion/capturas/`.

## 8. Decisiones pendientes del autor
1. **«BM30»** y el título del cierre «Vivienda cerca del empleo» (fase 2; no se tocan).
2. **Notas del orador**: texto nuevo, a aprobar.
3. **Publicación**: enlace privado o público y dónde (decisión del usuario; no se publica ni se sube sin pedirlo).
4. **Móvil**: queda fuera de la fase 1; decidir si el enlace debe leerse también en teléfono.
5. **Fotos de `MATERIALES/`**: procedencia y licencia antes de cualquier uso.

## 9. Lo que se deja al constructor
Nombres de funciones y ficheros internos; el aspecto fino de los controles; la forma exacta del indicador de progreso; cómo empaquetar fuentes e imágenes autoalojadas; el mecanismo de pantalla completa y de notas, siempre que cumplan lo anterior.
