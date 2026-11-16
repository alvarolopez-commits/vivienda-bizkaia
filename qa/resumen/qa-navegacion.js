// Navegación, modos, notas y pantalla completa. En el navegador, con el servidor en http://localhost:4180/ :
//   window.__qaRes = null; import('/_qa/qa-navegacion.js').then(m => m.run()).then(r => window.__qaRes = r)
// Cada escenario se abre en un iframe del tamaño pedido (1920×1080, 1440×900, 1280×720), así que no hace falta redimensionar la ventana.
// Comprueba: dirección al abrir; recorrido con teclado y límites; teclas ignoradas dentro de campos y diálogos; modos y su intensidad de
// movimiento; notas; rueda y scroll sin efecto; pantalla completa rechazada; Atrás/Adelante; direcciones inválidas; botones.

export const TAMANOS = [[1920, 1080], [1440, 900], [1280, 720]];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Abre la página en un iframe de w×h y espera a que la presentación esté lista (body[data-listo]). */
export async function abrir(url, w, h) {
  const f = document.createElement("iframe");
  f.style.cssText = `position:fixed;left:0;top:0;width:${w}px;height:${h}px;border:0;opacity:0;pointer-events:none;z-index:-1`;
  f.src = url;
  document.body.append(f);
  await new Promise((r) => (f.onload = r));
  for (let i = 0; i < 200 && !f.contentDocument.body?.dataset.listo; i++) await sleep(50);
  return f;
}

/** Pulsa una tecla en el elemento dado (o en el documento) como lo haría el teclado. */
export function tecla(win, key, destino = null, extra = {}) {
  const t = destino ?? win.document;
  t.dispatchEvent(new win.KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...extra }));
}

export async function run(tamanos = TAMANOS) {
  const res = [];
  const ok = (n, c, d = "") => res.push({ ok: !!c, n, d });

  for (const [w, h] of tamanos) {
    const T = `${w}×${h}`;
    let f = await abrir("/", w, h);
    let win = f.contentWindow, doc = f.contentDocument;
    const hash = () => win.location.hash;
    const activas = () => [...doc.querySelectorAll("[data-diapositiva][data-estado='activa']")];
    const espera = () => sleep(60);

    // (a) al abrir, la dirección es #/1/1 y hay una sola diapositiva activa
    ok(`${T} · al abrir la dirección es #/1/1`, hash() === "#/1/1", hash());
    ok(`${T} · hay exactamente una diapositiva activa (la 1)`, activas().length === 1 && activas()[0].dataset.diapositiva === "gancho", activas().map((a) => a.dataset.diapositiva));
    ok(`${T} · modo por defecto = leer y movimiento restrained`, doc.body.dataset.modo === "leer" && doc.body.dataset.motion === "restrained", [doc.body.dataset.modo, doc.body.dataset.motion]);
    ok(`${T} · cabecera con la marca y controles accesibles`, !!doc.querySelector("header [data-marca]") && ["anterior", "siguiente", "modo", "notas"].every((a) => doc.querySelector(`[data-accion="${a}"]`)?.getAttribute("aria-label")), "");
    ok(`${T} · región de estado role=status para los anuncios`, doc.querySelector("[data-anuncio]")?.getAttribute("role") === "status", "");
    ok(`${T} · cabe en la pantalla sin desborde`, doc.documentElement.scrollWidth <= w && doc.documentElement.scrollHeight <= h, [doc.documentElement.scrollWidth, doc.documentElement.scrollHeight]);

    // (b) recorrido con la flecha derecha y límite final
    const vistos = [hash()];
    for (let i = 0; i < 5; i++) { tecla(win, "ArrowRight"); await espera(); vistos.push(hash()); }
    ok(`${T} · → ×5 recorre #/1/1 … #/3/1`, vistos.join(" ") === "#/1/1 #/2/1 #/2/2 #/2/3 #/2/4 #/3/1", vistos.join(" "));
    tecla(win, "ArrowRight"); await espera();
    ok(`${T} · un → más pasa a #/4/1`, hash() === "#/4/1", hash());
    ok(`${T} · el indicador dice «Diapositiva 4 de 9 · Paso 1 de 7»`, /Diapositiva 4 de 9\s*·\s*Paso 1 de 7/.test(doc.querySelector("[data-progreso]")?.textContent ?? ""), doc.querySelector("[data-progreso]")?.textContent);

    // (c) flecha izquierda: vuelve entrando por el último paso
    tecla(win, "ArrowLeft"); await espera();
    ok(`${T} · ← desde #/4/1 vuelve a #/3/1`, hash() === "#/3/1", hash());
    tecla(win, "ArrowLeft"); await espera();
    ok(`${T} · ← desde #/3/1 entra en la 2 por su último paso, #/2/4`, hash() === "#/2/4", hash());
    for (const k of ["Home"]) { tecla(win, k); await espera(); }
    ok(`${T} · Inicio → #/1/1`, hash() === "#/1/1", hash());
    tecla(win, "End"); await espera();
    ok(`${T} · Fin → #/9/1`, hash() === "#/9/1", hash());
    tecla(win, "PageUp"); await espera();
    ok(`${T} · RePág retrocede`, hash() === "#/8/1", hash());
    tecla(win, "PageDown"); await espera();
    ok(`${T} · AvPág avanza`, hash() === "#/9/1", hash());
    tecla(win, " "); await espera();
    ok(`${T} · Espacio en la última no cambia nada`, hash() === "#/9/1", hash());
    tecla(win, "Home"); await espera();
    tecla(win, " "); await espera();
    ok(`${T} · Espacio avanza`, hash() === "#/2/1", hash());

    // (d) teclas ignoradas con el foco en un campo, un selector, un botón de formulario o un diálogo abierto
    tecla(win, "Home"); await espera();
    const campo = doc.createElement("input"); campo.type = "number"; campo.id = "qa-campo"; doc.body.append(campo); campo.focus();
    for (const k of ["ArrowLeft", "ArrowRight", " ", "PageDown", "Home", "End", "n", "p", "l"]) tecla(win, k, campo);
    await espera();
    ok(`${T} · con el foco en un <input> ninguna tecla cambia diapositiva, notas ni modo`, hash() === "#/1/1" && doc.body.dataset.modo === "leer" && doc.querySelector("#notas")?.hidden !== false, [hash(), doc.body.dataset.modo]);
    campo.remove();
    const sel = doc.createElement("select"); sel.innerHTML = "<option>a</option>"; doc.body.append(sel); sel.focus();
    tecla(win, "ArrowRight", sel); await espera();
    ok(`${T} · con el foco en un <select> → no navega`, hash() === "#/1/1", hash());
    sel.remove();
    const dlg = doc.createElement("dialog"); dlg.innerHTML = "<p>qa</p><button>ok</button>"; doc.body.append(dlg); dlg.showModal();
    tecla(win, "ArrowRight", dlg.querySelector("button")); await espera();
    ok(`${T} · con un <dialog> abierto → no navega`, hash() === "#/1/1", hash());
    dlg.close(); dlg.remove();

    // (f) notas
    const notas = () => doc.querySelector("#notas");
    ok(`${T} · el panel de notas existe, cerrado, con aria-label y data-propuesta`, !!notas() && notas().hidden === true && notas().getAttribute("aria-label") === "Notas del orador" && notas().hasAttribute("data-propuesta"), "");
    // Las notas del orador son solo de Presentar (spec §6.3): en Leer no se ven ni se abren
    tecla(win, "n"); await espera();
    ok(`${T} · en Leer la tecla N no abre las notas`, notas()?.hidden === true, "");
    ok(`${T} · en Leer el botón Notas no se ve`, doc.querySelector('[data-accion="notas"]')?.offsetParent === null, "");

    // (g) rueda y scroll
    doc.querySelector("#escenario").dispatchEvent(new win.WheelEvent("wheel", { deltaY: 600, bubbles: true, cancelable: true }));
    win.scrollBy(0, 400); await sleep(150);
    ok(`${T} · la rueda y el scroll no cambian de diapositiva`, hash() === "#/1/1", hash());

    // botones
    doc.querySelector('[data-accion="siguiente"]')?.click(); await espera();
    ok(`${T} · el botón siguiente avanza`, hash() === "#/2/1", hash());
    doc.querySelector('[data-accion="anterior"]')?.click(); await espera();
    ok(`${T} · el botón anterior retrocede`, hash() === "#/1/1", hash());

    // (i) Atrás / Adelante
    tecla(win, "ArrowRight"); await espera(); tecla(win, "ArrowRight"); await espera();
    win.history.back(); await sleep(150);
    ok(`${T} · Atrás del navegador restaura #/2/1 y su diapositiva`, hash() === "#/2/1" && activas()[0]?.dataset.diapositiva === "cifras", hash());
    win.history.forward(); await sleep(150);
    ok(`${T} · Adelante restaura #/2/2 y el indicador «Paso 2 de 4»`, hash() === "#/2/2" && /Paso 2 de 4/.test(doc.querySelector("[data-progreso]")?.textContent ?? ""), hash());
    f.remove();

    // direcciones inválidas: caen en un estado válido y se normalizan
    for (const [entrada, esperado] of [["#/9/9", "#/9/1"], ["#/10", "#/9/1"], ["#/0", "#/1/1"], ["#/2/9", "#/2/4"], ["#/4/9", "#/4/7"], ["#/abc", "#/1/1"], ["#/1/4", "#/1/1"]]) {
      f = await abrir("/" + entrada, w, h);
      ok(`${T} · abrir ${entrada} → ${esperado}`, f.contentWindow.location.hash === esperado && f.contentDocument.querySelectorAll("[data-diapositiva][data-estado='activa']").length === 1, f.contentWindow.location.hash);
      f.remove();
    }

    // (e) modo presentar por la dirección, y cambios de modo con las teclas
    f = await abrir("/?modo=presentar#/2/2", w, h); win = f.contentWindow; doc = f.contentDocument;
    ok(`${T} · ?modo=presentar → data-modo=presentar y data-motion=expressive`, doc.body.dataset.modo === "presentar" && doc.body.dataset.motion === "expressive", [doc.body.dataset.modo, doc.body.dataset.motion]);
    ok(`${T} · ?modo=presentar respeta la dirección #/2/2`, win.location.hash === "#/2/2", win.location.hash);
    tecla(win, "l"); await espera();
    ok(`${T} · L vuelve a leer (restrained)`, doc.body.dataset.modo === "leer" && doc.body.dataset.motion === "restrained", [doc.body.dataset.modo, doc.body.dataset.motion]);
    tecla(win, "p"); await espera();
    ok(`${T} · P pasa a presentar (expressive)`, doc.body.dataset.modo === "presentar" && doc.body.dataset.motion === "expressive", [doc.body.dataset.modo, doc.body.dataset.motion]);
    ok(`${T} · cambiar de modo no cambia de diapositiva`, win.location.hash === "#/2/2", win.location.hash);

    // notas (solo en Presentar)
    const panel = () => doc.querySelector("#notas");
    ok(`${T} · en Presentar el botón Notas se ve`, doc.querySelector('[data-accion="notas"]')?.offsetParent !== null, "");
    tecla(win, "n"); await espera();
    ok(`${T} · N abre las notas en Presentar`, panel()?.hidden === false, "");
    ok(`${T} · abrir las notas no cambia de diapositiva`, win.location.hash === "#/2/2", win.location.hash);
    tecla(win, "Escape"); await espera();
    ok(`${T} · Escape cierra las notas y no cambia de diapositiva`, panel()?.hidden === true && win.location.hash === "#/2/2", [panel()?.hidden, win.location.hash]);
    tecla(win, "n"); await espera(); tecla(win, "l"); await espera();
    ok(`${T} · al pasar a Leer las notas abiertas se cierran`, panel()?.hidden === true, "");
    tecla(win, "p"); await espera();

    // (h) pantalla completa rechazada: no lanza y se mantiene el modo
    let error = null;
    win.addEventListener("error", (e) => (error = e.message));
    win.addEventListener("unhandledrejection", (e) => (error = String(e.reason)));
    win.document.documentElement.requestFullscreen = () => Promise.reject(new Error("rechazada"));
    tecla(win, "l"); await espera(); tecla(win, "p"); await sleep(150);
    ok(`${T} · con la pantalla completa rechazada no hay error y sigue en presentar`, !error && doc.body.dataset.modo === "presentar", error);
    f.remove();
  }

  const fallos = res.filter((r) => !r.ok);
  return { pass: res.length - fallos.length, fail: fallos.length, detalles: fallos };
}
