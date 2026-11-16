// El mapa 3D de los 113 municipios, UNO solo para toda la presentación (no se recrea al cambiar de diapositiva).
// Envuelve territory() del Resumen (original/js/territorio.js, sin cambios): allí el estado compartido S lo movía el scroll;
// aquí lo mueven los pasos. Si no hay WebGL (o se pierde el contexto), territory() deja el mapa plano en SVG y todo sigue funcionando.
import { S, territory } from "../original/js/territorio.js";
import { reduced } from "../original/js/comun.js";

/** Estado final del mapa en cada paso, sacado de la línea de tiempo original (territorio.js, registerScene).
 *  0 portada · 1 «34 de 35» (alquiler) · 2 Bilbao · 3 Mundaka (turísticas) · 4 pueblos pequeños (viviendas vacías). */
export const PASOS_MAPA = Object.freeze([
  Object.freeze({ cam: 0, wH: 1, wA: 0, wV: 0, wN: 0, lB: 0, lM: 0 }),
  Object.freeze({ cam: 1, wH: 0, wA: 1, wV: 0, wN: 0, lB: 0, lM: 0 }),
  Object.freeze({ cam: 2, wH: 0, wA: 1, wV: 0, wN: 0, lB: 1, lM: 0 }),
  Object.freeze({ cam: 3, wH: 0, wA: 0, wV: 1, wN: 0, lB: 0, lM: 1 }),
  Object.freeze({ cam: 4, wH: 0, wA: 0, wV: 0, wN: 1, lB: 0, lM: 0 }),
]);

const DURACION = 0.7; // s: el cambio de dato del mapa es el momento firma de la diapositiva 2 (DCI §9.3)

// Los dos rótulos, tal como los escribe el Resumen (con el espacio duro antes del %)
const ROTULOS = '<span data-l="bilbao">Bilbao <b>55,8&nbsp;%</b></span><span data-l="mundaka">Mundaka <b>47,1</b> por 1.000</span>';

/**
 * @param {HTMLElement} host contenedor del lienzo (debe tener tamaño por CSS)
 * @param {{resumen: object, geo: object}} datos resumen.json y municipios.geojson
 * @returns {Promise<{irA: (indice: 0|1|2|3|4, opciones?: {inmediato?: boolean}) => void, atenuar: (on: boolean) => void, readonly plano: boolean}>}
 */
export async function montarMapa(host, { resumen, geo }) {
  // territory() busca un .scene.is-live: con él desplaza la cámara para dejar sitio al texto a la izquierda
  let marco = host.closest(".scene");
  if (!marco) {
    marco = document.createElement("div");
    host.replaceWith(marco);
    marco.append(host);
  }
  marco.classList.add("scene", "is-live");
  if (!marco.querySelector(":scope > .terr-labels")) {
    const rotulos = Object.assign(document.createElement("div"), { className: "terr-labels", innerHTML: ROTULOS });
    rotulos.setAttribute("aria-hidden", "true");
    marco.append(rotulos);
  }

  await territory(host, geo, resumen);

  return {
    irA(indice, { inmediato = false } = {}) {
      const destino = PASOS_MAPA[indice];
      if (!destino) return;
      if (inmediato || reduced() || !window.gsap) Object.assign(S, destino);
      else window.gsap.to(S, { ...destino, duration: DURACION, ease: "power3.out", overwrite: true });
    },
    atenuar(on) {
      marco.classList.toggle("atenuado", !!on);
    },
    get plano() {
      return !host.querySelector("canvas");
    },
  };
}
