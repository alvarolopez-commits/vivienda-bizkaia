# Vivienda en Bizkaia · versión unificada

Una sola web con tres secciones que funcionan de forma independiente: **Radar**, **Análisis** y **Resumen**. Se elige la sección desde un selector en la cabecera (y desde un acordeón en el pie); solo una está activa a la vez. Proyecto nuevo, desde cero, pensado con Safari y las guías de Apple desde el principio.

**Estado (2026-11-17):** los tres productos ya viven aquí, enlazados entre sí y con la portada.
- **Portada** (`site/index.html`): una sola pantalla; hero claro con la forma de papel, titular y las tres entradas.
- **Análisis** (`site/analisis/`): las seis vistas. Se abre directamente en Situación (sin hero). Cifras mayores, Situación en una pantalla, controles de Acceso en segmentos y plano de Medidas más grande.
- **Radar** (`site/radar/`): la app del repo `radar-vivienda-bizkaia`, con la cabecera común y adaptada a móvil. «Escenarios» y «Datos» siguen enlazando al Radar antiguo publicado aparte (no existen todavía aquí).
- **Resumen** (`site/resumen/`): la presentación de nueve diapositivas. En ordenador, modo Leer con escala contenida y modo Presentar con escala grande; en móvil, lectura vertical.
- Pruebas y documentación heredadas de los otros repos: `qa/` y `docs/historico-*` (ver sus `LEEME`). No se han vuelto a ejecutar contra esta estructura.

## Verlo en local

```bash
python3 servidor.py
```

Abre http://localhost:4190/

## Qué hay

| Ruta | Qué es |
|---|---|
| `site/` | Lo que se publica: portal, marco común y una carpeta por sección |
| `docs/PRINCIPIOS_UX.md` | Reglas de UX de plataforma y estilo, con lista de comprobación |
| `docs/ARQUITECTURA.md` | Cómo se conectan las subapps al marco |
| `docs/DECISIONES_ABIERTAS.md` | Lo que falta por decidir |
| `docs/AUDITORIA_HOME.md` y `docs/HOME_Y_CAMBIADOR.md` | Home editorial y cambiador global de producto (rama `home-unificada`): auditoría, decisiones, pruebas y capturas |
| `docs/MIGRACION_ANALISIS.md` | Qué se conserva de Astara, qué cambia y qué falta del Análisis |
| `docs/ESTUDIO_SAFARI_APPLE.md` | Estudio de partida (Safari y guías de Apple) |

## Siguiente
1. Decidir lo de `docs/DECISIONES_ABIERTAS.md`.
2. Interacción del Análisis: móvil y táctil (ver `docs/MIGRACION_ANALISIS.md`).
3. Migrar Radar y Resumen.
4. Pasada de Safari y Apple sobre cada una, y pruebas en dispositivos reales.
