# Estudio · Radar Vivienda Bizkaia en Safari y con criterios Apple

**Fecha:** 2026-11-16 · **Estado:** estudio previo, sin implementar nada · **Alcance:** Radar publicado (`gh-pages`, commit `c20f214`)

> Objetivo: decidir cómo combinar (a) lo que Safari y las plataformas Apple esperan de una web con (b) el estilo limpio y claro del Radar, para aplicarlo más adelante, cuando el diseño esté asentado. Aquí solo se diagnostica y se prioriza.

---

## 1. Resumen ejecutivo

1. **El Radar ya está cerca del espíritu Apple** (jerarquía clara, un solo acento, datos primero, controles sobrios). Lo que falta no es estética sino *comportamiento de plataforma*: cómo se mueve el foco en Safari, qué pasa con el «hover» en iPad/iPhone, cómo se ve con Aumentar contraste o Reducir movimiento, y qué hace la página al guardarla en el Dock o la pantalla de inicio.
2. **Hay 2 fallos reales que pueden romper contenido en Safari anterior a 16.4** (ver §4, P0): una expresión regular con *lookbehind* en `situacion.js:18` que da error de sintaxis y haría caer todo el módulo Situación, y `useGrouping: "always"` en `ui.js:32` que imprimiría `1459` en lugar de `1.459`. Con Safari actual no ocurren; afectan a iOS/macOS que no se han actualizado.
3. **Hay 3 puntos de diseño de interacción específicos de Safari** (P1): el foco **no** pasa a un botón al hacer clic (la devolución de foco del panel lateral falla), la tecla **Tab no llega a botones** con la configuración por defecto de Safari (el panel de estado solo se alcanza con Opción+Tab), y los efectos `:hover` se quedan «pegados» al tocar en pantallas táctiles.
4. **De las guías Apple (HIG) lo más útil para el Radar es poco y concreto:** materiales/«glass» solo para controles y navegación (no para el contenido), gráficos con resumen y etiquetas accesibles y sin depender solo del color, tamaños de control cómodos (≈ 44 pt en táctil), texto que escale, respeto a Aumentar contraste y a Reducir movimiento.
5. **Límite honesto del estudio:** no he podido ejecutar Safari/WebKit real (no hay `safaridriver` ni dispositivos aquí). Los hallazgos salen de análisis estático del código, de tablas de compatibilidad (MDN/Can I Use) y de documentación oficial de Apple. Cada hallazgo de comportamiento debe confirmarse en un Safari real antes de implementar (plan en §8).

---

## 2. Método y límites

| Qué se hizo | Cómo | Límite |
|---|---|---|
| Inventario de APIs/CSS usadas | `grep` sobre `radar-live` (publicado) | Estático; no mide uso real |
| Versión mínima de Safari por función | MDN Browser Compat Data + Can I Use (descargados) | «Primera versión con soporte»; no refleja bugs parciales |
| Comportamiento de teclado/foco en Safari | Documentación de soporte de Apple + bug de WebKit 229895 | Hay que verificarlo con la versión concreta |
| Criterios Apple | Páginas HIG (Materials, Charts, Accessibility, Layout, Typography, Color, Sidebars, Toolbars, Sheets, Popovers, Segmented controls, Search fields, Tab bars, Motion), leídas desde el JSON oficial de developer.apple.com | HIG está pensado para apps nativas: se traduce, no se copia |
| Ejecución en Safari/iOS | **No realizada** | Requiere Mac con Safari + iPhone/iPad (§8) |

**Versión mínima efectiva del Radar hoy ≈ Safari 16.4** (por lookbehind, `useGrouping` con cadenas y container queries 16.0). Safari 16.4 salió en marzo de 2023; con Safari 26.x vigente, la cobertura es amplia pero no total en iOS sin actualizar.

---

## 3. Qué espera Safari de una web (y qué hace el Radar)

### 3.1 Foco y teclado

- **Tab por defecto en Safari/macOS solo resalta campos de texto y menús emergentes.** Para llegar a botones y enlaces hay que usar **Opción+Tab**, o activar en Safari › Ajustes › Avanzado «Pulsar Tab para resaltar cada elemento de la página». ([Apple Soporte: atajos de teclado de Safari](https://support.apple.com/guide/safari/keyboard-and-other-shortcuts-cpsh003/mac))
- **Safari en macOS no da foco a un botón al hacer clic** (convención de macOS; [WebKit 229895](https://bugs.webkit.org/show_bug.cgi?id=229895)). Tras el clic, `document.activeElement` es `body`.
- Consecuencias en el Radar:
  - `pci.js:78` guarda `document.activeElement` como «el que abrió el panel» para devolverle el foco al cerrar. En Safari ese valor será `body` → **el foco no vuelve al botón que abrió el panel** (los usuarios de teclado y VoiceOver pierden su sitio).
  - `pci.js:93-94` (trampa de foco) compara con `activeElement`; sigue funcionando porque el foco entra por código, pero conviene probarlo.
  - `estatus.js:44` (flechas en la barra de estado) usa `activeElement`: dentro de la barra funciona si los segmentos reciben foco por teclado, pero **un usuario con la configuración por defecto de Safari no llegará con Tab** a la barra.
  - `estatus.js:37-38` y `indicadores-clave.js:74,76` usan `:focus-visible` (Safari ≥ 15.4): correcto, y de hecho es lo que evita mostrar anillos tras el clic.

### 3.2 Entrada táctil y puntero

- iPadOS con ratón y iOS emulan `:hover` al tocar: sin proteger, el último elemento tocado se queda «levantado». El Radar tiene **65 reglas `:hover` y ninguna dentro de `@media (hover: hover)`**. Ejemplo visible: `.est:hover { transform: translateY(-3px) }` (`radar.css:387`), que en iPad dejaría el segmento elevado tras tocarlo.
- La lectura contextual de la barra de estado (nombre + valor al pasar el cursor) **no existe en táctil**; ahí solo hay clic → panel. Es aceptable (la información está en el panel), pero conviene decidirlo a propósito.
- No hay `touch-action` ni `-webkit-tap-highlight-color` definidos: en iOS puede aparecer el destello gris al tocar y, en gráficos con arrastre, conflicto con el scroll.

### 3.3 Pantalla, seguro y barra del navegador

- Viewport con `viewport-fit=cover` y 10 usos de `env(safe-area-inset-*)`: **bien**, es lo que Apple pide para notch/isla dinámica.
- `min-height: 100vh` (`pci.css:284`): en Safari móvil `100vh` incluye la barra de direcciones cuando está escondida → desbordes. Preferir `100svh`/`100dvh` (Safari ≥ 15.4); ya se usa `100svh` en la constelación.
- `position: sticky` (5 usos): bien (Safari ≥ 7.1). Conviene probar la cabecera/panel sticky con la barra de Safari que se contrae.

### 3.4 Cabecera del documento (lo que Safari y Apple leen)

`index.html` **no tiene** `theme-color`, `apple-touch-icon`, manifiesto web, enlace a favicon (`/favicon.ico` da 404) ni etiquetas Open Graph. Efectos en Safari/Apple:
- Sin favicon ni `apple-touch-icon`: pestañas, Favoritos, Lista de lectura y «Añadir a pantalla de inicio / Dock» muestran una inicial genérica.
- Sin `theme-color` (Safari ≥ 15, parcial): la barra de pestañas/cabecera de Safari no se tiñe con el color de marca.
- Sin manifiesto: «Añadir al Dock» (Safari 17+ en macOS) crea una app web con nombre e icono por defecto.
- Sin Open Graph: al compartir el enlace por Mensajes/Mail no sale tarjeta con título e imagen.

### 3.5 Compatibilidad de funciones (MDN BCD + Can I Use)

| Función usada en el Radar | Safari mínimo | Apariciones | Riesgo |
|---|---|---|---|
| `RegExp` lookbehind `(?<=…)` | **16.4** | 1 (`situacion.js:18`) | **Error de sintaxis → módulo no carga** |
| `toLocaleString` con `useGrouping:"always"` | **16.4** | `ui.js:32` | Cifras de 4 dígitos sin separador en es-ES |
| `Object.hasOwn`, `Array.at` | 15.4 | 5 / 8 | Bajo |
| `inert` | 15.5 | 5 | Bajo |
| Container queries | 16.0 | 18 | Medio en <16 |
| `:has()` | 15.4 | 6 | Bajo |
| `:focus-visible` | 15.4 | 14 | Bajo |
| `color-mix()` | 16.2 | 13 | Medio: sin él, colores caen a valor inicial |
| `backdrop-filter` | prefijo `-webkit-` antes de 18 | 11 en `pci.css` (con prefijo) | Bajo: ya hay prefijo |
| `text-wrap` | 17.4 | 1 | Mejora opcional |
| `scrollbar-width` | 18.2 | 4 | Cosmético |
| `prefers-reduced-motion` | 10.1 | 5 | Cubierto |
| `prefers-contrast` | 14.1 | **0** | Oportunidad |
| `prefers-color-scheme` | 12.1 | **0** (solo tema claro) | Decisión de producto |
| `prefers-reduced-transparency` | **no soportado** | 1 (`pci.css:220`) | Inútil en Safari (ver §5.1) |
| WebGL2 (three.js, mapa 3D) | 15 | 1, carga diferida | Bajo; probar rendimiento en iPhone |

---

## 4. Hallazgos priorizados

**Severidad:** P0 = rompe o muestra datos mal; P1 = degrada la experiencia Safari/Apple; P2 = pulido.

| # | Sev. | Hallazgo | Dónde | Propuesta (para implementar más adelante) |
|---|---|---|---|---|
| 1 | **P0** | Lookbehind en regex: Safari < 16.4 falla al *parsear* el archivo | `js/situacion.js:18` | Sustituir por regex sin lookbehind (p. ej. cortar con `/\.\s+(?=[A-ZÁÉÍÓÚ])/` y reponer el punto) |
| 2 | **P0** | `useGrouping:"always"` coaccionado a `true` en < 16.4 → 1459 en vez de 1.459 | `js/ui.js:32` | Formateo propio del separador de miles o detectar soporte; mantener la regla de «siempre agrupar» |
| 3 | P1 | Devolución de foco falla en Safari (el foco no va al botón al clic) | `js/pci.js:78` | Guardar el elemento que dispara la apertura (`event.currentTarget`/dato del clic) y no `activeElement` |
| 4 | P1 | Barra de estado inalcanzable con Tab en la configuración por defecto | `js/estatus.js` | Documentarlo en ayuda de teclado y ofrecer una segunda vía de acceso a cada indicador. Ojo: las fichas del catálogo (`button.tile`) son botones y tienen el mismo problema con Tab por defecto; valorar enlaces reales (`<a href="#indicador">`), que Safari sí enfoca con Tab |
| 5 | P1 | `:hover` sin protección táctil: «pegado» en iPad/iOS | `radar.css` (65 reglas), p. ej. `:387` | Envolver los efectos en `@media (hover: hover) and (pointer: fine)` |
| 6 | P1 | Sin favicon / `apple-touch-icon` / `theme-color` / manifiesto / Open Graph | `index.html` | Añadir cabecera completa (icono 180 px, color de marca, manifiesto con `display: standalone`, OG) |
| 7 | P1 | `min-height:100vh` en Safari móvil | `css/pci.css:284` | `100svh` con `100vh` de respaldo |
| 8 | P1 | Sin soporte de «Aumentar contraste» | CSS global | Bloque `@media (prefers-contrast: more)` con bordes y texto reforzados (también cubre el panel de cristal) |
| 9 | P2 | `prefers-reduced-transparency` no existe en Safari | `pci.css:220` | Mantenerlo (ayuda en otros navegadores) pero reforzar con `prefers-contrast` y fondos sólidos por defecto en superficies con texto |
| 10 | P2 | Sin `-webkit-tap-highlight-color`/`touch-action` | CSS global | Definirlos en controles y en las gráficas con arrastre |
| 11 | P2 | Tamaño de texto: no se ha medido el mínimo en `pci.css` (en `radar.css` solo 2 declaraciones ≤ 11 px) | CSS | Auditoría de tamaños mínimos y prueba con texto ampliado (§6.3) |
| 12 | P2 | `scrollbar-width`/`text-wrap` solo en Safari reciente | CSS | Mantener como mejora progresiva |

---

## 5. Criterios Apple (HIG) traducidos al Radar

### 5.1 Materiales y «cristal» (Liquid Glass)

Lo que dice el HIG: el cristal es una **capa funcional para controles y navegación** que flota sobre el contenido; **no se usa en la capa de contenido**; se usa con moderación; para componentes con mucho texto, la variante *regular* (más opaca) porque la transparencia cambia con los ajustes de accesibilidad.

Para el Radar:
- Reservar el efecto translúcido/desenfoque para **dock/navegación y barras flotantes**; mantener las **tarjetas, gráficas y fichas con fondo sólido**. Es coherente con la decisión ya tomada de «datos primero».
- Los paneles con mucho texto (panel de indicador, tooltips largos) deben ser **opacos o casi** por defecto: Safari no ofrece `prefers-reduced-transparency`, así que el control debe ser nuestro (fondo sólido) y no depender de un ajuste.
- Evitar texto sobre fondos con imagen/Flow sin capa de atenuación (en la ficha, las «islas» con fondo brillante ya estaban marcadas como pendiente).

### 5.2 Gráficos y datos (HIG Charts)

Recomendaciones que aplican a sparklines, líneas y constelación:
- **Datos como protagonista**; título y resumen que expliquen *qué mostrar* («Empeora desde 2024: +3,1 %»), sin adjetivos subjetivos.
- **Etiquetas accesibles por marca** y resumen textual (equivalente a las «Audio Graphs» de Apple); ocultar los rótulos de eje visuales a lectores de pantalla y dar el resumen en su lugar.
- **No depender solo del color:** ya cumplido en la barra de estado (segmento hueco para «sin dato anterior», cortes entre estados, estado en palabra); extender el mismo criterio a sparklines y a la leyenda de la constelación (forma/trama/etiqueta además de color).
- **No exigir interacción para lo crítico**: lo importante debe verse sin pasar el cursor (la lectura contextual de `estatus.js` es complementaria, correctamente `aria-hidden`).
- Zonas táctiles holgadas y navegación por teclado entre marcas.

### 5.3 Navegación: dock ↔ sidebar, toolbars, tabs, segmentados, búsqueda

- **Sidebar (HIG):** máximo **dos niveles**; iconos reconocibles; permitir ocultarla; no esconderla por defecto; **nada crítico en el borde inferior** (en macOS la gente recoloca ventanas). El dock del Radar encaja; revisar que ninguna acción clave quede abajo del todo.
- **Tab bar (HIG):** no desactivar ni ocultar secciones aunque estén vacías, **explicar por qué** están vacías. Aplica a Medidas, Escenarios, Datos y Metodología, que hoy no existen en el Radar nuevo: mejor una pantalla «Próximamente» con explicación que un enlace que cae en la web antigua.
- **Segmented controls (HIG):** 5–7 segmentos en ancho, **≈ 5 en iPhone**; segmentos de ancho parecido; texto *o* imagen, no mezcla; etiquetas con sustantivos. La barra de estado (hasta 12 segmentos) no es un control segmentado convencional (es una barra-resumen), pero conviene no presentarla como tal y mantener su rol de grupo + leyenda.
- **Toolbars (HIG):** pocos elementos, menú «Más» para lo secundario, **reducir fondos y tintes de la barra**, título útil.
- **Búsqueda (HIG):** marcador de posición que diga *qué* se busca; filtrar al escribir; mostrar sugerencias; ámbito amplio por defecto y refinable. Aplicable al catálogo de indicadores.

### 5.4 Panel lateral del indicador ↔ hoja (sheet) / popover

- Hojas: **cerrar con gesto y con botón**, un solo panel a la vez, botón de cierre claro; en iPhone permitir **tamaño medio y completo**. El panel actual (drawer) es de ancho completo en móvil: valorar una **versión de media altura** con resumen y lectura completa al expandir.
- Popovers: no mostrarlos en vista compacta (usar hoja), no cascada, no avisos importantes dentro. Coincide con la regla actual del Radar de que el tooltip no contiene información crítica.

### 5.5 Accesibilidad (HIG Accessibility, Typography, Layout, Color, Motion)

- **Texto ampliable hasta ≥ 200 %** sin romper el diseño. Probar con zoom de página de Safari y con tamaño de texto del sistema. Para texto que siga el ajuste de tamaño de iOS existe `font: -apple-system-body` (WebKit); decidir si compensa frente a la identidad tipográfica propia (Geist/Montserrat) — *por validar en dispositivo*.
- **Contraste:** referencia WCAG AA (4,5:1 texto normal, 3:1 grande y componentes). Si no se cumple por defecto, ofrecer variante con **Aumentar contraste**.
- **Controles suficientemente grandes y separados:** el HIG recomienda ≈ 44 × 44 pt en táctil y ~12 pt de aire alrededor de controles con borde. Auditar tamaños de cierre, chips y enlaces pequeños (el icono del CTA es de 32 px dentro de un botón mayor: comprobar que el área pulsable total llega).
- **Teclado completo y VoiceOver:** nombres accesibles, orden lógico, sin sobrescribir atajos del sistema. Ya hay roving tabindex y `aria-label` con estado; falta la prueba con VoiceOver real (pendiente de antes).
- **Movimiento:** opcional, breve y cancelable; no bloquear al usuario por una animación. Ya existen 5 consultas `prefers-reduced-motion`; la intro se muestra una vez por sesión (alineado con «evitar movimiento en interacciones frecuentes»).
- **Color:** funcionar en claro/oscuro/contraste alto. El Radar es solo claro; si se quiere «sentirse Apple» en macOS/iOS, el modo oscuro es una decisión de producto, no una obligación.

---

## 6. Combinar plataforma y estilo propio: principios de decisión

1. **Plataforma para el comportamiento, marca para la apariencia.** Foco, gestos, tamaños, ajustes del sistema → convenciones Apple. Tipografía, color, composición → Radar/PCI.
2. **Cristal solo donde es navegación o control; sólido donde es dato.**
3. **Nunca esconder información crítica detrás de hover ni de color.**
4. **Una sola vía de interacción garantizada por cada acción:** teclado (incluida la configuración por defecto de Safari), táctil y puntero.
5. **Mejora progresiva:** lo que Safari antiguo no soporta debe degradar sin romper (los dos P0 son el único caso en que hoy no ocurre).

---

## 7. Experiencia «Safari/Apple» más allá de la página

| Tema | Estado actual | Idea |
|---|---|---|
| Pestaña y Favoritos | Sin favicon, título genérico | Favicon + `apple-touch-icon` + título por vista |
| Compartir | Sin tarjeta | Open Graph + imagen 1200×630 |
| Añadir al Dock / pantalla de inicio | Sin manifiesto | Manifiesto (`name`, `icons`, `display: standalone`, `theme_color`) |
| Barra de Safari | Sin color | `theme-color` claro (y oscuro si se añade tema) |
| Imprimir/PDF | No evaluado | Hoja de estilos `@media print` para una ficha |
| Vista Lector | No aplicable a la app, útil a Metodología | Revisar cuando exista la página |
| URLs | Rutas con `#` | Conservar enlaces compartibles por indicador |

---

## 8. Plan de pruebas en Safari real (antes de implementar)

**Dispositivos/versiones:** Safari macOS actual y una versión de hace ≈ 2 años; iPhone con iOS actual; iPad con teclado/trackpad; si es posible, un iPhone con iOS 15/16 sin actualizar para ver los P0.

| Prueba | Qué comprobar |
|---|---|
| Carga completa | Situación y Indicadores cargan; cifras con separador (1.459) |
| Teclado (config. por defecto) | Tab/Opción+Tab: ¿se llega a la barra de estado, al catálogo, al panel? |
| Teclado (con «Pulsar Tab…» activado) | Orden de foco, flechas, Intro/Espacio |
| Panel | Abrir con clic y con teclado; ¿vuelve el foco al cerrar? |
| iPad con puntero y táctil | ¿Quedan elementos «pegados» tras tocar? |
| VoiceOver (macOS e iOS) | Nombres, estados, grupos, lectura de gráficos |
| Texto ampliado | Zoom 200 %; texto grande del sistema; sin recortes |
| Aumentar contraste / Reducir movimiento / Reducir transparencia | Legibilidad y animaciones |
| Safari móvil | Barra que se contrae, `100svh`, áreas seguras, rotación |
| Rendimiento | Mapa 3D en iPhone, tiempo hasta interactivo, memoria |
| Añadir al Dock / pantalla de inicio | Nombre, icono, color (tras añadir cabecera) |

---

## 9. Backlog sugerido (cuando se decida implementar)

- **Primera tanda (P0 + P1 baratos):** regex sin lookbehind; separador de miles propio; foco de retorno por elemento disparador; `@media (hover: hover)`; `100svh`; cabecera con iconos/`theme-color`/OG/manifiesto.
- **Segunda tanda (P1 de diseño):** variante «Aumentar contraste»; superficies con texto opacas por defecto; pantalla «Próximamente» en secciones sin construir; revisión de tamaños de control y de texto.
- **Tercera tanda (decisiones de producto):** panel en media altura en móvil; resumen textual de gráficos; modo oscuro; vista de impresión; texto que siga el tamaño del sistema.

---

## 10. Preguntas abiertas

1. ¿Qué **versión mínima de Safari/iOS** queremos garantizar (propuesta: 16.4+ sin fallos; degradar elegante por debajo)?
2. ¿Queremos que el Radar sea instalable («Añadir al Dock») o basta con una buena cabecera?
3. ¿**Modo oscuro** sí/no en esta fase?
4. ¿El texto debe **seguir el tamaño del sistema** (Dynamic Type en web) o basta con soportar zoom?
5. ¿Hay dispositivos reales para la ronda de pruebas (Mac, iPhone, iPad) y alguna persona con VoiceOver?

---

## Fuentes

- Apple Soporte, *Atajos de teclado y otros de Safari* (Tab/Opción+Tab, «Pulsar Tab para resaltar cada elemento»): https://support.apple.com/guide/safari/keyboard-and-other-shortcuts-cpsh003/mac
- WebKit Bugzilla 229895 (los botones no reciben foco al clic en Safari/macOS): https://bugs.webkit.org/show_bug.cgi?id=229895
- Apple HIG: [Materials](https://developer.apple.com/design/human-interface-guidelines/materials), [Charts](https://developer.apple.com/design/human-interface-guidelines/charts), [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility), [Layout](https://developer.apple.com/design/human-interface-guidelines/layout), [Typography](https://developer.apple.com/design/human-interface-guidelines/typography), [Color](https://developer.apple.com/design/human-interface-guidelines/color), [Sidebars](https://developer.apple.com/design/human-interface-guidelines/sidebars), [Toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars), [Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars), [Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets), [Popovers](https://developer.apple.com/design/human-interface-guidelines/popovers), [Segmented controls](https://developer.apple.com/design/human-interface-guidelines/segmented-controls), [Search fields](https://developer.apple.com/design/human-interface-guidelines/search-fields), [Motion](https://developer.apple.com/design/human-interface-guidelines/motion)
- Compatibilidad: [MDN Browser Compat Data](https://github.com/mdn/browser-compat-data) y [Can I Use](https://caniuse.com)
- Novedades de Safari 26.x: https://webkit.org/blog/
