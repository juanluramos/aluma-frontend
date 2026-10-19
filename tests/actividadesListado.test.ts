import test from 'node:test';
import assert from 'node:assert/strict';
import { filtrarActividades, ordenarActividades } from '../src/utils/actividadesListado.ts';
import type { Actividad } from '../src/types/actividad.ts';

function actividad(
  id: number,
  titulo: string,
  fecha: string | null,
): Actividad {
  return {
    id_actividad: id,
    titulo,
    fecha,
    aforo: 10,
    plazasOcupadas: 0,
    plazasDisponibles: 10,
    personasEnEspera: 0,
    importeSocio: null,
    importeNoSocio: null,
    id_estado_actividad: 1,
  };
}

const lista: Actividad[] = [
  actividad(1, 'Zumba', '2026-03-01'),
  actividad(2, 'Ágora', '2026-01-15'),
  actividad(3, 'Ballet 10', null),
  actividad(4, 'Ballet 2', '2026-02-01'),
];

test('ordenar por título ascendente ignora mayúsculas y tildes', () => {
  const orden = ordenarActividades(lista, 'titulo', 'asc').map((item) => item.titulo);
  assert.deepEqual(orden, ['Ágora', 'Ballet 2', 'Ballet 10', 'Zumba']);
});

test('ordenar por título descendente invierte el orden', () => {
  const orden = ordenarActividades(lista, 'titulo', 'desc').map((item) => item.titulo);
  assert.deepEqual(orden, ['Zumba', 'Ballet 10', 'Ballet 2', 'Ágora']);
});

test('ordenar por fecha ascendente deja las actividades sin fecha al final', () => {
  const orden = ordenarActividades(lista, 'fecha', 'asc').map((item) => item.id_actividad);
  assert.deepEqual(orden, [2, 4, 1, 3]);
});

test('ordenar por fecha descendente mantiene sin fecha al final', () => {
  const orden = ordenarActividades(lista, 'fecha', 'desc').map((item) => item.id_actividad);
  assert.deepEqual(orden, [1, 4, 2, 3]);
});

test('ordenarActividades no muta el array original', () => {
  const copia = [...lista];
  ordenarActividades(lista, 'titulo', 'desc');
  assert.deepEqual(lista.map((item) => item.id_actividad), copia.map((item) => item.id_actividad));
});

test('la búsqueda y el orden ignoran la ocupación', () => {
  const conOcupacion: Actividad[] = [
    { ...actividad(1, 'Zumba', '2026-03-01'), plazasOcupadas: 25, plazasDisponibles: 0, personasEnEspera: 4 },
    { ...actividad(2, 'Ágora', '2026-01-15'), plazasOcupadas: 0, plazasDisponibles: null, aforo: null },
    { ...actividad(4, 'Ballet 2', '2026-02-01'), plazasOcupadas: 18, plazasDisponibles: 2, personasEnEspera: 0 },
    { ...actividad(5, 'Cerrada', '2026-04-01'), id_estado_actividad: 2, plazasOcupadas: 1 },
  ];
  const encontradas = filtrarActividades(conOcupacion, 'ballet', ['activo']);
  assert.deepEqual(encontradas.map((item) => item.titulo), ['Ballet 2']);
  const orden = ordenarActividades(filtrarActividades(conOcupacion, '', ['activo']), 'titulo', 'asc');
  assert.deepEqual(orden.map((item) => item.titulo), ['Ágora', 'Ballet 2', 'Zumba']);
  assert.equal(filtrarActividades(conOcupacion, '18/20', ['activo']).length, 0);
});
