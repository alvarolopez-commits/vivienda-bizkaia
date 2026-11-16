// Fase 15: el modelo de escenarios. Una sola versión que usan el radar, la web de resumen y el informe (que la ejecuta
// con Node). No sabe de qué territorio se trata: todo lo de Bizkaia llega en el escenario base
// (analysis/escenario_base.py → escenario_base.json). Cuentas, en llano:
//   hogares    = población ÷ personas por hogar (+ hogares de los trabajadores que vengan de más)
//   viviendas  = hogares del último año con dato + construcción neta + vacías y turísticas que vuelven a vivienda habitual
//   precio     = precio de hoy × crecimiento de los salarios (± diferencial) × (viviendas por hogar frente a hoy)^-sensibilidad
// y el acceso (años para la entrada, cuota, esfuerzo del alquiler) con las fórmulas del análisis (calculo-acceso.js).
// La sensibilidad no tiene un valor: los estudios dan una franja (base.sensibilidad_precio), así que el precio, el
// alquiler y el acceso salen siempre como [menor, mayor] entre los dos bordes de la franja. Las cantidades (hogares,
// viviendas, falta) no dependen de ella.
// Todo se mide frente a «hoy» (año_hoy): en ese año el modelo da exactamente las cifras del análisis.
import { access } from "./calculo-acceso.js";

export const TIERS = ["P25", "P50", "P75"];

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** Valores de los parámetros: los del escenario base con los cambios pedidos, dentro de su rango. */
export function paramValues(base, changes) {
  const given = changes ?? {};
  return Object.fromEntries(base.parametros.map((p) => {
    const v = Number.isFinite(given[p.id]) ? given[p.id] : p.base;
    return [p.id, clamp(v, p.min, p.max)];
  }));
}

/**
 * Las cantidades de un año: población, hogares que se querrían formar y viviendas para vivir. Hasta «hoy» siguen lo
 * observado (ritmo de construcción y tendencia del tamaño del hogar), así que hoy no depende de ningún parámetro; a
 * partir de hoy mandan los parámetros.
 */
function quantities(base, v, year) {
  const d = base.datos, last = base.ultimo_año, t0 = d.año_stock, hoy = base.año_hoy;
  const ramp = (until) => clamp((year - hoy) / (until - hoy), 0, 1);
  const sizeHoy = d.personas_hogar.inicio * (1 + d.personas_hogar.tendencia_anual_pct / 100) ** (hoy - t0);
  const size = year <= hoy ? d.personas_hogar.inicio * (1 + d.personas_hogar.tendencia_anual_pct / 100) ** (year - t0)
    : sizeHoy * (v.personas_hogar_fin / sizeHoy) ** ((year - hoy) / (last - hoy));
  const extra = (v.trabajadores_extra / v.ocupados_hogar) * ramp(base.trabajadores_hasta); // llegan de forma gradual
  const population = d.poblacion[year];
  const built = d.ritmo_construccion * (Math.min(year, hoy) - t0) + v.construccion * Math.max(0, year - hoy);
  const homes = d.hogares_inicio + built + (v.movilizadas + v.turisticas) * ramp(last);
  return { population, size, extra, demand: population / size + extra, homes };
}

/** El dinero de un año con una sensibilidad concreta: precio, alquiler, ingresos y acceso, a partir de «hoy». */
function money(d, v, years, ratio, sensitivity) {
  const wages = (1 + v.salarios / 100) ** years;
  const prices = (1 + (v.salarios + v.dif_precio) / 100) ** years * ratio ** -sensitivity;
  const price = d.precio_hoy * prices;
  const rent = d.alquiler_hoy * prices;
  const s = d.acceso;
  const income = Object.fromEntries(TIERS.map((q) => [q, d.ingresos_hoy[q].neta * wages]));
  const buy = access({ price, net: income.P50, savings: v.ahorro / 100, downPayment: s.entrada[1], rate: v.interes,
    years: Math.max(...s.plazos), loanShare: s.financiacion, cap: s.tope_esfuerzo });
  const rentEffort = Object.fromEntries(TIERS.map((q) => [q, (1200 * rent) / income[q]]));
  return { price, rent, income, yearsToSave: buy.yearsToSave, mortgageEffort: buy.effort, rentEffort };
}

const span = (a, b) => [Math.min(a, b), Math.max(a, b)];

/** El dinero de un año en los dos bordes de la franja de sensibilidad, cada cifra como [menor, mayor]. */
function moneyRange(base, v, years, ratio) {
  const lo = money(base.datos, v, years, ratio, base.sensibilidad_precio.min);
  const hi = money(base.datos, v, years, ratio, base.sensibilidad_precio.max);
  return { price: span(lo.price, hi.price), rent: span(lo.rent, hi.rent), income: lo.income,
    yearsToSave: span(lo.yearsToSave, hi.yearsToSave), mortgageEffort: span(lo.mortgageEffort, hi.mortgageEffort),
    rentEffort: Object.fromEntries(TIERS.map((q) => [q, span(lo.rentEffort[q], hi.rentEffort[q])])) };
}

/**
 * Simula un escenario año a año, de año_hoy a ultimo_año.
 * @param {object} base el escenario base (escenario_base.json)
 * @param {object} changes cambios sobre los parámetros base, por id
 */
export function simulate(base, changes = {}) {
  const last = base.ultimo_año, hoy = base.año_hoy;
  const v = paramValues(base, changes);
  const q0 = quantities(base, v, hoy);
  const rows = [];
  for (let year = hoy; year <= last; year += 1) {
    const q = quantities(base, v, year);
    const ratio = (q.homes / q.demand) / (q0.homes / q0.demand);
    rows.push({ year, ...q, shortfall: q.demand - q.homes - (q0.demand - q0.homes), ratio, ...moneyRange(base, v, year - hoy, ratio) });
  }
  return { values: v, rows, at: (y) => rows.find((r) => r.year === y) };
}

/** Viviendas nuevas al año, desde hoy hasta `year`, que harían falta para que haya las mismas viviendas por hogar que hoy. */
export function neededPerYear(base, changes, year) {
  const v = paramValues(base, changes), hoy = base.año_hoy;
  if (year <= hoy) return 0; // no hay años por delante en los que construir
  const q = quantities(base, v, year), q0 = quantities(base, v, hoy);
  const others = q.homes - q0.homes - v.construccion * (year - hoy); // vacías y turísticas que vuelven
  return (q.demand * (q0.homes / q0.demand) - q0.homes - others) / (year - hoy);
}

/** Qué explica la falta de viviendas en `year` frente a hoy, por partes que suman el total. */
export function breakdown(base, changes, year) {
  const v = paramValues(base, changes), hoy = base.año_hoy;
  const q = quantities(base, v, year), q0 = quantities(base, v, hoy);
  const parts = {
    poblacion: (q.population - q0.population) / q0.size,
    tamaño_hogar: q.population / q.size - q.population / q0.size,
    trabajadores: q.extra - q0.extra,
    construccion: -v.construccion * (year - hoy),
    vacias_y_turisticas: -(q.homes - q0.homes - v.construccion * (year - hoy)),
  };
  return { parts, total: Object.values(parts).reduce((a, b) => a + b, 0) };
}

/**
 * Qué parámetro mueve más un resultado en `year`: el resultado con cada parámetro en su mínimo y en su máximo, contando
 * los dos bordes de la franja de sensibilidad. `pick` devuelve el resultado como [menor, mayor]. Va de más a menos influyente.
 */
export function sensitivity(base, changes, year, pick) {
  const ref = pick(simulate(base, changes).at(year));
  const rows = base.parametros.map((p) => {
    const ends = [p.min, p.max].flatMap((x) => pick(simulate(base, { ...changes, [p.id]: x }).at(year)));
    return { id: p.id, nombre: p.nombre, min: Math.min(...ends, ref[0]), max: Math.max(...ends, ref[1]) };
  });
  const reach = (r) => Math.max(ref[0] - r.min, r.max - ref[1]);
  return { ref, parametros: rows.sort((a, b) => reach(b) - reach(a)) };
}
