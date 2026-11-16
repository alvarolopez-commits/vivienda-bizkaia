# Home unificada y cambiador global (rama `home-unificada`)

Parte de `main` · `86aeae3`. Rama local, **sin subir ni publicar**. Auditoría de partida: [`AUDITORIA_HOME.md`](AUDITORIA_HOME.md).

## Qué hay ahora
- **Pie sin acordeón:** el acordeón de productos del pie se ha eliminado; el pie es solo una nota. La cabecera es el único selector entre productos.
- **Cambiador de producto global** (`site/shared/marco.js` + `global.css`): el mismo componente en home, Análisis, Resumen y Radar, con el orden **Análisis · Resumen · Radar**.
  - Escritorio y tableta: segmented control de cristal moderado con un indicador que se desliza entre productos (también entre páginas: parte de la posición del producto anterior) y `aria-current="page"`. El producto activo se deduce de la ruta real.
  - Entre productos la cabecera se queda quieta (transición de documento a documento donde el navegador la soporta); la navegación sigue siendo la normal.
  - Móvil (≤ 760 px): botón `Análisis ▾` siempre en la barra que despliega un selector ligero con las tres opciones y una frase de cada una. No está detrás del menú de vistas.
  - Enlaces reales; Escape cierra y devuelve el foco al botón; flechas arriba/abajo recorren las opciones; un clic fuera, elegir una opción o navegar lo cierra; botón y opciones de ≥ 44 px; se mantiene dentro de la pantalla desde 320 px.
- **Cabecera del marco** (home, Resumen, Radar): logo aprobado a la izquierda (en móvil, el isotipo: silueta de Bizkaia con corchetes) + cambiador. Sticky.
- **Análisis**: su cabecera ya **no se esconde en el hero**; el cambiador vive en ella en todo momento. En el hero solo se callan lo propio de las vistas (píldora, nombre de la vista, «Menú», «Copiar enlace»). «Copiar enlace» pasa al menú de vistas en tableta/móvil.
- **Home**: hero editorial con el **Flow** como atmósfera y la **geometría real de los 113 municipios** como pieza protagonista (contorno; sin gráficos ni cifras inventadas), titular y texto aprobados, dos acciones (entrar al análisis / ver las tres experiencias) y debajo tres accesos distintos con vistas previas **reales** (capturas de lo ya publicado).
- **Marca única**: el favicon, `apple-touch-icon` y los iconos del manifiesto salen ahora del logo aprobado (se eliminó el símbolo de círculos).

## Decisiones visuales
1. **Una sola cabecera por página.** En el Análisis el cambiador comparte fila con la navegación local (logo · vistas · cambiador) en vez de apilar dos barras: ahorra altura en móvil y evita que los `top` sticky de las seis vistas (basados en `--banda`) cambien.
2. **Dos niveles de jerarquía visual:** el cambiador global es azul marino `#102E50` (lo de «dónde estoy en la plataforma»); la píldora de vistas del Análisis conserva su azul noche de Astara (lo de «dónde estoy en el producto»).
3. **Paleta del marco: la azul de siempre** — marino `#102E50`, azul de acento `#1A4D7A` e hielo `#8BCDFF` (se sustituyó el turquesa por petición de Alvaro; el único turquesa que queda es el de los corchetes del logo aprobado). Se cambia en las variables de `global.css`, `marco.css` y `home.css`.
4. **Los tres accesos se leen como tres productos**: marco de ventana (Análisis, con las seis vistas como chips), de diapositiva (Resumen, «9 diapositivas») y de panel (Radar, «Prototipo»). Análisis es más ancho. Estados reales: Resumen y Radar dicen «En integración».
5. **La tarjeta entera es clicable** (enlace estirado); el foco de teclado se dibuja alrededor de la tarjeta; el hover solo con puntero fino.
6. **Sin movimiento obligatorio**: no hay parallax ni vídeo; las transiciones son de 180–350 ms y se anulan con «Reducir movimiento». «Aumentar contraste» sustituye el velo del hero por uno sólido y la barra por un fondo opaco.
7. **Recursos**: Flow en WebP (223 KB, con `preload`), vistas previas en WebP (32–57 KB), `loading="lazy"` en las tarjetas, geometría del territorio cargada en reposo (si falla, el hero funciona igual).

## Archivos
- Nuevos: `site/shared/global.css`, `home.css`, `home.js`, `img/` (Flow, logo, isotipo, tres vistas previas), `docs/AUDITORIA_HOME.md`, `docs/HOME_Y_CAMBIADOR.md`, `docs/capturas-home/`.
- Modificados: `site/index.html`, `shared/marco.js` y `marco.css`, `manifest.webmanifest`, iconos, `radar/index.html`, `resumen/index.html`, `analisis/index.html`, `analisis/css/producto.css`, `movil.css` y `situacion.css` (se quitó una regla que ocultaba el cambiador a ≤ 380 px).
- **No se ha tocado**: datos, calculadora de Acceso, 34 medidas, 113 municipios, normativa, textos del glosario, rutas `#` ni la lógica de las vistas.

## Pruebas (Chrome, automatizadas; resultado completo en `capturas-home/pruebas-cambiador.txt`)
**147/147 correctas**, con 0 errores de consola y 0 recursos 404:
- Sin scroll horizontal y cambiador visible arriba y con scroll profundo en 320×700, 375×812, 390×844, 768×1024, 1280×800 y 1440×900, en home, hero y vistas del Análisis, Radar y Resumen.
- `aria-current` coincide con la página abierta en las diez pantallas.
- Teclado: Tab recorre logo y tres destinos; el foco se ve. Móvil: abrir, flechas, Escape devuelve el foco, clic fuera cierra.
- Navegación entre productos desde el cambiador, «atrás» y logo.
- El Análisis conserva todas sus rutas: situación, municipios, acceso, medidas (ficha y matriz), normas y método (con glosario).

Capturas «antes» y «después»: `docs/capturas-home/antes/` y `despues/` (escritorio 1440×900, tableta 768×1024, móvil 390×844 y 320×700; menús abiertos, hover, foco, Aumentar contraste y Reducir movimiento).

## Sin validar (no inventar evidencia)
- **Safari y dispositivos reales**: todo se ha comprobado con Chrome (escritorio y emulación). Falta iPhone/iPad/Safari reales, incluidas safe areas con muesca y teclado virtual.
- **VoiceOver** y **zoom de texto al 200 %**: no se han podido probar.
- **Modo lectura/presentación del Resumen** y las vistas del Radar: no están migrados, así que no hay nada que comprobar; los dos son pantallas «en construcción» con la cabecera global. Cuando se migren hay que comprobar que su modo de presentación a pantalla completa deja una salida inmediata al cambiador (el Resumen original ya lleva enlaces a Análisis y Radar en su barra).
- Los textos de las tarjetas y de las frases del cambiador («Explorar en profundidad», «Comprender lo esencial», «Seguir los cambios») salen del documento de encargo; los de las tarjetas son los de las webs publicadas.

## Incidencias y puntos abiertos
1. El Resumen enlazaba a su web antigua (`vizcaya-vivienda-resumen`); ahora apunta a la presentación nueva (`vivienda-bizkaia-presentacion`).
2. La vista previa del Radar es una captura del prototipo publicado (6 de 12 indicadores, «datos descargados el 20 de octubre de 2026»); conviene regenerarla cuando cambien los datos. Las tres previas son capturas estáticas: hay que rehacerlas si cambia el diseño de cada producto.
3. El logo del Análisis y el de `shared/img` son el mismo archivo duplicado; unificar al migrar el resto.
4. Entre 900 y 1200 px de ancho, la cabecera del Análisis (logo + nombre de vista + cápsula + Menú) está al límite; revisar si se añaden vistas.
5. Hay que decidir si la home mantiene «Productos ▾» en móvil (sin producto activo) o muestra «Análisis ▾».

## Cómo iniciarla en local
```bash
python3 servidor.py        # http://localhost:4190/
```

## Fase 4 · pulido e integración (continuidad entre productos)
- **Cabecera idéntica en las cuatro páginas:** misma altura (64 px), fondo, borde, márgenes (también en pantallas de 1920 px) y logo; el selector va siempre al borde derecho. Medido: logo y barra en la misma posición en home, Análisis, Radar y Resumen a 1440, 1920 y 390 px. El fondo de página del marco es ahora el del Análisis (`#F7F8FB`).
- **Móvil:** rótulo completo de Vivienda Bizkaia en la barra desde 380 px (isotipo por debajo); selector «producto ▾» siempre visible; por debajo de 1280 px la barra del Análisis pasa a **dos filas**: arriba marca + selector de producto, debajo las seis vistas como pestañas siempre visibles (se deslizan y la activa se centra). Antes, en ese rango, las vistas quedaban escondidas tras «Menú» y solo se veía el nombre de la vista actual.
- **Sin saltos al cargar:** se reserva la altura de la cabecera hasta que el marco la monta; hueco reservado para el selector del Análisis; fuentes Geist y Montserrat precargadas; `scroll-padding-top` para que ningún ancla quede bajo la cabecera.
- **Pie:** logo en versión blanca (nuevo `logo-vivienda-bizkaia-blanco.png`) y una nota; sin navegación entre productos. Etiquetas de estado de las tarjetas acortadas («En integración · versión publicada»).
- **Pruebas:** 147/147 en Chrome y 0 fallos en 19 anchos (320–1920) × 4 pantallas (sin scroll horizontal, sin solapes en la barra, selector visible, barra de 64 px).
- **Limitación real:** Resumen y Radar siguen sin migrar (pantallas «en construcción» con la cabecera global y enlace a lo publicado); sus rutas profundas externas (Radar antiguo, desde el glosario del Análisis) no se han tocado. Se mantiene la paleta azul pedida por Alvaro; el documento de esta fase menciona turquesa, que no se ha vuelto a usar.

- **Título del indicador en una línea** (Análisis · Situación, desde 1180 px): comprobados los cinco títulos a 1180, 1280 y 1440 px sin cortes; por debajo de 1180 px el más largo no cabe y sigue envolviendo.
