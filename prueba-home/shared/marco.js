// Navegación global de «Vivienda en Bizkaia»: selector de producto (Análisis · Resumen · Radar) y pie.
// Cada producto es una subapp independiente con su propio index.html; el marco solo sabe a dónde lleva cada una y NO toca sus rutas, datos ni cálculos.
//
//   · Sin data-marco: el marco pone su propia cabecera (logo + selector) al principio de la página: home, Resumen y Radar.
//   · <body data-marco="integrado">: la subapp ya tiene su cabecera (Análisis) y solo pide el selector en los huecos [data-selector-secciones].
//
// El producto activo se deduce de la ruta real (location.pathname), no de una marca en la página; data-seccion queda solo como respaldo.
// Dos presentaciones del mismo componente (CSS decide cuál se ve):
//   · escritorio y tableta: segmented control con un indicador que se desliza entre productos (entre páginas parte de la posición del producto
//     anterior, guardada en sessionStorage, así se percibe como una sola plataforma);
//   · móvil (≤ 760 px): botón «Análisis ▾» que abre un menú flotante; Escape, clic fuera, elegir producto o navegar lo cierran.
// Enlaces reales, aria-current, foco visible. Sin lookbehind ni APIs recientes: debe cargar en Safari 15 o posterior.
(function () {
  "use strict";

  var PRODUCTOS = [
    { id: "analisis", nombre: "Análisis", verbo: "Explorar en profundidad", ruta: "analisis/" },
    { id: "resumen", nombre: "Resumen", verbo: "Comprender lo esencial", ruta: "resumen/" },
    { id: "radar", nombre: "Radar", verbo: "Seguir los cambios", ruta: "radar/" }
  ];
  var CLAVE = "vb-producto-previo";

  var body = document.body;
  var raiz = body.getAttribute("data-raiz") || "./";
  var SVG = "http://www.w3.org/2000/svg";
  var contador = 0;

  // producto activo según la ruta real (funciona también si el sitio cuelga de una subcarpeta, como en GitHub Pages)
  var actual = (function () {
    var segmentos = location.pathname.split("/").filter(Boolean);
    for (var i = segmentos.length - 1; i >= 0; i--) {
      for (var j = 0; j < PRODUCTOS.length; j++) if (segmentos[i] === PRODUCTOS[j].id) return PRODUCTOS[j].id;
    }
    return body.getAttribute("data-seccion") === "inicio" ? "inicio" : (body.getAttribute("data-seccion") || "inicio");
  })();
  var productoActual = PRODUCTOS.filter(function (p) { return p.id === actual; })[0];
  var previo = null;
  try { previo = sessionStorage.getItem(CLAVE); } catch (e) { /* sin almacenamiento: el indicador simplemente no parte de otro sitio */ }

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

  // ---- Selector de producto: una instancia por hueco ----
  function selector() {
    var idPanel = "gsw-panel-" + (++contador);

    // escritorio: segmented control
    var thumb = h("span", { class: "gsw-thumb", "aria-hidden": "true" });
    var lista = h("ul", {}, [thumb].concat(PRODUCTOS.map(function (p) {
      var a = h("a", { href: raiz + p.ruta }, [p.nombre]);
      if (p.id === actual) a.setAttribute("aria-current", "page");
      return h("li", {}, [a]);
    })));
    var cap = h("nav", { class: "gsw-cap", "aria-label": "Cambiar de producto" }, [lista]);

    // móvil: botón + menú flotante
    var btn = h("button", { type: "button", class: "gsw-btn", "aria-expanded": "false", "aria-controls": idPanel },
      [h("span", { class: "gsw-btn-t" }, [productoActual ? productoActual.nombre : "Productos"]), chevron()]);
    btn.setAttribute("aria-label", (productoActual ? "Producto: " + productoActual.nombre + ". " : "") + "Cambiar de producto");
    var panel = h("div", { class: "gsw-panel", id: idPanel }, [
      h("ul", {}, PRODUCTOS.map(function (p) {
        var a = h("a", { href: raiz + p.ruta, tabindex: "-1" }, [h("b", {}, [p.nombre]), h("span", {}, [p.verbo])]);
        if (p.id === actual) a.setAttribute("aria-current", "page");
        return h("li", {}, [a]);
      }))
    ]);
    var mov = h("div", { class: "gsw-mov" }, [btn, panel]);
    var raizGsw = h("div", { class: "gsw" }, [cap, mov]);

    // ---- indicador deslizante ----
    function itemActivo() { return lista.querySelector('a[aria-current="page"]'); }
    function pos(a) { var li = a.parentNode; return { x: li.offsetLeft, w: li.offsetWidth }; }
    function ponerThumb(a, anima) {
      if (!a || !cap.offsetWidth) return;
      var p = pos(a);
      thumb.classList.toggle("anima", !!anima);
      thumb.style.width = p.w + "px";
      thumb.style.transform = "translateX(" + p.x + "px)";
      thumb.classList.add("listo");
    }
    function iniciarThumb() {
      var activo = itemActivo();
      if (!activo) { thumb.classList.remove("listo"); return; }       // home: ningún producto activo
      var ant = previo && previo !== actual ? lista.querySelector('a[href$="' + previo + '/"]') : null;
      if (ant) { ponerThumb(ant, false); void thumb.offsetWidth; requestAnimationFrame(function () { ponerThumb(activo, true); }); }
      else ponerThumb(activo, false);
    }
    cap.classList.add("sin-thumb");
    function arrancar() { cap.classList.remove("sin-thumb"); iniciarThumb(); }
    if (document.readyState === "complete") arrancar(); else window.addEventListener("load", arrancar);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { var a = itemActivo(); if (a && !cap.classList.contains("sin-thumb")) ponerThumb(a, false); });
    window.addEventListener("resize", function () { var a = itemActivo(); if (a) ponerThumb(a, false); });

    // ---- menú flotante (móvil) ----
    function abierto() { return panel.classList.contains("abierto"); }
    function colocar() {
      // el menú cuelga bajo el botón (alineado a su derecha); si por su posición se saliera de la pantalla se desplaza para quedar a 12 px del borde.
      // Se mide con offsetWidth y no con getBoundingClientRect: durante la animación de apertura el rectángulo lleva una escala.
      var vw = document.documentElement.clientWidth, w = panel.offsetWidth, derecha = btn.getBoundingClientRect().right, izquierda = derecha - w, dx = 0;
      if (izquierda < 12) dx = 12 - izquierda;
      if (derecha + dx > vw - 12) dx = vw - 12 - derecha;
      panel.style.right = (-dx) + "px";
    }
    function enlaces() { return Array.prototype.slice.call(panel.querySelectorAll("a")); }
    function abrir() {
      panel.classList.add("abierto"); btn.setAttribute("aria-expanded", "true");
      enlaces().forEach(function (a) { a.removeAttribute("tabindex"); });
      colocar();
    }
    function cerrar(devolverFoco) {
      if (!abierto()) return;
      panel.classList.remove("abierto"); btn.setAttribute("aria-expanded", "false");
      enlaces().forEach(function (a) { a.setAttribute("tabindex", "-1"); });
      if (devolverFoco) btn.focus();
    }
    btn.addEventListener("click", function () { if (abierto()) cerrar(false); else abrir(); });
    raizGsw.addEventListener("keydown", function (e) {
      if (!abierto()) return;
      var links = enlaces(), i = links.indexOf(document.activeElement);
      if (e.key === "Escape") { e.preventDefault(); cerrar(true); }
      else if (e.key === "ArrowDown") { e.preventDefault(); (links[i + 1] || links[0]).focus(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); (i > 0 ? links[i - 1] : btn).focus(); }
    });
    document.addEventListener("click", function (e) { if (abierto() && !raizGsw.contains(e.target)) cerrar(false); });
    raizGsw.addEventListener("focusout", function (e) { if (abierto() && e.relatedTarget && !raizGsw.contains(e.relatedTarget)) cerrar(false); });
    panel.addEventListener("click", function (e) { if (e.target.closest && e.target.closest("a")) cerrar(false); });
    window.addEventListener("hashchange", function () { cerrar(false); });
    window.addEventListener("pagehide", function () { cerrar(false); });
    window.addEventListener("resize", function () { if (abierto()) colocar(); });
    return raizGsw;
  }

  // ---- Cabecera propia del marco (home, Resumen y Radar) ----
  function cabecera() {
    var marca = h("a", { class: "gmarca", href: raiz, title: "Ir al inicio de Vivienda en Bizkaia" }, [
      h("img", { src: raiz + "shared/img/logo-vivienda-bizkaia.png", alt: "Vivienda Bizkaia, inicio", width: "800", height: "212" })
    ]);
    if (actual === "inicio") marca.setAttribute("aria-current", "page");
    // en la home los tres productos ya están en pantalla (son la propia página): la cabecera lleva solo la marca
    return h("header", { class: "gcab" }, [h("div", { class: "gcab-in" }, actual === "inicio" ? [marca] : [marca, selector()])]);
  }

  // ---- Pie sencillo: la navegación entre productos es la de la cabecera ----
  function pie() {
    var marca = h("a", { class: "pie-marca", href: raiz, title: "Ir al inicio de Vivienda en Bizkaia" }, [
      h("img", { src: raiz + "shared/img/logo-vivienda-bizkaia-blanco.png", alt: "Vivienda Bizkaia, inicio", width: "800", height: "212", loading: "lazy" })
    ]);
    return h("footer", { class: "pie" }, [h("div", { class: "pie-in" }, [marca,
      h("p", { class: "pie-nota" }, ["Versión de trabajo. Los datos y textos son los de las webs publicadas."])])]);
  }

  // ---- Montaje ----
  if (body.getAttribute("data-marco") === "integrado") {
    Array.prototype.forEach.call(body.querySelectorAll("[data-selector-secciones]"), function (host) { host.appendChild(selector()); });
  } else {
    var saltar = body.querySelector(".saltar");
    var cab = cabecera();
    if (saltar) body.insertBefore(cab, saltar.nextSibling); else body.insertBefore(cab, body.firstChild);
  }
  body.appendChild(pie());
  body.classList.add("marco-listo");
  try { sessionStorage.setItem(CLAVE, actual === "inicio" ? "" : actual); } catch (e) { /* ignorar */ }
})();
