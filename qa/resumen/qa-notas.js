// Notas del orador (propuesta, solo en Presentar). En el navegador, con el servidor en http://localhost:4180/ :
//   import('/_qa/qa-notas.js').then(m => m.run()).then(r => window.__qaRes = r)
// Comprueba: que ninguna cifra de las notas es inventada (cada una sale de textos.json), el contenido por estado, y el panel
// (marcado como propuesta, se abre con N solo en Presentar, se actualiza al navegar y no cambia de diapositiva).
import { abrir, tecla, TAMANOS } from "/_qa/qa-navegacion.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => s.replace(/[ \t\r\n]+/g, " ").trim();

export async function run(tamanos = TAMANOS) {
  const res = [];
  const ok = (n, c, d = "") => res.push({ ok: !!c, n, d });
  const textos = await fetch("/_qa/textos.json").then((r) => r.json());
  const corpus = [];
  (function aplanar(x) { if (typeof x === "string") corpus.push(x.replace(/ /g, " ")); else if (x && typeof x === "object") Object.values(x).forEach(aplanar); })(textos);
  const texto = corpus.join(" \n ");
  const { NOTAS, textoNotas } = await import("/js/notas.js");

  // ---------- ninguna cifra inventada ----------
  const numeros = (s) => s.match(/\d+(?:[.,]\d+)*/g) ?? [];
  const sinOrigen = [];
  for (const [clave, notas] of Object.entries(NOTAS)) {
    for (const nota of notas) for (const n of numeros(nota)) {
      const esc = n.replace(/[.,]/g, (c) => `\\${c}`);
      if (!new RegExp(`(?<![\\d.,])${esc}(?![\\d])`).test(texto)) sinOrigen.push([clave, n]);
    }
  }
  ok("cada cifra de las notas aparece en el texto del Resumen (textos.json)", sinOrigen.length === 0, sinOrigen);
  const { DIAPOSITIVAS } = await import("/js/estado.js");
  ok("NOTAS tiene las claves 1 a 9", DIAPOSITIVAS.every((_, i) => Array.isArray(NOTAS[i + 1])), Object.keys(NOTAS));
  const mal = DIAPOSITIVAS.filter((d, i) => (d.pasos > 1 ? NOTAS[i + 1].length !== d.pasos : NOTAS[i + 1].length < 2 || NOTAS[i + 1].length > 3)).map((d) => d.id);
  ok("las diapositivas de varios pasos llevan una nota por paso y las de un paso, dos o tres frases", mal.length === 0, mal);
  ok("ninguna nota nombra BM30", Object.values(NOTAS).flat().every((n) => !/BM30/i.test(n)), "");
  ok("textoNotas({d:2,p:3}) habla de Mundaka y de 47,1", textoNotas({ d: 2, p: 3 }).join(" ").includes("47,1") && /Mundaka/.test(textoNotas({ d: 2, p: 3 }).join(" ")), textoNotas({ d: 2, p: 3 }));
  ok("textoNotas({d:2,p:1}) habla de 34 de 35", textoNotas({ d: 2, p: 1 }).join(" ").includes("34 de 35"), textoNotas({ d: 2, p: 1 }));
  ok("textoNotas({d:2,p:2}) habla de Bilbao y 55,8", /Bilbao/.test(textoNotas({ d: 2, p: 2 }).join(" ")) && textoNotas({ d: 2, p: 2 }).join(" ").includes("55,8"), "");
  ok("textoNotas de la 1 y la 3 devuelve todas sus frases", textoNotas({ d: 1, p: 1 }).length === NOTAS[1].length && textoNotas({ d: 3, p: 1 }).length === NOTAS[3].length, "");
  ok("textoNotas({d:2,p:4}) devuelve una sola nota", textoNotas({ d: 2, p: 4 }).length === 1, "");

  // ---------- el panel ----------
  for (const [w, h] of tamanos) {
    const T = `${w}×${h}`;
    const f = await abrir("/?modo=presentar#/2/1", w, h);
    const win = f.contentWindow, doc = f.contentDocument;
    const panel = () => doc.querySelector("#notas");
    const cuerpo = () => norm(doc.querySelector("[data-notas-texto]")?.innerText ?? "");
    ok(`${T} · el panel está marcado como propuesta con el aviso visible`, panel().hasAttribute("data-propuesta") && /Propuesta/.test(panel().textContent), "");
    tecla(win, "n"); await sleep(100);
    ok(`${T} · en #/2/1 las notas son las del paso 1`, !panel().hidden && textoNotas({ d: 2, p: 1 }).every((n) => cuerpo().includes(norm(n))), cuerpo());
    tecla(win, "ArrowRight"); await sleep(250); tecla(win, "ArrowRight"); await sleep(250);
    ok(`${T} · con el panel abierto, al ir a #/2/3 el texto cambia a las notas del paso 3 (47,1)`, win.location.hash === "#/2/3" && cuerpo().includes("47,1") && !cuerpo().includes("34 de 35"), [win.location.hash, cuerpo()]);
    win.location.hash = "#/3/1"; await sleep(250);
    ok(`${T} · en #/3/1 las notas son las de la calculadora`, textoNotas({ d: 3, p: 1 }).every((n) => cuerpo().includes(norm(n))), cuerpo());
    tecla(win, "Home"); await sleep(250);
    ok(`${T} · en #/1/1 las notas son las del gancho`, textoNotas({ d: 1, p: 1 }).every((n) => cuerpo().includes(norm(n))), cuerpo());
    tecla(win, "Escape"); await sleep(100);
    ok(`${T} · Escape cierra el panel sin cambiar de diapositiva`, panel().hidden && win.location.hash === "#/1/1", [panel().hidden, win.location.hash]);
    ok(`${T} · el panel de notas no desborda la pantalla`, (() => { tecla(win, "n"); const r = panel().getBoundingClientRect(); return r.left >= 0 && r.right <= w && r.top >= 0 && r.bottom <= h; })(), "");
    f.remove();
  }
  const fallos = res.filter((r) => !r.ok);
  return { pass: res.length - fallos.length, fail: fallos.length, detalles: fallos };
}
