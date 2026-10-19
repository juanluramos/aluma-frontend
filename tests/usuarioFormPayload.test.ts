import test from 'node:test';
import assert from 'node:assert/strict';
import { construirDatosCreacionUsuario, construirDatosEdicionUsuario } from '../src/utils/usuarioFormPayload.ts';
import type { FormularioUsuario } from '../src/utils/validacionesUsuario.ts';
import { hasPermission } from '../src/auth/permissions.ts';

const datos: FormularioUsuario = {
  codUsuario: 'ALU01', tipoDocumento: '2', numeroDocumento: 'X1234567L',
  nombre: 'Ana', apellido1: 'García', apellido2: '', email: 'ana@example.test',
  telefono: '612345678', comentario: '', fechaInscripcion: '2026-03-15', password: 'Clave123', confirmPassword: 'Clave123',
};
const administrativo = { rol: '2', estado: '3', socio: false, matriculaPagada: false };
const permisos = { puedeCambiarRol: true, puedeCambiarEstado: true, puedeCambiarSocio: true };
const opciones = { documentoSinCambios: false, ...permisos };
const esperado = {
  codUsuario: 'ALU01', id_tipo_documento: 2, numeroDocumento: 'X1234567L',
  nombre: 'Ana', apellido1: 'García', apellido2: undefined, email: 'ana@example.test',
  telefono: '612345678', id_rol: 2, socio: false, matriculaPagada: false,
  id_estado_usuario: 3, comentario: undefined, fechaInscripcion: '2026-03-15', password: 'Clave123',
};

test('Creación conserva el objeto anterior y su representación JSON', () => {
  const payload = construirDatosCreacionUsuario(datos, administrativo, permisos);
  assert.deepEqual(payload, esperado);
  assert.equal(JSON.stringify(payload), JSON.stringify(esperado));
});

test('Edición completa conserva el objeto anterior y su representación JSON', () => {
  const payload = construirDatosEdicionUsuario(datos, administrativo, opciones);
  assert.deepEqual(payload, esperado);
  assert.equal(JSON.stringify(payload), JSON.stringify(esperado));
});

test('Alta sin documento no envía tipo ni número', () => {
  const payload = construirDatosCreacionUsuario(
    { ...datos, tipoDocumento: '', numeroDocumento: '' },
    administrativo,
    permisos,
  );
  assert.equal(Object.hasOwn(payload, 'id_tipo_documento'), false);
  assert.equal(Object.hasOwn(payload, 'numeroDocumento'), false);
});

test('Editar y dejar el documento vacío envía null en los dos campos', () => {
  const payload = construirDatosEdicionUsuario(
    { ...datos, tipoDocumento: '', numeroDocumento: '' },
    administrativo,
    opciones,
  );
  assert.equal(payload.id_tipo_documento, null);
  assert.equal(payload.numeroDocumento, null);
});

test('Documento heredado sin cambios: ambas propiedades están ausentes', () => {
  const payload = construirDatosEdicionUsuario({ ...datos, numeroDocumento: 'HEREDADO' }, administrativo, { ...opciones, documentoSinCambios: true });
  assert.equal(Object.hasOwn(payload, 'id_tipo_documento'), false);
  assert.equal(Object.hasOwn(payload, 'numeroDocumento'), false);
});

for (const puedeCambiarRol of [false, true]) {
  for (const puedeCambiarEstado of [false, true]) {
    test(`Permisos independientes: rol=${puedeCambiarRol}, estado=${puedeCambiarEstado}`, () => {
      const payload = construirDatosEdicionUsuario(datos, administrativo, { ...opciones, puedeCambiarRol, puedeCambiarEstado });
      assert.equal(Object.hasOwn(payload, 'id_rol'), puedeCambiarRol);
      assert.equal(Object.hasOwn(payload, 'id_estado_usuario'), puedeCambiarEstado);
      if (puedeCambiarRol) assert.equal(payload.id_rol, 2);
      if (puedeCambiarEstado) assert.equal(payload.id_estado_usuario, 3);
    });
  }
}

for (const rol of ['Usuario', 'Operador', 'Administrador'] as const) {
  test(`Edición respeta los permisos actuales de ${rol}`, () => {
    const payload = construirDatosEdicionUsuario(datos, administrativo, {
      ...opciones,
      puedeCambiarRol: hasPermission(rol, 'cambiarRolUsuario'),
      puedeCambiarEstado: rol === 'Operador' || rol === 'Administrador',
      puedeCambiarSocio: rol === 'Operador' || rol === 'Administrador',
    });
    assert.equal(Object.hasOwn(payload, 'id_rol'), rol === 'Administrador');
    assert.equal(Object.hasOwn(payload, 'id_estado_usuario'), rol === 'Operador' || rol === 'Administrador');
    assert.equal(Object.hasOwn(payload, 'socio'), rol === 'Operador' || rol === 'Administrador');
    assert.equal(Object.hasOwn(payload, 'matriculaPagada'), rol === 'Operador' || rol === 'Administrador');
  });
}

test('Sin permiso, el alta queda como Usuario activo y sin condición de socio', () => {
  const payload = construirDatosCreacionUsuario(datos, {
    rol: '3', estado: '2', socio: true, matriculaPagada: true,
  }, { puedeCambiarRol: false, puedeCambiarEstado: false, puedeCambiarSocio: false });
  assert.equal(payload.id_rol, 1);
  assert.equal(payload.id_estado_usuario, 1);
  assert.equal(payload.socio, false);
  assert.equal(payload.matriculaPagada, false);
  assert.equal(Object.hasOwn(payload, 'password'), false);
});

test('Sin permiso, la edición no envía socio ni matrícula', () => {
  const payload = construirDatosEdicionUsuario(datos, {
    ...administrativo, socio: true, matriculaPagada: true,
  }, { ...opciones, puedeCambiarSocio: false });
  assert.equal(Object.hasOwn(payload, 'socio'), false);
  assert.equal(Object.hasOwn(payload, 'matriculaPagada'), false);
});

test('Contraseña vacía no se envía; el alta de operador sí envía la contraseña escrita', () => {
  const vacios = { ...datos, password: '', confirmPassword: '' };
  assert.equal(Object.hasOwn(construirDatosEdicionUsuario(vacios, administrativo, opciones), 'password'), false);
  assert.equal(Object.hasOwn(construirDatosCreacionUsuario(vacios, administrativo, permisos), 'password'), false);
  assert.equal(construirDatosCreacionUsuario(datos, administrativo, permisos).password, 'Clave123');
  assert.equal(Object.hasOwn(construirDatosCreacionUsuario(datos, { ...administrativo, rol: '1' }, permisos), 'password'), false);
  const sinEmail = { ...datos, email: '' };
  assert.equal(Object.hasOwn(construirDatosCreacionUsuario(sinEmail, { ...administrativo, rol: '1' }, permisos), 'email'), false);
  assert.equal(construirDatosEdicionUsuario(sinEmail, administrativo, opciones).email, null);
});

test('Confirmación nunca se envía, aunque esté presente en la entrada', () => {
  for (const payload of [construirDatosCreacionUsuario(datos, administrativo, permisos), construirDatosEdicionUsuario(datos, administrativo, opciones)]) {
    assert.equal(Object.hasOwn(payload, 'confirmPassword'), false);
  }
});

test('Opcionales vacíos conservan undefined y se omiten del JSON', () => {
  const vacios = { ...datos, codUsuario: '', apellido1: '', apellido2: '', telefono: '', comentario: '' };
  for (const payload of [construirDatosCreacionUsuario(vacios, administrativo, permisos), construirDatosEdicionUsuario(vacios, administrativo, opciones)]) {
    const json = JSON.parse(JSON.stringify(payload)) as Record<string, unknown>;
    for (const campo of ['codUsuario', 'apellido1', 'apellido2', 'telefono', 'comentario'] as const) {
      assert.equal(Object.hasOwn(payload, campo), true);
      assert.equal(payload[campo], undefined);
      assert.equal(Object.hasOwn(json, campo), false);
    }
  }
});

test('Los booleanos false y true se conservan sin omitir propiedades', () => {
  for (const socio of [false, true]) {
    for (const matriculaPagada of [false, true]) {
      const estado = { ...administrativo, socio, matriculaPagada };
      for (const payload of [construirDatosCreacionUsuario(datos, estado, permisos), construirDatosEdicionUsuario(datos, estado, opciones)]) {
        assert.equal(payload.socio, socio);
        assert.equal(payload.matriculaPagada, matriculaPagada);
      }
    }
  }
});

test('Las funciones no normalizan de nuevo ni mutan las entradas', () => {
  const entrada = Object.freeze({ ...datos, nombre: ' Ana ', password: ' Clave123 ' });
  const estado = Object.freeze({ ...administrativo });
  const flags = Object.freeze({ ...opciones });
  const copia = { ...entrada };
  for (const payload of [construirDatosCreacionUsuario(entrada, estado, permisos), construirDatosEdicionUsuario(entrada, estado, flags)]) {
    assert.equal(payload.nombre, ' Ana ');
    assert.equal(payload.password, ' Clave123 ');
    payload.nombre = 'Otro';
  }
  assert.deepEqual(entrada, copia);
  assert.deepEqual(estado, administrativo);
  assert.deepEqual(flags, opciones);
});
