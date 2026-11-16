// Los dos modos de la presentación: Presentar (proyectada y explicada, pantalla completa) y Leer (enlace enviado, se recorre sola).
// Presentar usa movimiento «expressive»; Leer, «restrained» (DCI §9.2). ?mov=quieto|sobrio|expresivo lo fuerza (como en el Análisis).

const POR_MOV = { quieto: "still", sobrio: "restrained", expresivo: "expressive" };

/** «?modo=presentar» → 'presentar'; cualquier otra cosa → 'leer' (lo que ve quien recibe el enlace). */
export function modoInicial(search = "") {
  return new URLSearchParams(search).get("modo") === "presentar" ? "presentar" : "leer";
}

/** Intensidad de movimiento del modo; ?mov= tiene prioridad. */
export function intensidad(modo, search = "") {
  const forzada = POR_MOV[new URLSearchParams(search).get("mov")];
  return forzada ?? (modo === "presentar" ? "expressive" : "restrained");
}

/** Pide la pantalla completa. Devuelve false (sin lanzar) si el navegador lo rechaza o no la admite. */
export async function entrarPantallaCompleta() {
  try {
    await document.documentElement.requestFullscreen();
    return true;
  } catch {
    return false;
  }
}

/** Sale de la pantalla completa si está activa. Nunca lanza. */
export async function salirPantallaCompleta() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
  } catch {
    /* ya no estaba */
  }
}
