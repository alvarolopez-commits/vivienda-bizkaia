// Diapositiva 3 · Calculadora. En el navegador (con el panel VISIBLE: el resultado se anima con requestAnimationFrame):
//   import('/_qa/qa-calculadora.js').then(m => m.run([[1280, 720]])).then(r => window.__qaRes = r)     (un tamaño por llamada: la rejilla tarda ~10 s)
// Comprueba: los textos literales del Resumen; que el resultado coincide con entry() del propio Resumen para una rejilla de hogares × precios;
// precios fuera de rango o no numéricos; − / + y los dos ejemplos; que el teclado dentro del campo no navega; el panel «Cómo se calcula»;
// el mapa atenuado; el anuncio para lectores de pantalla; y que cabe en la pantalla.
import { abrir, tecla, TAMANOS } from "/_qa/qa-navegacion.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => s.replace(/[ \t\r\n]+/g, " ").trim(); // conserva el NBSP
const llano = (s) => norm(s).replace(/ /g, " "); // para los valores que repinta calculadora.js (usa espacio normal)

/** Espera hasta que cond() sea cierta (máx. ms). */
async function hasta(cond, ms = 1500) {
  const t0 = performance.now();
  while (performance.now() - t0 < ms) { if (cond()) return true; await sleep(40); }
  return cond();
}

export async function run(tamanos = TAMANOS) {
  const res = [];
  const ok = (n, c, d = "") => res.push({ ok: !!c, n, d });
  const textos = await fetch("/_qa/textos.json").then((r) => r.json());
  const K = textos.calculadora;
  const { entry, between, nf } = await import("/original/js/calculadora.js");
  const { resumen } = { resumen: await fetch("/original/data/resumen.json").then((r) => r.json()) };
  const supuestos = resumen.calculadora.supuestos;
  const HOGARES = [20637, 36766, 58436, 33959, 27420];
  const PRECIOS = [60000, 265733, 900000];

  for (const [w, h] of tamanos) {
    const T = `${w}×${h}`;
    const f = await abrir("/#/3/1", w, h);
    const win = f.contentWindow, doc = f.contentDocument;
    const slide = () => doc.querySelector('[data-diapositiva="calculadora"]');
    const anos = () => doc.querySelector("[data-anos]");
    const cuota = () => doc.querySelector("[data-cuota]");
    const precio = () => doc.querySelector("#precio");
    await hasta(() => !!anos() && llano(anos().textContent) === K.anos_inicial, 2500);

    // ---------- valores iniciales y textos ----------
    ok(`${T} · resultado inicial «${K.anos_inicial}» años`, llano(anos()?.textContent ?? "") === K.anos_inicial, anos()?.textContent);
    ok(`${T} · cuota inicial «${K.cuota_inicial}» (el Resumen la repinta con espacio normal)`, llano(cuota()?.textContent ?? "") === llano(K.cuota_inicial), cuota()?.textContent);
    const visible = norm(slide()?.innerText ?? "");
    const faltan = [K.titular, ...K.hogares, K.etiqueta_precio, ...K.ejemplos, K.anos_texto, K.cuota_antes, K.cuota_despues].filter((s) => !visible.includes(s));
    ok(`${T} · los textos de la diapositiva son los del Resumen`, faltan.length === 0, faltan);
    ok(`${T} · el botón «${K.como_boton}» existe`, norm(slide()?.querySelector('[data-abre="como"]')?.textContent ?? "").startsWith(K.como_boton), "");
    ok(`${T} · cinco hogares (radios) con «Ingresos medios» marcado y precio inicial 265733`, doc.querySelectorAll('[name="hogar"]').length === 5 && doc.querySelector('[name="hogar"]:checked')?.value === "36766" && precio()?.value === "265733", "");
    ok(`${T} · el campo de precio tiene min 60000, max 900000 y paso 1000`, precio()?.min === "60000" && precio()?.max === "900000" && precio()?.step === "1000", "");
    await hasta(() => !!doc.body.dataset.mapa, 10000); // el mapa se monta después que la calculadora (Three.js pesa más)
    await sleep(100);
    ok(`${T} · el mapa queda atenuado detrás`, doc.querySelector(".fondo-mapa")?.classList.contains("atenuado"), doc.body.dataset.mapa);
    ok(`${T} · cabe sin desplazarse y el disco está dentro de la pantalla`, slide().scrollHeight <= slide().clientHeight + 1 && doc.querySelector(".disco").getBoundingClientRect().bottom <= h, [slide().scrollHeight, slide().clientHeight, doc.querySelector(".disco").getBoundingClientRect().bottom]);

    // ---------- equivalencia con entry() del Resumen: hogares × precios ----------
    const fijar = (hogar, p) => {
      const radio = [...doc.querySelectorAll('[name="hogar"]')].find((r) => r.value === String(hogar));
      radio.checked = true;
      radio.dispatchEvent(new win.Event("change", { bubbles: true }));
      precio().value = String(p);
      precio().dispatchEvent(new win.Event("input", { bubbles: true }));
    };
    const esperado = (hogar, p) => {
      const r = entry(p, hogar, supuestos);
      const cuotaTxt = nf(r.effort[0], 1) === nf(r.effort[1], 1) ? `el ${nf(r.effort[0], 1)} %` : `del ${nf(r.effort[0], 1)} al ${nf(r.effort[1], 1)} %`;
      return [between(...r.years), cuotaTxt];
    };
    const malos = [];
    for (const hogar of HOGARES) {
      for (const p of PRECIOS) {
        fijar(hogar, p);
        const [a, c] = esperado(hogar, p);
        const bien = await hasta(() => llano(anos().textContent) === a && llano(cuota().textContent) === c, 1600);
        if (!bien) malos.push({ hogar, p, esperado: [a, c], real: [anos().textContent, cuota().textContent] });
      }
    }
    ok(`${T} · ${HOGARES.length * PRECIOS.length} combinaciones hogar × precio coinciden con entry() del Resumen`, malos.length === 0, malos.slice(0, 2));

    // ---------- precios fuera de rango o no numéricos ----------
    const ajusta = [];
    for (const entrada of ["", "abc", "1", "99999999", "-5", "0"]) {
      precio().value = entrada;
      precio().dispatchEvent(new win.Event("change", { bubbles: true }));
      await sleep(900);
      const v = Number(precio().value);
      const formato = /^\d+(,\d)?( a \d+(,\d)?)?$/.test(llano(anos().textContent));
      if (!(v >= 60000 && v <= 900000 && formato)) ajusta.push({ entrada, valor: precio().value, anos: anos().textContent });
    }
    ok(`${T} · precio vacío, «abc», 1, 99999999, −5 y 0 se ajustan a 60.000–900.000 y el resultado sigue con formato válido`, ajusta.length === 0, ajusta);
    precio().value = "1"; precio().dispatchEvent(new win.Event("change", { bubbles: true }));
    ok(`${T} · un precio de 1 € se sube a 60000`, precio().value === "60000", precio().value);
    precio().value = "99999999"; precio().dispatchEvent(new win.Event("change", { bubbles: true }));
    ok(`${T} · un precio de 99999999 € se baja a 900000`, precio().value === "900000", precio().value);

    // ---------- − / + y ejemplos ----------
    doc.querySelector('[data-precio="265733"]').click();
    ok(`${T} · «${K.ejemplos[0]}» pone 265733`, precio().value === "265733", precio().value);
    doc.querySelector('[data-paso="10000"]').click();
    ok(`${T} · «+» suma 10.000 €`, precio().value === "275733", precio().value);
    doc.querySelector('[data-paso="-10000"]').click();
    ok(`${T} · «−» resta 10.000 €`, precio().value === "265733", precio().value);
    doc.querySelector('[data-precio="558211"]').click();
    ok(`${T} · «${K.ejemplos[1]}» pone 558211`, precio().value === "558211", precio().value);
    const [a2, c2] = esperado(36766, 558211);
    fijar(36766, 558211);
    ok(`${T} · «Un piso en Abando» con ingresos medios da el resultado del Resumen`, await hasta(() => llano(anos().textContent) === a2 && llano(cuota().textContent) === c2, 1600), [anos().textContent, a2]);

    // ---------- anuncio para lectores de pantalla ----------
    await sleep(900);
    ok(`${T} · el resultado se anuncia en la región de estado`, /años ahorrando la entrada/.test(doc.querySelector("[data-anuncio]").textContent), doc.querySelector("[data-anuncio]").textContent);

    // ---------- el teclado dentro del campo no navega ----------
    precio().focus();
    for (const k of ["ArrowLeft", "ArrowRight", " ", "PageDown", "Home", "End"]) tecla(win, k, precio());
    await sleep(150);
    ok(`${T} · con el foco en #precio ninguna tecla cambia de diapositiva`, win.location.hash === "#/3/1", win.location.hash);
    const radio = doc.querySelector('[name="hogar"]'); radio.focus();
    tecla(win, "ArrowRight", radio); tecla(win, " ", radio); await sleep(100);
    ok(`${T} · con el foco en un radio de hogar tampoco`, win.location.hash === "#/3/1", win.location.hash);
    const mas = doc.querySelector('[data-paso="10000"]'); mas.focus(); tecla(win, " ", mas); await sleep(100);
    ok(`${T} · Espacio sobre el botón «+» no cambia de diapositiva`, win.location.hash === "#/3/1", win.location.hash);

    // ---------- «Cómo se calcula» ----------
    const boton = slide().querySelector('[data-abre="como"]');
    boton.focus(); boton.click(); await sleep(150);
    const dlg = doc.querySelector("dialog#como");
    const t = norm(dlg?.innerText ?? "");
    ok(`${T} · «Cómo se calcula»: título y párrafos literales del Resumen`, !!dlg?.open && t.includes(K.como_titulo) && K.como_parrafos.every((p) => t.includes(p)), t.slice(0, 200));
    tecla(win, "ArrowRight", dlg.querySelector("button")); tecla(win, "Escape", dlg); await sleep(150);
    ok(`${T} · «Cómo se calcula»: Escape lo cierra, no navega y el foco vuelve al botón`, !dlg.open && win.location.hash === "#/3/1" && doc.activeElement === boton, [dlg.open, win.location.hash]);

    // ---------- el mapa vuelve al salir ----------
    tecla(win, "ArrowLeft"); await sleep(500);
    ok(`${T} · al volver a la diapositiva 2 el mapa deja de estar atenuado`, !doc.querySelector(".fondo-mapa").classList.contains("atenuado"), "");
    f.remove();
  }
  const fallos = res.filter((r) => !r.ok);
  return { pass: res.length - fallos.length, fail: fallos.length, detalles: fallos };
}
