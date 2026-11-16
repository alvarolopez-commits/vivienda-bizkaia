// Diapositiva 2 · Las cuatro cifras sobre el mapa. Cuatro pasos; cada uno es un «beat» de la sección «territorio» del Resumen,
// con su foto y su pie. Los textos son literales del Resumen (comprobados contra _qa/textos.json).
// Leer: se ven las cuatro cifras y se elige con un clic. Presentar: solo la actual, en grande. El mapa (uno solo, persistente)
// cambia de dato y de cámara con el paso: paso p ↔ PASOS_MAPA[p].
import { refrescar } from "../movimiento.js";
import { panelCreditos } from "../creditos.js";
import { enlazarPanel } from "../paneles.js";

const NBSP = " ";
const PASOS = [
  { num: "34 de 35", titular: `municipios: un alquiler nuevo pasa del 30${NBSP}% de unos ingresos bajos`, meta: 'De los 35 municipios con dato de alquiler. <span class="etiqueta">Cálculo propio</span> EMAL y Eustat, 2024', foto: null },
  { num: `55,8${NBSP}%`, titular: "En Bilbao, más de la mitad de unos ingresos bajos", meta: `Ingresos medios: 30,4${NBSP}%. <span class="etiqueta">Cálculo propio</span> EMAL y Eustat`, foto: { src: "bilbao.jpg", w: 1920, h: 768, alt: "Bilbao visto desde el monte Artxanda", pie: "Bilbao desde Artxanda" } },
  { num: "47,1", titular: "viviendas turísticas por cada 1.000 en Mundaka", meta: 'Bizkaia: 4,8. <span class="etiqueta">Dato oficial</span> Registro vasco y Eustat', foto: { src: "mundaka.jpg", w: 1805, h: 1338, alt: "Barcas en el puerto de Mundaka, con las casas detrás", pie: "Puerto de Mundaka" } },
  { num: "53 de 63", titular: "pueblos pequeños: una casa de cada cinco, vacía o secundaria", meta: '<span class="etiqueta">Dato oficial</span> Eustat, 2024', foto: { src: "elantxobe.jpg", w: 1920, h: 1200, alt: "Elantxobe, casas en la ladera sobre el puerto", pie: "Elantxobe" } },
];

/** @param {{mapa: object|null}} ctx */
export function crearCifras(ctx) {
  const raiz = document.createElement("section");
  raiz.className = "diapositiva diapositiva-mapa";
  raiz.dataset.diapositiva = "cifras";
  raiz.dataset.estado = "inactiva";
  raiz.setAttribute("aria-labelledby", "cifras-t");
  raiz.innerHTML = `
    <div class="cifras">
      <h1 id="cifras-t" class="sr-only">Cuatro cifras del problema</h1>
      <ol class="cifras-lista">
        ${PASOS.map((p, i) => `
        <li class="cifra" data-b="${i + 1}">
          <p class="num">${p.num}</p>
          <h2 class="titular">${p.titular}</h2>
          <p class="meta">${p.meta}</p>
          <button type="button" class="cifra-elegir" aria-label="Ver la cifra ${i + 1} de ${PASOS.length}"></button>
        </li>`).join("")}
      </ol>
      <div class="fotos">
        ${PASOS.map((p, i) => (p.foto ? `
        <figure class="foto" data-b="${i + 1}" hidden>
          <img src="original/img/${p.foto.src}" width="${p.foto.w}" height="${p.foto.h}" alt="${p.foto.alt}" decoding="async">
          <figcaption>${p.foto.pie}</figcaption>
        </figure>` : "")).join("")}
      </div>
      <p class="pie-diapositiva"><button type="button" class="enlace" data-abre="creditos">Créditos de las imágenes</button></p>
    </div>`;

  const items = [...raiz.querySelectorAll(".cifra")];
  const fotos = [...raiz.querySelectorAll(".foto")];
  items.forEach((li) => li.querySelector(".cifra-elegir").addEventListener("click", () => { location.hash = `#/2/${li.dataset.b}`; }));
  enlazarPanel(panelCreditos(), raiz.querySelector('[data-abre="creditos"]'));

  let previo = null; // paso mostrado antes; null al entrar en la diapositiva (entonces manda la transición, no el refresco)
  return {
    id: "cifras",
    pasos: PASOS.length,
    raiz,
    // el momento firma de esta diapositiva es el cambio de dato del mapa (700 ms, mapa3d.js), no un efecto propio
    alEntrar() { previo = null; },
    ir(paso, dir) {
      items.forEach((li) => (Number(li.dataset.b) === paso ? li.setAttribute("aria-current", "step") : li.removeAttribute("aria-current")));
      if (previo !== null && previo !== paso && dir !== 0) refrescar(items[paso - 1]);
      previo = paso;
      fotos.forEach((fig) => { fig.hidden = Number(fig.dataset.b) !== paso; });
      ctx.mapa?.atenuar(false);
      ctx.mapa?.irA(paso, { inmediato: dir === 0 });
    },
  };
}
