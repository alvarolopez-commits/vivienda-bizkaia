// Diapositiva 8 · Qué puede hacer BM30. Las tres tarjetas de la sección #bm30 del Resumen: Impulsar 3 · Facilitar 21 · Pedir 10 (suman las 34 medidas).
// Textos literales, comprobados contra textos.json. La sigla BM30 NO se desarrolla aquí ni en ninguna parte (decisión pendiente del autor).
import { momentoFirma } from "../movimiento.js";

const CARTAS = [
  ["Impulsar", "3", "La alerta de viviendas turísticas, la vigilancia de barrios y la vivienda para trabajadores.", ""],
  ["Facilitar", "21", "Sobre todo, construir más y poner en uso las viviendas que ya existen.", " tinta"],
  ["Pedir", "10", "Ayudas, impuestos y vivienda pública: los deciden otras instituciones.", ""],
];

/** @param {{mapa: object|null}} ctx */
export function crearBm30(ctx) {
  const raiz = document.createElement("section");
  raiz.className = "diapositiva diapositiva-bm30";
  raiz.dataset.diapositiva = "bm30";
  raiz.dataset.estado = "inactiva";
  raiz.setAttribute("aria-labelledby", "bm30-t");
  raiz.innerHTML = `
    <div class="bm30">
      <div class="bm30-cab"><h1 id="bm30-t">Qué puede hacer BM30</h1><p>No decide sobre vivienda, pero reúne a casi todos los que deciden.</p></div>
      <div class="cartas">
        ${CARTAS.map(([titulo, cifra, txt, extra]) => `
        <article class="carta${extra}"><div class="carta-cab"><h2>${titulo}</h2><p class="carta-num">${cifra}</p></div><p class="carta-txt">${txt}</p></article>`).join("")}
      </div>
    </div>`;
  return {
    id: "bm30",
    pasos: 1,
    tema: "claro",
    raiz,
    alEntrar() { raiz.querySelectorAll(".carta").forEach((c, i) => momentoFirma(c, { retardo: Math.min(70 * i, 200), duracion: i ? 420 : undefined })); },
    ir() { ctx.mapa?.atenuar(true); },
  };
}
