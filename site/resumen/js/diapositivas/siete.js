// Diapositiva 4 · Siete Bizkaias. Siete pasos, uno por tipo de municipio. Los textos son los de la sección #siete del Resumen (comprobados contra
// _qa/textos.json) y el mapa es el del Resumen: svgMap() de original/js/mapa.js con los colores de resumen.json, sin tocar.
// Leer: las siete filas a la vez y se elige con un clic. Presentar: solo el tipo actual, en grande.
import { svgMap } from "../../original/js/mapa.js";
import { refrescar } from "../movimiento.js";

const TIPOS = [
  ["bilbao", "1", "Bilbao", "municipio · 346.933 habitantes", "Alquiler caro para sus ingresos"],
  ["urbano_renta_baja", "11", "Ciudades con ingresos bajo la media", "municipios · 358.998 habitantes", "Muchas viviendas turísticas, o muchas inscritas hace poco · 5 de 11"],
  ["urbano_renta_alta", "4", "Ciudades con ingresos sobre la media", "municipios · 147.740 habitantes", "Los hogares crecen más que las viviendas · 3 de 4"],
  ["expansion", "5", "Municipios en crecimiento", "municipios · 66.425 habitantes", "Los hogares crecen más que las viviendas · 4 de 5"],
  ["costa_turistica", "9", "Costa turística", "municipios · 56.027 habitantes", "Muchas viviendas turísticas, o muchas inscritas hace poco · 9 de 9"],
  ["villa", "20", "Pueblos medianos", "municipios de 3.000 a 10.000 habitantes · 116.827 habitantes", "Los hogares crecen más que las viviendas · 6 de 20"],
  ["rural", "63", "Pueblos pequeños", "municipios de menos de 3.000 habitantes · 62.783 habitantes", "Muchas viviendas vacías o de segunda residencia · 53 de 63"],
];

/** @param {{mapa: object|null, datos: Promise<{resumen: object, geo: object}>}} ctx */
export function crearSiete(ctx) {
  const raiz = document.createElement("section");
  raiz.className = "diapositiva diapositiva-siete";
  raiz.dataset.diapositiva = "siete";
  raiz.dataset.estado = "inactiva";
  raiz.setAttribute("aria-labelledby", "siete-t");
  raiz.innerHTML = `
    <div class="siete">
      <div class="siete-cab">
        <h1 id="siete-t">Siete Bizkaias</h1>
        <p class="sub">Cada tipo tiene su problema. Bilbao y las ciudades reúnen al 74&nbsp;% de la población.</p>
      </div>
      <div class="siete-cuerpo">
        <ol class="siete-lista">
          ${TIPOS.map(([tipo, cuantos, nombre, pob, prob], i) => `
          <li class="tipo" data-tipo="${tipo}" data-b="${i + 1}">
            <p class="cuantos">${cuantos}</p>
            <div class="tipo-txt"><h2 class="tipo-nombre">${nombre}</h2><p class="pob">${pob}</p></div>
            <p class="prob">${prob}</p>
            <button type="button" class="tipo-elegir" aria-label="Ver el tipo ${i + 1} de ${TIPOS.length}"></button>
          </li>`).join("")}
        </ol>
        <div class="siete-mapa"></div>
      </div>
    </div>`;

  const filas = [...raiz.querySelectorAll(".tipo")];
  const mapa = raiz.querySelector(".siete-mapa");
  let datos = null, actual = 1, previo = null;
  filas.forEach((li) => li.querySelector(".tipo-elegir").addEventListener("click", () => { location.hash = `#/4/${li.dataset.b}`; }));

  /** El mapa de los 113 municipios con los del tipo elegido resaltados (como los mapas pequeños del Resumen). */
  const pintar = () => {
    if (!datos) return;
    const tipo = TIPOS[actual - 1][0], t = datos.resumen.tipos[tipo];
    mapa.replaceChildren(svgMap(datos.geo, (p) => (p.tipo === tipo ? { fill: t.color, on: true } : { fill: "#ffffff" }), { stroke: "#c3c7d9", label: `Mapa de Bizkaia con los municipios del tipo «${t.nombre}»` }));
  };
  ctx.datos.then((d) => { datos = d; pintar(); }).catch((e) => console.error("Siete Bizkaias: sin datos del mapa", e));

  return {
    id: "siete",
    pasos: TIPOS.length,
    tema: "claro", // los colores de los tipos están pensados para fondo claro
    raiz,
    alEntrar() { previo = null; },
    ir(paso, dir) {
      actual = paso;
      filas.forEach((li) => (Number(li.dataset.b) === paso ? li.setAttribute("aria-current", "step") : li.removeAttribute("aria-current")));
      pintar();
      if (previo !== null && previo !== paso && dir !== 0) refrescar(filas[paso - 1]);
      previo = paso;
      ctx.mapa?.atenuar(true);
    },
  };
}
