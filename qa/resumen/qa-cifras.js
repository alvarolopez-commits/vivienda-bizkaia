// Diapositiva 2 · Las cuatro cifras sobre el mapa. En el navegador, con el servidor en http://localhost:4180/ :
//   import('/_qa/qa-cifras.js').then(m => m.run()).then(r => window.__qaRes = r)
// Comprueba, por paso y por modo: el texto literal del Resumen (cifra, titular, fuente y etiqueta), el estado del mapa, la foto y su pie,
// que en Leer se ven las cuatro cifras y se eligen con un clic y en Presentar solo la actual en grande, y el panel de créditos.
import { abrir, tecla, TAMANOS } from "/_qa/qa-navegacion.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => s.replace(/[ \t\r\n]+/g, " ").trim(); // no pliega el NBSP: debe coincidir con el Resumen
const CLAVES = ["cam", "wH", "wA", "wV", "wN", "lB", "lM"];

export async function run(tamanos = TAMANOS) {
  const res = [];
  const ok = (n, c, d = "") => res.push({ ok: !!c, n, d });
  const textos = await fetch("/_qa/textos.json").then((r) => r.json());
  const { PASOS_MAPA } = await import("/js/mapa3d.js");
  const C = textos.cifras;

  for (const [w, h] of tamanos) {
    const T = `${w}×${h}`;
    for (const modo of ["leer", "presentar"]) {
      const M = `${T} ${modo}`;
      const f = await abrir(modo === "leer" ? "/#/2/1" : "/?modo=presentar#/2/1", w, h);
      const win = f.contentWindow, doc = f.contentDocument;
      const estadoMapa = () => win.eval("import('/original/js/territorio.js').then(m => JSON.stringify(Object.fromEntries(" + JSON.stringify(CLAVES) + ".map((k) => [k, m.S[k]]))))");
      await sleep(900);
      const slide = () => doc.querySelector('[data-diapositiva="cifras"]');

      for (let p = 1; p <= 4; p++) {
        win.location.hash = `#/2/${p}`;
        await sleep(1100); // el mapa tarda 0,7 s en cambiar de dato
        const paso = C.pasos[p - 1];
        const visible = norm(slide()?.innerText ?? "");
        ok(`${M} · paso ${p}: la cifra «${paso.num}» es la del Resumen`, visible.includes(paso.num), visible.slice(0, 160));
        ok(`${M} · paso ${p}: el titular es el del Resumen`, visible.includes(paso.titular), "");
        ok(`${M} · paso ${p}: la fuente y la etiqueta «${paso.etiqueta}» son las del Resumen`, visible.includes(paso.meta), visible.slice(-200));
        const s = JSON.parse(await estadoMapa());
        const e = PASOS_MAPA[p];
        ok(`${M} · paso ${p}: el mapa está en el estado ${p}`, CLAVES.every((k) => Math.abs(s[k] - e[k]) < 0.01), JSON.stringify(s));

        const fotos = [...slide().querySelectorAll("figure")].filter((x) => !x.hidden && x.offsetParent !== null);
        if (p === 1) ok(`${M} · paso 1: sin foto`, fotos.length === 0, fotos.length);
        else {
          const foto = paso.foto;
          const img = fotos[0]?.querySelector("img");
          ok(`${M} · paso ${p}: una sola foto, «${foto.pie}», con su alt y cargada`, fotos.length === 1 && norm(fotos[0].querySelector("figcaption")?.textContent ?? "") === foto.pie && img?.getAttribute("alt") === foto.alt && img.complete && img.naturalWidth > 0, [fotos.length, fotos[0]?.querySelector("figcaption")?.textContent, img?.alt, img?.naturalWidth]);
        }
        const items = [...slide().querySelectorAll(".cifra")];
        const actual = items.filter((i) => i.getAttribute("aria-current") === "step");
        ok(`${M} · paso ${p}: exactamente un elemento marcado como actual y es el ${p}`, actual.length === 1 && actual[0].dataset.b === String(p), actual.map((a) => a.dataset.b));
        const vis = items.filter((i) => i.offsetParent !== null);
        if (modo === "leer") ok(`${M} · paso ${p}: se ven las cuatro cifras`, vis.length === 4 && C.pasos.every((q) => norm(slide().innerText).includes(q.num)), vis.length);
        else {
          const otras = C.pasos.filter((_, i) => i !== p - 1).map((q) => q.num);
          ok(`${M} · paso ${p}: solo se ve la cifra actual y en grande (≥ 64 px)`, vis.length === 1 && otras.every((n) => !norm(slide().innerText).includes(n)) && parseFloat(win.getComputedStyle(vis[0].querySelector(".num")).fontSize) >= 64, [vis.length, win.getComputedStyle(vis[0]?.querySelector(".num") ?? doc.body).fontSize]);
        }
      }

      ok(`${M} · un único h1 en la página (el de esta diapositiva, solo para lectores de pantalla)`, [...doc.querySelectorAll("h1")].filter((x) => x.checkVisibility()).length === 1 && slide().querySelector("h1.sr-only"), [...doc.querySelectorAll("h1")].filter((x) => x.checkVisibility()).length);
      ok(`${M} · la diapositiva cabe sin desplazarse`, slide().scrollHeight <= slide().clientHeight + 1, [slide().scrollHeight, slide().clientHeight]);

      if (modo === "leer") {
        doc.querySelector('.cifra[data-b="3"] button')?.click();
        await sleep(200);
        ok(`${M} · un clic en la 3.ª cifra lleva a #/2/3`, win.location.hash === "#/2/3", win.location.hash);
      }

      // créditos
      const boton = slide().querySelector('[data-abre="creditos"]');
      ok(`${M} · el enlace «${C.creditos.titulo}» existe`, !!boton && norm(boton.textContent).startsWith(C.creditos.titulo), boton?.textContent);
      boton?.focus(); boton?.click(); await sleep(150);
      const dlg = doc.querySelector("dialog#creditos");
      const t = norm(dlg?.innerText ?? "");
      ok(`${M} · créditos: el panel se abre con el título, los tres créditos y la nota del Resumen`, !!dlg?.open && t.includes(C.creditos.titulo) && C.creditos.lista.every((x) => t.includes(x)) && t.includes(C.creditos.nota), t.slice(0, 160));
      const enlaces = [...(dlg?.querySelectorAll("a") ?? [])];
      ok(`${M} · créditos: 8 enlaces (4 obras y 4 licencias) externos con rel noopener`, enlaces.length === 8 && enlaces.every((a) => /^https:\/\//.test(a.href) && /noopener/.test(a.rel)) && enlaces.filter((a) => a.href.startsWith("https://commons.wikimedia.org/")).length === 4, enlaces.map((a) => a.href));
      const hashAntes = win.location.hash;
      tecla(win, "ArrowRight", dlg?.querySelector("button, a"));
      tecla(win, "Escape", dlg); await sleep(150);
      ok(`${M} · créditos: Escape cierra el panel, no navega y el foco vuelve al enlace`, !dlg?.open && win.location.hash === hashAntes && doc.activeElement === boton, [dlg?.open, win.location.hash, doc.activeElement?.outerHTML?.slice(0, 60)]);
      f.remove();
    }
  }
  const fallos = res.filter((r) => !r.ok);
  return { pass: res.length - fallos.length, fail: fallos.length, detalles: fallos };
}
