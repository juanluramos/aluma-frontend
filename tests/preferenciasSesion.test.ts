import test from 'node:test';
import assert from 'node:assert/strict';
import { guardarPreferencia, leerPreferencia, limpiarPreferenciasSesion } from '../src/utils/preferenciasSesion.ts';

test('restaura filtros y orden por listado y limpia solo las preferencias de sesión', () => {
  const datos = new Map<string, string>();
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: {
    getItem: (clave: string) => datos.get(clave) ?? null,
    setItem: (clave: string, valor: string) => datos.set(clave, valor),
    removeItem: (clave: string) => datos.delete(clave),
    key: (indice: number) => [...datos.keys()][indice] ?? null,
    get length() { return datos.size; },
  } });
  try {
    guardarPreferencia('usuarios.campoOrden', 'codigo');
    guardarPreferencia('actividades.estadoFiltro', ['inactivo', 'pendiente']);
    guardarPreferencia('inscripciones.estadoFiltro', []);
    assert.equal(leerPreferencia('usuarios.campoOrden', 'nombre', ['codigo', 'nombre']), 'codigo');
    assert.deepEqual(leerPreferencia('actividades.estadoFiltro', ['activo']), ['inactivo', 'pendiente']);
    assert.deepEqual(leerPreferencia('inscripciones.estadoFiltro', ['Activa']), []);
    assert.equal(leerPreferencia('actividades.campoOrden', 'titulo'), 'titulo');
    datos.set('aluma.listado.usuarios.campoOrden', '"invalido"');
    assert.equal(leerPreferencia('usuarios.campoOrden', 'nombre', ['codigo', 'nombre']), 'nombre');
    datos.set('aluma.listado.usuarios.pagina', '{');
    assert.equal(leerPreferencia('usuarios.pagina', 1), 1);
    datos.set('otra-configuracion', 'conservar');
    limpiarPreferenciasSesion();
    assert.deepEqual([...datos], [['otra-configuracion', 'conservar']]);
  } finally {
    Reflect.deleteProperty(globalThis, 'sessionStorage');
  }
});

test('funciona sin almacenamiento disponible', () => {
  assert.equal(leerPreferencia('usuarios.busqueda', ''), '');
  assert.doesNotThrow(() => guardarPreferencia('usuarios.busqueda', 'Ana'));
  assert.doesNotThrow(limpiarPreferenciasSesion);
});
