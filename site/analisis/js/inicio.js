// Inicio (retirado el 2026-11-17). Antes: hero editorial con el fondo «flow» y los botones «Explorar el análisis» y «Ver el resumen», visible solo con la dirección
// raíz y con Situación debajo. Ahora el Análisis se abre directamente en Situación y la portada del proyecto (../) hace de puerta a los tres productos.
// Se conservan las dos exportaciones que usa app.js para no tocar el resto de la aplicación.
export const esInicio = () => false;

export function sincronizar() {
  document.documentElement.classList.remove("con-inicio");
  // sin hero, el encabezado de la vista Situación vuelve a ser el principal de la página
  const h1 = document.getElementById("vista")?.querySelector("h1");
  if (h1) { h1.removeAttribute("role"); h1.removeAttribute("aria-level"); }
}
