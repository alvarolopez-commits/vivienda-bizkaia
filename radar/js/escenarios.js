// Escenarios (fase 15, pieza 4): ¿qué puede pasar? Parte del escenario base (escenario_base.json) y el lector cambia los
// supuestos con botones de paso. Las cuentas son las del modelo común (js/modelo/, copia idéntica de modelo/, la misma que
// usan el informe y la web de resumen). El precio, el alquiler y el acceso salen siempre como franja, porque los estudios
// dan un rango para cuánto sube el precio cuando faltan viviendas. El escenario queda en la dirección de la página: se
// comparte con el enlace y no se guarda en ningún servidor.
import { announce } from "./comun.js";
import { whereTheyFit } from "./donde-caben.js";
import { lineChart, tornado, waterfall } from "./graficos.js";
import { breakdown, neededPerYear, paramValues, sensitivity, simulate } from "./modelo/escenarios.js";
import { backtest } from "./modelo/validacion.js";
import { LABELS, el, es, kpiCell } from "./ui.js";

const NICE = [1, 2, 5, 10, 20, 50, 100, 200, 500];
const PARTS = { poblacion: "Crece la población", tamaño_hogar: "Hogares más pequeños", trabajadores: "Trabajadores de fuera", construccion: "Viviendas que se construyen", vacias_y_turisticas: "Vacías y turísticas que vuelven" };

const decimalsOf = (p) => (p.paso >= 1 ? 0 : String(p.paso).split(".")[1].length);
/** El paso de los botones: un múltiplo redondo del paso del parámetro, para recorrer su rango en unos 12 a 24 toques. */
export const stepOf = (p) => p.paso * (NICE.find((k) => (p.max - p.min) / (p.paso * k) <= 24) ?? 1);
const fmtParam = (p, v) => `${es(v, decimalsOf(p))} ${p.unidad}`;
const span = (r, d = 0, u = "") => (r[0].toFixed(d) === r[1].toFixed(d) ? `${es(r[0], d)}${u}` : `de ${es(r[0], d)} a ${es(r[1], d)}${u}`);
const signed = (v) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${es(Math.abs(v))}`;

/** Lo que pide la dirección (#escenarios?construccion=4800): solo parámetros que existen y números. */
export function changesFrom(base, params) {
  const ids = new Set(base.parametros.map((p) => p.id));
  const out = {};
  for (const [k, v] of Object.entries(params ?? {})) {
    if (ids.has(k) && v !== "" && Number.isFinite(Number(v))) out[k] = Number(v);
  }
  return paramValues(base, out);
}

function stepper(p, st, update) {
  const value = el("output", { class: "paso-valor", "aria-live": "off" });
  const minus = el("button", { type: "button", class: "paso-boton", "aria-label": `Menos: ${p.nombre}`, text: "−" });
  const plus = el("button", { type: "button", class: "paso-boton", "aria-label": `Más: ${p.nombre}`, text: "+" });
  const k = stepOf(p);
  const move = (dir) => {
    const v = st.v[p.id];
    if ((dir > 0 && v >= p.max) || (dir < 0 && v <= p.min)) return; // en el límite: el botón sigue enfocable, pero no hace nada
    const next = dir > 0 ? k * (Math.floor(v / k + 1e-9) + 1) : k * (Math.ceil(v / k - 1e-9) - 1);
    st.v = { ...st.v, [p.id]: Math.min(p.max, Math.max(p.min, Number(next.toFixed(6)))) };
    update(`${p.nombre}: ${fmtParam(p, st.v[p.id])}`);
  };
  minus.addEventListener("click", () => move(-1));
  plus.addEventListener("click", () => move(1));
  const row = el("div", { class: "parametro" }, [
    el("div", { class: "parametro-cab" }, [el("span", { class: "parametro-nombre", id: `p-${p.id}`, text: p.nombre }), el("span", { class: "etiqueta", text: LABELS[p.etiqueta] ?? p.etiqueta })]),
    el("div", { class: "pasos-control", role: "group", "aria-labelledby": `p-${p.id}` }, [minus, value, plus]),
    el("p", { class: "fuente", text: `Base: ${fmtParam(p, p.base)}` }),
  ]);
  return { row, paint() {
    const v = st.v[p.id];
    value.textContent = fmtParam(p, v);
    row.classList.toggle("cambiado", Math.abs(v - p.base) > 1e-9);
    minus.setAttribute("aria-disabled", String(v <= p.min)); plus.setAttribute("aria-disabled", String(v >= p.max));
  } };
}

function results(base, st) {
  const h = st.h, mine = simulate(base, st.v).at(h), ref = simulate(base, {}).at(h);
  const cells = [
    ["Viviendas que faltarían frente a hoy", signed(mine.shortfall), `Base: ${signed(ref.shortfall)}. En negativo, sobrarían.`],
    ["Precio de una vivienda media", span(mine.price.map((v) => v / 1000), 0, " mil €"), `Base: ${span(ref.price.map((v) => v / 1000), 0, " mil €")}`],
    ["Alquiler medio de un contrato nuevo", span(mine.rent, 0, " €/mes"), `Base: ${span(ref.rent, 0, " €/mes")}`],
    ["Años de ahorro para la entrada", span(mine.yearsToSave, 1, " años"), `Base: ${span(ref.yearsToSave, 1, " años")}. Hogar de ingresos medios.`],
    ["Alquiler sobre los ingresos bajos", span(mine.rentEffort.P25, 0, " %"), `Base: ${span(ref.rentEffort.P25, 0, " %")}. Medios: ${span(mine.rentEffort.P50, 0, " %")}.`],
  ];
  return el("div", { class: "kpi-tira kpi-tira-5" }, cells.map(([label, value, foot]) => kpiCell(label, [el("span", { class: "kpi-valor", text: value })], foot)));
}

function charts(base, st) {
  const mine = simulate(base, st.v), ref = simulate(base, {});
  const xs = mine.rows.map((r) => String(r.year));
  const shortfall = lineChart({ xs, alto: 220, etiqueta: "Viviendas que faltarían frente a hoy, año a año", fmtTip: (v) => es(v),
    series: [{ nombre: "Tu escenario", valores: mine.rows.map((r) => r.shortfall) }, { nombre: "Escenario base", valores: ref.rows.map((r) => r.shortfall), cls: "otra" }],
    marca: { x: String(st.h), texto: String(st.h) } });
  const price = lineChart({ xs, alto: 220, etiqueta: "Precio de una vivienda media, como franja", fmtTip: (v) => `${es(v / 1000, 0)} mil €`, fmt: (v) => `${es(v / 1000, 0)} mil`,
    series: [{ nombre: "Tu escenario", valores: mine.rows.map(() => null), franja: mine.rows.map((r) => r.price) }, { nombre: "Escenario base", valores: ref.rows.map(() => null), franja: ref.rows.map((r) => r.price), cls: "otra" }],
    marca: { x: String(st.h), texto: String(st.h) } });
  const b = breakdown(base, st.v, st.h);
  const cascade = waterfall({ partes: Object.entries(b.parts).filter(([, v]) => Math.abs(v) >= 1).map(([k, v]) => ({ nombre: PARTS[k] ?? k, v })),
    total: `Faltan en ${st.h}`, fmt: (v) => es(v), etiqueta: `Qué explica la falta de viviendas en ${st.h}` });
  const sens = sensitivity(base, st.v, st.h, (r) => r.yearsToSave);
  const tor = tornado({ filas: sens.parametros.slice(0, 7), ref: sens.ref, fmt: (v) => es(v, 0), etiqueta: `Qué supuesto mueve más los años para la entrada en ${st.h}` });
  const legend = el("ul", { class: "leyenda" }, [el("li", {}, [el("i", { style: "--c:var(--chart-1)", "aria-hidden": "true" }), "Tu escenario"]), el("li", {}, [el("i", { style: "--c:var(--chart-muted)", "aria-hidden": "true" }), "Escenario base"])]);
  return el("div", { class: "graficos-esc" }, [
    el("section", { class: "carta" }, [el("div", { class: "carta-cab" }, [el("h3", { text: "Viviendas que faltarían, año a año" }), legend]), shortfall]),
    el("section", { class: "carta" }, [el("div", { class: "carta-cab" }, [el("h3", { text: "Precio de una vivienda media" }), legend.cloneNode(true)]), price,
      el("p", { class: "nota", text: "La franja va de lo que dicen los estudios que menos reacciona el precio a lo que más." })]),
    el("section", { class: "carta" }, [el("h3", { text: `Qué explica la falta en ${st.h}` }), cascade, el("p", { class: "nota", text: "En rosa, lo que suma falta; en azul, lo que la quita." })]),
    el("section", { class: "carta" }, [el("h3", { text: `Qué mueve más los años para la entrada (${st.h})` }), tor,
      el("p", { class: "nota", text: "Cada barra va del supuesto en su mínimo a su máximo, con el resto como está. La banda clara es tu escenario." })]),
  ]);
}

function sentence(base, st) {
  const need = neededPerYear(base, st.v, st.h), built = st.v.construccion;
  return `Para que en ${st.h} no haya menos viviendas por hogar que hoy, harían falta unas ${es(Math.round(need / 100) * 100)} viviendas nuevas al año; en este escenario se construyen ${es(built)}.`;
}

export function renderEscenarios(root, store) {
  const base = store.escenarios, body = root.querySelector("[data-cuerpo]");
  if (!base) {
    body.replaceChildren(el("p", { class: "aviso", text: "Para simular escenarios hace falta un escenario base (escenario_base.json) con la población proyectada, las viviendas, los hogares, el precio, el alquiler y los ingresos del territorio. La guía «Llevar el radar a otro territorio», en la pestaña Datos, explica cómo prepararlo." }),
      store.dondeCaben ? whereTheyFit(store) : null);
    return { head: () => ({ sub: "Este territorio aún no tiene escenario base." }) };
  }
  const intro = "Cambia los supuestos y mira qué pasa. El precio y el alquiler salen como franja, porque los estudios dan un rango.";
  const st = { v: paramValues(base, {}), h: base.horizontes[0] };
  const resultBox = el("div"), chartBox = el("div"), say = el("p", { class: "frase-esc" });
  let ready = false;
  const presets = base.escenarios.map((e) => {
    const b = el("button", { type: "button", class: "opcion", "aria-pressed": "false", text: e.nombre, title: e.explicacion });
    b.addEventListener("click", () => { st.v = paramValues(base, e.cambios); update(`Escenario ${e.nombre}`); });
    return [e, b];
  });
  const horizons = base.horizontes.map((y) => {
    const b = el("button", { type: "button", class: "opcion", "aria-pressed": String(y === st.h), text: String(y) });
    b.addEventListener("click", () => { st.h = y; update(`Resultados en ${y}`); });
    return [y, b];
  });
  const steppers = base.parametros.map((p) => stepper(p, st, (msg) => update(msg)));
  const explain = el("p", { class: "nota preset-texto" });
  const share = el("button", { type: "button", class: "boton", text: "Copiar el enlace de este escenario" });
  share.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(location.href); share.textContent = "Enlace copiado"; announce("Enlace copiado"); }
    catch { share.textContent = "Copia la dirección de la barra del navegador"; }
    setTimeout(() => { share.textContent = "Copiar el enlace de este escenario"; }, 2500);
  });
  const reset = el("button", { type: "button", class: "boton", text: "Volver al base" });
  reset.addEventListener("click", () => { st.v = paramValues(base, {}); update("Escenario base"); });
  function update(msg) {
    steppers.forEach((s) => s.paint());
    const match = presets.find(([e]) => base.parametros.every((p) => Math.abs(paramValues(base, e.cambios)[p.id] - st.v[p.id]) < 1e-9));
    presets.forEach(([, b]) => b.setAttribute("aria-pressed", String(match?.[1] === b)));
    explain.textContent = match ? match[0].explicacion : "Escenario propio: los supuestos cambiados están marcados.";
    horizons.forEach(([y, b]) => b.setAttribute("aria-pressed", String(y === st.h)));
    resultBox.replaceChildren(results(base, st));
    chartBox.replaceChildren(charts(base, st));
    say.textContent = sentence(base, st);
    const changed = base.parametros.filter((p) => Math.abs(st.v[p.id] - p.base) > 1e-9).map((p) => [p.id, String(st.v[p.id])]);
    if (st.h !== base.horizontes[0]) changed.push(["h", String(st.h)]);
    history.replaceState(null, "", `#escenarios${changed.length ? `?${new URLSearchParams(changed)}` : ""}`);
    if (ready && msg) announce(`${msg}. ${say.textContent}`, 300);
  }
  const check = backtest(base);
  body.replaceChildren(
    el("div", { class: "esc" }, [
      el("aside", { class: "esc-controles", "aria-label": "Supuestos" }, [
        el("h2", { class: "esc-titulo", text: "Escenarios de partida" }),
        el("div", { class: "opciones", role: "group", "aria-label": "Escenarios de partida" }, presets.map(([, b]) => b)), explain,
        el("h2", { class: "esc-titulo", text: "Supuestos" }),
        ...steppers.map((s) => s.row),
        el("p", { class: "fuente" }, ["De dónde sale cada valor base: ", el("a", { href: "#metodologia", text: "Metodología" }), "."]),
        el("div", { class: "esc-acciones" }, [reset, share]),
      ]),
      el("div", { class: "esc-resultados" }, [
        el("div", { class: "esc-cab" }, [el("h2", { class: "esc-titulo", text: "Resultados" }), el("div", { class: "opciones", role: "group", "aria-label": "Año" }, horizons.map(([, b]) => b))]),
        say, resultBox, chartBox,
        el("p", { class: "nota validacion", text: `Probado hacia atrás: puesto en marcha en ${check.desde} con lo que de verdad pasó hasta ${check.hasta}, el precio del modelo se pasa entre un ${es(check.error_pct[0], 1)} y un ${es(check.error_pct[1], 1)} %. Sirve para comparar escenarios, no para predecir el precio.` }),
      ]),
    ]),
    store.dondeCaben ? whereTheyFit(store) : null,
  );
  return {
    head: () => ({ sub: intro }),
    show(_, params) {
      st.v = changesFrom(base, params);
      const h = Number(params?.h);
      st.h = base.horizontes.includes(h) ? h : base.horizontes[0];
      update(null);
      ready = true;
    },
  };
}

