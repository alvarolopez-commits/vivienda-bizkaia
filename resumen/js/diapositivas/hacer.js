// Diapositiva 6 · Qué se puede hacer. La tabla de la sección #hacer del Resumen: 34 medidas en seis líneas (textos literales, comprobados contra textos.json).
import { momentoFirma } from "../movimiento.js";

const LINEAS = [
  ["Más vivienda", "11", "2", "5", "Impulsar 1, facilitar 9"],
  ["Usar las viviendas que ya existen", "9", "5", "5", "Facilitar 8"],
  ["Alquiler asequible y protección", "5", "4", "3", "Facilitar 2"],
  ["Acceso a la compra", "5", "4", "0", "Depende de otros"],
  ["Vivienda turística", "3", "3", "1", "Impulsar 1, facilitar 2"],
  ["Vigilancia de barrios", "1", "0", "0", "Impulsar 1"],
];

/** @param {{mapa: object|null}} ctx */
export function crearHacer(ctx) {
  const raiz = document.createElement("section");
  raiz.className = "diapositiva diapositiva-hacer";
  raiz.dataset.diapositiva = "hacer";
  raiz.dataset.estado = "inactiva";
  raiz.setAttribute("aria-labelledby", "hacer-t");
  raiz.innerHTML = `
    <div class="hacer">
      <h1 id="hacer-t">Qué se puede hacer</h1>
      <p class="sub">34 medidas en seis líneas. 30 se pueden aplicar ya, sin cambiar ninguna ley.</p>
      <div class="tabla" role="table" aria-label="Medidas por línea de actuación">
        <div class="fila cab" role="row"><span role="columnheader">Línea</span><span role="columnheader">Medidas</span><span role="columnheader">Rápidas</span><span role="columnheader">Probadas</span><span role="columnheader" class="destacada">BM30 puede</span></div>
        ${LINEAS.map(([linea, medidas, rapidas, probadas, bm30]) => `<div class="fila" role="row"><span role="rowheader">${linea}</span><span role="cell" data-col="Medidas">${medidas}</span><span role="cell" data-col="Rápidas">${rapidas}</span><span role="cell" data-col="Probadas">${probadas}</span><span role="cell" class="destacada" data-col="BM30 puede">${bm30}</span></div>`).join("")}
      </div>
      <p class="nota">Rápidas: se aplican a corto plazo. Probadas: con evidencia media o mejor.</p>
    </div>`;
  return {
    id: "hacer",
    pasos: 1,
    tema: "claro",
    raiz,
    alEntrar() { momentoFirma(raiz.querySelector(".tabla")); },
    ir() { ctx.mapa?.atenuar(true); },
  };
}
