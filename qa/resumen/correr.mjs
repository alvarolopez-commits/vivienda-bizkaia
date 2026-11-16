// Ejecutor de pruebas y capturas con Chrome SIN PANTALLA (protocolo CDP), para no depender del panel del navegador de la aplicación
// (un panel oculto pausa requestAnimationFrame y, con él, GSAP y las animaciones). Requiere Chrome instalado y el servidor en :4180.
//
//   node presentacion/_qa/correr.mjs prueba qa-cifras.js [[1280,720]]       → ejecuta run(tamaños) del módulo y resume el resultado
//   node presentacion/_qa/correr.mjs captura "/#/2/3" salida.png 1920 1080 [esperaMs] [colorScheme]
//   node presentacion/_qa/correr.mjs js "/#/2/3" "document.title" 1920 1080 [esperaMs]    → evalúa una expresión en la página
//
// Chrome se lanza con un perfil temporal propio, que se borra al terminar. Salida con código 1 si alguna prueba falla.
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"].find((p) => existsSync(p));

const BASE = process.env.PRES_BASE || "http://localhost:4180"; // PRES_BASE permite capturar otra página local (p. ej. una referencia de estilo)
const PUERTO = 9400 + Math.floor(Math.random() * 400);
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

async function lanzar(ancho, alto) {
  if (!CHROME) throw new Error("No se encontró Chrome.");
  const perfil = mkdtempSync(join(tmpdir(), "pres-qa-"));
  const proc = spawn(CHROME, [
    "--headless=new", `--remote-debugging-port=${PUERTO}`, `--user-data-dir=${perfil}`, "--no-first-run", "--no-default-browser-check",
    "--disable-extensions", "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows",
    "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl",
    `--window-size=${ancho},${alto}`, "about:blank",
  ], { stdio: "ignore" });
  let objetivo = null;
  for (let i = 0; i < 100 && !objetivo; i++) {
    try { objetivo = (await (await fetch(`http://127.0.0.1:${PUERTO}/json/list`)).json()).find((t) => t.type === "page"); } catch { /* aún arrancando */ }
    if (!objetivo) await dormir(100);
  }
  if (!objetivo) { proc.kill(); throw new Error("Chrome no abrió el puerto de depuración."); }
  const ws = new WebSocket(objetivo.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = () => j(new Error("WebSocket CDP")); });
  let id = 0;
  const pend = new Map(), eventos = [], consola = [];
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pend.has(d.id)) { const { ok, ko } = pend.get(d.id); pend.delete(d.id); d.error ? ko(new Error(d.error.message)) : ok(d.result); }
    else if (d.method) {
      eventos.push(d);
      if (d.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(d.params.type)) consola.push(`${d.params.type}: ${d.params.args.map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 200)}`);
      if (d.method === "Runtime.exceptionThrown") consola.push(`excepción: ${(d.params.exceptionDetails.exception?.description ?? d.params.exceptionDetails.text).slice(0, 200)}`);
    }
  };
  const cdp = (method, params = {}) => new Promise((ok, ko) => { const i = ++id; pend.set(i, { ok, ko }); ws.send(JSON.stringify({ id: i, method, params })); });
  await cdp("Page.enable"); await cdp("Runtime.enable");
  const cerrar = async () => { try { ws.close(); } catch { /* ya cerrado */ } proc.kill(); await dormir(300); try { rmSync(perfil, { recursive: true, force: true }); } catch { /* Windows aún lo usa */ } };
  const esperarCarga = async () => { for (let i = 0; i < 200; i++) { if (eventos.some((e) => e.method === "Page.loadEventFired")) return; await dormir(50); } };
  const ir = async (ruta, ancho_, alto_, escala = 1) => {
    await cdp("Emulation.setDeviceMetricsOverride", { width: ancho_, height: alto_, deviceScaleFactor: escala, mobile: false });
    // carga limpia: dos rutas que solo difieren en el # no recargan la página y arrastrarían el estado de la anterior
    eventos.length = 0; await cdp("Page.navigate", { url: "about:blank" }); await esperarCarga();
    eventos.length = 0; await cdp("Page.navigate", { url: BASE + ruta }); await esperarCarga();
  };
  const evaluar = async (expresion, timeout = 240000) => {
    const r = await Promise.race([cdp("Runtime.evaluate", { expression: expresion, awaitPromise: true, returnByValue: true }), dormir(timeout).then(() => { throw new Error("tiempo agotado"); })]);
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
    return r.result.value;
  };
  return { cdp, ir, evaluar, cerrar, consola };
}

const [, , modo, ...args] = process.argv;
let codigo = 0;
try {
  if (modo === "prueba") {
    const [modulo, tamanos = "", reducir] = args; // reducir = "reduce" emula «reducir movimiento» en todo el navegador
    const c = await lanzar(1920, 1080);
    try {
      if (reducir === "reduce") await c.cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
      await c.ir("/", 1920, 1080);
      const t = tamanos ? `, ${tamanos}` : "";
      const r = JSON.parse(await c.evaluar(`import('/_qa/${modulo}?v=${Date.now()}').then((m) => m.run(${tamanos || ""})).then((r) => JSON.stringify(r))`));
      console.log(`${modulo}${t ? " " + tamanos : ""}: ${r.pass} PASS, ${r.fail} FAIL`);
      for (const d of r.detalles) console.log(`  FAIL · ${d.n}\n         ${typeof d.d === "string" ? d.d : JSON.stringify(d.d)}`.slice(0, 600));
      if (c.consola.length) console.log("Consola:", [...new Set(c.consola)].slice(0, 8).join(" | "));
      codigo = r.fail ? 1 : 0;
    } finally { await c.cerrar(); }
  } else if (modo === "foco") {
    // Foco visible: se recorre la página con Tab REAL (Input.dispatchKeyEvent, que activa :focus-visible) y cada parada debe llevar un anillo sólido de 2 px.
    const c = await lanzar(1440, 900);
    let paradas = 0, malas = 0;
    try {
      for (const m of ["leer", "presentar"]) for (const e of ["#/1/1", "#/2/2", "#/3/1", "#/4/3", "#/5/2", "#/6/1", "#/7/1", "#/8/1", "#/9/1"]) {
        await c.ir(`/${m === "presentar" ? "?modo=presentar" : ""}${e}`, 1440, 900);
        await dormir(2500);
        const vistos = [];
        for (let i = 0; i < 30; i++) {
          for (const type of ["keyDown", "keyUp"]) await c.cdp("Input.dispatchKeyEvent", { type, key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
          await dormir(60);
          const r = JSON.parse(await c.evaluar(`(() => { const e = document.activeElement; if (!e || e === document.body) return JSON.stringify({ fin: true }); const o = e.matches('input[type=radio]') ? e.nextElementSibling : e; const cs = getComputedStyle(o); return JSON.stringify({ el: e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + ' ' + (e.getAttribute('aria-label') || e.textContent.trim()).slice(0, 28), estilo: cs.outlineStyle, ancho: cs.outlineWidth }); })()`));
          if (r.fin || vistos.includes(r.el)) break;
          vistos.push(r.el); paradas++;
          if (!(r.estilo === "solid" && r.ancho === "2px")) { malas++; console.log(`  FAIL ${m} ${e}: «${r.el}» sin anillo de 2 px (${r.estilo} ${r.ancho})`); }
        }
        console.log(`${m.padEnd(9)} ${e}: ${vistos.length} controles recorridos con Tab`);
      }
      console.log(`\nFoco: ${paradas} paradas, ${malas} sin anillo sólido de 2 px`);
      codigo = malas || !paradas ? 1 : 0;
    } finally { await c.cerrar(); }
  } else if (modo === "contraste") {
    // Contraste medido sobre los píxeles: por tamaño × modo × estado, con el texto transparente se captura el fondo de cada línea de texto.
    const tamanos = args[0] ? JSON.parse(args[0]) : [[1920, 1080], [1440, 900], [1280, 720]];
    const ESTADOS = args[1] ? JSON.parse(args[1]) : ["1/1", "2/1", "2/2", "2/3", "2/4", "3/1", "4/1", "4/2", "4/3", "4/4", "4/5", "4/6", "4/7", "5/1", "5/2", "5/3", "6/1", "7/1", "7/2", "8/1", "9/1"].map((e) => "#/" + e); // 2.º argumento opcional: solo esos estados
    const c = await lanzar(1920, 1080);
    let total = 0, medidas = 0;
    try {
      for (const [w, h] of tamanos) for (const m of ["leer", "presentar"]) for (const e of ESTADOS) {
        await c.ir(`/${m === "presentar" ? "?modo=presentar" : ""}${e}`, w, h);
        await dormir(2800); // el mapa se monta y las transiciones terminan
        const items = await c.evaluar("import('/_qa/qa-calidad.js').then((q) => JSON.stringify(q.textosVisibles()))");
        await c.evaluar("import('/_qa/qa-calidad.js').then((q) => { q.ocultarTexto(); return 1; })");
        await dormir(250);
        const { data } = await c.cdp("Page.captureScreenshot", { format: "png" });
        const r = JSON.parse(await c.evaluar(`import('/_qa/qa-calidad.js').then((q) => q.analizar(${JSON.stringify("data:image/png;base64," + data)}, ${items}, ${w}, ${h})).then((r) => JSON.stringify(r))`, 120000));
        medidas += r.medidas; total += r.fallos.length;
        console.log(`${w}×${h} ${m.padEnd(9)} ${e}: ${r.medidas} líneas de texto, ${r.fallos.length} bajo el umbral`);
        for (const f of r.fallos) console.log(`    FAIL «${f.texto}» contraste p5 ${f.p5}:1 (mín ${f.min}) < ${f.umbral}:1 · ${f.tam}px`);
      }
      console.log(`\nContraste sobre píxeles: ${medidas} líneas medidas, ${total} por debajo del umbral AA`);
      codigo = total ? 1 : 0;
    } finally { await c.cerrar(); }
  } else if (modo === "captura" || modo === "js") {
    const [ruta, tercero, cuarto, ancho = "1920", alto = "1080", espera = "1500", esquema] = modo === "captura" ? [args[0], args[1], null, args[2], args[3], args[4], args[5]] : [args[0], args[1], null, args[2], args[3], args[4]];
    const preparar = modo === "captura" ? args[6] : undefined; // JS opcional que se ejecuta antes de capturar (p. ej. pulsar teclas)
    const c = await lanzar(Number(ancho), Number(alto));
    try {
      await c.ir(ruta, Number(ancho), Number(alto));
      if (esquema) await c.cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: esquema }] });
      if (preparar) await c.evaluar(preparar);
      await dormir(Number(espera));
      if (modo === "captura") {
        const { data } = await c.cdp("Page.captureScreenshot", { format: "png" });
        writeFileSync(tercero, Buffer.from(data, "base64"));
        console.log(`captura ${tercero} (${ancho}×${alto})`);
      } else console.log(await c.evaluar(tercero));
      if (c.consola.length) console.log("Consola:", [...new Set(c.consola)].slice(0, 8).join(" | "));
    } finally { await c.cerrar(); }
  } else { console.log("Uso: prueba <modulo.js> [[w,h]] | captura <ruta> <salida.png> [w h espera] | js <ruta> <expresion> [w h espera]"); codigo = 2; }
} catch (e) { console.error("ERROR:", e.message); codigo = 1; }
process.exit(codigo);
