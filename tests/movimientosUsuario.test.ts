import test from 'node:test';
import assert from 'node:assert/strict';
import { movimientosDeUsuario, textoFechaMovimiento } from '../src/utils/movimientosUsuario.ts';

test('La fecha de un movimiento se muestra como día/mes/año corto', () => {
  assert.equal(textoFechaMovimiento('2026-01-01'), '1/1/26');
  assert.equal(textoFechaMovimiento('2026-03-02T00:00:00.000Z'), '2/3/26');
  assert.equal(textoFechaMovimiento(''), '');
});

test('Los movimientos del usuario mezclan actividades y cuotas por fecha', () => {
  const filas = movimientosDeUsuario(
    7,
    [
      { id_usuario: 7, id_actividad: 3, apuntadoFecha: '2026-02-01', Actividad: { titulo: 'Visita a Málaga' } },
      { id_usuario: 9, id_actividad: 3, apuntadoFecha: '2026-01-01', Actividad: { titulo: 'Otra persona' } },
      { id_usuario: 7, id_actividad: 4, apuntadoFecha: '2026-04-01', Actividad: null },
    ],
    [
      { id_actividad: 3, titulo: 'Visita a Málaga', fecha: '2026-01-01' },
      { id_actividad: 4, titulo: 'Taller de lectura', fecha: null },
    ],
    [
      { id_usuario: 7, pagoAnio: 2027, fechaPago: '2026-03-02' },
      { id_usuario: 8, pagoAnio: 2026, fechaPago: '2026-01-15' },
    ],
  );

  assert.deepEqual(filas.map(fila => [fila.textoFecha, fila.descripcion]), [
    ['1/1/26', 'Visita a Málaga'],
    ['2/3/26', 'Cuota 2027'],
    ['1/4/26', 'Taller de lectura'],
  ]);
});
