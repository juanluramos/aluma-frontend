import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validarDni, validarNie, validarPasaporte, validarPermisoTrabajo,
  validarTelefono, validarEmail, validarPassword, validarCodigoUsuario,
  validarNombre, validarDocumentoUsuario, validarUsuario, normalizarUsuario, type FormularioUsuario,
} from '../src/utils/validacionesUsuario.ts';

const formulario: FormularioUsuario = {
  codUsuario: ' alu_01 ', tipoDocumento: '1', numeroDocumento: ' 12345678z ',
  nombre: ' María ', apellido1: ' Muñoz ', apellido2: '',
  email: ' MARIA@EJEMPLO.ES ', telefono: ' +34 612 345 678 ',
  comentario: ' Hola ', fechaInscripcion: '2026-10-18', password: ' Clave123 ', confirmPassword: ' Clave123 ',
};

const casos: [string, (valor: string) => boolean, string[], string[]][] = [
  ['DNI', validarDni, ['12345678Z', ' 12345678z ', '00000000T'], ['12345678A', '1234567Z', '', '123456789Z']],
  ['NIE', validarNie, ['X1234567L', 'y1234567x', 'Z1234567R'], ['X1234567A', 'A1234567L', 'X123456L', 'X12345!7L', '']],
  ['Pasaporte', validarPasaporte, ['ab12345', '123456789', 'ABC123456', 'A'.repeat(20)], ['', '   ', 'AB12', 'AB-123', 'AB<123', 'A B123', 'A'.repeat(21)]],
  ['Permiso', validarPermisoTrabajo, ['pt-12345', 'A'.repeat(30), 'x1234567l', 'Y1234567X', 'Z1234567R'], ['', 'AB12', 'AB_123', '-----', 'A'.repeat(31), 'X1234567A', 'Y1234567A', 'Z1234567A']],
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
  assert.deepEqual(validarUsuario(formulario, 'create'), {});
  assert.deepEqual(normalizarUsuario(formulario), {
    codUsuario: 'ALU_01', tipoDocumento: '1', numeroDocumento: '12345678Z',
    nombre: 'María', apellido1: 'Muñoz', apellido2: '', email: 'maria@ejemplo.es',
    telefono: '+34612345678', comentario: 'Hola', fechaInscripcion: '2026-10-18', password: 'Clave123', confirmPassword: 'Clave123',
  });
  assert.deepEqual(formulario, copia);
});

test('Documento depende del tipo y devuelve mensajes específicos', () => {
  for (const [tipoDocumento, numeroDocumento] of [['1', '12345678Z'], ['2', 'X1234567L'], ['3', 'AB12345'], ['4', 'PT-12345']]) {
    assert.deepEqual(validarUsuario({ ...formulario, tipoDocumento, numeroDocumento }, 'create'), {});
  }
  const mensajes = ['El DNI no es válido.', 'El NIE no es válido.', 'El pasaporte no tiene un formato válido.', 'El permiso de trabajo no tiene un formato válido.'];
  mensajes.forEach((mensaje, i) => assert.equal(validarUsuario({ ...formulario, tipoDocumento: String(i + 1), numeroDocumento: '' }, 'create').numeroDocumento, mensaje));
  assert.ok(validarUsuario({ ...formulario, tipoDocumento: '5' }, 'create').tipoDocumento);
  assert.deepEqual(validarUsuario({ ...formulario, tipoDocumento: '', numeroDocumento: '' }, 'create'), {});
  assert.deepEqual(validarUsuario({ ...formulario, tipoDocumento: ' ', numeroDocumento: '  ' }, 'edit'), {});
  assert.deepEqual(validarDocumentoUsuario('', ''), {});
  assert.equal(validarUsuario({ ...formulario, fechaInscripcion: '' }, 'create').fechaInscripcion, 'La fecha de inscripción es obligatoria.');
  assert.equal(validarUsuario({ ...formulario, fechaInscripcion: '2026-02-31' }, 'edit').fechaInscripcion, 'La fecha de inscripción no es válida.');
  assert.equal(validarUsuario({ ...formulario, fechaInscripcion: '', password: '', confirmPassword: '' }, 'edit').fechaInscripcion, 'La fecha de inscripción es obligatoria.');
  assert.equal(validarUsuario({ ...formulario, fechaInscripcion: '', password: '', confirmPassword: '' }, 'edit').password, undefined);
});

test('Opcionales, confirmación y límite de comentarios', () => {
  assert.deepEqual(validarUsuario({ ...formulario, telefono: '', codUsuario: '', apellido1: '', comentario: 'a'.repeat(500) }, 'create'), {});
  assert.equal(validarUsuario({ ...formulario, confirmPassword: 'Otra1234' }, 'create', { exigePassword: true }).confirmPassword, 'Las contraseñas no coinciden.');
  assert.ok(validarUsuario({ ...formulario, comentario: 'a'.repeat(501) }, 'create').comentario);
  const errores = validarUsuario({ ...formulario, nombre: ' ', apellido1: '123', apellido2: '456', telefono: 'abc', email: 'abc', password: 'abc' }, 'create', { exigePassword: true });
  for (const campo of ['nombre', 'apellido1', 'apellido2', 'telefono', 'email', 'password'] as const) assert.ok(errores[campo]);
});


test('Contraseñas obligatorias solo al crear operador o administrador', () => {
  const sinPassword = { ...formulario, password: '', confirmPassword: '' };
  const errores = validarUsuario(sinPassword, 'create', { exigePassword: true });
  assert.ok(errores.password);
  assert.ok(errores.confirmPassword);
  assert.equal(validarUsuario(sinPassword, 'create').password, undefined);
  const sinEmail = { ...formulario, email: '' };
  assert.equal(validarUsuario(sinEmail, 'create').email, undefined);
  assert.ok(validarUsuario(sinEmail, 'create', { exigeEmail: true }).email);
  assert.equal(validarUsuario({ ...sinEmail, email: 'ana@ejemplo.test' }, 'create', { exigeEmail: true }).email, undefined);
  assert.deepEqual(validarUsuario(sinPassword, 'edit'), {});
  assert.ok(validarUsuario({ ...sinPassword, email: 'incorrecto' }, 'edit').email);
});

test('Editar una contraseña aplica las mismas reglas que crearla', () => {
  for (const [password, confirmPassword, campoError] of [
    ['Clave123', '', 'confirmPassword'],
    ['', 'Clave123', 'password'],
    ['Clave12', 'Clave12', 'password'],
    ['clave123', 'clave123', 'password'],
    ['CLAVE123', 'CLAVE123', 'password'],
    ['ClaveSegura', 'ClaveSegura', 'password'],
    ['Clave123', 'Otra1234', 'confirmPassword'],
    [' ', ' ', 'password'],
  ] as const) {
    const datos = { ...formulario, password, confirmPassword };
    const errores = validarUsuario(datos, 'edit');
    assert.ok(errores[campoError]);
    assert.deepEqual(errores, validarUsuario(datos, 'create', { exigePassword: true }));
  }
  assert.deepEqual(validarUsuario(formulario, 'edit'), {});
});


test('Cambiar tipo revalida el mismo número, tanto en creación como en edición', () => {
  for (const mode of ['create', 'edit'] as const) {
    const datos = { ...formulario, numeroDocumento: 'X1234567A' };
    assert.deepEqual(validarUsuario({ ...datos, tipoDocumento: '3' }, mode), {});
    for (const tipoDocumento of ['1', '2', '4']) {
      assert.ok(validarUsuario({ ...datos, tipoDocumento }, mode).numeroDocumento);
    }
    assert.deepEqual(validarDocumentoUsuario('2', ' x1234567l '), {});
    assert.deepEqual(validarDocumentoUsuario('4', ' x1234567l '), {});
    assert.ok(validarDocumentoUsuario('', datos.numeroDocumento).tipoDocumento);
  }
});
