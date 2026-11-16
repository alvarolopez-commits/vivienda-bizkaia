// La calculadora de la entrada y el control de construcción. Las dos usan las cuentas del proyecto, sin calcular nada
// por su cuenta: la de la entrada, calculo-acceso.js (la misma que la web de análisis); la de construcción, el modelo de
// escenarios (modelo/escenarios.js, el mismo del radar y del informe).
import { announce, reduced } from "./comun.js";
import { access } from "./modelo/calculo-acceso.js";
import { simulate } from "./modelo/escenarios.js";

/** Cifra en español, con punto de millar también en las de cuatro dígitos (toLocaleString no lo pone en «4800»). */
export const nf = (v, d = 0) => {
  const [int, dec] = Math.abs(v).toFixed(d).split(".");
  return `${v < 0 ? "−" : ""}${int.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}${dec ? `,${dec}` : ""}`;
};
const PRICE = { min: 60000, max: 900000 };
const NEAR_ZERO = 1000; // como en el exportador: por debajo de esta diferencia, «casi las mismas que hoy»
const TYPING = 600; // milisegundos sin tocar los controles antes de avisar al lector de pantalla

/** «16,9 a 17,8», o una sola cifra si los dos extremos se escriben igual. */
export const between = (lo, hi, d = 1) => (nf(lo, d) === nf(hi, d) ? nf(lo, d) : `${nf(lo, d)} a ${nf(hi, d)}`);

/** Cómo dice la frase la diferencia con hoy en 2035: [verbo, cifra, final]. */
export function gapWords(gap) {
  if (gap >= NEAR_ZERO) return ["faltarán", nf(gap), "más que hoy"];
  if (gap <= -NEAR_ZERO) return ["sobrarán", nf(-gap), "frente a hoy"];
  return ["faltarán", "casi las mismas", "que hoy"];
}

/** Años para reunir la entrada y cuota, como horquilla del caso más favorable al menos favorable. */
export function entry(price, net, s) {
  const base = { price, net, rate: s.tipo_hipoteca.media, loanShare: s.financiacion, cap: s.tope_esfuerzo };
  const fast = access({ ...base, savings: s.ahorro[1], downPayment: s.entrada[0], years: Math.max(...s.plazos) });
  const slow = access({ ...base, savings: s.ahorro[0], downPayment: s.entrada[1], years: Math.min(...s.plazos) });
  return { years: [fast.yearsToSave, slow.yearsToSave], effort: [fast.effort, slow.effort] };
}

/** La calculadora: el hogar (radio), el precio (campo con − y +, y dos precios de ejemplo) y el resultado en el disco. */
export function calculator(root, supuestos) {
  const form = root.querySelector("[data-calc]");
  const input = root.querySelector("#precio");
  const out = root.querySelector("[data-anos]");
  const fee = root.querySelector("[data-cuota]");
  const clampPrice = (v) => Math.max(PRICE.min, Math.min(PRICE.max, Math.round(Number(v) || Number(input.defaultValue))));
  const shown = { a: 0, b: 0 };
  const write = () => { out.textContent = between(shown.a, shown.b); };
  const paint = () => {
    const checked = form.querySelector("[name=hogar]:checked");
    const r = entry(clampPrice(input.value), Number(checked.value), supuestos);
    const share = nf(r.effort[0], 1) === nf(r.effort[1], 1) ? `el ${nf(r.effort[0], 1)} %` : `del ${nf(r.effort[0], 1)} al ${nf(r.effort[1], 1)} %`;
    fee.textContent = share;
    if (window.gsap && !reduced()) gsap.to(shown, { a: r.years[0], b: r.years[1], duration: 0.6, ease: "expo.out", overwrite: true, onUpdate: write });
    else { shown.a = r.years[0]; shown.b = r.years[1]; write(); }
    // el número que se anima no avisa en cada paso: el aviso va una vez, cuando el lector deja de tocar los controles
    announce(`${between(...r.years)} años ahorrando la entrada. Después, la cuota: ${share} de los ingresos.`, TYPING);
  };
  const first = entry(clampPrice(input.value), Number(form.querySelector("[name=hogar]:checked").value), supuestos);
  [shown.a, shown.b] = first.years;
  form.addEventListener("change", (e) => { if (e.target.name === "hogar") paint(); });
  form.addEventListener("submit", (e) => { e.preventDefault(); input.value = clampPrice(input.value); paint(); });
  input.addEventListener("input", paint);
  input.addEventListener("change", () => { input.value = clampPrice(input.value); paint(); });
  root.querySelectorAll("[data-paso]").forEach((b) => b.addEventListener("click", () => {
    input.value = clampPrice(clampPrice(input.value) + Number(b.dataset.paso)); paint();
  }));
  root.querySelectorAll("[data-precio]").forEach((b) => b.addEventListener("click", () => { input.value = b.dataset.precio; paint(); }));
  paint();
}

/** La frase de «Vivienda para lo que viene»: cada botón es un ritmo de construcción real y la frase se recalcula. */
export function building(root, base, horizon = 2035) {
  const words = Object.fromEntries([...root.querySelectorAll("[data-v]")].map((el) => [el.dataset.v, el]));
  const buttons = [...root.querySelectorAll("[data-construccion]")];
  const set = (pace) => {
    const r = simulate(base, { construccion: pace }).at(horizon);
    [words.verbo.textContent, words.faltan.textContent, words.cola.textContent] = gapWords(Math.round(r.shortfall / 100) * 100);
    words.ritmo.textContent = nf(pace);
    words.anos.textContent = between(...r.yearsToSave);
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.construccion) === pace)));
  };
  buttons.forEach((b) => b.addEventListener("click", () => set(Number(b.dataset.construccion))));
}
