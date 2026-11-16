// Marco común: construye la cabecera (selector de secciones) y el pie (acordeón) en cada página.
// Cada sección es una subapp independiente con su propio index.html; el marco solo sabe a dónde lleva cada una.
// <body data-seccion="radar|analisis|resumen|inicio" data-raiz="../"> dice dónde estamos y cómo llegar a la raíz.
// Sin lookbehind ni APIs recientes: debe cargar en Safari 15 o posterior.
(function () {
  "use strict";

  var SECCIONES = [
    { id: "radar", nombre: "Radar", lema: "Qué está cambiando en vivienda", ruta: "radar/" },
    { id: "analisis", nombre: "Análisis", lema: "Datos, municipios y medidas", ruta: "analisis/" },
    { id: "resumen", nombre: "Resumen", lema: "El caso en nueve diapositivas", ruta: "resumen/" }
  ];

  var body = document.body;
  var actual = body.getAttribute("data-seccion") || "inicio";
  var raiz = body.getAttribute("data-raiz") || "./";
  var SVG = "http://www.w3.org/2000/svg";

  function h(tag, attrs, hijos) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    (hijos || []).forEach(function (c) { n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  }

  function enlaceSeccion(s, conLema) {
    var a = h("a", { href: raiz + s.ruta }, conLema ? [h("b", {}, [s.nombre]), h("span", {}, [s.lema])] : [s.nombre]);
    if (s.id === actual) a.setAttribute("aria-current", "page");
    return a;
  }

  // ---- Cabecera ----
  var marca = h("a", { class: "marca", href: raiz }, [
    h("img", { src: raiz + "shared/icons/favicon.svg", alt: "", width: "32", height: "32" }),
    h("span", {}, ["Vivienda en Bizkaia"])
  ]);
  if (actual === "inicio") marca.setAttribute("aria-current", "page");
  var seg = h("ul", { class: "seg" }, SECCIONES.map(function (s) { return h("li", {}, [enlaceSeccion(s, false)]); }));
  var cab = h("header", { class: "cab" }, [h("div", { class: "cont cab-in" }, [marca, h("nav", { "aria-label": "Secciones" }, [seg])])]);

  // ---- Pie: acordeón con una sola sección activa ----
  var seccionActual = SECCIONES.filter(function (s) { return s.id === actual; })[0];
  var chev = document.createElementNS(SVG, "svg");
  chev.setAttribute("class", "chev"); chev.setAttribute("viewBox", "0 0 20 20"); chev.setAttribute("aria-hidden", "true");
  var path = document.createElementNS(SVG, "path"); path.setAttribute("d", "M5 7.5l5 5 5-5"); chev.appendChild(path);

  var resumen = h("summary", {}, [
    h("span", {}, [seccionActual ? "Estás en " + seccionActual.nombre + " · Cambiar de sección" : "Elegir sección", h("small", {}, ["Radar, Análisis o Resumen: cada una funciona por su cuenta"])]),
    chev
  ]);
  var detalle = h("details", { class: "pie-sec" }, [
    resumen,
    h("ul", { class: "pie-lista" }, SECCIONES.map(function (s) { return h("li", {}, [enlaceSeccion(s, true)]); }))
  ]);
  var pie = h("footer", { class: "pie" }, [
    h("div", { class: "cont" }, [detalle, h("p", { class: "pie-nota" }, ["Versión de trabajo en local. Los datos y textos aún son los de las webs publicadas."])])
  ]);

  // Escape cierra el acordeón y devuelve el foco al botón; un clic fuera también lo cierra
  detalle.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && detalle.open) { detalle.open = false; resumen.focus(); }
  });
  document.addEventListener("click", function (e) { if (detalle.open && !detalle.contains(e.target)) detalle.open = false; });

  // ---- Montaje ----
  // Modo integrado (<body data-marco="integrado">): la subapp ya tiene su propia cabecera y solo pide el selector de secciones en los
  // huecos marcados con [data-selector-secciones] (cada subapp lo viste con su propio sistema de diseño). El pie es el mismo.
  if (body.getAttribute("data-marco") === "integrado") {
    Array.prototype.forEach.call(body.querySelectorAll("[data-selector-secciones]"), function (host) {
      host.appendChild(h("ul", { class: "seg" }, SECCIONES.map(function (s) { return h("li", {}, [enlaceSeccion(s, false)]); })));
    });
  } else {
    var saltar = body.querySelector(".saltar");
    if (saltar) body.insertBefore(cab, saltar.nextSibling); else body.insertBefore(cab, body.firstChild);
  }
  body.appendChild(pie);
})();
