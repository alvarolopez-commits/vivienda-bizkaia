// Marco común de «Vivienda en Bizkaia»: cambiador global de producto (Análisis · Resumen · Radar) y pie con acordeón.
// Cada producto es una subapp independiente con su propio index.html; el marco solo sabe a dónde lleva cada una y NO toca sus rutas, datos ni cálculos.
//
//   <body data-seccion="inicio|analisis|resumen|radar" data-raiz="../" [data-marco="integrado"]>
//
//   · Sin data-marco: el marco pone su propia cabecera (logo + cambiador) al principio de la página. Es lo que usan la home, Resumen y Radar.
//   · data-marco="integrado": la subapp ya tiene su cabecera (Análisis) y solo pide el cambiador en los huecos [data-selector-secciones].
//
// El cambiador tiene dos presentaciones del mismo componente (CSS decide cuál se ve):
//   · cápsula con los tres destinos (escritorio y tableta);
//   · botón «Análisis ▾» que despliega un selector ligero (móvil, ≤ 760 px): siempre visible en la barra, sin abrir ningún menú.
// Enlaces reales, aria-current en el producto abierto, Escape cierra y devuelve el foco, un clic fuera o navegar lo cierra.
// Sin lookbehind ni APIs recientes: debe cargar en Safari 15 o posterior.
(function () {
  "use strict";

  var PRODUCTOS = [
    { id: "analisis", nombre: "Análisis", verbo: "Explorar en profundidad", ruta: "analisis/" },
    { id: "resumen", nombre: "Resumen", verbo: "Comprender lo esencial", ruta: "resumen/" },
    { id: "radar", nombre: "Radar", verbo: "Seguir los cambios", ruta: "radar/" }
  ];

  var body = document.body;
  var actual = body.getAttribute("data-seccion") || "inicio";
  var raiz = body.getAttribute("data-raiz") || "./";
  var SVG = "http://www.w3.org/2000/svg";
  var contador = 0;

  function h(tag, attrs, hijos) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    (hijos || []).forEach(function (c) { n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  }
  function chevron() {
    var s = document.createElementNS(SVG, "svg");
    s.setAttribute("class", "chev"); s.setAttribute("viewBox", "0 0 20 20"); s.setAttribute("aria-hidden", "true"); s.setAttribute("focusable", "false");
    var p = document.createElementNS(SVG, "path"); p.setAttribute("d", "M5 7.5l5 5 5-5"); s.appendChild(p);
    return s;
  }
  var productoActual = PRODUCTOS.filter(function (p) { return p.id === actual; })[0];

  // ---- Cambiador global: una instancia por hueco (la cabecera, o el hueco que pida la subapp) ----
  function cambiador() {
    var n = ++contador, idPanel = "gsw-panel-" + n;

    // presentación de escritorio: cápsula
    var cap = h("nav", { class: "gsw-cap", "aria-label": "Cambiar de producto" }, [
      h("ul", {}, PRODUCTOS.map(function (p) {
        var a = h("a", { href: raiz + p.ruta }, [p.nombre]);
        if (p.id === actual) a.setAttribute("aria-current", "page");
        return h("li", {}, [a]);
      }))
    ]);

    // presentación de móvil: botón + selector ligero
    var btn = h("button", { type: "button", class: "gsw-btn", "aria-expanded": "false", "aria-controls": idPanel },
      [h("span", { class: "gsw-btn-t" }, [productoActual ? productoActual.nombre : "Productos"]), chevron()]);
    btn.setAttribute("aria-label", (productoActual ? "Producto: " + productoActual.nombre + ". " : "") + "Cambiar de producto");
    var panel = h("div", { class: "gsw-panel", id: idPanel, hidden: "" }, [
      h("p", { class: "gsw-panel-t" }, ["Tres maneras de explorar"]),
      h("ul", {}, PRODUCTOS.map(function (p) {
        var a = h("a", { href: raiz + p.ruta }, [h("b", {}, [p.nombre]), h("span", {}, [p.verbo])]);
        if (p.id === actual) a.setAttribute("aria-current", "page");
        return h("li", {}, [a]);
      }))
    ]);
    var mov = h("div", { class: "gsw-mov" }, [btn, panel]);
    var raizGsw = h("div", { class: "gsw" }, [cap, mov]);

    function abierto() { return !panel.hidden; }
    function colocar() {
      // el selector cuelga bajo el botón; si por su posición se saliera de la pantalla, se desplaza para quedar a 12 px del borde (también a 320 px)
      panel.style.right = "0px";
      var pr = panel.getBoundingClientRect(), vw = document.documentElement.clientWidth, dx = 0;
      if (pr.left < 12) dx = 12 - pr.left;
      if (pr.right + dx > vw - 12) dx = vw - 12 - pr.right;
      panel.style.right = (-dx) + "px";
    }
    function abrir() { panel.hidden = false; btn.setAttribute("aria-expanded", "true"); colocar(); document.documentElement.classList.add("gsw-abierto"); }
    function cerrar(devolverFoco) {
      if (!abierto()) return;
      panel.hidden = true; btn.setAttribute("aria-expanded", "false"); document.documentElement.classList.remove("gsw-abierto");
      if (devolverFoco) btn.focus();
    }
    btn.addEventListener("click", function () { if (abierto()) cerrar(false); else abrir(); });
    raizGsw.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && abierto()) { e.preventDefault(); cerrar(true); }
      else if ((e.key === "ArrowDown" || e.key === "ArrowUp") && abierto()) {
        var links = Array.prototype.slice.call(panel.querySelectorAll("a")), i = links.indexOf(document.activeElement);
        if (e.key === "ArrowDown") { e.preventDefault(); (links[i + 1] || links[0]).focus(); }
        else { e.preventDefault(); (i > 0 ? links[i - 1] : btn).focus(); }
      }
    });
    document.addEventListener("click", function (e) { if (abierto() && !raizGsw.contains(e.target)) cerrar(false); });
    raizGsw.addEventListener("focusout", function (e) { if (abierto() && e.relatedTarget && !raizGsw.contains(e.relatedTarget)) cerrar(false); });
    panel.addEventListener("click", function (e) { if (e.target.closest && e.target.closest("a")) cerrar(false); });
    window.addEventListener("hashchange", function () { cerrar(false); });
    window.addEventListener("resize", function () { if (abierto()) colocar(); });
    return raizGsw;
  }

  // ---- Cabecera propia del marco (home, Resumen y Radar) ----
  function cabecera() {
    var marca = h("a", { class: "gmarca", href: raiz, title: "Ir al inicio de Vivienda en Bizkaia" }, [
      h("img", { src: raiz + "shared/img/logo-vivienda-bizkaia.png", alt: "Vivienda Bizkaia, inicio", width: "800", height: "212" })
    ]);
    if (actual === "inicio") marca.setAttribute("aria-current", "page");
    return h("header", { class: "gcab" }, [h("div", { class: "gcab-in" }, [marca, cambiador()])]);
  }

  // ---- Pie: acordeón de productos ----
  function pie() {
    var resumen = h("summary", {}, [
      h("span", {}, [productoActual ? "Estás en " + productoActual.nombre + " · Cambiar de producto" : "Elegir producto",
        h("small", {}, ["Análisis, Resumen o Radar: cada uno funciona por su cuenta"])]),
      chevron()
    ]);
    var detalle = h("details", { class: "pie-sec" }, [
      resumen,
      h("ul", { class: "pie-lista" }, PRODUCTOS.map(function (p) {
        var a = h("a", { href: raiz + p.ruta }, [h("b", {}, [p.nombre]), h("span", {}, [p.verbo])]);
        if (p.id === actual) a.setAttribute("aria-current", "page");
        return h("li", {}, [a]);
      }))
    ]);
    detalle.addEventListener("keydown", function (e) { if (e.key === "Escape" && detalle.open) { detalle.open = false; resumen.focus(); } });
    document.addEventListener("click", function (e) { if (detalle.open && !detalle.contains(e.target)) detalle.open = false; });
    return h("footer", { class: "pie" }, [h("div", { class: "pie-in" }, [detalle,
      h("p", { class: "pie-nota" }, ["Versión de trabajo. Los datos y textos son los de las webs publicadas."])])]);
  }

  // ---- Montaje ----
  if (body.getAttribute("data-marco") === "integrado") {
    Array.prototype.forEach.call(body.querySelectorAll("[data-selector-secciones]"), function (host) { host.appendChild(cambiador()); });
  } else {
    var saltar = body.querySelector(".saltar");
    var cab = cabecera();
    if (saltar) body.insertBefore(cab, saltar.nextSibling); else body.insertBefore(cab, body.firstChild);
  }
  body.appendChild(pie());
})();
