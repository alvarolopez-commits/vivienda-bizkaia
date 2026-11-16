// Notas del orador de la fase 1. PROPUESTA: texto nuevo, pendiente de aprobación del autor (el panel lo avisa con data-propuesta).
import { DIAPOSITIVAS } from "./estado.js";

// Solo usan cifras y frases que ya están en el Resumen (qa-notas.js lo comprueba contra _qa/textos.json) y solo se ven en Presentar.

/** Diapositivas de un paso: dos o tres frases. Las de varios pasos (2, 4, 5 y 7): una nota por paso. */
export const NOTAS = Object.freeze({
  1: Object.freeze([
    "Empieza por el problema, no por los datos: falta vivienda asequible.",
    "El alquiler expulsa a los ingresos bajos y reunir la entrada frena a los medios. Todo lo que sigue explica esas dos frases.",
    "Avanza con la flecha derecha, o con «Calcula tu entrada» si quieres ir directo a la calculadora.",
  ]),
  2: Object.freeze([
    "34 de 35: en casi todos los municipios con dato de alquiler, un alquiler nuevo pasa del 30 % de unos ingresos bajos. Es un cálculo propio con EMAL y Eustat, 2024.",
    "Bilbao es el caso más claro: un alquiler nuevo se lleva el 55,8 % de unos ingresos bajos, frente al 30,4 % de los ingresos medios.",
    "Mundaka: 47,1 viviendas turísticas por cada 1.000, frente a 4,8 en Bizkaia. Dato oficial del Registro vasco y Eustat.",
    "En los pueblos pequeños, 53 de 63 tienen una casa de cada cinco vacía o secundaria. Dato oficial de Eustat, 2024.",
  ]),
  3: Object.freeze([
    "Invita a probarlo en directo: elige un hogar y un precio.",
    "Con ingresos medios y el precio medio de Bizkaia, la entrada lleva de 10,8 a 16,9 años, y después la cuota es del 29,0 al 32,6 % de los ingresos.",
    "Si preguntan cómo se calcula, abre «Cómo se calcula»: el banco presta el 80 % del precio y el resto se ahorra.",
  ]),
  // Siete Bizkaias: una nota por tipo de municipio
  4: Object.freeze([
    "Bilbao es un tipo en sí mismo: 346.933 habitantes y un alquiler caro para sus ingresos.",
    "11 ciudades con ingresos bajo la media, 358.998 habitantes: muchas viviendas turísticas, o muchas inscritas hace poco, en 5 de 11.",
    "4 ciudades con ingresos sobre la media, 147.740 habitantes: los hogares crecen más que las viviendas, en 3 de 4.",
    "5 municipios en crecimiento, 66.425 habitantes: los hogares crecen más que las viviendas, en 4 de 5.",
    "9 municipios de costa turística, 56.027 habitantes: en los 9 hay muchas viviendas turísticas, o muchas inscritas hace poco.",
    "20 pueblos medianos, de 3.000 a 10.000 habitantes, 116.827 en total: los hogares crecen más que las viviendas, en 6 de 20.",
    "63 pueblos pequeños, de menos de 3.000 habitantes, 62.783 en total: en 53 de 63 hay muchas viviendas vacías o de segunda residencia.",
  ]),
  // Lo que viene: una nota por ritmo de construcción
  5: Object.freeze([
    "Al ritmo de hoy, 2.679 viviendas nuevas al año: en 2035 faltarán 12.700 más que hoy y la entrada llevará 17,0 a 17,8 años.",
    "Con 3.900 al año se evita empeorar. El resultado sale del mismo modelo: cambia el ritmo y se recalcula la frase.",
    "Con 4.800 al año, lo que permiten los planes. Es una aproximación: los estudios no coinciden y por eso hay una horquilla.",
  ]),
  6: Object.freeze([
    "34 medidas en seis líneas; 30 se pueden aplicar ya, sin cambiar ninguna ley.",
    "Rápidas son las de corto plazo; probadas, las de evidencia media o mejor.",
    "Mira la última columna para ver qué parte puede impulsar o facilitar cada línea.",
  ]),
  // Diez conclusiones: una nota por grupo
  7: Object.freeze([
    "El diagnóstico en cuatro conclusiones: el alquiler es el problema más grave (34 de 35 municipios) y para comprar la barrera es la entrada (10,8 a 16,9 años).",
    "Qué hacer en seis conclusiones: al ritmo actual faltarán 12.700 viviendas en 2035, y casi todo se puede hacer ya: 30 de 34 medidas.",
  ]),
  8: Object.freeze([
    "Las 34 medidas se reparten así: impulsar 3, facilitar 21 y pedir 10.",
    "Impulsar son las que se pueden empujar directamente; facilitar, sobre todo construir más y poner en uso las viviendas que ya existen.",
    "Pedir son las que deciden otras instituciones: ayudas, impuestos y vivienda pública.",
  ]),
  9: Object.freeze([
    "Se cierra con el enlace al análisis municipio a municipio y con el radar que lo sigue.",
    "Las fuentes y los créditos de las imágenes están abajo; todos los datos son agregados, descargados en octubre de 2026.",
  ]),
});

/** Las notas de un estado { d, p }: la de su paso si la diapositiva tiene varios pasos; todas las frases si tiene uno. */
export function textoNotas({ d, p }) {
  const notas = NOTAS[d] ?? [];
  return DIAPOSITIVAS[d - 1]?.pasos > 1 ? [notas[p - 1]].filter(Boolean) : [...notas];
}
