// Diapositiva 3 · Calculadora «¿Cuántos años para la entrada?». El HTML es el del bloque #entrada del Resumen (los textos se comprueban
// contra _qa/textos.json) y las cuentas son las del Resumen: calculator() de original/js/calculadora.js, sin tocar, que a su vez usa
// calculo-acceso.js (la misma fórmula que el Análisis). Aquí solo se monta; no se calcula nada.
import { calculator } from "../../original/js/calculadora.js";
import { momentoFirma } from "../movimiento.js";
import { crearPanel, enlazarPanel } from "../paneles.js";

const COMO = `
  <p>El banco presta el 80&nbsp;% del precio; el resto, con impuestos y gastos (del 30 al 35&nbsp;% del precio), se ahorra. Ahorro: del 15 al 20&nbsp;% de los ingresos al año. Hipoteca a 25 o 30 años al 2,92&nbsp;% (media de 2026). Ingresos de 2024, después de impuestos.</p>
  <p><span class="etiqueta">Cálculo propio</span> con Registradores, Eustat e INE.</p>`;

/** @param {{mapa: object|null, datos: Promise<{resumen: object}>}} ctx */
export function crearCalculadora(ctx) {
  const raiz = document.createElement("section");
  raiz.className = "diapositiva diapositiva-calculadora";
  raiz.dataset.diapositiva = "calculadora";
  raiz.dataset.estado = "inactiva";
  raiz.setAttribute("aria-labelledby", "entrada-t");
  raiz.innerHTML = `
    <div class="calculadora">
      <div class="disco-lado">
        <form class="controles-calc" data-calc novalidate>
          <h1 id="entrada-t">¿Cuántos años para la entrada?</h1>
          <div class="hogares" role="radiogroup" aria-labelledby="entrada-t">
            <label class="hogar"><input type="radio" name="hogar" value="20637"><span>Ingresos bajos</span></label>
            <label class="hogar"><input type="radio" name="hogar" value="36766" checked><span>Ingresos medios</span></label>
            <label class="hogar"><input type="radio" name="hogar" value="58436"><span>Ingresos altos</span></label>
            <label class="hogar"><input type="radio" name="hogar" value="33959"><span>Un hogar de 25 a 29 años</span></label>
            <label class="hogar"><input type="radio" name="hogar" value="27420"><span>Dos salarios mínimos</span></label>
          </div>
          <div class="precio">
            <label for="precio">Precio de la vivienda, en euros</label>
            <div class="stepper">
              <button type="button" data-paso="-10000" aria-label="Bajar 10.000 euros">−</button>
              <input type="number" id="precio" inputmode="numeric" min="60000" max="900000" step="1000" value="265733">
              <button type="button" data-paso="10000" aria-label="Subir 10.000 euros">+</button>
            </div>
            <div class="ejemplos">
              <button type="button" data-precio="265733">Media de Bizkaia <span aria-hidden="true">→</span></button>
              <button type="button" data-precio="558211">Un piso en Abando <span aria-hidden="true">→</span></button>
            </div>
          </div>
        </form>
        <div class="disco">
          <p class="anos"><span data-anos>10,8 a 16,9</span></p>
          <p class="anos-txt">años ahorrando la entrada</p>
          <p class="cuota">Después, la cuota: <b data-cuota>del 29,0 al 32,6&nbsp;%</b> de los ingresos</p>
        </div>
      </div>
      <p class="supuestos"><button type="button" class="enlace-tinta" data-abre="como">Cómo se calcula <span aria-hidden="true">→</span></button></p>
    </div>`;

  enlazarPanel(crearPanel({ id: "como", titulo: "Cómo se calcula", cuerpoHtml: COMO }), raiz.querySelector('[data-abre="como"]'));

  // La calculadora se monta cuando llegan los datos del Resumen; si fallan, sus controles se apagan y la cifra escrita se queda
  ctx.datos
    .then(({ resumen }) => calculator(raiz, resumen.calculadora.supuestos))
    .catch((err) => {
      console.error("No se pudo montar la calculadora:", err);
      raiz.classList.add("inerte");
      raiz.querySelectorAll("form button, form input").forEach((c) => { c.disabled = true; });
    });

  return {
    id: "calculadora",
    pasos: 1,
    tema: "claro", // fondo claro: es una diapositiva de cifras y controles, sin mapa
    raiz,
    /** Momento firma (solo expressive): la tarjeta con el resultado sube a su sitio. */
    alEntrar() {
      momentoFirma(raiz.querySelector(".disco"));
    },
    ir() {
      ctx.mapa?.atenuar(true);
    },
  };
}
