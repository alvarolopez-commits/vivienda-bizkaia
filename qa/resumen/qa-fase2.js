// Diapositivas 4 a 9 (fase 2): Siete Bizkaias, Lo que viene, Qué se puede hacer, Diez conclusiones, BM30 y Cierre.
//   node presentacion/_qa/correr.mjs prueba qa-fase2.js            (necesita un navegador que pinte: usar correr.mjs)
// Comprueba, con los textos literales del Resumen (textos.json → fase2): cada bloque de texto visible; los pasos (tipo de municipio, ritmo de
// construcción, grupo de conclusiones) y su efecto; que las cifras de «Lo que viene» coinciden con el modelo del Resumen (simulate); las
// sumas cruzadas (113 municipios, 34 medidas, 10 conclusiones, 3 + 21 + 10); los enlaces del cierre y los paneles de fuentes y créditos.
import { abrir, tecla, TAMANOS } from "/_qa/qa-navegacion.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => s.replace(/[ \t\r\n]+/g, " ").trim(); // conserva el NBSP del Resumen
const llano = (s) => norm(s).replace(/ /g, " ");
const TIPOS = ["bilbao", "urbano_renta_baja", "urbano_renta_alta", "expansion", "costa_turistica", "villa", "rural"];
const PACES = [2679, 3900, 4800];

export async function run(tamanos = TAMANOS) {
  const res = [];
  const ok = (n, c, d = "") => res.push({ ok: !!c, n, d });
  const F = (await fetch("/_qa/textos.json").then((r) => r.json())).fase2;
  const resumen = await fetch("/original/data/resumen.json").then((r) => r.json());
  const base = await fetch("/original/data/escenario_base.json").then((r) => r.json());
  const { simulate } = await import("/original/js/modelo/escenarios.js");
  const { gapWords, nf, between } = await import("/original/js/calculadora.js");
  const faltan = (visible, lista) => lista.filter((b) => !visible.includes(b));

  for (const [w, h] of tamanos) {
    const T = `${w}×${h}`;
    const ver = async (ruta) => { const f = await abrir(ruta, w, h); await sleep(1700); return { f, win: f.contentWindow, doc: f.contentDocument }; };
    const slide = (doc, id) => doc.querySelector(`[data-diapositiva="${id}"]`);
    const visibleDe = (doc, id) => norm(slide(doc, id)?.innerText ?? "");
    const hash = (win, e) => { win.location.hash = e; return sleep(500); };

    // ---------- 4 · Siete Bizkaias ----------
    {
      const { f, win, doc } = await ver("/#/4/1");
      const s = slide(doc, "siete"), v = visibleDe(doc, "siete");
      ok(`${T} · Siete: el h1 es «${F.siete[0]}»`, norm(s?.querySelector("h1")?.textContent ?? "") === F.siete[0], s?.querySelector("h1")?.textContent);
      ok(`${T} · Siete (Leer): se ven el título, la entradilla y las siete tarjetas del Resumen`, faltan(v, F.siete).length === 0, faltan(v, F.siete).slice(0, 3));
      ok(`${T} · Siete: siete filas en el orden de los tipos del Resumen`, JSON.stringify([...s.querySelectorAll("li[data-tipo]")].map((li) => li.dataset.tipo)) === JSON.stringify(TIPOS), [...s.querySelectorAll("li[data-tipo]")].map((li) => li.dataset.tipo));
      let mal = [];
      for (let p = 1; p <= 7; p++) {
        await hash(win, `#/4/${p}`);
        const actual = [...s.querySelectorAll("li[aria-current='step']")];
        const cuantos = Number(F.siete[2 + 4 * (p - 1)].replace(/\D/g, ""));
        const on = s.querySelectorAll("svg path.on");
        const todos = s.querySelectorAll("svg path");
        const color = resumen.tipos[TIPOS[p - 1]].color;
        if (!(actual.length === 1 && actual[0].dataset.b === String(p) && on.length === cuantos && todos.length === 113 && [...on].every((x) => x.getAttribute("fill") === color))) mal.push({ p, actual: actual.length, on: on.length, esperado: cuantos, todos: todos.length });
      }
      ok(`${T} · Siete: en cada paso el mapa resalta los municipios de su tipo (1, 11, 4, 5, 9, 20, 63 de 113) con el color del Resumen`, mal.length === 0, mal);
      ok(`${T} · Siete: los siete tipos suman 113 municipios`, [1, 11, 4, 5, 9, 20, 63].reduce((a, b) => a + b, 0) === 113 && TIPOS.every((_, i) => F.siete[2 + 4 * i] === String([1, 11, 4, 5, 9, 20, 63][i])), "");
      ok(`${T} · Siete: cabe sin desplazarse`, s.scrollHeight <= s.clientHeight + 1, [s.scrollHeight, s.clientHeight]);
      s.querySelector('li[data-b="5"] button')?.click(); await sleep(300);
      ok(`${T} · Siete (Leer): un clic en la 5.ª fila lleva a #/4/5`, win.location.hash === "#/4/5", win.location.hash);
      f.remove();
      const g = await ver("/?modo=presentar#/4/3");
      const sp = slide(g.doc, "siete"), vp = visibleDe(g.doc, "siete");
      const propios = F.siete.slice(2 + 4 * 2, 6 + 4 * 2), ajenos = [F.siete[5], F.siete[9], F.siete[17], F.siete[21]]; // el problema («prob») de otros tipos, todos distintos del del tipo 3
      ok(`${T} · Siete (Presentar): solo el tipo actual, con sus cuatro bloques`, faltan(vp, propios).length === 0 && ajenos.every((a) => !vp.includes(a)), faltan(vp, propios));
      ok(`${T} · Siete (Presentar): cabe sin desplazarse`, sp.scrollHeight <= sp.clientHeight + 1, [sp.scrollHeight, sp.clientHeight]);
      g.f.remove();
    }

    // ---------- 5 · Lo que viene ----------
    {
      const frase = (pace) => {
        const r = simulate(base, { construccion: pace }).at(2035);
        const [verbo, cifra, cola] = gapWords(Math.round(r.shortfall / 100) * 100);
        return `Con ${nf(pace)} viviendas nuevas al año, en 2035 ${verbo} ${cifra} ${cola} y la entrada llevará ${between(...r.yearsToSave)} años.`;
      };
      const { f, win, doc } = await ver("/#/5/1");
      const s = slide(doc, "viene"), v = visibleDe(doc, "viene");
      const [titulo, fraseInicial, ...resto] = F.viene.bloques;
      ok(`${T} · Viene: el h1 es «${titulo}»`, norm(s?.querySelector("h1")?.textContent ?? "") === titulo, s?.querySelector("h1")?.textContent);
      ok(`${T} · Viene: los tres ritmos, la nota y el pie de foto son los del Resumen`, faltan(v, resto).length === 0, faltan(v, resto));
      ok(`${T} · Viene: la frase inicial es literal del Resumen y es la que da el modelo (simulate) para 2.679 viviendas al año`, llano(s.querySelector(".frase")?.textContent ?? "") === llano(fraseInicial) && llano(fraseInicial) === frase(2679), [s.querySelector(".frase")?.textContent, frase(2679)]);
      const malos = [];
      for (let p = 1; p <= 3; p++) {
        await hash(win, `#/5/${p}`);
        const botones = [...s.querySelectorAll("[data-construccion]")];
        const pulsados = botones.filter((b) => b.getAttribute("aria-pressed") === "true");
        const real = llano(s.querySelector(".frase")?.textContent ?? "");
        if (!(pulsados.length === 1 && Number(pulsados[0].dataset.construccion) === PACES[p - 1] && real === llano(frase(PACES[p - 1])))) malos.push({ p, pulsados: pulsados.map((b) => b.dataset.construccion), real, esperado: frase(PACES[p - 1]) });
      }
      ok(`${T} · Viene: cada paso elige su ritmo (2.679 · 3.900 · 4.800) y la frase coincide con el modelo del Resumen`, malos.length === 0, malos.slice(0, 1));
      s.querySelector('[data-construccion="3900"]')?.click(); await sleep(400);
      ok(`${T} · Viene (Leer): un clic en «3.900» lleva a #/5/2 con su frase`, win.location.hash === "#/5/2" && llano(s.querySelector(".frase").textContent) === llano(frase(3900)), [win.location.hash, s.querySelector(".frase")?.textContent]);
      const img = s.querySelector("figure img");
      ok(`${T} · Viene: la foto de Bolueta con su alt y cargada`, img?.getAttribute("alt") === F.viene.alts[0] && img.complete && img.naturalWidth > 0, [img?.alt, img?.naturalWidth]);
      const boton = s.querySelector('[data-abre="creditos"]'); boton?.focus(); boton?.click(); await sleep(150);
      const dlg = doc.querySelector("dialog#creditos");
      ok(`${T} · Viene: el panel de créditos incluye el de Bolueta`, !!dlg?.open && norm(dlg.innerText).includes(F.credito_bolueta), dlg?.innerText?.slice(0, 80));
      tecla(win, "Escape", dlg); await sleep(150);
      ok(`${T} · Viene: Escape cierra los créditos y el foco vuelve al botón de esta diapositiva`, !dlg.open && doc.activeElement === boton, doc.activeElement?.outerHTML?.slice(0, 60));
      ok(`${T} · Viene: cabe sin desplazarse`, s.scrollHeight <= s.clientHeight + 1, [s.scrollHeight, s.clientHeight]);
      f.remove();
    }

    // ---------- 6 · Qué se puede hacer ----------
    {
      const { f, doc } = await ver("/#/6/1");
      const s = slide(doc, "hacer"), v = visibleDe(doc, "hacer");
      ok(`${T} · Hacer: el h1 es «${F.hacer[0]}»`, norm(s?.querySelector("h1")?.textContent ?? "") === F.hacer[0], "");
      ok(`${T} · Hacer: se ven el subtítulo, la tabla y la nota del Resumen`, faltan(v, F.hacer).length === 0, faltan(v, F.hacer).slice(0, 3));
      const filas = [...s.querySelectorAll('[role="row"]')];
      const medidas = filas.slice(1).map((r) => Number(r.querySelectorAll('[role="cell"]')[0]?.textContent.trim()));
      ok(`${T} · Hacer: tabla con cabecera y seis líneas; las medidas suman 34`, s.querySelector('[role="table"]') && filas.length === 7 && medidas.reduce((a, b) => a + b, 0) === 34, medidas);
      ok(`${T} · Hacer: cabe sin desplazarse`, s.scrollHeight <= s.clientHeight + 1, [s.scrollHeight, s.clientHeight]);
      f.remove();
    }

    // ---------- 7 · Diez conclusiones ----------
    {
      const { f, win, doc } = await ver("/#/7/1");
      const s = slide(doc, "conclusiones"), v = visibleDe(doc, "conclusiones");
      ok(`${T} · Conclusiones: el h1 es «${F.conclusiones[0]}»`, norm(s?.querySelector("h1")?.textContent ?? "") === F.conclusiones[0], "");
      ok(`${T} · Conclusiones (Leer): se ven los dos grupos y las diez conclusiones del Resumen`, faltan(v, F.conclusiones).length === 0 && s.querySelectorAll("li").length === 10, [faltan(v, F.conclusiones).slice(0, 3), s.querySelectorAll("li").length]);
      for (const [p, filas, otro] of [[1, 4, "Qué hacer"], [2, 6, "El diagnóstico"]]) {
        await hash(win, `#/7/${p}`);
        const marcado = [...s.querySelectorAll(".grupo[aria-current='step']")];
        ok(`${T} · Conclusiones: el paso ${p} marca su grupo (${filas} conclusiones)`, marcado.length === 1 && marcado[0].dataset.b === String(p) && marcado[0].querySelectorAll("li").length === filas, [marcado.length, marcado[0]?.dataset.b]);
      }
      ok(`${T} · Conclusiones: cabe sin desplazarse`, s.scrollHeight <= s.clientHeight + 1, [s.scrollHeight, s.clientHeight]);
      f.remove();
      const g = await ver("/?modo=presentar#/7/2");
      const sp = slide(g.doc, "conclusiones"), vp = visibleDe(g.doc, "conclusiones");
      ok(`${T} · Conclusiones (Presentar): solo el grupo «Qué hacer» y sus seis conclusiones`, vp.includes("Qué hacer") && !vp.includes("El diagnóstico") && [...sp.querySelectorAll("li")].filter((li) => li.checkVisibility()).length === 6, [...sp.querySelectorAll("li")].filter((li) => li.checkVisibility()).length);
      ok(`${T} · Conclusiones (Presentar): cabe sin desplazarse`, sp.scrollHeight <= sp.clientHeight + 1, [sp.scrollHeight, sp.clientHeight]);
      g.f.remove();
    }

    // ---------- 8 · BM30 ----------
    {
      const { f, doc } = await ver("/#/8/1");
      const s = slide(doc, "bm30"), v = visibleDe(doc, "bm30");
      ok(`${T} · BM30: el h1 es «${F.bm30[0]}» (sin desarrollar la sigla)`, norm(s?.querySelector("h1")?.textContent ?? "") === F.bm30[0], "");
      ok(`${T} · BM30: se ven la entradilla y las tres tarjetas del Resumen`, faltan(v, F.bm30).length === 0, faltan(v, F.bm30).slice(0, 3));
      const cifras = [...s.querySelectorAll(".carta .carta-num")].map((e) => Number(e.textContent.trim()));
      ok(`${T} · BM30: tres tarjetas (Impulsar 3 · Facilitar 21 · Pedir 10) que suman 34 medidas`, cifras.length === 3 && cifras.join() === "3,21,10" && cifras.reduce((a, b) => a + b, 0) === 34, cifras);
      ok(`${T} · BM30: la sigla no se desarrolla en ninguna parte de la diapositiva`, !/Bizkaia\s*M|Bilbao Metropolitano|Metropolitan/i.test(s.textContent), "");
      ok(`${T} · BM30: cabe sin desplazarse`, s.scrollHeight <= s.clientHeight + 1, [s.scrollHeight, s.clientHeight]);
      f.remove();
    }

    // ---------- 9 · Cierre ----------
    {
      const { f, win, doc } = await ver("/#/9/1");
      const s = slide(doc, "cierre"), v = visibleDe(doc, "cierre");
      const P = F.pie;
      // Divergencia deliberada con el Resumen: el enlace al Análisis apunta al rediseño (js/enlaces.js), no al original de Vercel
      const ANALISIS = "https://alvarolopez-commits.github.io/vivienda-bizkaia-analisis/sprint-03-1/app/";
      const DIRS = ["alvarolopez-commits.github.io/vivienda-bizkaia-analisis", P.direcciones[1]];
      ok(`${T} · Cierre: el h1 es «${F.cierre[0]}»`, norm(s?.querySelector("h1")?.textContent ?? "") === F.cierre[0], "");
      ok(`${T} · Cierre: se ven la frase, el botón y el pie «${P.titulo}» del Resumen`, faltan(v, F.cierre).length === 0 && v.includes(P.titulo) && DIRS.every((d) => v.includes(d)) && v.includes(P.territorio) && v.includes(P.nota) && P.enlaces.every((e) => v.includes(e)), faltan(v, [...F.cierre, P.titulo, ...DIRS, P.territorio, P.nota, ...P.enlaces]));
      const enlaces = Object.fromEntries([...s.querySelectorAll("a[href]")].map((a) => [a.getAttribute("href"), a]));
      ok(`${T} · Cierre: «Ver el análisis» lleva al Análisis, en pestaña nueva y con noopener`, enlaces[ANALISIS]?.target === "_blank" && /noopener/.test(enlaces[ANALISIS].rel), Object.keys(enlaces));
      ok(`${T} · Cierre: la dirección del radar es https://vizcaya-vivienda.vercel.app, en pestaña nueva y con noopener`, enlaces["https://vizcaya-vivienda.vercel.app"]?.target === "_blank" && /noopener/.test(enlaces["https://vizcaya-vivienda.vercel.app"].rel), Object.keys(enlaces));
      const copiar = s.querySelector(".copiar"); copiar.click(); await sleep(250);
      ok(`${T} · Cierre: «${P.copiar}» responde (Copiado o Cópialo a mano) y no lanza`, /Copiado|Cópialo a mano/.test(copiar.textContent), copiar.textContent);
      const bFuentes = [...s.querySelectorAll("button")].find((b) => norm(b.textContent) === "Fuentes"); bFuentes.focus(); bFuentes.click(); await sleep(150);
      const dlg = doc.querySelector("dialog#fuentes"), t = norm(dlg?.innerText ?? "");
      ok(`${T} · Cierre: el panel «Fuentes» lista las 11 fuentes del Resumen`, !!dlg?.open && t.includes(F.fuentes.titulo) && F.fuentes.lista.length === 11 && F.fuentes.lista.every((x) => t.includes(x)), t.slice(0, 120));
      tecla(win, "Escape", dlg); await sleep(150);
      ok(`${T} · Cierre: Escape cierra «Fuentes», no navega y el foco vuelve al botón`, !dlg.open && win.location.hash === "#/9/1" && doc.activeElement === bFuentes, [dlg.open, win.location.hash]);
      ok(`${T} · Cierre: cabe sin desplazarse`, s.scrollHeight <= s.clientHeight + 1, [s.scrollHeight, s.clientHeight]);
      f.remove();
    }
  }
  const fallos = res.filter((r) => !r.ok);
  return { pass: res.length - fallos.length, fail: fallos.length, detalles: fallos };
}
