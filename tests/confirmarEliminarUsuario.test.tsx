import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ConfirmarEliminarUsuario from '../src/components/usuarios/ConfirmarEliminarUsuario.tsx';
import type { Usuario } from '../src/services/usuarioService.ts';

const usuario: Usuario = {
  id_usuario: 7,
  codUsuario: 'ALU07',
  id_tipo_documento: 1,
  numeroDocumento: '12345678Z',
  nombre: 'Ana',
  apellido1: 'García',
  apellido2: 'López',
  email: 'ana@example.test',
  telefono: null,
  socio: true,
  matriculaPagada: true,
  id_rol: 2,
  id_estado_usuario: 1,
  comentario: null,
  fechaInscripcion: '2026-01-15',
};

const noop = () => {};

function render(
  props: Partial<Parameters<typeof ConfirmarEliminarUsuario>[0]> = {},
): string {
  return renderToStaticMarkup(
    createElement(ConfirmarEliminarUsuario, {
      usuario: null,
      isOpen: false,
      submitting: false,
      onCancel: noop,
      onConfirm: noop,
      ...props,
    }),
  );
}

test('Modal cerrado no renderiza el diálogo', () => {
  const html = render({ isOpen: false, usuario });
  assert.equal(html, '');
  assert.doesNotMatch(html, /Eliminar usuario definitivamente/);
});

test('Usuario seleccionado: título, nombre y código visibles', () => {
  const html = render({ isOpen: true, usuario });
  assert.match(html, /Eliminar usuario definitivamente/);
  assert.match(html, /Ana García López/);
  assert.match(html, /ALU07/);
});

test('Advertencia de eliminación irreversible y registros relacionados', () => {
  const html = render({ isOpen: true, usuario });
  assert.match(html, /irreversible/i);
  assert.match(html, /registros relacionados/i);
});

test('Botones Cancelar y Eliminar definitivamente', () => {
  const html = render({ isOpen: true, usuario });
  assert.match(html, />Cancelar</);
  assert.match(html, />Eliminar definitivamente</);
  assert.match(html, /type="button"/);
});

test('Estado submitting deshabilita botones y muestra Eliminando...', () => {
  const html = render({ isOpen: true, usuario, submitting: true });
  assert.match(html, />Eliminando\.\.\.</);
  assert.doesNotMatch(html, />Eliminar definitivamente</);
  assert.match(html, /disabled/);
});

test('Mensaje de error con role="alert"', () => {
  const html = render({
    isOpen: true,
    usuario,
    error: 'No puedes eliminar tu propia cuenta',
  });
  assert.match(html, /role="alert"/);
  assert.match(html, /No puedes eliminar tu propia cuenta/);
});

test('Nombre y código se escapan como texto, no como HTML', () => {
  const peligroso: Usuario = {
    ...usuario,
    nombre: '<img src=x onerror=alert(1)>',
    apellido1: '<script>alert(1)</script>',
    apellido2: null,
    codUsuario: '<b>COD</b>',
  };
  const html = render({ isOpen: true, usuario: peligroso });
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(html, /&lt;b&gt;COD&lt;\/b&gt;/);
  assert.doesNotMatch(html, /<img src=x/);
  assert.doesNotMatch(html, /<script>alert/);
});

test('Sin código de usuario no se muestran paréntesis vacíos', () => {
  const sinCodigo = { ...usuario, codUsuario: null };
  const html = render({ isOpen: true, usuario: sinCodigo });
  assert.match(html, /Ana García López/);
  assert.doesNotMatch(html, /\(\)/);
});
