// Auditoría visual y técnica de todo el proyecto con Chrome SIN PANTALLA (protocolo CDP). Pensada para repetirse antes de cada publicación.
//
//   1) Servir la carpeta site/ :   python -m http.server 4195 --directory site
//   2) node qa/auditoria-visual.mjs [base] [salida.json] [soloTamaño]      p. ej.  node qa/auditoria-visual.mjs http://localhost:4195 auditoria.json
//
// Para cada ruta y cada tamaño (1280×720, 1440×900, 1920×1080 y móvil 390×844 con emulación táctil) mide, DENTRO de la página:
//   · desborde horizontal de toda la página y elementos que se salen por la derecha;
//   · errores de consola, excepciones y peticiones fallidas (404/5xx), salvo el aviso conocido de View Transitions;
//   · controles interactivos por debajo de 24 px (límite AA) y, en móvil, por debajo de 44 px (recomendado);
//   · imágenes rotas, fuentes que no cargan, avisos role="alert" visibles y número de h1 visibles;
//   · reglas propias: la portada y Situación caben en la pantalla; en escritorio, ninguna diapositiva del Resumen recorta su contenido;
//     en móvil, el Resumen está en lectura vertical.
// NO mide contraste ni lectura con lector de pantalla, ni sustituye una prueba en Safari o en un teléfono real.
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = (process.argv[2] || "http://localhost:4195").replace(/\/$/, "");
const SALIDA = process.argv[3] || "auditoria-visual.json";
const SOLO = process.argv[4] || "";
const FILTRO = process.argv[5] || "";   // solo las rutas que contengan este texto
const CHROME = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe", "/usr/bin/google-chrome"].find((p) => existsSync(p));
const PUERTO = 9500 + Math.floor(Math.random() * 300);
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

const TAMAÑOS = [
  { id: "1280x720", w: 1280, h: 720, movil: false },
  { id: "1440x900", w: 1440, h: 900, movil: false },
  { id: "1920x1080", w: 1920, h: 1080, movil: false },
  { id: "390x844", w: 390, h: 844, movil: true },
].filter((t) => !SOLO || t.id === SOLO);

// [ruta, espera ms, etiqueta, reglas]
const RUTAS = [
  ["/", 2500, "Portada", ["cabe"]],
  ["/analisis/#situacion/alquiler", 4000, "Análisis · Situación", ["cabe-situacion"]],
  ["/analisis/#municipios/48020", 4000, "Análisis · Municipios (Bilbao)", []],
  ["/analisis/#municipios/48020-48013", 4500, "Análisis · Comparador (Bilbao y Barakaldo)", []],
  ["/analisis/#acceso", 4000, "Análisis · Acceso", []],
  ["/analisis/#medidas", 4500, "Análisis · Medidas", []],
  ["/analisis/#normas", 3500, "Análisis · Normas", []],
  ["/analisis/#metodo", 3500, "Análisis · Método", []],
  ["/radar/#situacion", 4500, "Radar · Situación", []],
  ["/radar/#indicadores", 4000, "Radar · Indicadores", []],
  ["/radar/#escenarios", 5000, "Radar · Escenarios", []],
  ["/radar/#datos", 4000, "Radar · Datos", []],
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => [`/resumen/#/${n}/1`, 6000, `Resumen · diapositiva ${n}`, ["resumen"]]),
];

const AUDITORIA = `(() => {
  const d = document.documentElement, vw = d.clientWidth, vh = innerHeight;
  const visible = (e) => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && cs.opacity !== "0" && !e.closest("[hidden],[inert],.sr-only,.solo-lectores,.salto,.saltar"); };
  const out = { vw, vh, sw: d.scrollWidth, sh: d.scrollHeight, overflowX: d.scrollWidth > vw + 1 };
  out.h1 = [...document.querySelectorAll("h1")].filter(visible).length;
  out.alertas = [...document.querySelectorAll("[role=alert]")].filter(visible).map((e) => e.innerText.slice(0, 90));
  out.rotas = [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && visible(i)).map((i) => i.currentSrc.split("/").slice(-2).join("/"));
  const sel = "a[href],button,input:not([type=hidden]),select,textarea,summary,[role=button],[role=tab]";
  const peq = [], fuera = []; let exentos = 0;
  for (const e of document.querySelectorAll(sel)) {
    if (!visible(e) || e.closest("svg")) continue;
    const r = e.getBoundingClientRect(), m = Math.min(r.width, r.height);
    // los botones que cubren su tarjeta entera (cifra-elegir, tipo-elegir…) y los radios ocultos dentro de una etiqueta no cuentan
    if (/(^| )(cifra|tipo|grupo)-elegir( |$)/.test(e.className)) continue;
    if (e.matches("input[type=radio],input[type=checkbox]") && e.closest("label")) continue;
    // enlace dentro de una frase: exento de la norma de tamaño del objetivo (WCAG 2.2, 2.5.8, excepción «en línea»)
    if (e.tagName === "A" && getComputedStyle(e).display === "inline" && ((e.parentElement?.innerText || "").replace(e.innerText, "").trim().length >= 6)) { exentos++; continue; }
    // área pulsable ampliada con ::after (botones «i», enlaces de fichas, tarjetas enteras clicables): cuenta como el objetivo
    const pa = getComputedStyle(e, "::after");
    if (pa.content !== "none" && pa.position === "absolute" && Math.min(parseFloat(pa.width) || 0, parseFloat(pa.height) || 0) >= 44) { exentos++; continue; }
    if (m < 44) peq.push({ n: (e.tagName.toLowerCase() + (typeof e.className === "string" && e.className ? "." + e.className.split(" ")[0] : "")).slice(0, 40), t: (e.innerText || e.getAttribute("aria-label") || e.title || "").trim().slice(0, 28), w: Math.round(r.width), h: Math.round(r.height), ctx: (e.parentElement?.className || "").toString().slice(0, 30) });
  }
  for (const e of document.querySelectorAll("body *")) {
    if (e.closest("svg") || !visible(e)) continue;
    const r = e.getBoundingClientRect();
    let scroller = false;
    for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) { const o = getComputedStyle(a).overflowX; if (o === "auto" || o === "scroll" || o === "hidden" || o === "clip") { scroller = true; break; } }
    if (r.right > vw + 1 && !scroller) { fuera.push((e.tagName.toLowerCase() + "." + String(e.className.baseVal ?? e.className).split(" ")[0]).slice(0, 40) + " r=" + Math.round(r.right)); if (fuera.length >= 5) break; }
  }
  out.enLinea = exentos; out.peq24 = peq.filter((p) => Math.min(p.w, p.h) < 24); out.peq44 = peq.length; out.peq44Ej = peq.slice(0, 6);
  out.fuera = fuera;
  out.fuentes = { montserrat: document.fonts.check("600 16px Montserrat"), geist: document.fonts.check("400 16px Geist") };
  out.disposicion = d.dataset.disposicion || null;
  const q = (s) => document.querySelector(s);
  const fecha = q(".fecha"); out.fechaBottom = fecha ? Math.round(fecha.getBoundingClientRect().bottom) : null;
  const act = q(".diapositiva[data-estado=activa]"); out.diapo = act ? { sh: act.scrollHeight, ch: act.clientHeight } : null;
  out.titulo = document.title;
  return out;
})()`;

async function lanzar() {
  if (!CHROME) throw new Error("No se encontró Chrome.");
  const perfil = mkdtempSync(join(tmpdir(), "vb-audit-"));
  const proc = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PUERTO}`, `--user-data-dir=${perfil}`, "--no-first-run", "--disable-extensions", "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl", "--window-size=1440,900", "about:blank"], { stdio: "ignore" });
  let objetivo = null;
  for (let i = 0; i < 100 && !objetivo; i++) { try { objetivo = (await (await fetch(`http://127.0.0.1:${PUERTO}/json/list`)).json()).find((t) => t.type === "page"); } catch { /* arrancando */ } if (!objetivo) await dormir(100); }
  if (!objetivo) { proc.kill(); throw new Error("Chrome no abrió el puerto de depuración."); }
  const ws = new WebSocket(objetivo.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = () => j(new Error("WebSocket CDP")); });
  let id = 0; const pend = new Map(); const reg = { errores: [], fallos: [] };
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pend.has(d.id)) { const { r, j } = pend.get(d.id); pend.delete(d.id); d.error ? j(new Error(d.error.message)) : r(d.result); return; }
    if (d.method === "Runtime.exceptionThrown") reg.errores.push("excepción: " + (d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text).split("\n")[0].slice(0, 140));
    else if (d.method === "Runtime.consoleAPICalled" && d.params.type === "error") reg.errores.push("consola: " + d.params.args.map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 140));
    else if (d.method === "Network.responseReceived" && d.params.response.status >= 400) reg.fallos.push(`${d.params.response.status} ${d.params.response.url.replace(BASE, "")}`);
    else if (d.method === "Network.loadingFailed" && !d.params.canceled) reg.fallos.push(`falló ${d.params.errorText} ${d.params.requestId}`);
  };
  const send = (method, params = {}) => new Promise((r, j) => { const i = ++id; pend.set(i, { r, j }); ws.send(JSON.stringify({ id: i, method, params })); });
  await send("Page.enable"); await send("Runtime.enable"); await send("Network.enable");
  return { send, reg, cerrar() { try { ws.close(); } catch {} proc.kill(); try { rmSync(perfil, { recursive: true, force: true }); } catch {} } };
}

const RUIDO = /Transition was aborted because of invalid state|Page already revealed|favicon/i;
const cdp = await lanzar();
const resultados = [], fallos = [];
try {
  for (const tam of TAMAÑOS) {
    await cdp.send("Emulation.setDeviceMetricsOverride", { width: tam.w, height: tam.h, deviceScaleFactor: 1, mobile: tam.movil });
    await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: tam.movil });
    for (const [ruta, espera, etiqueta, reglas] of RUTAS.filter((x) => !FILTRO || x[0].includes(FILTRO))) {
      cdp.reg.errores.length = 0; cdp.reg.fallos.length = 0;
      await cdp.send("Page.navigate", { url: "about:blank" }); await dormir(150);
      await cdp.send("Page.navigate", { url: `${BASE}${ruta.replace("#", `?a=${Date.now() % 100000}#`)}` });
      await dormir(espera);
      const r = (await cdp.send("Runtime.evaluate", { expression: AUDITORIA, returnByValue: true })).result.value;
      const f = [];
      if (r.overflowX) f.push(`desborde horizontal de la página (${r.sw} > ${r.vw})`);
      if (r.fuera.length) f.push("sale por la derecha: " + r.fuera.slice(0, 3).join(" | "));
      const errs = cdp.reg.errores.filter((e) => !RUIDO.test(e)); if (errs.length) f.push("errores: " + [...new Set(errs)].slice(0, 3).join(" | "));
      const fall = cdp.reg.fallos.filter((e) => !RUIDO.test(e)); if (fall.length) f.push("peticiones fallidas: " + [...new Set(fall)].slice(0, 3).join(" | "));
      if (r.rotas.length) f.push("imágenes rotas: " + r.rotas.join(", "));
      if (r.alertas.length) f.push("aviso de error visible: " + r.alertas[0]);
      if (!r.fuentes.montserrat || !r.fuentes.geist) f.push(`fuentes no cargadas (Montserrat ${r.fuentes.montserrat}, Geist ${r.fuentes.geist})`);
      if (r.peq24.length) f.push(`controles por debajo de 24 px: ${r.peq24.slice(0, 4).map((p) => `${p.n}«${p.t}» ${p.w}×${p.h} en .${p.ctx}`).join("; ")}`);
      if (tam.movil && r.peq44 > 0 && !reglas.includes("resumen")) f.push(`${r.peq44} controles por debajo de 44 px (p. ej. ${r.peq44Ej.slice(0, 2).map((p) => `${p.n} ${p.w}×${p.h}`).join(", ")})`);
      if (tam.movil && reglas.includes("resumen") && r.peq44 > 0) f.push(`${r.peq44} controles por debajo de 44 px (p. ej. ${r.peq44Ej.slice(0, 2).map((p) => `${p.n} ${p.w}×${p.h}`).join(", ")})`);
      if (r.h1 !== 1 && !reglas.includes("resumen")) f.push(`h1 visibles: ${r.h1} (debería ser 1)`);
      if (reglas.includes("cabe") && !tam.movil && r.sh > r.vh + 1) f.push(`la portada hace scroll (${r.sh} > ${r.vh})`);
      if (reglas.includes("cabe-situacion") && !tam.movil && r.fechaBottom !== null && r.fechaBottom > r.vh + 1) f.push(`Situación no cabe: la fecha acaba en ${r.fechaBottom} > ${r.vh}`);
      if (reglas.includes("resumen")) {
        if (!tam.movil && r.diapo && r.diapo.sh > r.diapo.ch + 2) f.push(`la diapositiva recorta contenido (${r.diapo.sh} > ${r.diapo.ch})`);
        if (tam.movil && r.disposicion !== "vertical") f.push("en móvil no está en lectura vertical");
        if (!tam.movil && r.disposicion) f.push("en escritorio está en lectura vertical");
      }
      resultados.push({ tam: tam.id, ruta, etiqueta, fallos: f, metricas: { sw: r.sw, vw: r.vw, sh: r.sh, vh: r.vh, peq44: r.peq44, h1: r.h1 } });
      if (f.length) fallos.push({ tam: tam.id, etiqueta, ruta, f });
      process.stdout.write(`${f.length ? "✗" : "✓"} ${tam.id.padEnd(9)} ${etiqueta}${f.length ? "\n    - " + f.join("\n    - ") : ""}\n`);
    }
  }
} finally { cdp.cerrar(); }
writeFileSync(SALIDA, JSON.stringify({ base: BASE, fecha: new Date().toISOString(), total: resultados.length, conFallos: fallos.length, fallos, resultados }, null, 1));
console.log(`\n${resultados.length} comprobaciones · ${fallos.length} con fallos · resultado en ${SALIDA}`);
process.exit(fallos.length ? 1 : 0);
