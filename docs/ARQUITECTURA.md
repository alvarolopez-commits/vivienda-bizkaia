# Arquitectura

## Idea
Tres **subapps independientes** (Radar, Análisis, Resumen) bajo un **marco común**. Cada una vive en su carpeta con su propio `index.html`, CSS, JS y datos, y puede abrirse y funcionar sola. El marco solo aporta lo compartido: cabecera con el selector de secciones, pie con acordeón, fuentes, tokens base y cabecera del documento.

```
15 VIVIENDA BIZKAIA/
├─ site/                  ← lo que se publica (estático, sin build)
│  ├─ index.html          portal: elegir sección
│  ├─ manifest.webmanifest
│  ├─ shared/             marco.css, marco.js, fonts.css, fonts/, icons/
│  ├─ radar/              subapp (por migrar)
│  ├─ analisis/           subapp (por migrar; es la base del proyecto)
│  └─ resumen/            subapp (por migrar)
├─ docs/                  principios, arquitectura, estudio Safari/Apple
└─ servidor.py            servidor local (http://localhost:4190/)
```

## Cómo se conecta cada subapp al marco
Cada `index.html` declara dónde está y cómo llegar a la raíz:

```html
<body data-seccion="radar" data-raiz="../">
  <a class="saltar" href="#contenido">Saltar al contenido</a>
  <main id="contenido" tabindex="-1">…</main>
  <script src="../shared/marco.js" defer></script>
```

`marco.js` inserta la cabecera y el pie. Para añadir una sección nueva basta una entrada en su lista `SECCIONES` y una carpeta.

## Por qué así
- **Independencia real:** cada subapp trae sus propios estilos, sin choques entre sistemas de diseño distintos mientras decidimos si se unifican.
- **Sin build, sin framework:** archivos estáticos que sirve cualquier hosting (GitHub Pages incluido) y que se pueden abrir en local.
- **Rutas con `#` dentro de cada subapp:** se conservan las direcciones ya compartidas del Análisis.
- **Seguridad:** nada de estilos ni scripts en línea; así el proyecto cumple una política CSP estricta (`script-src 'self'`, `style-src 'self'`) si se aloja donde se aplique (como el Resumen en Vercel).

## Decisiones abiertas
Ver [DECISIONES_ABIERTAS.md](DECISIONES_ABIERTAS.md).
