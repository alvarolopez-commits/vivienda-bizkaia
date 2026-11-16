// Calidad de la presentación: sin desborde, accesibilidad básica, un solo h1, foco visible, nada de texto fuera del Resumen, y legibilidad.
//   node presentacion/_qa/correr.mjs prueba qa-calidad.js        → run(): desborde, h1, foco, nombres accesibles, imágenes, textos
//   node presentacion/_qa/correr.mjs contraste                    → contraste WCAG AA medido sobre los PÍXELES renderizados (texto sobre el mapa 3D)
// El contraste se mide como en sprint-03-1/_qa/qa-inicio.js: con el texto transparente se captura lo que hay DETRÁS de cada línea de texto
// (mapa, fotos, tarjetas, vidrio) y se calcula la razón de contraste del color real del texto (con su opacidad) contra esos píxeles.
import { abrir, TAMANOS } from "/_qa/qa-navegacion.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// los 21 estados: [diapositiva, pasos]
const PASOS_POR_DIAPOSITIVA = [1, 4, 1, 7, 3, 1, 2, 1, 1];
export const ESTADOS = PASOS_POR_DIAPOSITIVA.flatMap((n, i) => Array.from({ length: n }, (_, p) => `#/${i + 1}/${p + 1}`));
// tema por diapositiva: las del mapa y las de texto en azul noche; la calculadora, Siete Bizkaias, la tabla y BM30 en claro
export const CLARAS = new Set([3, 4, 6, 8]);
const norm = (s) => s.replace(/[ \t\r\n ]+/g, " ").trim();

// ---------- contraste sobre píxeles ----------
const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);

/** Cada línea de texto visible: su caja, su color y su opacidad efectiva (la del propio color por la de todos sus ancestros). */
export function textosVisibles(doc = document) {
  const win = doc.defaultView, salida = [];
  const w = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = w.nextNode());) {
    const texto = n.textContent.trim();
    const el = n.parentElement;
    // los controles desactivados (← en la primera diapositiva, → en la última) están exentos de contraste (WCAG 1.4.3)
    if (!texto || !el || el.closest('script, style, noscript, .sr-only, dialog:not([open]), [aria-disabled="true"], :disabled')) continue;
    if (!el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true, opacityProperty: true, visibilityProperty: true })) continue;
    const rango = doc.createRange(); rango.selectNodeContents(n);
    const cajas = [...rango.getClientRects()].filter((r) => r.width > 1 && r.height > 1).map((r) => [r.left, r.top, r.width, r.height]);
    if (!cajas.length) continue;
    const cs = win.getComputedStyle(el);
    const m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/.exec(cs.color);
    if (!m) continue;
    let opacidad = Number(m[4] ?? 1);
    for (let e = el; e; e = e.parentElement) opacidad *= parseFloat(win.getComputedStyle(e).opacity);
    salida.push({ texto: texto.slice(0, 48), cajas, color: [Number(m[1]), Number(m[2]), Number(m[3])], opacidad, tam: parseFloat(cs.fontSize), peso: parseInt(cs.fontWeight, 10) });
  }
  return salida;
}

/** Deja el texto transparente para capturar solo lo que hay detrás. */
export function ocultarTexto(doc = document) {
  if (doc.getElementById("qa-sin-texto")) return;
  const s = doc.createElement("style");
  s.id = "qa-sin-texto";
  s.textContent = "*, *::before, *::after { color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important; caret-color: transparent !important; } .acento { background: none !important; } ::placeholder { color: transparent !important; }";
  doc.head.append(s);
}

/** Razón de contraste de cada línea de texto contra los píxeles reales de la captura (percentil 5: peor 5 % de los píxeles). */
export async function analizar(dataUrl, items, ancho, alto) {
  const bmp = await createImageBitmap(await (await fetch(dataUrl)).blob());
  const lienzo = new OffscreenCanvas(bmp.width, bmp.height);
  const g = lienzo.getContext("2d", { willReadFrequently: true });
  g.drawImage(bmp, 0, 0);
  const fallos = [];
  let medidas = 0;
  for (const it of items) {
    const grande = it.tam >= 24 || (it.tam >= 18.66 && it.peso >= 700);
    const umbral = grande ? 3 : 4.5;
    const razones = [];
    for (const [x, y, w, h] of it.cajas) {
      const x0 = Math.max(0, Math.floor(x)), y0 = Math.max(0, Math.floor(y));
      const x1 = Math.min(ancho, Math.ceil(x + w)), y1 = Math.min(alto, Math.ceil(y + h));
      if (x1 <= x0 || y1 <= y0) continue;
      const d = g.getImageData(x0, y0, x1 - x0, y1 - y0).data;
      for (let i = 0; i < d.length; i += 8) { // un píxel de cada dos
        const a = it.opacidad;
        const t = [0, 1, 2].map((k) => a * it.color[k] + (1 - a) * d[i + k]); // el texto compuesto sobre el fondo
        const Lb = lum(d[i], d[i + 1], d[i + 2]), Lt = lum(t[0], t[1], t[2]);
        razones.push((Math.max(Lb, Lt) + 0.05) / (Math.min(Lb, Lt) + 0.05));
      }
    }
    if (!razones.length) continue;
    medidas++;
    razones.sort((p, q) => p - q);
    const p5 = razones[Math.floor(razones.length * 0.05)];
    if (p5 < umbral) fallos.push({ texto: it.texto, p5: Math.round(p5 * 100) / 100, min: Math.round(razones[0] * 100) / 100, umbral, tam: it.tam });
  }
  return { medidas, fallos };
}

// ---------- calidad estructural (en iframes) ----------
export async function run(tamanos = TAMANOS) {
  const res = [];
  const ok = (n, c, d = "") => res.push({ ok: !!c, n, d });
  const textos = await fetch("/_qa/textos.json").then((r) => r.json());
  const corpus = [];
  (function aplanar(x) { if (typeof x === "string") corpus.push(norm(x)); else if (x && typeof x === "object") Object.values(x).forEach(aplanar); })(textos);
  const texto = corpus.join(" | ");
  const INTERFAZ = new Set(["−", "+", "→", "Cerrar", "Notas", "Presentar", "Leer", "Vivienda en Bizkaia", "alvarolopez-commits.github.io/vivienda-bizkaia-analisis"]);
  // «Lo que viene» recalcula su frase con el propio módulo del Resumen (gapWords, nf, between, simulate): esas palabras y cifras son suyas, no del HTML estático
  const { simulate } = await import("/original/js/modelo/escenarios.js");
  const { gapWords, nf, between } = await import("/original/js/calculadora.js");
  const base = await fetch("/original/data/escenario_base.json").then((r) => r.json());
  const DINAMICAS = new Set();
  for (const pace of [2679, 3900, 4800]) {
    const r = simulate(base, { construccion: pace }).at(2035);
    [...gapWords(Math.round(r.shortfall / 100) * 100), nf(pace), between(...r.yearsToSave)].forEach((s) => DINAMICAS.add(norm(s)));
  }

  for (const [w, h] of tamanos) {
    for (const modo of ["leer", "presentar"]) {
      for (const estado of ESTADOS) {
        const T = `${w}×${h} ${modo} ${estado}`;
        const f = await abrir(`/${modo === "presentar" ? "?modo=presentar" : ""}${estado}`, w, h);
        const doc = f.contentDocument, win = f.contentWindow;
        await sleep(1700);
        const slide = doc.querySelector("[data-diapositiva][data-estado='activa']");
        ok(`${T} · sin desborde de la página (${w}×${h})`, doc.documentElement.scrollWidth <= w && doc.documentElement.scrollHeight <= h && slide.scrollHeight <= slide.clientHeight + 1, [doc.documentElement.scrollWidth, doc.documentElement.scrollHeight, slide.scrollHeight, slide.clientHeight]);
        // alternancia de tema: CLARAS (3, 4, 6, 8) en claro; el resto en azul noche
        const tema = CLARAS.has(Number(estado.split("/")[1])) ? "claro" : "oscuro";
        const velo = win.getComputedStyle(doc.querySelector(".fondo-claro") ?? doc.body).opacity;
        ok(`${T} · tema ${tema}: body[data-tema] y fondo claro ${tema === "claro" ? "visible" : "oculto"}`, doc.body.dataset.tema === tema && velo === (tema === "claro" ? "1" : "0"), [doc.body.dataset.tema, velo]);
        const lineas = textosVisibles(doc);
        const fuera = lineas.flatMap((l) => l.cajas.filter(([x, y, ancho, alto]) => x < -1 || y < -1 || x + ancho > w + 1 || y + alto > h + 1).map(() => l.texto));
        ok(`${T} · ningún texto queda fuera de la pantalla`, fuera.length === 0, fuera.slice(0, 3));
        ok(`${T} · exactamente un h1 visible en la página`, [...doc.querySelectorAll("h1")].filter((e) => e.checkVisibility()).length === 1, [...doc.querySelectorAll("h1")].filter((e) => e.checkVisibility()).length);
        const sinNombre = [...doc.querySelectorAll("button, a[href], input, select")].filter((e) => e.checkVisibility() && !(e.getAttribute("aria-label") || e.textContent.trim() || e.labels?.length || e.getAttribute("aria-labelledby")));
        ok(`${T} · todos los controles visibles tienen nombre accesible`, sinNombre.length === 0, sinNombre.map((e) => e.outerHTML.slice(0, 60)));
        const ajeno = [...slide.querySelectorAll("*")].flatMap((e) => [...e.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim() && !e.closest(".sr-only") && e.checkVisibility()).map((n) => norm(n.textContent))).filter((t) => !INTERFAZ.has(t) && !DINAMICAS.has(t) && !texto.includes(t));
        ok(`${T} · todo el texto de la diapositiva es del Resumen (salvo controles de interfaz)`, ajeno.length === 0, ajeno.slice(0, 3));
        f.remove();
      }
    }
    // (el foco visible de 2 px se comprueba con Tab de verdad: node presentacion/_qa/correr.mjs foco)
    const f = await abrir("/#/3/1", w, h);
    const doc = f.contentDocument;
    await sleep(1500);
    ok(`${w}×${h} · html con lang=es, título y descripción`, doc.documentElement.lang === "es" && !!doc.title && !!doc.querySelector('meta[name="description"]'), doc.documentElement.lang);
    ok(`${w}×${h} · toda imagen tiene alt`, [...doc.querySelectorAll("img")].every((i) => i.getAttribute("alt")?.trim()), "");
    ok(`${w}×${h} · región de estado role=status para los lectores de pantalla`, doc.querySelector("[data-anuncio]")?.getAttribute("role") === "status", "");
    f.remove();
  }
  const fallos = res.filter((r) => !r.ok);
  return { pass: res.length - fallos.length, fail: fallos.length, detalles: fallos };
}
