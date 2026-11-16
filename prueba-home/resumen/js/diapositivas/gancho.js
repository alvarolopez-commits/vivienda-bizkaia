// Diapositiva 1 · Gancho. Los textos son los de la sección «territorio» del Resumen (comprobados contra _qa/textos.json).
// El mapa 3D no es de esta diapositiva: vive en el escenario y aquí solo se le pide la portada.
import { momentoFirma } from "../movimiento.js";

/** @param {{mapa: object|null}} ctx */
export function crearGancho(ctx) {
  const raiz = document.createElement("section");
  raiz.className = "diapositiva diapositiva-mapa";
  raiz.dataset.diapositiva = "gancho";
  raiz.dataset.estado = "inactiva";
  raiz.setAttribute("aria-labelledby", "titulo");
  raiz.innerHTML = `
    <div class="gancho">
      <h1 id="titulo">Falta vivienda <span class="acento">asequible</span></h1>
      <p class="lead">El alquiler expulsa a los ingresos bajos y reunir la entrada frena a los medios.</p>
      <p class="accion"><a class="pildora" href="#/3/1"><span class="rotulo">Calcula tu entrada</span><span class="chip" aria-hidden="true">→</span></a></p>
    </div>`;
  return {
    id: "gancho",
    pasos: 1,
    raiz,
    /** Momento firma (solo expressive): el titular sube a su sitio y el resto le sigue, con un escalonado de hasta 200 ms. */
    alEntrar() {
      momentoFirma(raiz.querySelector("h1"));
      [".lead", ".accion"].forEach((s, i) => momentoFirma(raiz.querySelector(s), { retardo: Math.min(70 * (i + 1), 200), duracion: 420 }));
    },
    ir(paso, dir) {
      ctx.mapa?.atenuar(false);
      ctx.mapa?.irA(0, { inmediato: dir === 0 });
    },
  };
}
