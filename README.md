# Vivienda en Bizkaia · versión unificada

Una sola web con tres secciones que funcionan de forma independiente: **Radar**, **Análisis** y **Resumen**. Se elige la sección desde un selector en la cabecera (y desde un acordeón en el pie); solo una está activa a la vez. Proyecto nuevo, desde cero, pensado con Safari y las guías de Apple desde el principio.

**Estado:** marco, portal y selector de secciones funcionando en local. **Análisis ya migrado** (las seis vistas, con la estética Astara y los arreglos de Safari; ver `docs/MIGRACION_ANALISIS.md`). Radar y Resumen siguen como pantallas «en construcción» que enlazan a las versiones publicadas. Nada está subido a GitHub.

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
