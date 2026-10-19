import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import UsuariosTable from '../src/components/usuarios/UsuariosTable.tsx';
import type { Usuario } from '../src/services/usuarioService.ts';

const usuario: Usuario = {
  id_usuario: 1,
  codUsuario: 'ALU01',
  id_tipo_documento: 1,
  numeroDocumento: '12345678Z',
  nombre: 'Ana',
  apellido1: 'García',
  apellido2: null,
  email: 'ana@example.test',
  telefono: null,
  socio: true,
  matriculaPagada: false,
  id_rol: 2,
  id_estado_usuario: 1,
  comentario: null,
  fechaInscripcion: '2026-01-15',
};

const noop = () => {};

function render(props: Partial<Parameters<typeof UsuariosTable>[0]> = {}) {
  return renderToStaticMarkup(
    createElement(UsuariosTable, {
      usuarios: [],
      loading: false,
      campoOrden: 'nombre',
      direccionOrden: 'asc',
      puedeEditar: false,
      onCambiarOrden: noop,
      onEditar: noop,
      ...props,
    }),
  );
}

const otroUsuario: Usuario = {
  ...usuario,
  id_usuario: 2,
  codUsuario: 'ALU02',
  nombre: 'Bruno',
  apellido1: 'Martín',
  email: 'bruno@example.test',
  id_rol: 1,
  id_estado_usuario: 2,
};

test('Muestra el estado de carga', () => {
  const html = render({ loading: true });
  assert.match(html, /Cargando usuarios\.\.\./);
  assert.doesNotMatch(html, /No se han encontrado usuarios/);
});

test('Muestra listado vacío cuando no hay usuarios', () => {
  const html = render({ loading: false, usuarios: [] });
  assert.match(html, /No se han encontrado usuarios/);
});

test('Renderiza filas y textos de datos básicos', () => {
  const html = render({ usuarios: [usuario] });
  assert.match(html, /15\/01\/2026/);
  assert.match(html, /ALU01/);
  assert.match(html, /Ana García/);
  assert.match(html, /ana@example\.test/);
  assert.match(html, />Sí</);
  assert.match(html, /Pendiente/);
});

test('Sin permiso de rol, el listado no muestra la columna', () => {
  const html = render({ usuarios: [usuario], mostrarRol: false });
  assert.doesNotMatch(html, /rol-etiqueta/);
  assert.doesNotMatch(html, />Rol</);
  assert.match(html, /estado-indicador/);
});

test('El rol se muestra como etiqueta, nunca como select', () => {
  const html = render({ usuarios: [usuario] });
  assert.equal(html.includes('rol-select'), false);
  assert.match(html, /rol-etiqueta/);
  assert.match(html, /rol-operador/);
  assert.match(html, /Operador/);
});

test('Activo es solo indicador de lectura, sin checkbox', () => {
  const html = render({ usuarios: [usuario, otroUsuario] });
  assert.doesNotMatch(html, /type="checkbox"/);
  assert.doesNotMatch(html, /estado-checkbox/);
  assert.match(html, /estado-indicador estado-indicador-activo/);
  assert.match(html, /Usuario activo/);
  assert.match(html, /Usuario inactivo/);
});

test('Un usuario pendiente se distingue del inactivo', () => {
  const html = render({
    usuarios: [{ ...usuario, id_usuario: 9, id_estado_usuario: 3, nombre: 'Nuria' }],
  });
  assert.match(html, /estado-indicador estado-indicador-pendiente/);
  assert.match(html, /Usuario pendiente/);
  assert.match(html, /está pendiente/);
});

test('No hay columna ni botón Eliminar en la tabla', () => {
  const html = render({ usuarios: [usuario, otroUsuario] });
  assert.doesNotMatch(html, />Eliminar</);
  assert.doesNotMatch(html, /usuarios-eliminar-button/);
});

test('Fila editable solo con permiso de edición', () => {
  const sinPermiso = render({ usuarios: [usuario], puedeEditar: false });
  const conPermiso = render({ usuarios: [usuario], puedeEditar: true });
  assert.match(sinPermiso, /usuarios-table-row"/);
  assert.equal(sinPermiso.includes('usuarios-table-row-editable'), false);
  assert.match(conPermiso, /usuarios-table-row-editable/);
});

test('Indicadores de ordenación reflejan campo y dirección', () => {
  const codigoDesc = render({ campoOrden: 'codigo', direccionOrden: 'desc' });
  assert.match(codigoDesc, /sort-icon active[^>]*>▼/);

  const nombreAsc = render({ campoOrden: 'nombre', direccionOrden: 'asc' });
  assert.match(nombreAsc, /sort-icon active[^>]*>▲/);
});

test('Loading y vacío usan colSpan 9', () => {
  const carga = render({ loading: true });
  assert.match(carga, /colSpan="9"/);
  assert.match(carga, /Cargando usuarios\.\.\./);

  const vacio = render({ loading: false, usuarios: [] });
  assert.match(vacio, /colSpan="9"/);
  assert.match(vacio, /No se han encontrado usuarios/);
});
