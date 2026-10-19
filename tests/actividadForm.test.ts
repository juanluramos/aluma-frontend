import test from 'node:test';
import assert from 'node:assert/strict';
import { obtenerValoresIniciales } from '../src/utils/actividadFormState.ts';
import { construirDatosActividad } from '../src/utils/actividadFormPayload.ts';
import { validarActividad } from '../src/utils/validacionesActividad.ts';

const original = { id_actividad: 1, titulo: 'Taller', fecha: '2026-10-14T00:00:00.000Z', aforo: 20, plazasOcupadas: 3, plazasDisponibles: 17, personasEnEspera: 0, importeSocio: '0.00', importeNoSocio: '12.50', id_estado_actividad: 1, comentario: 'Notas' };

test('creación vacía y precarga completa, sin alterar el original', () => {
  assert.ok(Object.values(obtenerValoresIniciales()).every(valor => valor === ''));
  const valores = obtenerValoresIniciales(original);
  assert.equal(valores.fecha, '2026-10-14');
  assert.equal(valores.aforo, '20');
  assert.equal(valores.comentario, 'Notas');
  assert.deepEqual(validarActividad(valores), {});
  valores.titulo = 'Cambio';
  assert.equal(original.titulo, 'Taller');
});

test('payload distingue cero, null y aforo omitido', () => {
  const valores = { ...obtenerValoresIniciales(), titulo: ' Taller ', id_estado_actividad: '3', importeSocio: '0' };
  assert.deepEqual(construirDatosActividad(valores), { titulo: 'Taller', fecha: null, importeSocio: 0, importeNoSocio: null, id_estado_actividad: 3, comentario: null });
});

test('límites del backend, fechas imposibles y estados desconocidos', () => {
  const valores = obtenerValoresIniciales(original);
  for (const aforo of ['0', '-1', '1.5', '2147483648']) assert.ok(validarActividad({ ...valores, aforo }).aforo);
  for (const importeSocio of ['-1', '1.001', '100000000', 'Infinity']) assert.ok(validarActividad({ ...valores, importeSocio }).importeSocio);
  assert.ok(validarActividad({ ...valores, fecha: '2026-02-30' }).fecha);
  assert.ok(validarActividad({ ...valores, titulo: ' '.repeat(2) }).titulo);
  assert.ok(validarActividad({ ...valores, titulo: 'a'.repeat(101) }).titulo);
  assert.ok(validarActividad({ ...valores, id_estado_actividad: '4' }).id_estado_actividad);
  assert.equal(validarActividad({ ...valores, aforo: '' }).aforo, undefined);
  assert.deepEqual(validarActividad({ ...valores, aforo: '2147483647', importeSocio: '99999999.99' }), {});
});

for (const [antes, entrada, esperado] of [
  [20, '30', 30], [20, '10', 10], [20, '', null], [null, '20', 20],
  [20, '20', undefined], [null, '', undefined],
] as const) {
  test(`aforo ${antes} → ${entrada || 'ilimitado'}: payload ${esperado}`, () => {
    const actividad = { ...original, aforo: antes };
    const valores = { ...obtenerValoresIniciales(actividad), aforo: entrada };
    assert.deepEqual(validarActividad(valores), {});
    const payload = construirDatosActividad(valores, actividad);
    assert.equal(payload.aforo, esperado);
    assert.equal(Object.hasOwn(payload, 'aforo'), esperado !== undefined);
    assert.equal(Object.hasOwn(JSON.parse(JSON.stringify(payload)), 'aforo'), esperado !== undefined);
    assert.equal(actividad.aforo, antes);
  });
}
