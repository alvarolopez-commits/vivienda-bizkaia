// Arranque de la presentación: dirección (#/diapositiva/paso), teclado, botones, modos, notas y pantalla completa.
// La única ruta de navegación es la dirección: los controles escriben location.hash y quien aplica el cambio es «hashchange».
import { DIAPOSITIVAS, escribirHash, leerHash, siguiente, anterior, inicio, fin } from "./estado.js";
import { modoInicial, intensidad, entrarPantallaCompleta, salirPantallaCompleta } from "./modos.js";
import { crearDiapositivas } from "./diapositivas/index.js";
import { announce, reduced } from "../original/js/comun.js";
import { montarMapa } from "./mapa3d.js";
import { textoNotas } from "./notas.js";
import { transicionar } from "./movimiento.js";

const $ = (s, r = document) => r.querySelector(s);
const body = document.body;
const escenario = $("#escenario");
const panelNotas = $("#notas");

// Lectura vertical (móvil, ≤ 760 px): las nueve diapositivas se apilan como secciones que se leen deslizando, con todos los pasos a la vista.
// No hay modo Presentar, ni mapa 3D de fondo, ni barra de diapositivas. En pantallas anchas todo es como antes. Se decide al cargar; si la ventana cruza el
// límite (girar el móvil) se recarga.
const ESTRECHA = matchMedia("(max-width: 760px)");
const vertical = ESTRECHA.matches;
ESTRECHA.addEventListener?.("change", () => location.reload());
if (vertical) { document.documentElement.dataset.disposicion = "vertical"; body.dataset.disposicion = "vertical"; }

const json = (url) => fetch(url).then((r) => { if (!r.ok) throw new Error(`${url}: ${r.status}`); return r.json(); });

const ctx = {
  mapa: null, // se rellena cuando el lienzo 3D (o su plan B en SVG) está montado
  datos: Promise.all([json("original/data/resumen.json"), json("original/data/municipios.geojson"), json("original/data/escenario_base.json")]).then(([resumen, geo, base]) => ({ resumen, geo, base })),
  modo: () => body.dataset.modo,
  anunciar: (texto, espera = 0) => announce(texto, espera),
};

const diapositivas = crearDiapositivas(ctx);
escenario.append(...diapositivas.map((d) => d.raiz));
if (vertical) {
  diapositivas.forEach((d) => { d.raiz.dataset.tema = d.tema ?? "oscuro"; d.raiz.dataset.estado = "activa"; d.ir(1, 0); });
}

let actual = null; // { d, p } que se está viendo

// ---------- aplicar un estado ----------
function aplicarVertical(e) {
  const cambio = !actual || actual.d !== e.d;
  const nueva = diapositivas[e.d - 1];
  nueva.ir(e.p, 0);
  const primera = !actual;
  actual = e;
  if (cambio && !(primera && e.d === 1)) {
    const ir = () => nueva.raiz.scrollIntoView({ block: "start", behavior: primera || reduced() ? "instant" : "smooth" });
    if (primera) requestAnimationFrame(() => requestAnimationFrame(ir)); else ir();   // al cargar, cuando ya hay maquetación
  }
}

function aplicar(e, dir) {
  if (vertical) { aplicarVertical(e); return; }
  const anteriorD = actual?.d;
  const nueva = diapositivas[e.d - 1];
  if (anteriorD !== e.d) {
    transicionar(anteriorD ? diapositivas[anteriorD - 1].raiz : null, nueva.raiz, dir || 1);
    nueva.alEntrar?.(dir);
    body.dataset.tema = nueva.tema ?? "oscuro"; // la presentación alterna diapositivas en azul noche y en claro
  }
  nueva.ir(e.p, dir);
  actual = e;
  const pasos = DIAPOSITIVAS[e.d - 1].pasos;
  $("[data-progreso]").textContent = `Diapositiva ${e.d} de ${DIAPOSITIVAS.length} · Paso ${e.p} de ${pasos}`;
  $('[data-accion="anterior"]').setAttribute("aria-disabled", String(!anterior(e)));
  $('[data-accion="siguiente"]').setAttribute("aria-disabled", String(!siguiente(e)));
  pintarNotas(e);
  // línea de avance de arriba y pastilla de la diapositiva actual
  body.style.setProperty("--avance", String(((e.d - 1) + e.p / pasos) / DIAPOSITIVAS.length));
  document.querySelectorAll("[data-ir]").forEach((b) => (Number(b.dataset.ir) === e.d ? b.setAttribute("aria-current", "true") : b.removeAttribute("aria-current")));
  announce(`Diapositiva ${e.d} de ${DIAPOSITIVAS.length}, paso ${e.p} de ${pasos}`, 300);
}

/** Las notas del orador del estado actual (propuesta; solo se ven en Presentar). */
function pintarNotas(e) {
  $("[data-notas-texto]").replaceChildren(...textoNotas(e).map((t) => Object.assign(document.createElement("p"), { textContent: t })));
}

/** Lo que dice la dirección, normalizado: una dirección inválida se reescribe sin añadir historial. */
function sincronizar() {
  const e = leerHash(location.hash);
  const h = escribirHash(e);
  if (location.hash !== h) history.replaceState(null, "", location.pathname + location.search + h);
  if (actual && actual.d === e.d && actual.p === e.p) return;
  const dir = !actual ? 0 : e.d > actual.d || (e.d === actual.d && e.p > actual.p) ? 1 : -1;
  aplicar(e, dir);
}
addEventListener("hashchange", sincronizar);

const ir = (e) => { if (e && escribirHash(e) !== location.hash) location.hash = escribirHash(e); };

// ---------- modos ----------
function fijarModo(modo) {
  body.dataset.modo = modo;
  body.dataset.motion = intensidad(modo, location.search);
  const u = new URL(location.href);
  if (modo === "presentar") u.searchParams.set("modo", "presentar"); else u.searchParams.delete("modo");
  history.replaceState(null, "", u.pathname + u.search + u.hash);
  const boton = $('[data-accion="modo"]');
  boton.textContent = modo === "presentar" ? "Leer" : "Presentar";
  boton.setAttribute("aria-label", modo === "presentar" ? "Cambiar al modo Leer" : "Cambiar al modo Presentar (pantalla completa)");
  if (modo === "presentar") entrarPantallaCompleta(); else { fijarNotas(false); salirPantallaCompleta(); }
}

// ---------- notas ----------
/** Las notas del orador solo existen en Presentar (spec §6.3): en Leer ni se abren ni se ven. */
function fijarNotas(abiertas) {
  if (abiertas && body.dataset.modo !== "presentar") return;
  panelNotas.hidden = !abiertas;
  $('[data-accion="notas"]').setAttribute("aria-pressed", String(abiertas));
}

// ---------- teclado ----------
/** Un campo, un selector o un diálogo abierto se quedan con el teclado; los botones y enlaces, con Espacio e Intro. */
function esDeOtro(destino, key) {
  if (!(destino instanceof Element)) return false;
  if (destino.closest('input, textarea, select, dialog[open], [contenteditable=""], [contenteditable="true"]')) return true;
  return (key === " " || key === "Enter") && !!destino.closest("button, a[href], summary");
}

document.addEventListener("keydown", (ev) => {
  if (ev.defaultPrevented || ev.ctrlKey || ev.metaKey || ev.altKey) return;
  const k = ev.key;
  if (esDeOtro(ev.target, k)) return;
  const acciones = {
    ArrowRight: () => ir(siguiente(actual)), PageDown: () => ir(siguiente(actual)), " ": () => ir(siguiente(actual)),
    ArrowLeft: () => ir(anterior(actual)), PageUp: () => ir(anterior(actual)),
    Home: () => ir(inicio()), End: () => ir(fin()),
    p: () => fijarModo("presentar"), P: () => fijarModo("presentar"),
    l: () => fijarModo("leer"), L: () => fijarModo("leer"),
    n: () => fijarNotas(panelNotas.hidden), N: () => fijarNotas(panelNotas.hidden),
    Escape: () => { if (!panelNotas.hidden) fijarNotas(false); else return false; },
  };
  const hacer = acciones[k];
  if (hacer && hacer() !== false) ev.preventDefault();
});

// ---------- botones ----------
const sinAria = (b) => b.getAttribute("aria-disabled") !== "true";
$('[data-accion="anterior"]').addEventListener("click", (e) => { if (sinAria(e.currentTarget)) ir(anterior(actual)); });
$('[data-accion="siguiente"]').addEventListener("click", (e) => { if (sinAria(e.currentTarget)) ir(siguiente(actual)); });
$('[data-accion="modo"]').addEventListener("click", () => fijarModo(body.dataset.modo === "presentar" ? "leer" : "presentar"));
$('[data-accion="notas"]').addEventListener("click", () => fijarNotas(panelNotas.hidden));
document.querySelectorAll("[data-ir]").forEach((b) => b.addEventListener("click", () => ir({ d: Number(b.dataset.ir), p: 1 })));

// ---------- lectura vertical: la línea de avance sigue al desplazamiento ----------
if (vertical) {
  const avance = () => { const h = document.documentElement, max = h.scrollHeight - innerHeight; body.style.setProperty("--avance", String(max > 0 ? Math.min(1, h.scrollTop / max) : 0)); };
  addEventListener("scroll", avance, { passive: true });
  addEventListener("resize", avance);
}

// ---------- arranque ----------
body.dataset.modo = vertical ? "leer" : modoInicial(location.search);
body.dataset.motion = intensidad(body.dataset.modo, location.search);
$('[data-accion="modo"]').textContent = body.dataset.modo === "presentar" ? "Leer" : "Presentar";
sincronizar();
body.dataset.listo = "1";

// El mapa se monta cuando llegan los datos; la presentación se navega antes y, al estar listo, la diapositiva actual lo coloca.
ctx.datos
  .then(async (datos) => {
    if (vertical) { body.dataset.mapa = "sin"; return; }
    ctx.mapa = await montarMapa($("#mapa"), datos);
    if (actual) diapositivas[actual.d - 1].ir(actual.p, 0);
    body.dataset.mapa = ctx.mapa.plano ? "plano" : "3d";
  })
  .catch((err) => { console.error("El mapa no se pudo montar; la presentación sigue navegable:", err); body.dataset.mapa = "error"; });
