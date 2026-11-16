# Mini auditoría · home unificada y cambiador global (2026-11-16)

## 1. Versión de partida
| Dato | Valor |
|---|---|
| Repositorio | `alvarolopez-commits/vivienda-bizkaia` (público) |
| Rama y SHA de partida | `main` · `86aeae3` (igual que `origin/main`) |
| Rama de trabajo | `home-unificada` (local; no se ha subido) |
| Despliegue | GitHub Pages, origen `gh-pages` en la raíz, build `legacy`; `gh-pages` (`4beda50`) contiene solo el contenido de `site/` |
| Raíz servida | `https://alvarolopez-commits.github.io/vivienda-bizkaia/` |

**Discrepancia con el ZIP de referencia:** el remoto sí ha evolucionado. El ZIP describe Radar y Resumen como «En construcción» (sigue siendo cierto) pero el **Análisis ya está migrado** (seis vistas, fase móvil incluida, 0 errores de consola, 0 recursos externos). No se ha hecho checkout de ninguna versión antigua.

## 2. Estado de las tres experiencias
- **Análisis:** migrado y funcionando en `site/analisis/` (rutas con `#` intactas).
- **Resumen:** pantalla «En construcción». Enlaza a `vizcaya-vivienda-resumen.vercel.app` (la web **antigua**); la presentación nueva del Resumen está en `vivienda-bizkaia-presentacion.vercel.app`.
- **Radar:** pantalla «En construcción» que enlaza al Radar nuevo publicado (`radar-vivienda-bizkaia`).

## 3. Dónde vive la navegación entre productos
| Pieza | Archivo | Observación |
|---|---|---|
| Cabecera y pie compartidos | `site/shared/marco.js` + `marco.css` | Home, Resumen y Radar: cabecera sticky con cápsula de 3 enlaces. Análisis: modo `data-marco="integrado"` que monta la cápsula en `[data-selector-secciones]`. |
| Cabecera propia del Análisis | `site/analisis/index.html`, `css/marco.css`, `css/producto.css`, `css/movil.css` | Logo + píldora de 6 vistas + cápsula + «Copiar enlace»; en móvil el menú local. |
| Hero propio del Análisis | `css/inicio.css`, `js/inicio.js` | Oculta la cabecera entera (`.con-inicio .banda`) hasta que Situación llega arriba. |

## 4. Diagnóstico (medido en la web publicada, Chrome 1440×900 y 390×844)
¿Se ve el cambiador de producto sin abrir ningún menú?

| Pantalla | Escritorio, arriba | Escritorio, scroll profundo | Móvil, arriba | Móvil, scroll profundo |
|---|---|---|---|---|
| Home | sí | sí | sí | sí |
| Análisis · hero | **no** | sí | **no** | **no** |
| Análisis · Situación / ficha | sí | sí | **no** | **no** |
| Radar / Resumen | sí | sí | sí | sí |

1. **Análisis oculta la navegación global** en el hero (cabecera escondida) y, **en móvil, siempre** (el selector se esconde a ≤760 px y solo está dentro del menú local).
2. **Dos identidades de marca:** el marco usa un favicon de círculos (símbolo de radar), el Análisis usa el logo aprobado (silueta de Bizkaia + corchetes turquesa).
3. **Dos paletas:** marco `#221e41 / #1a4d7a / #8bcdff`; marca aprobada `#102E50 / #11B9B6`.
4. **Home:** título genérico, tres tarjetas blancas casi idénticas, sin imagen ni jerarquía; no cuenta una historia.
5. El enlace del Resumen del placeholder apunta a la web antigua.

## 5. Componentes que se reutilizan
Marco (`marco.js`, ampliado), Flow (`analisis/img/flow/flow-3.webp`), logo aprobado, fuentes Montserrat y Geist, geometría real del territorio (`analisis/original/data/municipios.geojson`) y `meta.json` (número de municipios), textos aprobados de las tres webs.

Capturas «antes»: `docs/capturas-home/antes/` (escritorio `d*`, móvil `m*`).
