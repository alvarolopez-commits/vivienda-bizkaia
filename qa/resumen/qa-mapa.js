// Mapa 3D persistente y diapositiva 1 (Gancho). En el navegador, con el servidor en http://localhost:4180/ :
//   import('/_qa/qa-mapa.js').then(m => m.run()).then(r => window.__qaRes = r)
// Comprueba: los cinco estados del mapa (PASOS_MAPA) y que irA los aplica; el plan B en SVG sin WebGL (113 municipios);
// el texto literal de la diapositiva 1 y su acción; que el lienzo es uno solo y persiste al navegar.
import { abrir, tecla, TAMANOS } from "/_qa/qa-navegacion.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// Solo se pliegan espacios, tabuladores y saltos: el espacio duro (NBSP) del Resumen («55,8 %») debe conservarse tal cual
const norm = (s) => s.replace(/[ \t\r\n]+/g, " ").trim();

export async function run(tamanos = TAMANOS) {
  const res = [];
  const ok = (n, c, d = "") => res.push({ ok: !!c, n, d });
  const textos = await fetch("/_qa/textos.json").then((r) => r.json());

  // ---------- el módulo del mapa ----------
  const { montarMapa, PASOS_MAPA } = await import("/js/mapa3d.js");
  const { S } = await import("/original/js/territorio.js");
  const snap = () => JSON.stringify(Object.fromEntries(["cam", "wH", "wA", "wV", "wN", "lB", "lM"].map((k) => [k, S[k]]))); // S lleva propiedades de GSAP (circulares)
  const [resumen, geo] = await Promise.all(["resumen.json", "municipios.geojson"].map((f) => fetch("/original/data/" + f).then((r) => r.json())));

  ok("PASOS_MAPA: cinco estados con cámara 0..4", PASOS_MAPA.length === 5 && PASOS_MAPA.every((p, i) => p.cam === i), PASOS_MAPA.map((p) => p.cam));
  ok("PASOS_MAPA[0] = portada (wH=1)", PASOS_MAPA[0].wH === 1 && PASOS_MAPA[0].wA === 0 && PASOS_MAPA[0].lB === 0 && PASOS_MAPA[0].lM === 0, "");
  ok("PASOS_MAPA[1] = «34 de 35» (alquiler)", PASOS_MAPA[1].wA === 1 && PASOS_MAPA[1].wH === 0, "");
  ok("PASOS_MAPA[2] = Bilbao (alquiler + rótulo de Bilbao)", PASOS_MAPA[2].wA === 1 && PASOS_MAPA[2].lB === 1 && PASOS_MAPA[2].lM === 0, "");
  ok("PASOS_MAPA[3] = Mundaka (turísticas + rótulo de Mundaka)", PASOS_MAPA[3].wV === 1 && PASOS_MAPA[3].lM === 1 && PASOS_MAPA[3].lB === 0 && PASOS_MAPA[3].wA === 0, "");
  ok("PASOS_MAPA[4] = pueblos (viviendas vacías)", PASOS_MAPA[4].wN === 1 && PASOS_MAPA[4].lM === 0 && PASOS_MAPA[4].wV === 0, "");

  const host = Object.assign(document.createElement("div"), { style: "position:fixed;left:0;top:0;width:800px;height:500px;opacity:0;pointer-events:none" });
  document.body.append(host);
  const mapa = await montarMapa(host, { resumen, geo });
  ok("montarMapa devuelve irA, atenuar y plano", typeof mapa.irA === "function" && typeof mapa.atenuar === "function" && "plano" in mapa, Object.keys(mapa));
  const marco = host.closest(".scene");
  ok("el mapa queda dentro de un .scene.is-live (lo que territory() espera)", !!marco && marco.classList.contains("is-live"), "");
  const rot = [...(marco?.querySelectorAll(".terr-labels [data-l]") ?? [])].map((e) => [e.dataset.l, norm(e.textContent)]);
  ok("los rótulos de Bilbao y Mundaka son los del Resumen", JSON.stringify(rot) === JSON.stringify([["bilbao", textos.cifras.rotulos.bilbao], ["mundaka", textos.cifras.rotulos.mundaka]]), rot);
  const hayGL = !!document.createElement("canvas").getContext("webgl2") || !!document.createElement("canvas").getContext("webgl");
  if (hayGL) ok("con WebGL el mapa es un <canvas> (plano = false)", mapa.plano === false && !!host.querySelector("canvas"), mapa.plano);
  mapa.irA(2, { inmediato: true });
  ok("irA(2) → cámara 2 y rótulo de Bilbao", S.cam === 2 && S.lB === 1 && S.wA === 1, snap());
  mapa.irA(3, { inmediato: true });
  ok("irA(3) → cámara 3, rótulo de Mundaka, sin el de Bilbao", S.cam === 3 && S.lM === 1 && S.lB === 0 && S.wV === 1 && S.wA === 0, snap());
  mapa.irA(4, { inmediato: true });
  ok("irA(4) → cámara 4 y viviendas vacías", S.cam === 4 && S.wN === 1 && S.lM === 0, snap());
  mapa.irA(0, { inmediato: true });
  ok("irA(0) → portada", S.cam === 0 && S.wH === 1 && S.wN === 0, snap());
  mapa.irA(1);
  await sleep(1100);
  ok("irA(1) con movimiento llega a la cámara 1 en menos de 1,1 s", S.cam === 1 && S.wA === 1 && S.wH === 0, snap());
  mapa.irA(9, { inmediato: true });
  ok("irA con un índice inválido no cambia nada ni lanza", S.cam === 1, snap());
  mapa.atenuar(true);
  ok("atenuar(true) marca el marco", marco.classList.contains("atenuado"), "");
  mapa.atenuar(false);
  ok("atenuar(false) lo quita", !marco.classList.contains("atenuado"), "");
  ok("sin .scene propio, montarMapa envuelve el host sin tocar el <body>", !document.body.classList.contains("scene") && marco !== document.body, "");
  marco.remove();

  // ---------- plan B: sin WebGL ----------
  const getContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (tipo, ...r) { return /webgl/.test(tipo) ? null : getContext.call(this, tipo, ...r); };
  const host2 = Object.assign(document.createElement("div"), { style: "position:fixed;left:0;top:0;width:800px;height:500px;opacity:0;pointer-events:none" });
  document.body.append(host2);
  let error = null, mapa2 = null;
  try { mapa2 = await montarMapa(host2, { resumen, geo }); mapa2.irA(3, { inmediato: true }); mapa2.irA(0); } catch (e) { error = String(e); }
  HTMLCanvasElement.prototype.getContext = getContext;
  ok("sin WebGL: montarMapa no lanza", !error && !!mapa2, error);
  ok("sin WebGL: plano === true", mapa2?.plano === true, mapa2?.plano);
  const svg = host2.querySelector("svg[role=img]");
  ok("sin WebGL: el plan B es un SVG con 113 municipios", !!svg && svg.querySelectorAll("path").length === 113, svg?.querySelectorAll("path").length);
  (host2.closest(".scene") ?? host2).remove();

  // ---------- la diapositiva 1 en la página ----------
  for (const [w, h] of tamanos) {
    const T = `${w}×${h}`;
    const f = await abrir("/#/1/1", w, h);
    const win = f.contentWindow, doc = f.contentDocument;
    await sleep(400);
    const gancho = doc.querySelector('[data-diapositiva="gancho"]');
    const visible = norm(gancho?.innerText ?? "");
    const g = textos.gancho;
    ok(`${T} · el titular es «${g.titular}» en un h1`, norm(gancho?.querySelector("h1")?.textContent ?? "") === g.titular, gancho?.querySelector("h1")?.textContent);
    ok(`${T} · solo hay un h1 visible en la página`, [...doc.querySelectorAll("h1")].filter((x) => x.checkVisibility()).length === 1, [...doc.querySelectorAll("h1")].filter((x) => x.checkVisibility()).length);
    ok(`${T} · el texto de apoyo es el del Resumen`, visible.includes(g.lead), visible);
    const cta = gancho?.querySelector("a");
    ok(`${T} · la acción «${g.accion}» es un enlace a #/3/1`, !!cta && norm(cta.textContent).startsWith(g.accion) && cta.getAttribute("href") === "#/3/1", cta?.outerHTML);
    ok(`${T} · el mapa está fuera de la diapositiva (persistente)`, !!doc.querySelector("#mapa") && !gancho.contains(doc.querySelector("#mapa")), "");
    ok(`${T} · hay un único contenedor del mapa`, doc.querySelectorAll(".terr-map").length === 1, doc.querySelectorAll(".terr-map").length);
    const lienzo = doc.querySelector("#mapa canvas, #mapa svg");
    ok(`${T} · el mapa se monta (canvas o SVG)`, !!lienzo, "");
    tecla(win, "ArrowRight"); await sleep(150); tecla(win, "ArrowRight"); await sleep(150); tecla(win, "Home"); await sleep(150);
    ok(`${T} · el lienzo es el mismo tras navegar y volver`, doc.querySelector("#mapa canvas, #mapa svg") === lienzo, "");
    cta.click(); await sleep(150);
    ok(`${T} · la acción lleva a #/3/1`, win.location.hash === "#/3/1", win.location.hash);
    f.remove();
  }

  const fallos = res.filter((r) => !r.ok);
  return { pass: res.length - fallos.length, fail: fallos.length, detalles: fallos };
}
