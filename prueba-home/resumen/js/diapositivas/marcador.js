// Diapositiva provisional: ocupa su sitio en el marco hasta que se monta la real (tareas 4 a 6 del plan).
// Contrato de una diapositiva: { id, pasos, raiz, ir(paso, dir) }.

/** @returns {{id: string, pasos: number, raiz: HTMLElement, ir: (paso: number, dir: 1|-1|0) => void}} */
export function crearMarcador(id, pasos) {
  const raiz = document.createElement("section");
  raiz.className = "diapositiva";
  raiz.dataset.diapositiva = id;
  raiz.dataset.estado = "inactiva";
  raiz.innerHTML = `<div class="marcador"><p>Diapositiva «${id}» · se monta en una tarea posterior</p></div>`;
  return { id, pasos, raiz, ir() {} };
}
