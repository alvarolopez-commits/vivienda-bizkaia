// Diapositiva 7 · Diez conclusiones. Dos pasos: «El diagnóstico» (4) y «Qué hacer» (6), como en la sección #conclusiones del Resumen (textos literales,
// comprobados contra textos.json). Leer: los dos grupos a la vez, el actual marcado. Presentar: solo el grupo actual, en grande.
import { refrescar } from "../movimiento.js";

const NBSP = "&nbsp;";
const GRUPOS = [
  ["El diagnóstico", [
    ["El alquiler, el problema más grave", "34 de 35 municipios"],
    ["Para comprar, la barrera es la entrada", "10,8 a 16,9 años"],
    ["El precio vuelve a acelerar", `+11,1${NBSP}% en 2025`],
    ["Los hogares pequeños empujan la demanda", "43.400 hogares"],
  ]],
  ["Qué hacer", [
    ["Al ritmo actual faltará vivienda", "12.700 en 2035"],
    ["Los planes municipales dan margen", "72.016 viviendas"],
    ["Las turísticas, en pocos barrios", "38 barrios"],
    ["En los pueblos, el problema es el uso", "53 de 63 pueblos"],
    ["Muchas medidas rápidas, pocas con evidencia fuerte", "3 de 34 medidas"],
    ["Casi todo se puede hacer ya", "30 de 34 medidas"],
  ]],
];

/** @param {{mapa: object|null}} ctx */
export function crearConclusiones(ctx) {
  const raiz = document.createElement("section");
  raiz.className = "diapositiva diapositiva-conclusiones";
  raiz.dataset.diapositiva = "conclusiones";
  raiz.dataset.estado = "inactiva";
  raiz.setAttribute("aria-labelledby", "concl-t");
  raiz.innerHTML = `
    <div class="conclusiones">
      <h1 id="concl-t">Diez conclusiones</h1>
      <div class="grupos">
        ${GRUPOS.map(([titulo, filas], i) => `
        <div class="grupo" data-b="${i + 1}">
          <h2>${titulo}</h2>
          <ul class="filas">${filas.map(([txt, val]) => `<li><span class="txt">${txt}</span><span class="val">${val}</span></li>`).join("")}</ul>
          <button type="button" class="grupo-elegir" aria-label="Ver el grupo ${i + 1} de ${GRUPOS.length}"></button>
        </div>`).join("")}
      </div>
    </div>`;
  const grupos = [...raiz.querySelectorAll(".grupo")];
  grupos.forEach((g) => g.querySelector(".grupo-elegir").addEventListener("click", () => { location.hash = `#/7/${g.dataset.b}`; }));
  let previo = null;
  return {
    id: "conclusiones",
    pasos: GRUPOS.length,
    raiz,
    alEntrar() { previo = null; },
    ir(paso, dir) {
      grupos.forEach((g) => (Number(g.dataset.b) === paso ? g.setAttribute("aria-current", "step") : g.removeAttribute("aria-current")));
      if (previo !== null && previo !== paso && dir !== 0) refrescar(grupos[paso - 1]);
      previo = paso;
      ctx.mapa?.atenuar(true);
    },
  };
}
