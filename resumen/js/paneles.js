// Paneles modales (créditos de las imágenes, «Cómo se calcula»): un <dialog> con su botón de apertura.
// Escape lo cierra (también el evento sintético de las pruebas), el foco vuelve al botón y, con el panel abierto, app.js
// no interpreta el teclado (esDeOtro: dialog[open]).

/** @param {HTMLDialogElement} dialog @param {HTMLElement} abridor */
export function enlazarPanel(dialog, abridor) {
  abridor.addEventListener("click", () => { if (!dialog.open) { dialog._abridor = abridor; dialog.showModal(); } }); // varios botones pueden abrir el mismo panel
  if (dialog._enlazado) return;
  dialog._enlazado = true;
  dialog.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { e.preventDefault(); dialog.close(); }
  });
  dialog.addEventListener("close", () => dialog._abridor?.focus()); // el foco vuelve al botón que lo abrió
}

/** Crea un panel con título y cuerpo ya escritos (HTML del Resumen) y un botón «Cerrar». Se añade al <body>. */
export function crearPanel({ id, titulo, cuerpoHtml }) {
  const dialog = document.createElement("dialog");
  dialog.id = id;
  dialog.className = "panel vidrio-foco";
  dialog.setAttribute("aria-labelledby", `${id}-t`);
  dialog.innerHTML = `<h2 id="${id}-t">${titulo}</h2>${cuerpoHtml}<form method="dialog"><button class="boton texto principal">Cerrar</button></form>`;
  document.body.append(dialog);
  return dialog;
}
