// Lógica pura de navegación: node --test presentacion/_qa/estado.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { DIAPOSITIVAS, leerHash, escribirHash, siguiente, anterior, inicio, fin } from "../js/estado.js";

const PASOS = [["gancho", 1], ["cifras", 4], ["calculadora", 1], ["siete", 7], ["viene", 3], ["hacer", 1], ["conclusiones", 2], ["bm30", 1], ["cierre", 1]];
const TODOS = PASOS.flatMap(([, n], i) => Array.from({ length: n }, (_, p) => `#/${i + 1}/${p + 1}`));

test("hay nueve diapositivas, en el orden del Resumen, con sus pasos", () => {
  assert.deepEqual(DIAPOSITIVAS.map((d) => [d.id, d.pasos]), PASOS);
});

test("leerHash lee diapositiva y paso", () => {
  assert.deepEqual(leerHash("#/2/3"), { d: 2, p: 3 });
  assert.deepEqual(leerHash("#/2"), { d: 2, p: 1 });
  assert.deepEqual(leerHash("#/4/7"), { d: 4, p: 7 });
  assert.deepEqual(leerHash("#/9/1"), { d: 9, p: 1 });
});

test("leerHash con vacío o basura cae en el inicio", () => {
  assert.deepEqual(leerHash(""), { d: 1, p: 1 });
  assert.deepEqual(leerHash("#/abc"), { d: 1, p: 1 });
  assert.deepEqual(leerHash("#"), { d: 1, p: 1 });
  assert.deepEqual(leerHash("#/2/x"), { d: 2, p: 1 });
  assert.deepEqual(leerHash(undefined), { d: 1, p: 1 });
});

test("leerHash ajusta lo inválido al estado válido más cercano", () => {
  assert.deepEqual(leerHash("#/9/9"), { d: 9, p: 1 });
  assert.deepEqual(leerHash("#/10"), { d: 9, p: 1 });
  assert.deepEqual(leerHash("#/0"), { d: 1, p: 1 });
  assert.deepEqual(leerHash("#/-3/2"), { d: 1, p: 1 });
  assert.deepEqual(leerHash("#/2/9"), { d: 2, p: 4 });
  assert.deepEqual(leerHash("#/4/9"), { d: 4, p: 7 });
  assert.deepEqual(leerHash("#/5/0"), { d: 5, p: 1 });
  assert.deepEqual(leerHash("#/1/4"), { d: 1, p: 1 });
  assert.deepEqual(leerHash("#/2/2.7"), { d: 2, p: 1 });
});

test("siguiente avanza de paso y luego de diapositiva; null al final", () => {
  assert.deepEqual(siguiente({ d: 1, p: 1 }), { d: 2, p: 1 });
  assert.deepEqual(siguiente({ d: 2, p: 4 }), { d: 3, p: 1 });
  assert.deepEqual(siguiente({ d: 3, p: 1 }), { d: 4, p: 1 });
  assert.deepEqual(siguiente({ d: 4, p: 7 }), { d: 5, p: 1 });
  assert.deepEqual(siguiente({ d: 7, p: 1 }), { d: 7, p: 2 });
  assert.equal(siguiente({ d: 9, p: 1 }), null);
});

test("anterior retrocede de paso y entra en la diapositiva previa por su último paso; null al inicio", () => {
  assert.deepEqual(anterior({ d: 2, p: 2 }), { d: 2, p: 1 });
  assert.deepEqual(anterior({ d: 3, p: 1 }), { d: 2, p: 4 });
  assert.deepEqual(anterior({ d: 5, p: 1 }), { d: 4, p: 7 });
  assert.deepEqual(anterior({ d: 8, p: 1 }), { d: 7, p: 2 });
  assert.equal(anterior({ d: 1, p: 1 }), null);
});

test("inicio y fin", () => {
  assert.deepEqual(inicio(), { d: 1, p: 1 });
  assert.deepEqual(fin(), { d: 9, p: 1 });
});

test("escribirHash es idempotente con leerHash para todo estado válido", () => {
  for (const h of TODOS) assert.equal(escribirHash(leerHash(h)), h);
});

test("recorrer siguiente desde el inicio visita los 21 estados en orden y termina", () => {
  const vistos = [];
  for (let e = inicio(); e; e = siguiente(e)) vistos.push(escribirHash(e));
  assert.equal(vistos.length, 21);
  assert.deepEqual(vistos, TODOS);
});

test("recorrer anterior desde el final vuelve por los mismos 21 estados", () => {
  const vistos = [];
  for (let e = fin(); e; e = anterior(e)) vistos.push(escribirHash(e));
  assert.deepEqual(vistos, [...TODOS].reverse());
});
