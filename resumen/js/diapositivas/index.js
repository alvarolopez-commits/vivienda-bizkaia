// Las diapositivas de la presentación, en el orden del Resumen. Cada una cumple { id, pasos, raiz, ir(paso, dir) } y, opcionalmente, alEntrar(dir) y tema.
import { DIAPOSITIVAS } from "../estado.js";
import { crearBm30 } from "./bm30.js";
import { crearCalculadora } from "./calculadora.js";
import { crearCierre } from "./cierre.js";
import { crearCifras } from "./cifras.js";
import { crearConclusiones } from "./conclusiones.js";
import { crearGancho } from "./gancho.js";
import { crearHacer } from "./hacer.js";
import { crearMarcador } from "./marcador.js";
import { crearSiete } from "./siete.js";
import { crearViene } from "./viene.js";

const CREADORES = { gancho: crearGancho, cifras: crearCifras, calculadora: crearCalculadora, siete: crearSiete, viene: crearViene, hacer: crearHacer, conclusiones: crearConclusiones, bm30: crearBm30, cierre: crearCierre };

/** Crea todas las diapositivas. Las que aún no tienen módulo propio son marcadores. */
export function crearDiapositivas(ctx) {
  return DIAPOSITIVAS.map(({ id, pasos }) => (CREADORES[id] ? CREADORES[id](ctx) : crearMarcador(id, pasos)));
}
