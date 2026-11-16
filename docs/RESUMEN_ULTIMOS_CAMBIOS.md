# Resumen de lo aplicado (rama `home-unificada`, 2026-11-16)

## Dónde está cada cosa
- **Web de siempre (raíz):** https://alvarolopez-commits.github.io/vivienda-bizkaia/ — sin tocar, versión anterior.
- **Prueba con todo lo nuevo:** https://alvarolopez-commits.github.io/vivienda-bizkaia/prueba-home/ (carpeta `prueba-home/` de `gh-pages`). Se actualiza a mano, solo cuando se pide.
- **Código:** rama `home-unificada` (último commit `d147848`). `main` no se ha tocado.
- **Local:** `python3 servidor.py` → http://localhost:4190/

## Home
- **Una sola pantalla, sin scroll** (escritorio y móvil): titular aprobado («El acceso a la vivienda en los 113 municipios de Bizkaia») sobre el fondo Flow y el contorno real de los municipios, y tres tarjetas para elegir: **Análisis · Resumen · Radar**.
- Cada tarjeta: vista previa real (captura de lo publicado), frase corta, nombre y botón de acceso; toda la tarjeta es clicable. Móvil: tres filas con miniatura.
- Quitado: botones del hero, sección explicativa, párrafos largos, chips y etiquetas «En integración». Cabecera de la home: solo el logo.
- Pie de una línea con logo blanco.

## Navegación global
- Selector **Análisis · Resumen · Radar** en la cabecera de los tres productos (no en la home):
  - escritorio: segmented control de cristal moderado con indicador que se desliza (también entre páginas);
  - móvil: botón «producto ▾» con menú flotante sólido, animado, por encima de mapas y paneles (Escape, clic fuera o elegir cierran).
- Producto activo deducido de la ruta real; el logo vuelve a la home; la cabecera se queda quieta entre productos donde el navegador lo soporta.
- Acordeón de productos del pie: eliminado.
- Misma cabecera en las cuatro páginas (altura 64 px, fondo, márgenes y logo idénticos; medido a 390, 1440 y 1920 px).

## Análisis
- Cabecera persistente: ya no se esconde en el hero.
- **Por debajo de 1280 px, barra de dos filas:** marca + selector arriba y las **seis vistas siempre visibles** como pestañas debajo (antes quedaban tras «Menú»).
- **Título del indicador en una sola línea** en escritorio (desde 1180 px).
- Fase móvil previa: zonas táctiles de 44 px, hojas inferiores, competencias en tarjetas, etc. (`MIGRACION_ANALISIS.md`).

## Marca y diseño
- Paleta **azul de siempre**: marino `#102E50`, azul de acento `#1A4D7A`, hielo `#8BCDFF`. El turquesa se retiró (solo queda el de los corchetes del logo aprobado). Se cambia en las variables de `global.css`, `marco.css` y `home.css`.
- Logo aprobado como única marca (favicon, iconos y manifiesto salen de él); Montserrat en titulares, Geist en el resto.
- Sin saltos al cargar: altura de cabecera reservada, fuentes precargadas, anclas con margen.

## Pruebas (Chrome)
- 147/147 comprobaciones de navegación, teclado y rutas; 0 errores de consola; 19 anchos × 4 pantallas sin solapes ni scroll horizontal; home sin scroll en 12 tamaños (320–1920 px, incluido móvil en horizontal).
- Capturas antes/después: `docs/capturas-home/`.

## Pendiente / límites reales
- **No probado:** Safari, iPhone/iPad reales, VoiceOver, zoom de texto al 200 %.
- **Radar y Resumen** siguen sin migrar: son pantallas «en construcción» con la cabecera global y enlace a lo publicado. Cuando se migren, revisar que su modo de presentación deja salida al selector.
- Las vistas previas de la home son capturas estáticas: rehacerlas si cambian esos productos.
- Los textos largos quitados de la home eran los de las webs publicadas; se pueden recuperar.
- Pasar la prueba a la raíz es un paso aparte, solo con tu permiso.
