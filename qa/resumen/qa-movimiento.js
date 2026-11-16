// Movimiento entre diapositivas y pasos (DCI §9, animate.md). Necesita un navegador que pinte (requestAnimationFrame): usar
//   node presentacion/_qa/correr.mjs prueba qa-movimiento.js            (y de nuevo con «… "" reduce» para «reducir movimiento»)
// Comprueba: duraciones y curva de la transición (entrada 420 ms, salida 240 ms en expressive; fundido de 240 ms en restrained),
// que solo se animan transform y opacity, que pulsaciones rápidas dejan el estado final limpio, la ruta de movimiento reducido,
// que «quieto» no anima, el momento firma (700 ms) solo en expressive, el refresco de la cifra, will-change y que no hay View Transitions.
import { abrir, tecla, TAMANOS } from "/_qa/qa-navegacion.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const EASE_IN = "cubic-bezier(0.16, 1, 0.3, 1)";
const SOLO = new Set(["offset", "easing", "composite", "computedOffset", "opacity", "transform"]);

export async function run(tamanos = TAMANOS) {
  const res = [];
  const ok = (n, c, d = "") => res.push({ ok: !!c, n, d });
  const reducido = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const R = reducido ? " [movimiento reducido]" : "";

  // ---------- el código: nada de View Transitions ni bucles propios ----------
  const fuentes = await Promise.all(["/js/app.js", "/js/movimiento.js", "/css/presentacion.css", "/js/mapa3d.js"].map((u) => fetch(u).then((r) => r.text())));
  ok("no hay View Transitions (startViewTransition / view-transition) en el código propio", fuentes.every((t) => !/startViewTransition|view-transition/.test(t)), "");
  ok("movimiento.js no usa requestAnimationFrame ni setInterval (sin bucles propios)", !/requestAnimationFrame|setInterval/.test(fuentes[1]), "");
  const territorio = await fetch("/original/js/territorio.js").then((r) => r.text());
  ok("el bucle del mapa se detiene fuera de pantalla (IntersectionObserver del módulo original)", /IntersectionObserver/.test(territorio) && /if \(!visible/.test(territorio), "");

  for (const [w, h] of tamanos) {
    const T = `${w}×${h}${R}`;

    // ---------- expressive (Presentar) ----------
    let f = await abrir("/?modo=presentar#/1/1", w, h);
    let win = f.contentWindow, doc = f.contentDocument;
    await sleep(1200);
    const anims = () => doc.getAnimations().filter((a) => a.effect?.target && doc.querySelector("#escenario").contains(a.effect.target));
    const t0 = win.performance.now();
    tecla(win, "ArrowRight");
    await sleep(40);
    const vivas = anims();
    const entrada = vivas.find((a) => a.effect.target.dataset?.diapositiva === "cifras");
    const salida = vivas.find((a) => a.effect.target.dataset?.diapositiva === "gancho");
    const dEnt = entrada?.effect.getTiming().duration, dSal = salida?.effect.getTiming().duration;
    if (!reducido) {
      ok(`${T} · expressive: la entrada dura 420 ms y la salida 240 ms (más rápida)`, dEnt === 420 && dSal === 240, [dEnt, dSal]);
      ok(`${T} · expressive: la entrada usa la curva ${EASE_IN} y la salida es más rápida`, entrada?.effect.getTiming().easing === EASE_IN && dSal < dEnt, entrada?.effect.getTiming().easing);
    } else {
      ok(`${T} · reducido: solo fundido, de 240 ms (no 420)`, dEnt === 240 && dSal === 240, [dEnt, dSal]);
    }
    const props = new Set(vivas.flatMap((a) => a.effect.getKeyframes().flatMap((k) => Object.keys(k))));
    ok(`${T} · solo se animan transform y opacity`, vivas.length >= 2 && [...props].every((p) => SOLO.has(p)), [...props]);
    const dx = (() => { const t = entrada?.effect.getKeyframes()[0]?.transform ?? "none"; const m = /translateX\((-?[\d.]+)px\)/.exec(t); return m ? Math.abs(Number(m[1])) : 0; })();
    ok(`${T} · desplazamiento ${reducido ? "0 px (reducido)" : "de 16 px (expressive)"}`, reducido ? dx === 0 : dx === 16, dx);
    ok(`${T} · la cabecera y el indicador no se animan (continuidad)`, doc.querySelector("header").getAnimations({ subtree: true }).filter((a) => a.effect.target.closest("header") && a.transitionProperty === undefined && !(a instanceof win.CSSTransition)).length === 0, "");
    if (entrada) { await entrada.finished.catch(() => {}); }
    const dt = win.performance.now() - t0;
    ok(`${T} · la transición completa tarda entre ${reducido ? "240" : "420"} y ${reducido ? "400" : "600"} ms`, dt >= (reducido ? 230 : 410) && dt <= (reducido ? 400 : 700), Math.round(dt));
    await sleep(100);
    const estados = [...doc.querySelectorAll("[data-diapositiva]")].map((s) => s.dataset.estado);
    ok(`${T} · al terminar: una activa y todas las demás inactivas (ninguna «saliendo»)`, estados.filter((e) => e === "activa").length === 1 && estados.filter((e) => e === "inactiva").length === estados.length - 1, estados);
    ok(`${T} · will-change vuelve a auto al terminar`, [...doc.querySelectorAll("[data-diapositiva]")].every((s) => win.getComputedStyle(s).willChange === "auto"), [...doc.querySelectorAll("[data-diapositiva]")].map((s) => win.getComputedStyle(s).willChange));

    // refresco de la cifra al cambiar de paso (240 ms)
    tecla(win, "ArrowRight"); await sleep(40);
    const tick = anims().find((a) => a.effect.target.classList?.contains("cifra") && a.effect.getTiming().duration === 240);
    ok(`${T} · el cambio de paso refresca la cifra actual con una animación de 240 ms`, !!tick, anims().map((a) => [a.effect.target.className, a.effect.getTiming().duration]));
    await sleep(500);

    // pulsaciones rápidas: Inicio y cinco flechas en 400 ms → estado final limpio
    tecla(win, "Home"); await sleep(700);
    for (let i = 0; i < 5; i++) { tecla(win, "ArrowRight"); await sleep(70); }
    await sleep(1000);
    const act = [...doc.querySelectorAll("[data-diapositiva][data-estado='activa']")];
    const cs = act[0] && win.getComputedStyle(act[0]);
    ok(`${T} · cinco → en 350 ms terminan en #/3/1 con una sola diapositiva, opaca y sin transform`, win.location.hash === "#/3/1" && act.length === 1 && act[0].dataset.diapositiva === "calculadora" && cs.opacity === "1" && (cs.transform === "none" || cs.transform === "matrix(1, 0, 0, 1, 0, 0)"), [win.location.hash, act.length, cs?.opacity, cs?.transform]);
    ok(`${T} · no queda ninguna animación de diapositiva en marcha`, anims().filter((a) => a.playState === "running" && a.effect.target.dataset?.diapositiva).length === 0, anims().map((a) => a.playState));
    f.remove();

    // momento firma: solo con expressive
    for (const [modo, esperado] of [["presentar", true], ["leer", false]]) {
      const g = await abrir(modo === "presentar" ? "/?modo=presentar#/1/1" : "/#/1/1", w, h);
      const d = g.contentDocument;
      let firma = false;
      for (let i = 0; i < 30 && !firma; i++) { firma = d.getAnimations().some((a) => a.effect?.target?.closest?.(".gancho") && a.effect.getTiming().duration === 700); await sleep(30); }
      ok(`${T} · momento firma de 700 ms en el gancho ${esperado ? "con" : "sin"} expressive (${modo})`, reducido ? !firma : firma === esperado, firma);
      g.remove();
    }

    // quieto: ?mov=quieto → sin animaciones de vista
    const q = await abrir("/?mov=quieto#/1/1", w, h);
    tecla(q.contentWindow, "ArrowRight"); await sleep(30);
    const dq = q.contentDocument;
    ok(`${T} · ?mov=quieto: la transición es inmediata y no crea animaciones`, dq.getAnimations().filter((a) => a.effect?.target && dq.querySelector("#escenario").contains(a.effect.target) && !(a instanceof q.contentWindow.CSSTransition)).length === 0 && q.contentWindow.location.hash === "#/2/1" && dq.querySelectorAll("[data-diapositiva][data-estado='activa']").length === 1, "");
    q.remove();
  }
  const fallos = res.filter((r) => !r.ok);
  return { pass: res.length - fallos.length, fail: fallos.length, detalles: fallos };
}
