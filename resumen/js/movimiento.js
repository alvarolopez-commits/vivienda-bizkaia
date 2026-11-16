// Movimiento de la presentación: sistema Astara DCI (§9) y principios de animate.md. Cada animación explica algo:
//   · transicionar  → continuidad entre diapositivas (la cabecera y el indicador no se mueven)
//   · refrescar     → una cifra cambió de paso (feedback de estado; el número no se interpola)
//   · momentoFirma  → UN momento de autor por diapositiva, solo con «expressive»
// Solo transform y opacity; entrada 420 ms (--t-layout) o 240 ms en «restrained»; salida 240 ms (--t-base), siempre más rápida; momento firma 700 ms
// (--t-focal en expressive). Con «reducir movimiento»: sin recorrido, solo fundido. «still» (?mov=quieto): sin animación de vista.
// Sin View Transitions (se quitaron del Análisis por rendimiento), sin bucles propios de fotogramas (Web Animations), will-change solo mientras dura.
import { reduced } from "../original/js/comun.js";

const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)"; // llegadas confiadas, sin rebote
const EASE_INOUT = "cubic-bezier(0.65, 0, 0.35, 1)"; // salidas

const nivel = () => document.body.dataset.motion ?? "restrained"; // still | restrained | expressive
const vivo = () => nivel() !== "still";

/** Un tiempo de los tokens (--t-base: 240ms), en milisegundos. */
function t(token) {
  const v = getComputedStyle(document.body).getPropertyValue(token).trim();
  const n = parseFloat(v);
  return /ms$/.test(v) ? n : /s$/.test(v) ? n * 1000 : n || 240;
}

let enCurso = []; // animaciones de la transición actual

/** Termina cualquier transición en marcha: nada queda a medio fundir ni con un estado intermedio. */
function limpiar() {
  for (const a of enCurso) a.cancel();
  enCurso = [];
  for (const s of document.querySelectorAll('[data-diapositiva][data-estado="saliendo"]')) s.dataset.estado = "inactiva";
  for (const s of document.querySelectorAll("[data-diapositiva]")) s.style.willChange = "";
}

/**
 * Pasa de una diapositiva a otra. El estado (activa / saliendo / inactiva) lo decide esta función; es interrumpible.
 * @param {HTMLElement|null} salida @param {HTMLElement} entrada @param {1|-1} dir 1 = hacia delante
 * @returns {Promise<void>} resuelve cuando la entrada ha terminado
 */
export function transicionar(salida, entrada, dir) {
  limpiar();
  for (const s of document.querySelectorAll("[data-diapositiva]")) s.dataset.estado = s === entrada ? "activa" : "inactiva";
  if (!salida || salida === entrada || !vivo()) return Promise.resolve();

  salida.dataset.estado = "saliendo";
  const dx = reduced() ? 0 : nivel() === "expressive" ? 16 : 4;
  const tEntrada = reduced() || nivel() === "restrained" ? t("--t-base") : t("--t-layout");
  const mover = (opacidad, x) => ({ opacity: opacidad, ...(dx ? { transform: x ? `translateX(${x}px)` : "none" } : {}) });
  entrada.style.willChange = salida.style.willChange = "transform, opacity";
  const aEntrada = entrada.animate([mover(0, dir * dx), mover(1, 0)], { duration: tEntrada, easing: EASE_OUT });
  const aSalida = salida.animate([mover(1, 0), mover(0, -dir * dx)], { duration: t("--t-base"), easing: EASE_INOUT, fill: "forwards" });
  enCurso = [aEntrada, aSalida];
  aSalida.finished.then(() => {
    if (salida.dataset.estado === "saliendo") salida.dataset.estado = "inactiva";
    aSalida.cancel();
    salida.style.willChange = "";
  }, () => {});
  return aEntrada.finished.then(() => { entrada.style.willChange = ""; }, () => {});
}

/** El valor de un elemento cambió (por ejemplo, la cifra de otro paso): un refresco de 240 ms. */
export function refrescar(el) {
  if (!el || !vivo()) return;
  const cuerpo = reduced() ? [{ opacity: 0.45 }, { opacity: 1 }] : [{ opacity: 0.45, transform: "translateY(4px)" }, { opacity: 1, transform: "none" }];
  el.animate(cuerpo, { duration: t("--t-base"), easing: EASE_OUT });
}

/** El momento firma de una diapositiva (700 ms con expressive); nada en las demás intensidades ni con movimiento reducido. */
export function momentoFirma(el, { retardo = 0, duracion } = {}) {
  if (!el || nivel() !== "expressive" || reduced()) return;
  el.animate([{ opacity: 0, transform: "translateY(16px)" }, { opacity: 1, transform: "none" }], { duration: duracion ?? t("--t-focal"), delay: retardo, easing: EASE_OUT, fill: "backwards" });
}
