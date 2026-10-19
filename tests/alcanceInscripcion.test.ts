import test from 'node:test';
import assert from 'node:assert/strict';
import { inscripcionesDeLaSesion } from '../src/utils/alcanceInscripcion.ts';

const lista = [
  { id_inscripcion: 1, id_usuario: 4 },
  { id_inscripcion: 2, id_usuario: 9 },
];

test('Quien gestiona inscripciones ve el listado completo', () => {
  assert.deepEqual(inscripcionesDeLaSesion(lista, true, 4), lista);
});

test('Un usuario solo ve sus inscripciones', () => {
  assert.deepEqual(inscripcionesDeLaSesion(lista, false, 4), [lista[0]]);
});

test('Sin id de sesión no se muestra ninguna inscripción ajena', () => {
  assert.deepEqual(inscripcionesDeLaSesion(lista, false, null), []);
});
