import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validarDni, validarNie, validarPasaporte, validarPermisoTrabajo,
  validarTelefono, validarEmail, validarPassword, validarCodigoUsuario,
  validarNombre, validarUsuario, normalizarUsuario, type FormularioUsuario,
} from '../src/utils/validacionesUsuario.ts';

const formulario: FormularioUsuario = {
  codUsuario: ' alu_01 ', tipoDocumento: '1', numeroDocumento: ' 12345678z ',
  nombre: ' María ', apellido1: ' Muñoz ', apellido2: '',
  email: ' MARIA@EJEMPLO.ES ', telefono: ' +34 612 345 678 ',
  comentario: ' Hola ', password: ' Clave123 ', confirmPassword: ' Clave123 ',
};

const casos: [string, (valor: string) => boolean, string[], string[]][] = [
  ['DNI', validarDni, ['12345678Z', ' 12345678z ', '00000000T'], ['12345678A', '1234567Z', '', '123456789Z']],
  ['NIE', validarNie, ['X1234567L', 'y1234567x', 'Z1234567R'], ['X1234567A', 'A1234567L', 'X123456L', '']],
  ['Pasaporte', validarPasaporte, ['ab12345', 'A'.repeat(20)], ['', 'AB12', 'AB-123', 'A'.repeat(21)]],
  ['Permiso', validarPermisoTrabajo, ['pt-12345', 'A'.repeat(30)], ['', 'AB12', 'AB_123', '-----', 'A'.repeat(31)]],
  ['Teléfono', validarTelefono, ['612345678', '+34 712 345 678', '912 345 678', '812345678'], ['', '123456789', '61234567', '+33612345678', '612ABC678', '6123456789', '900123456']],
  ['Email', validarEmail, [' María@example.es '.replace('María', 'Maria'), 'a.b+tag@example.com'], ['', 'a@', 'a b@example.es', 'a..b@example.es', '.a@example.es', 'a@-example.es', 'a@example..es']],
  ['Contraseña', validarPassword, ['Clave123', 'Segura123!'], ['', 'Clave12', 'clave123', 'CLAVE123', 'ClaveSegura']],
  ['Código', validarCodigoUsuario, ['', ' alu-01_a '], ['A'.repeat(11), 'ALU 01', 'ALU@1']],
  ['Nombre', validarNombre, [' María-José ', 'Muñoz', 'Jose\u0301'], ['', '   ', 'Ana2', '---', 'A'.repeat(51)]],
];
for (const [nombre, validar, validos, invalidos] of casos) {
  test(nombre, () => {
    for (const valor of validos) assert.equal(validar(valor), true, valor);
    for (const valor of invalidos) assert.equal(validar(valor), false, valor);
  });
}

test('Normalización sin modificar el formulario original', () => {
  const copia = { ...formulario };
  assert.deepEqual(validarUsuario(formulario), {});
  assert.deepEqual(normalizarUsuario(formulario), {
    codUsuario: 'ALU_01', tipoDocumento: '1', numeroDocumento: '12345678Z',
    nombre: 'María', apellido1: 'Muñoz', apellido2: '', email: 'maria@ejemplo.es',
    telefono: '+34612345678', comentario: 'Hola', password: 'Clave123', confirmPassword: 'Clave123',
  });
  assert.deepEqual(formulario, copia);
});

test('Documento depende del tipo y devuelve mensajes específicos', () => {
  for (const [tipoDocumento, numeroDocumento] of [['1', '12345678Z'], ['2', 'X1234567L'], ['3', 'AB12345'], ['4', 'PT-12345']]) {
    assert.deepEqual(validarUsuario({ ...formulario, tipoDocumento, numeroDocumento }), {});
  }
  const mensajes = ['El DNI no es válido.', 'El NIE no es válido.', 'El pasaporte no tiene un formato válido.', 'El permiso de trabajo no tiene un formato válido.'];
  mensajes.forEach((mensaje, i) => assert.equal(validarUsuario({ ...formulario, tipoDocumento: String(i + 1), numeroDocumento: '' }).numeroDocumento, mensaje));
  assert.ok(validarUsuario({ ...formulario, tipoDocumento: '5' }).tipoDocumento);
});

test('Opcionales, confirmación y límite de comentarios', () => {
  assert.deepEqual(validarUsuario({ ...formulario, telefono: '', codUsuario: '', apellido1: '', comentario: 'a'.repeat(500) }), {});
  assert.equal(validarUsuario({ ...formulario, confirmPassword: 'Otra1234' }).confirmPassword, 'Las contraseñas no coinciden.');
  assert.ok(validarUsuario({ ...formulario, comentario: 'a'.repeat(501) }).comentario);
  const errores = validarUsuario({ ...formulario, nombre: ' ', apellido1: '123', apellido2: '456', telefono: 'abc', email: 'abc', password: 'abc' });
  for (const campo of ['nombre', 'apellido1', 'apellido2', 'telefono', 'email', 'password'] as const) assert.ok(errores[campo]);
});
