// «Dónde caben» (fase 15, pieza 4; antes en Horizonte 2035): los municipios cerca del empleo en transporte público y con
// vivienda al alcance de un trabajador, con cuántos hogares caben en cada uno según sus planes. Es opcional: solo sale si
// el territorio trae donde_caben.json.
import { categoryLegend, svgMap } from "./mapa.js";
import { capital, el, es, sourcesLine } from "./ui.js";

const COLORS = ["#1a4d7a", "#d0878c", "#86bfc6", "#dfe4ea"];

export function whereTheyFit(store) {
  const d = store.dondeCaben;
  const color = (k) => COLORS[d.orden.indexOf(k) % COLORS.length] ?? "#f1f3f6";
  const counts = Object.values(d.municipios).reduce((n, m) => ({ ...n, [m.cruce]: (n[m.cruce] ?? 0) + 1 }), {});
  const fit = Object.entries(d.municipios).filter(([, m]) => m.cruce === d.orden[0]).sort(([, a], [, b]) => b.hogares - a.hogares);
  const homes = fit.reduce((n, [, m]) => n + (m.hogares ?? 0), 0);
  const map = svgMap(store.geo, { paint: (c) => (d.municipios[c] ? color(d.municipios[c].cruce) : "#f1f3f6"), label: "Mapa de dónde caben los trabajadores que lleguen",
    tip: (c) => (d.municipios[c] ? { title: store.name(c), lines: [d.cruces[d.municipios[c].cruce], `Cercanía al empleo: ${es(d.municipios[c].cercania, 0)} puntos`, `Vivienda al alcance: ${es(d.municipios[c].accesibilidad, 0)} puntos`] } : null) });
  return el("section", { class: "sec", id: "donde-caben", "aria-labelledby": "s-caben" }, [
    el("div", { class: "sec-cab" }, [el("h2", { id: "s-caben", text: "Dónde caben los trabajadores que lleguen" }),
      el("p", { class: "sec-lead", text: `${fit.length} ${store.territorio.unidad.varias} están cerca del empleo y tienen vivienda al alcance; sus planes dan sitio para unos ${es(Math.round(homes / 1000) * 1000)} hogares. ${d.nota}` })]),
    el("div", { class: "municipal-rejilla" }, [
      el("figure", { class: "municipal-mapa mapa" }, [map.svg, categoryLegend(d.orden.map((k) => ({ nombre: d.cruces[k], color: color(k), n: counts[k] ?? 0 })))]),
      el("div", {}, [el("h3", { text: "Los idóneos y los hogares que caben" }), el("div", { class: "tabla-caja" }, [el("table", { class: "tabla" }, [
        el("caption", { class: "sr-only", text: "Municipios idóneos y hogares que caben según sus planes" }),
        el("thead", {}, [el("tr", {}, [el("th", { scope: "col", text: capital(store.territorio.unidad.una) }), el("th", { scope: "col", class: "n", text: "Hogares que caben" })])]),
        el("tbody", {}, fit.map(([c, m]) => el("tr", {}, [el("th", { scope: "row", text: store.name(c) }), el("td", { class: "n", "data-col": "Hogares que caben", text: es(m.hogares) })]))),
      ])]), el("p", { class: "nota", text: `Cercanía: ${d.viaje}` })]),
    ]),
    sourcesLine(d.fuentes),
  ]);
}
