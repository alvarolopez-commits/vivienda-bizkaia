// Estado de la presentación: qué diapositiva y qué paso se ve. Lógica pura, sin DOM (se prueba con Node).
// Una dirección es «#/<diapositiva>/<paso>», con los dos números desde 1. Cualquier dirección, válida o no, produce un estado válido.

/** Las nueve diapositivas, en el orden del Resumen, y cuántos pasos tiene cada una. */
export const DIAPOSITIVAS = Object.freeze([
  Object.freeze({ id: "gancho", pasos: 1 }),
  Object.freeze({ id: "cifras", pasos: 4 }),
  Object.freeze({ id: "calculadora", pasos: 1 }),
  Object.freeze({ id: "siete", pasos: 7 }), // un paso por tipo de municipio
  Object.freeze({ id: "viene", pasos: 3 }), // un paso por ritmo de construcción
  Object.freeze({ id: "hacer", pasos: 1 }),
  Object.freeze({ id: "conclusiones", pasos: 2 }), // el diagnóstico y qué hacer
  Object.freeze({ id: "bm30", pasos: 1 }),
  Object.freeze({ id: "cierre", pasos: 1 }),
]);

const entre = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const entero = (texto) => (/^-?\d+$/.test(texto ?? "") ? Number(texto) : null);

export const inicio = () => ({ d: 1, p: 1 });
export const fin = () => ({ d: DIAPOSITIVAS.length, p: 1 });

/** «#/2/3» → { d: 2, p: 3 }. Lo vacío o ilegible cae en el inicio; un número fuera de rango, en el más cercano válido. */
export function leerHash(hash) {
  const [, d, p] = /^#?\/?([^/]*)\/?([^/]*)/.exec(String(hash ?? "")) ?? [];
  const dd = entero(d);
  if (dd === null) return inicio();
  const dia = entre(dd, 1, DIAPOSITIVAS.length);
  const pp = entero(p);
  return { d: dia, p: pp === null ? 1 : entre(pp, 1, DIAPOSITIVAS[dia - 1].pasos) };
}

/** { d: 2, p: 3 } → «#/2/3» */
export const escribirHash = ({ d, p }) => `#/${d}/${p}`;

/** El estado siguiente (paso y, al agotarlos, diapositiva), o null si ya es el último. */
export function siguiente({ d, p }) {
  if (p < DIAPOSITIVAS[d - 1].pasos) return { d, p: p + 1 };
  return d < DIAPOSITIVAS.length ? { d: d + 1, p: 1 } : null;
}

/** El estado anterior; al volver a una diapositiva se entra por su último paso. Null si ya es el primero. */
export function anterior({ d, p }) {
  if (p > 1) return { d, p: p - 1 };
  return d > 1 ? { d: d - 1, p: DIAPOSITIVAS[d - 2].pasos } : null;
}
