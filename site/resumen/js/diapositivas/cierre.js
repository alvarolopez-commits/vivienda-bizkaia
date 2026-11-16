// Diapositiva 9 · Cierre. La sección #cierre y el pie «Sigue el dato» del Resumen: el enlace al Análisis, las direcciones con su botón Copiar, y los paneles
// «Fuentes» y «Créditos de las imágenes». Textos literales, comprobados contra textos.json; ÚNICA divergencia deliberada: el enlace al Análisis apunta al rediseño (enlaces.js), no al original de Vercel. El título «Vivienda cerca del empleo» es el del
// Resumen: queda pendiente la decisión del autor (no tiene relación con el resto del contenido).
import { panelCreditos } from "../creditos.js";
import { ANALISIS, ANALISIS_TEXTO, RADAR, RADAR_TEXTO } from "../enlaces.js";
import { momentoFirma } from "../movimiento.js";
import { crearPanel, enlazarPanel } from "../paneles.js";

const FUENTES = [
  "Eustat · Viviendas por tipo (2010-2024) · descargado el 20/10/2026",
  "Eustat · Población a 1 de enero (2001-2025) · descargado el 20/10/2026",
  "Eustat · Renta familiar por tramos de ingresos (2013-2024) · descargado el 20/10/2026",
  "Gobierno Vasco · Estadística del Mercado de Alquiler (EMAL, 2016-2025) · descargado el 20/10/2026",
  "Open Data Euskadi · Viviendas de uso turístico (REATE) · descargado el 20/10/2026",
  "Gobierno Vasco y Colegio de Registradores · Precio medio de las compraventas de vivienda · descargado el 20/10/2026",
  "Ministerio de Vivienda · Compraventas de vivienda por municipio · descargado el 20/10/2026",
  "INE · Estadística de Hipotecas: tipo de interés medio (viviendas) · descargado el 20/10/2026",
  "Observatorio Vasco de la Vivienda · Personas apuntadas en Etxebide para una vivienda protegida (1/1/2026) · descargado el 20/10/2026",
  "GeoEuskadi · Límites municipales y secciones censales · descargado el 20/10/2026",
  "Eustat · Proyecciones de población por comarca (2026-2045) · descargado el 28/10/2026",
];
const EXTERNO = "";   // los productos del proyecto se abren en la misma pestaña

/** @param {{mapa: object|null, anunciar: (texto: string, espera?: number) => void}} ctx */
export function crearCierre(ctx) {
  const raiz = document.createElement("section");
  raiz.className = "diapositiva diapositiva-cierre";
  raiz.dataset.diapositiva = "cierre";
  raiz.dataset.estado = "inactiva";
  raiz.setAttribute("aria-labelledby", "cierre-t");
  raiz.innerHTML = `
    <div class="cierre">
      <div class="cierre-cuerpo">
        <h1 id="cierre-t">Vivienda cerca del empleo</h1>
        <p class="lead">El análisis municipio a municipio y el radar que lo sigue.</p>
        <p class="accion"><a class="pildora" href="${ANALISIS}" ${EXTERNO}><span class="rotulo">Ver el análisis</span><span class="chip" aria-hidden="true">→</span></a></p>
      </div>
      <div class="pie-datos">
        <div class="pie-arriba">
          <h2>Sigue el dato</h2>
          <div class="pie-dir">
            <p class="dir"><a href="${ANALISIS}" ${EXTERNO}>${ANALISIS_TEXTO}</a> <button type="button" class="copiar" data-copia="${ANALISIS}" aria-label="Copiar la dirección del análisis">Copiar</button></p>
            <p class="dir"><a href="${RADAR}" ${EXTERNO}>${RADAR_TEXTO}</a> <button type="button" class="copiar" data-copia="${RADAR}" aria-label="Copiar la dirección del radar">Copiar</button></p>
            <p>Bizkaia</p>
          </div>
        </div>
        <div class="pie-abajo">
          <button type="button" class="enlace" data-abre="fuentes">Fuentes</button>
          <button type="button" class="enlace" data-abre="creditos">Créditos de las imágenes</button>
          <span>Solo datos agregados, descargados en octubre de 2026.</span>
        </div>
      </div>
    </div>`;

  enlazarPanel(crearPanel({ id: "fuentes", titulo: "Fuentes", cuerpoHtml: `<ul>${FUENTES.map((f) => `<li>${f}</li>`).join("")}</ul>` }), raiz.querySelector('[data-abre="fuentes"]'));
  enlazarPanel(panelCreditos(), raiz.querySelector('[data-abre="creditos"]'));

  raiz.querySelectorAll("[data-copia]").forEach((b) => b.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(b.dataset.copia); b.textContent = "Copiado"; ctx.anunciar("Dirección copiada"); } catch { b.textContent = "Cópialo a mano"; ctx.anunciar("No se pudo copiar: cópialo a mano"); }
    setTimeout(() => { b.textContent = "Copiar"; }, 2000);
  }));

  return {
    id: "cierre",
    pasos: 1,
    raiz,
    alEntrar() { momentoFirma(raiz.querySelector("h1")); },
    ir() { ctx.mapa?.atenuar(true); },
  };
}
