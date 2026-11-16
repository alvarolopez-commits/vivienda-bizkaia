// «Copiar enlace»: copia la dirección actual, que ya recoge la consulta (vista, problema, municipios, filtros, supuestos, medidas elegidas).
// Cada vista escribe su estado en la dirección con las rutas que ya existían (+ una query); este botón solo copia lo que hay en la barra.
import { announce } from "../original/js/comun.js";

// Hay un botón en la cabecera y otro en el menú pequeño. En iPhone/iPad (puntero táctil y Web Share) se abre la hoja de compartir del sistema,
// que es lo que se espera en Apple; en el resto se copia la dirección.
const botones = [...document.querySelectorAll("[data-copiar-enlace]")];
const compartirNativo = typeof navigator.share === "function" && matchMedia("(pointer: coarse)").matches;
if (compartirNativo) botones.forEach((b) => { b.textContent = "Compartir"; });

async function copiar(texto) {
  try { await navigator.clipboard.writeText(texto); return true; } catch { /* sin permiso o sin API: se prueba el método clásico */ }
  const t = Object.assign(document.createElement("textarea"), { value: texto });
  t.setAttribute("readonly", ""); t.style.cssText = "position:fixed;top:0;left:0;opacity:0";
  document.body.append(t); t.select();
  let ok = false;
  try { ok = document.execCommand("copy"); } catch { ok = false; }
  t.remove();
  return ok;
}

let reponer = null;
botones.forEach((boton) => boton.addEventListener("click", async () => {
  if (compartirNativo) {
    try { await navigator.share({ title: document.title, url: location.href }); return; }
    catch (err) { if (err?.name === "AbortError") return; /* otro fallo: se copia */ }
  }
  const ok = await copiar(location.href);
  const original = boton.dataset.rotulo ?? (boton.dataset.rotulo = boton.textContent);
  boton.textContent = ok ? "Enlace copiado" : "No se pudo copiar";
  announce(ok ? "Enlace de esta consulta copiado" : "No se pudo copiar el enlace; cópialo de la barra de direcciones");
  clearTimeout(reponer);
  reponer = setTimeout(() => { boton.textContent = original; }, 2200);
}));
