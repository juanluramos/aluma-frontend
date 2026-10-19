import test from 'node:test';
import assert from 'node:assert/strict';
import { datosPerfil } from '../src/utils/perfilForm.ts';

const perfil = {
  nombre: 'Ana',
  apellido1: 'García',
  apellido2: null,
  telefono: null,
  email: 'ana@ejemplo.es',
};

test('Guardar el perfil no envía la contraseña si el campo va vacío', () => {
  const datos = datosPerfil(perfil, '   ');
  assert.equal(Object.hasOwn(datos, 'password'), false);
  assert.deepEqual(datos, {
    nombre: 'Ana',
    apellido1: 'García',
    apellido2: '',
    telefono: '',
    email: 'ana@ejemplo.es',
  });
});

test('Una contraseña escrita viaja recortada y sin el resto de campos administrativos', () => {
  const datos = datosPerfil(perfil, ' Clave123 ');
  assert.equal(datos.password, 'Clave123');
  assert.equal(Object.hasOwn(datos, 'id_rol'), false);
  assert.equal(Object.hasOwn(datos, 'socio'), false);
});
