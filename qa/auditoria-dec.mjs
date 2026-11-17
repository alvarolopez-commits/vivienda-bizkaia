// Auditoría de accesibilidad según el protocolo DEC (reglas DEC-004 contraste, DEC-007 teclado y foco, DEC-008 nombres, DEC-025/WCAG 1.4.10 reflujo y movimiento reducido).
//
//   python -m http.server 4195 --directory site
//   node qa/auditoria-dec.mjs [base] [salida.json]
//
// Cada hallazgo lleva uno de los cinco estados del protocolo: fail, needs_review, pass, not_applicable, not_evaluated. NO hay puntuación global.
// Lo que mide de verdad:
//   · DEC-004  contraste de cada texto visible frente a su fondo efectivo (se compone el color de los fondos translúcidos de los antecesores). Si el fondo no se puede
//              conocer (imagen, degradado, desenfoque) el resultado es needs_review, nunca pass.
//   · DEC-007  recorrido real con la tecla Tab (hasta 60 pasos por vista): trampas de teclado y controles sin indicador de foco propio.
//   · DEC-008  nombre accesible de cada control (aria-labelledby, aria-label, etiqueta, texto, title) y coherencia entre el nombre visible y el accesible (WCAG 2.5.3).
//   · Estructura: idioma, título, un solo <main>, un solo h1, enlace de salto.
//   · WCAG 1.4.10 reflujo: sin desplazamiento horizontal de la página a 320 px de ancho.
//   · Movimiento reducido: animaciones infinitas que siguen corriendo con prefers-reduced-motion: reduce.
// Lo que NO mide: lectura real con lector de pantalla, orden de lectura, contraste sobre imágenes, comprensión del contenido.
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = (process.argv[2] || "http://localhost:4195").replace(/\/$/, "");
const SALIDA = process.argv[3] || "auditoria-dec.json";
const FILTRO = process.argv[4] || "";
const CHROME = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe", "/usr/bin/google-chrome"].find((p) => existsSync(p));
const PUERTO = 9800 + Math.floor(Math.random() * 150);
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

const RUTAS = [
  ["/", 2500, "Portada"],
  ["/analisis/#situacion/alquiler", 4000, "Análisis · Situación"],
  ["/analisis/#municipios/48020", 4000, "Análisis · Municipios"],
  ["/analisis/#municipios/48020-48013", 4500, "Análisis · Comparador"],
  ["/analisis/#acceso", 4000, "Análisis · Acceso"],
  ["/analisis/#medidas", 4500, "Análisis · Medidas"],
  ["/analisis/#normas", 3500, "Análisis · Normas"],
  ["/analisis/#metodo", 3500, "Análisis · Método"],
  ["/radar/#situacion", 4500, "Radar · Situación"],
  ["/radar/#indicadores", 4000, "Radar · Indicadores"],
  ["/radar/#escenarios", 5000, "Radar · Escenarios"],
  ["/radar/#datos", 4000, "Radar · Datos"],
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => [`/resumen/#/${n}/1`, 6000, `Resumen · diapositiva ${n}`]),
].filter((r) => !FILTRO || r[0].includes(FILTRO));

// ---------------------------------------------------------------- contraste, nombres y estructura (dentro de la página)
const CONTRASTE = `(() => {
  const parse = (s) => { const m = /rgba?\\(([^)]+)\\)/.exec(s); if (!m) return null; const p = m[1].split(/[ ,\\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const sobre = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1 });
  const lum = (c) => { const k = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * k(c.r) + 0.7152 * k(c.g) + 0.0722 * k(c.b); };
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
  const visible = (e) => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && !e.closest("[hidden],[inert],[aria-hidden=true],.sr-only,.solo-lectores,svg"); };
  const enPantalla = (e) => { const r = e.getBoundingClientRect(); for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) { const o = getComputedStyle(a); if (o.overflowY !== "visible" || o.overflowX !== "visible") { const q = a.getBoundingClientRect(); if (r.bottom <= q.top + 1 || r.top >= q.bottom - 1 || r.right <= q.left + 1 || r.left >= q.right - 1) return false; } } return true; };
  const out = { fail: [], review: [], inciertos: [], sospechosos: [], medidos: 0 };
  const vistos = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walker.nextNode())) {
    const t = n.textContent.trim(); if (t.length < 2) continue;
    const e = n.parentElement; if (!e || !visible(e) || e.closest("script,style,noscript,option")) continue;
    if (e.closest(":disabled,[aria-disabled=true],[disabled]")) continue;           // inactivos: exentos (WCAG 1.4.3)
    const cs = getComputedStyle(e);
    let fg = parse(cs.color); if (!fg) { out.review.push({ k: "color no analizable", t: t.slice(0, 30) }); continue; }
    // opacidad acumulada
    let op = 1; for (let a = e; a; a = a.parentElement) op *= parseFloat(getComputedStyle(a).opacity);
    // fondo efectivo: se compone de la raíz hacia el elemento; imagen/degradado/desenfoque => no se conoce
    const cadena = []; for (let a = e; a; a = a.parentElement) cadena.unshift(a);
    let bg = { r: 255, g: 255, b: 255, a: 1 }, incierto = null;
    for (const a of cadena) {
      const s = getComputedStyle(a);
      if (s.backgroundImage !== "none") incierto = "fondo con imagen o degradado en ." + String(a.className).split(" ")[0];
      if (s.backdropFilter !== "none" || s.webkitBackdropFilter !== "none" && s.webkitBackdropFilter) incierto = incierto || "cristal (desenfoque) en ." + String(a.className).split(" ")[0];
      const c = parse(s.backgroundColor); if (c && c.a > 0) bg = sobre(c, bg);
    }
    if (op < 0.1 || !enPantalla(e)) continue;
    { const q0 = e.getBoundingClientRect(); if (q0.bottom <= 0 || q0.right <= 0) continue; }   // fuera de pantalla (p. ej. enlace de salto: solo se ve al recibir el foco)                                                           // invisible (opacidad ~0: etiquetas de un dock plegado, estados de transición)
    fg.a *= op; const fgc = sobre(fg, bg);
    const px = parseFloat(cs.fontSize), peso = parseInt(cs.fontWeight) || 400;
    const grande = px >= 24 || (px >= 18.66 && peso >= 700);
    const umbral = grande ? 3 : 4.5, r = ratio(fgc, bg);
    out.medidos++;
    const clave = e.tagName.toLowerCase() + "." + String(e.className.baseVal ?? e.className).split(" ")[0] + "|" + cs.color + "|" + (incierto ? "?" : Math.round(bg.r) + "," + Math.round(bg.g) + "," + Math.round(bg.b));
    if (vistos.has(clave)) continue; vistos.add(clave);
    if (incierto) { const rc = e.getBoundingClientRect(); out.inciertos.push({ k: incierto, el: clave.split("|")[0], fg: [Math.round(fgc.r), Math.round(fgc.g), Math.round(fgc.b)], umbral, px: Math.round(px), t: t.slice(0, 40), x: rc.left + scrollX, y: rc.top + scrollY, w: rc.width, h: rc.height }); continue; }
    if (r < umbral) { const rc = e.getBoundingClientRect(); out.sospechosos.push({ el: clave.split("|")[0], k: "fallo por antecesores", fg: [Math.round(fgc.r), Math.round(fgc.g), Math.round(fgc.b)], umbral, px: Math.round(px), t: t.slice(0, 40), rAnt: +r.toFixed(2), x: rc.left + scrollX, y: rc.top + scrollY, w: rc.width, h: rc.height }); }
  }
  return out;
})()`;

const NOMBRES = `(() => {
  const visible = (e) => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && !e.closest("[hidden],[inert]"); };
  const texto = (e) => (e?.innerText || e?.textContent || "").replace(/\\s+/g, " ").trim();
  const nombre = (e) => {
    const lb = e.getAttribute("aria-labelledby"); if (lb) { const t = lb.split(/\\s+/).map((i) => texto(document.getElementById(i))).join(" ").trim(); if (t) return t; }
    const al = e.getAttribute("aria-label"); if (al && al.trim()) return al.trim();
    if (e.labels && e.labels.length) { const t = [...e.labels].map(texto).join(" ").trim(); if (t) return t; }
    const lab = e.closest("label"); if (lab) { const t = texto(lab); if (t) return t; }
    if (e.matches("input[type=submit],input[type=button]")) return e.value;
    const alt = e.querySelector?.("img[alt]"); const t = texto(e) || (alt && alt.alt) || ""; if (t) return t;
    return e.getAttribute("title") || "";
  };
  const out = { sinNombre: [], contradice: [], total: 0 };
  for (const e of document.querySelectorAll("a[href],button,input:not([type=hidden]),select,textarea,summary,[role=button],[role=tab],[role=link]")) {
    if (!visible(e) || e.closest("svg")) continue;
    out.total++; const n = nombre(e);
    if (!n) out.sinNombre.push((e.tagName.toLowerCase() + "." + String(e.className).split(" ")[0]).slice(0, 40) + (e.getAttribute("href") ? " → " + e.getAttribute("href").slice(0, 30) : ""));
    else { const norm = (x) => x.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
      const vis = norm(texto(e)), al = norm(e.getAttribute("aria-label") || "");
      if (al && vis && vis.length > 1 && !al.includes(vis)) out.contradice.push({ vis: vis.slice(0, 30), nombre: al.slice(0, 40) }); }
  }
  const d = document.documentElement;
  out.estructura = { lang: d.lang || null, titulo: !!document.title.trim(), mains: document.querySelectorAll("main").length, h1: [...document.querySelectorAll("h1")].filter(visible).length,
    salto: !!document.querySelector("a.salto, a.saltar, [data-saltar], a[href^='#'][class*=salt]"), imgSinAlt: [...document.images].filter((i) => !i.hasAttribute("alt") && visible(i)).length };
  return out;
})()`;

const FOCO = `(() => { const a = document.activeElement; if (!a || a === document.body) return null; const cs = getComputedStyle(a);
  const tiene = (st) => st.outlineStyle !== "none" && parseFloat(st.outlineWidth) > 0;
  let outline = tiene(cs) || tiene(getComputedStyle(a, "::after")) || tiene(getComputedStyle(a, "::before")); let sombra = cs.boxShadow !== "none";
  for (let p = a.parentElement, i = 0; p && i < 3 && !outline; p = p.parentElement, i++) { if (p.matches(":focus-within")) { const q = getComputedStyle(p); if (tiene(q) || q.boxShadow !== "none") sombra = true; } }
  if (!outline && !sombra && a.ownerSVGElement) { for (const d of a.querySelectorAll("*")) { const q = getComputedStyle(d); if (q.strokeDasharray === "none" && parseFloat(q.strokeWidth) >= 3) { sombra = true; break; } } }
  const r = a.getBoundingClientRect();
  const lista = [...document.querySelectorAll("a[href],button,input:not([type=hidden]),select,textarea,summary,[tabindex]")].filter((x) => { const q = x.getBoundingClientRect(), c = getComputedStyle(x); return q.width > 0 && q.height > 0 && c.visibility !== "hidden" && !x.disabled && x.getAttribute("tabindex") !== "-1" && !x.closest("[inert],[hidden]"); });
  return { pos: Math.round(r.left) + "," + Math.round(r.top + scrollY), esUltimo: lista[lista.length - 1] === a, id: a.tagName.toLowerCase() + "." + String(a.className.baseVal ?? a.className).split(" ")[0] + (a.getAttribute("href") ? "[" + a.getAttribute("href").slice(0, 24) + "]" : ""), outline, sombra, texto: (a.innerText || a.getAttribute("aria-label") || "").trim().slice(0, 24), visible: r.width > 0 && r.height > 0 }; })()`;


// Fondos desconocidos (imagen, degradado, cristal): se mide sobre píxeles reales de una captura. El fondo es el color más frecuente dentro del rectángulo del texto.
const MUESTREO = (b64, items) => `(async () => {
  const img = new Image(); img.src = "data:image/png;base64,${b64}"; await img.decode();
  const cv = document.createElement("canvas"); cv.width = img.width; cv.height = img.height; const cx = cv.getContext("2d", { willReadFrequently: true }); cx.drawImage(img, 0, 0);
  const lum = (c) => { const k = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * k(c[0]) + 0.7152 * k(c[1]) + 0.0722 * k(c[2]); };
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
  return ${JSON.stringify(items)}.map((it) => {
    const x = Math.max(0, Math.floor(it.x)), y = Math.max(0, Math.floor(it.y)), w = Math.min(img.width - x, Math.ceil(it.w)), h = Math.min(img.height - y, Math.ceil(it.h));
    if (w < 2 || h < 2) return { ...it, medido: false, motivo: "fuera de la captura" };
    // El fondo no es el color más frecuente (en texto denso dominan los píxeles de borde suavizado). Se ordenan los píxeles por luminosidad y se promedia una banda
    // alejada del color del texto: texto claro -> banda del 15-45 % más oscuro; texto oscuro -> banda del 55-85 %. Con fondos degradados es una estimación, no una cota.
    const d = cx.getImageData(x, y, w, h).data, px = [];
    for (let i = 0; i < d.length; i += 4) px.push([d[i], d[i + 1], d[i + 2], lum([d[i], d[i + 1], d[i + 2]])]);
    px.sort((a, b) => a[3] - b[3]);
    const claro = lum(it.fg) > 0.4, a0 = Math.floor(px.length * (claro ? 0.15 : 0.55)), a1 = Math.max(a0 + 1, Math.floor(px.length * (claro ? 0.45 : 0.85)));
    const banda = px.slice(a0, a1), bg = [0, 1, 2].map((k) => banda.reduce((s, q) => s + q[k], 0) / banda.length);
    return { ...it, medido: true, bg: bg.map(Math.round), r: +ratio(bg, it.fg).toFixed(2) };
  });
})()`;

async function lanzar() {
  if (!CHROME) throw new Error("No se encontró Chrome.");
  const perfil = mkdtempSync(join(tmpdir(), "vb-dec-"));
  const proc = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PUERTO}`, `--user-data-dir=${perfil}`, "--no-first-run", "--disable-extensions", "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl", "--window-size=1440,900", "about:blank"], { stdio: "ignore" });
  let objetivo = null;
  for (let i = 0; i < 100 && !objetivo; i++) { try { objetivo = (await (await fetch(`http://127.0.0.1:${PUERTO}/json/list`)).json()).find((t) => t.type === "page"); } catch { /* arrancando */ } if (!objetivo) await dormir(100); }
  if (!objetivo) { proc.kill(); throw new Error("Chrome no abrió el puerto de depuración."); }
  const ws = new WebSocket(objetivo.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = () => j(new Error("WebSocket CDP")); });
  let id = 0; const pend = new Map();
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { const { r, j } = pend.get(d.id); pend.delete(d.id); d.error ? j(new Error(d.error.message)) : r(d.result); } };
  const send = (method, params = {}) => new Promise((r, j) => { const i = ++id; pend.set(i, { r, j }); ws.send(JSON.stringify({ id: i, method, params })); setTimeout(() => { if (pend.delete(i)) j(new Error(`tiempo agotado: ${method}`)); }, 25000); });
  await send("Page.enable"); await send("Runtime.enable");
  return { send, cerrar() { try { ws.close(); } catch {} proc.kill(); try { rmSync(perfil, { recursive: true, force: true }); } catch {} } };
}
const evalua = async (cdp, expr) => (await cdp.send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true })).result.value;
const tecla = async (cdp, key, code, vk, mod = 0) => { for (const type of ["rawKeyDown", "keyUp"]) await cdp.send("Input.dispatchKeyEvent", { type, key, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, modifiers: mod }); };
async function ir(cdp, ruta, espera) {
  await cdp.send("Page.navigate", { url: "about:blank" }); await dormir(150);
  await cdp.send("Page.navigate", { url: `${BASE}${ruta.replace("#", `?d=${Date.now() % 100000}#`)}` }); await dormir(espera);
  for (let i = 0; i < 12; i++) { const vivas = await evalua(cdp, `document.getAnimations().filter((a) => a.playState === "running" && Number.isFinite(a.effect?.getComputedTiming().endTime)).length`).catch(() => 0); if (!vivas) break; await dormir(500); }
}

const cdp = await lanzar();
const resultados = [];
try {
  for (const [ruta, espera, etiqueta] of RUTAS) {
    const r = { ruta, etiqueta, hallazgos: [] };
    const H = (regla, estado, evidencia, extra = {}) => r.hallazgos.push({ regla, estado, evidencia, ...extra });
    try {
    // ---------- escritorio 1440
    await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: false });
    await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }] });
    await ir(cdp, ruta, espera);
    const c = await evalua(cdp, CONTRASTE);
    const porPixeles = [...c.sospechosos.slice(0, 40), ...c.inciertos.slice(0, 40)];
    let med = [];
    if (porPixeles.length) {
      try {
        const alto = await evalua(cdp, "document.documentElement.scrollHeight");
        const sy = await evalua(cdp, "window.scrollY");
        const dentro = porPixeles.filter((m) => m.y - sy >= 0 && m.y - sy + m.h <= 900), resto = porPixeles.filter((m) => !dentro.includes(m));
        // lo visible en pantalla se mide en una captura normal (fiel a lo que ve la persona); lo que queda fuera, en una captura de toda la página
        if (dentro.length) { const shot = await cdp.send("Page.captureScreenshot", { format: "png" }); med.push(...(await evalua(cdp, MUESTREO(shot.data, dentro.map((m) => ({ ...m, y: m.y - sy })))))); }
        if (resto.length && alto > 905) { const shot = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: 0, y: 0, width: 1440, height: Math.min(alto, 6000), scale: 1 } }); med.push(...(await evalua(cdp, MUESTREO(shot.data, resto)))); }
      } catch (err) { H("DEC-004", "not_evaluated", `${porPixeles.length} textos con fondo no deducible por antecesores no se pudieron medir sobre píxeles (${err.message})`); }
    }
    const confirmados = med.filter((m) => m.k === "fallo por antecesores" && m.medido && m.r < m.umbral);
    const descartados = med.filter((m) => m.k === "fallo por antecesores" && m.medido && m.r >= m.umbral).length;
    const sinConfirmar = med.filter((m) => m.k === "fallo por antecesores" && !m.medido);
    H("DEC-004", confirmados.length ? "fail" : "pass", `${c.medidos} textos medidos; ${confirmados.length} por debajo del umbral confirmados sobre píxeles${descartados ? ` (${descartados} sospechas por antecesores descartadas al medir la captura)` : ""}`, { fallos: confirmados.slice(0, 8).map((m) => ({ el: m.el, t: m.t, r: m.r, umbral: m.umbral, fg: m.fg, bg: m.bg, px: m.px })) });
    if (sinConfirmar.length) H("DEC-004", "needs_review", `${sinConfirmar.length} sospechas de contraste sin poder medir sobre píxeles`, { ejemplos: sinConfirmar.slice(0, 3).map((m) => ({ t: m.t, el: m.el, rAnt: m.rAnt })) });
    if (c.inciertos.length) {
      const inc = med.filter((m) => m.k !== "fallo por antecesores");
      const malos = inc.filter((m) => m.medido && m.r < m.umbral), ok = inc.filter((m) => m.medido && m.r >= m.umbral), sin = inc.filter((m) => !m.medido);
      if (malos.length) H("DEC-004", "fail", `${malos.length} de ${inc.length} textos sobre fondo con imagen, degradado o cristal quedan por debajo del umbral (medido sobre píxeles de una captura)`, { fallos: malos.slice(0, 8).map((m) => ({ el: m.el, t: m.t, r: m.r, umbral: m.umbral, fg: m.fg, bg: m.bg, px: m.px })) });
      if (ok.length) H("DEC-004", "pass", `${ok.length} textos sobre fondo con imagen, degradado o cristal cumplen (medido sobre píxeles de una captura)`);
      if (sin.length || c.inciertos.length > 40) H("DEC-004", "needs_review", `${sin.length + Math.max(0, c.inciertos.length - 40)} textos sin medir (fuera de la captura o por encima del límite de muestreo)`, { ejemplos: sin.slice(0, 3).map((m) => ({ t: m.t, motivo: m.motivo })) });
    }
    const nm = await evalua(cdp, NOMBRES);
    H("DEC-008", nm.sinNombre.length ? "fail" : "pass", `${nm.total} controles; ${nm.sinNombre.length} sin nombre accesible`, { fallos: nm.sinNombre.slice(0, 6) });
    if (nm.contradice.length) H("DEC-008", "needs_review", `${nm.contradice.length} controles cuyo nombre accesible no contiene su texto visible (WCAG 2.5.3)`, { ejemplos: nm.contradice.slice(0, 4) });
    const e = nm.estructura;
    const estr = []; if (!e.lang) estr.push("sin lang"); if (!e.titulo) estr.push("sin título"); if (e.mains !== 1) estr.push(`${e.mains} main`); if (e.imgSinAlt) estr.push(`${e.imgSinAlt} imágenes sin alt`);
    H("Estructura", estr.length ? "fail" : "pass", estr.length ? estr.join(", ") : `lang ${e.lang}, título, un main, ${e.h1} h1, imágenes con alt`, { saltoVisible: e.salto });
    // ---------- teclado: Tab
    await evalua(cdp, "document.activeElement && document.activeElement.blur(); window.scrollTo(0,0); 0");
    const vistos = new Map(); let sinFoco = [], iguales = 0, ultimo = null, trampa = false, pasos = 0;
    for (let i = 0; i < 60; i++) {
      await tecla(cdp, "Tab", "Tab", 9); await dormir(40); pasos++;
      const f = await evalua(cdp, FOCO);
      if (!f) { if (vistos.size > 3) break; continue; }
      const huella = f.id + f.texto + f.pos; if (huella === ultimo) { if (f.esUltimo) break; if (++iguales >= 3) { trampa = true; break; } } else iguales = 0; ultimo = huella;
      if (!vistos.has(f.id + f.texto)) { vistos.set(f.id + f.texto, f); if (f.visible && !f.outline && !f.sombra) sinFoco.push(`${f.id}«${f.texto}»`); }
    }
    H("DEC-007", trampa ? "fail" : "pass", trampa ? `trampa de teclado en ${ultimo}` : `recorrido con Tab de ${vistos.size} controles distintos sin trampa`);
    H("DEC-007", sinFoco.length ? "needs_review" : "pass", sinFoco.length ? `${sinFoco.length} de ${vistos.size} controles recibieron el foco sin contorno ni sombra propios (puede haber otro indicador, p. ej. cambio de fondo)` : `los ${vistos.size} controles recorridos muestran contorno o sombra al recibir el foco`, { ejemplos: sinFoco.slice(0, 5) });
    // ---------- movimiento reducido
    await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
    await ir(cdp, ruta, espera);
    const mov = await evalua(cdp, `document.getAnimations().filter((a) => a.playState === "running" && a.effect?.getComputedTiming().iterations === Infinity).map((a) => (a.animationName || a.transitionProperty || "?"))`);
    H("Movimiento reducido", mov.length ? "fail" : "pass", mov.length ? `${mov.length} animaciones infinitas siguen en marcha: ${[...new Set(mov)].slice(0, 4).join(", ")}` : "sin animaciones infinitas con prefers-reduced-motion: reduce");
    await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }] });
    // ---------- reflujo a 320 px
    await cdp.send("Emulation.setDeviceMetricsOverride", { width: 320, height: 568, deviceScaleFactor: 1, mobile: true });
    await ir(cdp, ruta, espera);
    const m = await evalua(cdp, `({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth })`);
    H("Reflujo 320 px (WCAG 1.4.10)", m.sw > m.cw + 1 ? "fail" : "pass", `ancho de contenido ${m.sw} px frente a ${m.cw} px de pantalla`);
    } catch (err) { H("Auditoría", "not_evaluated", `no se pudo completar esta vista: ${err.message}`); }
    resultados.push(r);
    const n = (s) => r.hallazgos.filter((h) => h.estado === s).length;
    process.stdout.write(`${n("fail") ? "✗" : n("needs_review") ? "?" : "✓"} ${etiqueta.padEnd(34)} fail ${n("fail")} · revisar ${n("needs_review")} · pass ${n("pass")}\n`);
    for (const h of r.hallazgos.filter((x) => x.estado !== "pass")) {
      process.stdout.write(`    [${h.estado}] ${h.regla}: ${h.evidencia}\n`);
      for (const f of (h.fallos || h.ejemplos || []).slice(0, 3)) process.stdout.write(`        ${JSON.stringify(f).slice(0, 190)}\n`);
    }
  }
} finally { cdp.cerrar(); }
writeFileSync(SALIDA, JSON.stringify({ base: BASE, fecha: new Date().toISOString(), resultados }, null, 1));
const todos = resultados.flatMap((r) => r.hallazgos); const cuenta = (s) => todos.filter((h) => h.estado === s).length;
console.log(`\n${resultados.length} vistas · ${todos.length} comprobaciones: fail ${cuenta("fail")} · needs_review ${cuenta("needs_review")} · pass ${cuenta("pass")} (sin puntuación global) · ${SALIDA}`);
