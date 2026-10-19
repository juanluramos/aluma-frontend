import test from 'node:test';
import assert from 'node:assert/strict';
import { fechaHoyCalendario } from '../src/utils/fechaCalendario.ts';
import { obtenerValoresIniciales } from '../src/utils/usuarioFormState.ts';
import type { Usuario } from '../src/services/usuarioService.ts';

const usuarioEdicion: Usuario = {
  id_usuario: 42,
  codUsuario: 'ALU42',
  id_tipo_documento: 2,
  numeroDocumento: 'X1234567L',
  nombre: 'Ana',
  apellido1: 'García',
  apellido2: 'López',
  email: 'ana@example.test',
  telefono: '612345678',
  socio: true,
  matriculaPagada: true,
  id_rol: 3,
  id_estado_usuario: 2,
  comentario: 'Nota de prueba',
  fechaInscripcion: '2024-05-02',
};

const esperadoCreacion = {
  codUsuario: '',
  tipoDocumento: '',
  numeroDocumento: '',
  nombre: '',
  apellido1: '',
  apellido2: '',
  email: '',
  telefono: '',
  comentario: '',
  fechaInscripcion: fechaHoyCalendario(),
  password: '',
  confirmPassword: '',
  rol: '1',
  estado: '1',
  socio: false,
  matriculaPagada: false,
};

const esperadoEdicion = {
  codUsuario: 'ALU42',
  tipoDocumento: '2',
  numeroDocumento: 'X1234567L',
  nombre: 'Ana',
  apellido1: 'García',
  apellido2: 'López',
  email: 'ana@example.test',
  telefono: '612345678',
  comentario: 'Nota de prueba',
  fechaInscripcion: '2024-05-02',
  password: '',
  confirmPassword: '',
  rol: '3',
  estado: '2',
  socio: true,
  matriculaPagada: true,
};

test('Creación sin usuario: mismos defaults que los useState actuales', () => {
  assert.deepEqual(obtenerValoresIniciales('create'), esperadoCreacion);
  assert.deepEqual(obtenerValoresIniciales('create', undefined), esperadoCreacion);
});

test('Edición con usuario: copia los campos de negocio y deja las contraseñas vacías', () => {
  assert.deepEqual(obtenerValoresIniciales('edit', usuarioEdicion), esperadoEdicion);
});

test('Campos nullables del usuario se convierten a string vacío o false', () => {
  const conNulos: Usuario = {
    ...usuarioEdicion,
    codUsuario: null,
    id_tipo_documento: null,
    numeroDocumento: null,
    apellido1: null,
    apellido2: null,
    telefono: null,
    comentario: null,
  };

  const valores = obtenerValoresIniciales('edit', conNulos);

  assert.equal(valores.tipoDocumento, '');
  assert.equal(valores.numeroDocumento, '');
  assert.equal(valores.codUsuario, '');
  assert.equal(valores.apellido1, '');
  assert.equal(valores.apellido2, '');
  assert.equal(valores.telefono, '');
  assert.equal(valores.comentario, '');
  assert.equal(valores.password, '');
  assert.equal(valores.confirmPassword, '');
});

test('IDs numéricos se serializan como string, igual que String(...) en el modal', () => {
  const valores = obtenerValoresIniciales('edit', usuarioEdicion);

  assert.equal(valores.tipoDocumento, '2');
  assert.equal(valores.rol, '3');
  assert.equal(valores.estado, '2');
  assert.equal(typeof valores.tipoDocumento, 'string');
  assert.equal(typeof valores.rol, 'string');
  assert.equal(typeof valores.estado, 'string');
});

test('Sin usuario, create y edit comparten los mismos defaults actuales', () => {
  assert.deepEqual(obtenerValoresIniciales('edit'), esperadoCreacion);
});

test('Reinicio en creación: defaults, contraseñas vacías y booleanos en false', () => {
  const reinicio = obtenerValoresIniciales('create');

  assert.deepEqual(reinicio, esperadoCreacion);
  assert.equal(reinicio.password, '');
  assert.equal(reinicio.confirmPassword, '');
  assert.equal(reinicio.socio, false);
  assert.equal(reinicio.matriculaPagada, false);
});

test('Reinicio en edición: restaura el usuario original, no los valores modificados del formulario', () => {
  const formularioModificado = {
    ...esperadoEdicion,
    nombre: 'Nombre temporal',
    socio: false,
    matriculaPagada: false,
    password: 'ClaveTemporal1',
    confirmPassword: 'ClaveTemporal1',
    rol: '1',
    estado: '1',
  };

  const reinicio = obtenerValoresIniciales('edit', usuarioEdicion);

  assert.notDeepEqual(reinicio, formularioModificado);
  assert.deepEqual(reinicio, esperadoEdicion);
  assert.equal(reinicio.nombre, 'Ana');
  assert.equal(reinicio.socio, true);
  assert.equal(reinicio.matriculaPagada, true);
  assert.equal(reinicio.rol, '3');
  assert.equal(reinicio.estado, '2');
});

test('Reinicio en edición: password y confirmPassword siempre quedan vacías', () => {
  const reinicio = obtenerValoresIniciales('edit', usuarioEdicion);

  assert.equal(reinicio.password, '');
  assert.equal(reinicio.confirmPassword, '');
});

test('Reinicio en edición con booleanos en false: conserva false, no los convierte a true', () => {
  const usuarioSinFlags: Usuario = {
    ...usuarioEdicion,
    socio: false,
    matriculaPagada: false,
  };

  const reinicio = obtenerValoresIniciales('edit', usuarioSinFlags);

  assert.equal(reinicio.socio, false);
  assert.equal(reinicio.matriculaPagada, false);
});

test('Cancelar edición: el reinicio coincide con los valores originales del usuario de props', () => {
  const valoresAlAbrir = obtenerValoresIniciales('edit', usuarioEdicion);
  const valoresAlCancelar = obtenerValoresIniciales('edit', usuarioEdicion);

  assert.deepEqual(valoresAlCancelar, valoresAlAbrir);
  assert.deepEqual(valoresAlCancelar, esperadoEdicion);
});
