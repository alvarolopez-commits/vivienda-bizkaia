# Principios de UX (plataforma + estilo limpio)

Salen del [estudio de Safari y Apple](ESTUDIO_SAFARI_APPLE.md). Valen para las tres secciones y son la lista de comprobación de cada pantalla nueva.

## Regla de oro
**La plataforma manda en el comportamiento; la marca manda en la apariencia.** Foco, gestos, tamaños y ajustes del sistema siguen las convenciones de Safari y Apple. Tipografía, color y composición son los del proyecto.

## Reglas
1. **Navegación de primer nivel siempre visible.** Selector de secciones en la cabecera (enlaces reales), y el pie como acceso secundario. Una sola sección activa; la actual se marca con `aria-current="page"`.
2. **Enlaces para navegar, botones para actuar.** Safari enfoca los enlaces con Tab, pero no los botones salvo que el usuario lo active (Opción+Tab). Todo lo que lleva a otra vista es un `<a href>`.
3. **El foco no se pierde.** Safari no da foco a un botón al hacer clic: al abrir un panel se guarda el elemento que lo abrió (no `document.activeElement`) y se le devuelve el foco al cerrar. Escape siempre cierra.
4. **Sin hover «pegado».** Los efectos de `:hover` van dentro de `@media (hover: hover) and (pointer: fine)`. Nada crítico depende del hover.
5. **Cristal solo en navegación y controles.** Cabecera y barras pueden ser translúcidas; las tarjetas, gráficas y paneles con texto, sólidos. Safari no tiene `prefers-reduced-transparency`, así que las superficies con texto son opacas por defecto.
6. **Aumentar contraste y Reducir movimiento.** Bloques `prefers-contrast: more` y `prefers-reduced-motion: reduce` en el CSS común y en cada subapp.
7. **Zonas táctiles de 44 px** (puntero grueso) y aire entre controles. Texto en `rem`, nunca por debajo de 0,8125 rem, y la página debe aguantar un 200 % de ampliación.
8. **Nunca solo color.** Estado y series se distinguen también por forma, etiqueta o trama. Las gráficas llevan resumen en texto y etiquetas accesibles.
9. **Áreas seguras y altura real.** `viewport-fit=cover` con `env(safe-area-inset-*)`; `100svh` en lugar de `100vh`.
10. **Cabecera del documento completa:** favicon, `apple-touch-icon`, `theme-color`, manifiesto y Open Graph en cada página.
11. **JavaScript compatible con Safari 15+:** sin expresiones regulares con lookbehind (`(?<=…)`), sin `useGrouping: "always"`; probar con la versión mínima acordada.
12. **Las secciones vacías se explican.** Una sección aún sin construir muestra qué traerá y a dónde ir mientras tanto, nunca un enlace roto.

## Comprobación antes de dar una pantalla por buena
- Tab (y Opción+Tab) recorre todo en orden lógico y el foco se ve.
- Funciona con el dedo en iPhone/iPad sin elementos pegados.
- Se lee con Aumentar contraste y con movimiento reducido.
- Ampliada al 200 % no se corta nada.
- VoiceOver lee nombre, estado y valor de cada control y de cada gráfica.
