// Datos (fase 15, pieza 4): de dónde sale cada cifra y cuándo llega la siguiente, los datos que la administración tiene y no
// publica, las descargas y la guía para llevar el radar a otro territorio. Todo lo que es del territorio llega en
// datos.json; la guía es del producto y vale para cualquiera.
import { csv, dateLabel, download, el, es, extLink, jumpTo, periodLabel, stateTag } from "./ui.js";

/** Un texto con los correos y las direcciones sin partir al final de la línea. */
const keepAddresses = (text) => text.split(/(\S+@\S+\.[a-z]{2,}|https?:\/\/\S+)/).map((part, i) => (i % 2 ? el("span", { class: "sin-partir", text: part }) : part));

const FILES = [
  ["territorio.json", "Obligatorio", "El nombre del territorio y del producto, sus municipios (nombre, población y comarca o grupo), el archivo del mapa, los enlaces a otras webs y qué módulos opcionales trae."],
  ["catalogo.json", "Obligatorio", "Las dimensiones y los indicadores. Cada indicador clave lleva su regla (si subir es mejor o peor, qué cambio es estable), su último dato y el anterior, su serie y su próximo dato. Cada indicador de contexto, su serie y su valor en cada municipio."],
  ["alertas.json", "Obligatorio", "Los tipos de alerta, su explicación y las alertas de cada municipio. Puede no haber ninguna."],
  ["medidas.json", "Obligatorio", "Las medidas en seguimiento: estado, hitos con fecha y fuente, indicadores que deberían mover, estado por municipio y lo que aún no se puede medir. La lista puede estar vacía."],
  ["datos.json", "Obligatorio", "El calendario de las fuentes, los datos que faltan, las fuentes con su licencia, los supuestos, los límites y el glosario."],
  ["municipios.geojson", "Obligatorio", "Las formas de los municipios, con su código en properties.code."],
  ["escenario_base.json", "Opcional", "Los datos de partida y los supuestos del simulador. Sin él, la pestaña Escenarios lo dice y no simula."],
  ["donde_caben.json", "Opcional", "Dónde caben los trabajadores que lleguen: cercanía al empleo y vivienda al alcance por municipio."],
];

function calendar(d) {
  return el("div", { class: "tabla-caja" }, [el("table", { class: "tabla tabla-apilada" }, [
    el("caption", { class: "sr-only", text: "Calendario de las fuentes" }),
    el("thead", {}, [el("tr", {}, ["Fuente", "Qué da", "Cada cuánto", "Último dato", "Próximo (previsto)"].map((h) => el("th", { scope: "col", text: h })))]),
    el("tbody", {}, d.calendario.map((f) => el("tr", {}, [el("th", { scope: "row", text: f.fuente }), el("td", { "data-col": "Qué da", text: f.que }),
      el("td", { "data-col": "Cada cuánto", text: f.periodicidad }), el("td", { "data-col": "Último dato", text: f.ultimo }), el("td", { "data-col": "Próximo", text: f.proxima })]))),
  ])]);
}

function requests(d) {
  const p = d.peticiones;
  return el("ol", { class: "peticiones" }, p.lista.map((r) => el("li", { class: "carta peticion" }, [
    el("div", { class: "carta-cab" }, [el("h3", { text: r.dato }), stateTag(r.estado === "respondida" ? "mejora" : r.estado === "denegada" ? "empeora" : "pendiente", p.estados[r.estado] ?? r.estado)]),
    el("details", {}, [el("summary", { text: "A quién y para qué" }),
      el("p", {}, [el("strong", { text: "A quién: " }), ...keepAddresses(r.a_quien)]),
      el("p", {}, [el("strong", { text: "Para qué: " }), r.para_que])]),
    r.fecha ? el("p", { class: "fuente", text: `Fecha: ${dateLabel(r.fecha)}` }) : null,
  ])));
}

function downloads(store) {
  const keyCsv = el("button", { type: "button", class: "boton", text: "Indicadores clave (CSV)" });
  keyCsv.addEventListener("click", () => {
    const rows = store.catalogo.indicadores.filter((i) => i.clave).map((i) => [i.nombre, store.dims[i.dimension]?.nombre, i.actual.valor, i.unidad, periodLabel(i.actual.periodo),
      i.actual.anterior ?? "", periodLabel(i.actual.periodo_anterior), i.actual.cambio ?? "", store.catalogo.estados[i.actual.estado], i.ambito, i.fuentes.map((f) => f.nombre).join(" · ")]);
    download(`indicadores-clave-${store.territorio.id}.csv`, csv([["Indicador", "Dimensión", "Valor", "Unidad", "Periodo", "Anterior", "Periodo anterior", "Cambio", "Semáforo", "Ámbito", "Fuentes"], ...rows]));
  });
  const files = ["territorio", "catalogo", "alertas", "medidas", "datos", ...(store.escenarios ? ["escenario_base"] : []), ...(store.dondeCaben ? ["donde_caben"] : [])];
  return el("div", { class: "descargas" }, [
    keyCsv,
    el("p", { class: "nota", text: "Cada ficha de indicador descarga además su valor en cada municipio. Los archivos del territorio, tal como los lee el radar:" }),
    el("ul", { class: "lista-archivos" }, files.map((f) => el("li", {}, [el("a", { href: `data/${f}.json`, download: `${f}.json`, text: `${f}.json` })]))),
  ]);
}

function guide() {
  return el("div", { class: "guia" }, [
    el("p", { text: "El radar no sabe de qué territorio se trata. Para llevarlo a otro (una provincia, una comarca, una ciudad con sus barrios) no se toca el código: se cambian los archivos de la carpeta data/." }),
    el("ol", { class: "pasos-guia" }, [
      el("li", {}, [el("strong", { text: "Copia la web. " }), "La carpeta web/ entera: el código, los estilos, las letras y las librerías."]),
      el("li", {}, [el("strong", { text: "Prepara los archivos del territorio " }), "con el formato de la tabla de abajo. Cada cifra con su fuente y su fecha; si un dato no existe, se deja sin dato, nunca se inventa."]),
      el("li", {}, [el("strong", { text: "Comprueba los archivos " }), "con el comprobador: node herramientas/comprobar-territorio.mjs <carpeta de datos>. Dice, en castellano, qué falta o qué está mal. El radar hace la misma comprobación al abrirse."]),
      el("li", {}, [el("strong", { text: "Ábrelo en local " }), "y recorre las pestañas. Las pruebas automáticas del proyecto lo hacen con un territorio de ejemplo (una comarca, con sus 20 municipios)."]),
      el("li", {}, [el("strong", { text: "Publícalo " }), "como una web estática más, con la misma política de seguridad (solo archivos propios)."]),
    ]),
    el("div", { class: "tabla-caja" }, [el("table", { class: "tabla tabla-apilada" }, [
      el("caption", { class: "sr-only", text: "Archivos de un territorio" }),
      el("thead", {}, [el("tr", {}, ["Archivo", "", "Qué lleva"].map((h) => el("th", { scope: "col", text: h })))]),
      el("tbody", {}, FILES.map(([f, req, what]) => el("tr", {}, [el("th", { scope: "row", text: f }), el("td", {}, [el("span", { class: "etiqueta", text: req })]), el("td", { text: what })]))),
    ])]),
  ]);
}

export function renderDatos(root, store) {
  const d = store.datos;
  const sources = el("div", { class: "tabla-caja" }, [el("table", { class: "tabla tabla-apilada" }, [
    el("caption", { class: "sr-only", text: "Fuentes" }),
    el("thead", {}, [el("tr", {}, ["Fuente", "Licencia", "Descargado", "Nota"].map((h) => el("th", { scope: "col", text: h })))]),
    el("tbody", {}, d.fuentes.map((f) => el("tr", {}, [el("th", { scope: "row" }, [extLink(f.url, f.nombre)]), el("td", { "data-col": "Licencia", text: f.licencia ?? "" }), el("td", { "data-col": "Descargado", text: f.descargado ? dateLabel(f.descargado) : "" }), el("td", { "data-col": "Nota", text: f.nota ?? "" })]))),
  ])]);
  root.querySelector("[data-cuerpo]").replaceChildren(
    el("section", { class: "sec sec-primera", "aria-labelledby": "d-cal" }, [el("div", { class: "sec-cab" }, [el("h2", { id: "d-cal", text: "Cuándo llega cada dato" }),
      el("p", { class: "sec-lead", text: "La fecha prevista sale de la periodicidad habitual de cada organismo, no de un calendario oficial." })]), calendar(d)]),
    el("section", { class: "sec", "aria-labelledby": "d-faltan" }, [el("div", { class: "sec-cab" }, [el("h2", { id: "d-faltan", text: `${es(d.peticiones.lista.length)} datos que faltan` }),
      el("p", { class: "sec-lead", text: "Datos que la administración tiene y no publica por municipio. Con ellos se podría medir lo que hoy se estima o no se sabe." })]), requests(d)]),
    el("section", { class: "sec", "aria-labelledby": "d-desc" }, [el("div", { class: "sec-cab" }, [el("h2", { id: "d-desc", text: "Descargas" })]), downloads(store)]),
    el("section", { class: "sec", id: "guia", "aria-labelledby": "d-guia" }, [el("div", { class: "sec-cab" }, [el("h2", { id: "d-guia", text: "Llevar el radar a otro territorio" })]), guide()]),
    el("section", { class: "sec", "aria-labelledby": "d-fuentes" }, [el("div", { class: "sec-cab" }, [el("h2", { id: "d-fuentes", text: "Fuentes" }),
      el("p", { class: "sec-lead", text: "Descargadas directamente de cada organismo. Cada indicador dice en su ficha qué tipo de dato es." })]), sources]),
    d.futuras.length ? el("section", { class: "sec", "aria-labelledby": "d-fut" }, [el("div", { class: "sec-cab" }, [el("h2", { id: "d-fut", text: "Fuentes nuevas previstas" })]),
      el("ul", { class: "lista-def" }, d.futuras.map((f) => el("li", {}, [el("strong", { text: `${f.titulo}. ` }), f.texto])))]) : null,
  );
  return {
    head: () => ({ sub: `De dónde sale cada cifra, cuándo llega la siguiente y qué datos faltan. Calendario revisado el ${dateLabel(d.revisado_el)}.` }),
    show(sub) { if (sub === "guia") requestAnimationFrame(() => jumpTo("d-guia")); },
    keepScroll: (sub) => sub === "guia",
  };
}
