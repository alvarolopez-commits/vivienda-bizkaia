// Home: dibuja el contorno real de los municipios de Bizkaia sobre el hero y comprueba el número de municipios con los datos.
// Todo es decoración con datos reales: si algo falla (sin red, sin JS) el hero sigue funcionando con la imagen y el texto.
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  var svg = document.querySelector(".hx-atlas");

  function dibujar(geo) {
    var anillos = [], minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, latMedia = 0, n = 0;
    geo.features.forEach(function (f) {
      var polis = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates, grupo = [];
      polis.forEach(function (poli) { poli.forEach(function (anillo) { grupo.push(anillo); anillo.forEach(function (p) { latMedia += p[1]; n++; }); }); });
      anillos.push(grupo);
    });
    var k = Math.cos((latMedia / n) * Math.PI / 180);   // longitud y latitud no miden lo mismo: se corrige para no deformar el territorio
    anillos.forEach(function (g) { g.forEach(function (a) { a.forEach(function (p) { var x = p[0] * k, y = -p[1]; if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }); }); });
    var w = maxX - minX, hgt = maxY - minY, W = 1000, H = Math.round(W * hgt / w);
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    var frag = document.createDocumentFragment();
    anillos.forEach(function (g) {
      var d = "";
      g.forEach(function (a) { d += a.map(function (p, i) { return (i ? "L" : "M") + ((p[0] * k - minX) / w * W).toFixed(1) + " " + ((-p[1] - minY) / hgt * H).toFixed(1); }).join("") + "Z"; });
      var path = document.createElementNS(NS, "path"); path.setAttribute("d", d); frag.appendChild(path);
    });
    svg.appendChild(frag);
    requestAnimationFrame(function () { svg.classList.add("listo"); });
  }

  function cuandoPueda(f) { if (window.requestIdleCallback) window.requestIdleCallback(f, { timeout: 2500 }); else setTimeout(f, 600); }
  if (svg) {
    cuandoPueda(function () {
      fetch("analisis/original/data/municipios.geojson").then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(dibujar).catch(function () { /* decoración: se omite */ });
    });
  }
  // el número del titular sale de los datos (meta.json); el HTML ya lo trae para que no falte sin JS
  var nSpan = document.querySelector("[data-municipios]");
  if (nSpan) {
    fetch("analisis/original/data/meta.json").then(function (r) { return r.ok ? r.json() : null; }).then(function (m) {
      if (m && m.municipios_total) nSpan.textContent = String(m.municipios_total);
    }).catch(function () {});
  }
})();
