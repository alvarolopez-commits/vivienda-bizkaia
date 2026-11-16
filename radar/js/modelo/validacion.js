// Fase 15: validación hacia atrás del modelo de escenarios. Pone el modelo en marcha en el primer año de la década
// observada (2014) con lo que se habría supuesto entonces (la tendencia del tamaño del hogar de los años anteriores) y
// con lo que de verdad pasó con la población, la construcción y los salarios, y compara su precio con el observado.
// No sirve para afinar el modelo: sirve para decir, con cifras, cuánto se equivoca. Como el modelo da el precio como
// una franja, el error también es una franja [menor, mayor].
import { simulate } from "./escenarios.js";

const sizeOf = (h, y) => h.poblacion[y] / h.hogares[y];
const growth = (s, a, b) => 100 * ((s[b] / s[a]) ** (1 / (Number(b) - Number(a))) - 1);

/**
 * @param {object} base el escenario base (escenario_base.json), que trae las series observadas en datos.historia
 * @param {{desde?: string, hasta?: string, tendenciaDesde?: string}} [o] años de la década y de la tendencia previa
 */
export function backtest(base, { desde = "2014", hasta = "2024", tendenciaDesde = "2010" } = {}) {
  const h = base.datos.historia;
  const span = Number(hasta) - Number(desde);
  const trend = (sizeOf(h, desde) / sizeOf(h, tendenciaDesde)) ** (1 / (Number(desde) - Number(tendenciaDesde)));
  const past = {
    ...base, año_hoy: Number(desde), ultimo_año: Number(hasta), trabajadores_hasta: Number(hasta),
    datos: { ...base.datos, año_stock: Number(desde), hogares_inicio: h.hogares[desde], personas_hogar: { inicio: sizeOf(h, desde), tendencia_anual_pct: 0 },
      poblacion: Object.fromEntries(Object.entries(h.poblacion).map(([y, v]) => [Number(y), v])), precio_hoy: h.precio_medio[desde] },
  };
  const changes = {
    salarios: growth(h.renta_familiar, desde, hasta),
    construccion: (h.viviendas_total[hasta] - h.viviendas_total[desde]) / span,
    personas_hogar_fin: sizeOf(h, desde) * trend ** span,
  };
  const run = simulate(past, changes);
  const years = Object.keys(h.precio_medio).filter((y) => y >= desde && y <= hasta);
  const rows = years.map((y) => ({ year: Number(y), observado: h.precio_medio[y], modelo: run.at(Number(y)).price }));
  const end = rows[rows.length - 1];
  const error = (p) => (100 * (p - end.observado)) / end.observado;
  return { desde, hasta, supuestos: changes, filas: rows, error_pct: end.modelo.map(error), falta_modelo: run.at(Number(hasta)).shortfall };
}
