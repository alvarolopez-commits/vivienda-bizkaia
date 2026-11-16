// Diapositiva 5 · Vivienda para lo que viene. Tres pasos, uno por ritmo de construcción (2.679 · 3.900 · 4.800 viviendas al año). El HTML es el de la
// sección #viene del Resumen y la frase se recalcula con building() de original/js/calculadora.js, que usa el modelo de escenarios del Resumen
// (modelo/escenarios.js): aquí solo se monta; no se calcula nada.
import { building } from "../../original/js/calculadora.js";
import { panelCreditos } from "../creditos.js";
import { momentoFirma } from "../movimiento.js";
import { enlazarPanel } from "../paneles.js";

/** @param {{mapa: object|null, datos: Promise<{base: object}>}} ctx */
export function crearViene(ctx) {
  const raiz = document.createElement("section");
  raiz.className = "diapositiva diapositiva-viene";
  raiz.dataset.diapositiva = "viene";
  raiz.dataset.estado = "inactiva";
  raiz.setAttribute("aria-labelledby", "viene-t");
  raiz.innerHTML = `
    <div class="viene">
      <div class="viene-texto">
        <h1 id="viene-t">Vivienda para lo que viene</h1>
        <p class="frase" data-frase aria-live="polite" aria-atomic="true">Con <b data-v="ritmo">2.679</b> viviendas nuevas al año, en 2035 <span data-v="verbo">faltarán</span> <b data-v="faltan">12.700</b> <span data-v="cola">más que hoy</span> y la entrada llevará <b data-v="anos">17,0 a 17,8</b> años.</p>
        <div class="pasos" role="group" aria-label="Viviendas nuevas al año">
          <button type="button" class="paso" data-construccion="2679" aria-pressed="true"><b>2.679</b> el ritmo de hoy</button>
          <button type="button" class="paso" data-construccion="3900" aria-pressed="false"><b>3.900</b> para no empeorar</button>
          <button type="button" class="paso" data-construccion="4800" aria-pressed="false"><b>4.800</b> lo que permiten los planes</button>
        </div>
        <p class="nota"><span class="etiqueta">Aproximación</span> Modelo del proyecto, hogar de ingresos medios. Horquilla: los estudios no coinciden.</p>
      </div>
      <figure class="loseta">
        <img src="original/img/bolueta.jpg" width="1920" height="1386" alt="Torres de viviendas en Bolueta, Bilbao" decoding="async">
        <figcaption>Torres de Bolueta, Bilbao</figcaption>
      </figure>
      <p class="pie-diapositiva"><button type="button" class="enlace" data-abre="creditos">Créditos de las imágenes</button></p>
    </div>`;

  enlazarPanel(panelCreditos(), raiz.querySelector('[data-abre="creditos"]'));
  const botones = [...raiz.querySelectorAll("[data-construccion]")];
  let actual = 1;
  // un clic en un ritmo cambia de paso (la dirección lleva el estado); la frase la recalcula building()
  botones.forEach((b, i) => b.addEventListener("click", () => { if (location.hash !== `#/5/${i + 1}`) location.hash = `#/5/${i + 1}`; }));
  /** Pone el ritmo del paso: si todavía no está elegido, se pulsa su botón (building() recalcula la frase). */
  const aplicar = () => { const b = botones[actual - 1]; if (b && b.getAttribute("aria-pressed") !== "true") b.click(); };

  ctx.datos
    .then(({ base }) => { building(raiz, base, 2035); aplicar(); })
    .catch((err) => {
      console.error("No se pudo montar el control de construcción:", err);
      raiz.querySelector(".pasos").classList.add("inerte");
      botones.forEach((b) => { b.disabled = true; });
    });

  return {
    id: "viene",
    pasos: botones.length,
    raiz,
    alEntrar() { momentoFirma(raiz.querySelector(".frase")); },
    ir(paso) {
      actual = paso;
      aplicar();
      ctx.mapa?.atenuar(true);
    },
  };
}
