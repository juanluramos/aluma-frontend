import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import UsuarioAcceso from '../src/components/usuarios/UsuarioAcceso';
import UsuarioEstadoSocio from '../src/components/usuarios/UsuarioEstadoSocio';
import { hasPermission } from '../src/auth/permissions';

for (const rol of ['Usuario', 'Operador', 'Administrador'] as const) {
  test(`${rol}: los selectores de rol y estado solo se renderizan para Administrador`, () => {
    const noop = () => {};
    const acceso = renderToStaticMarkup(<UsuarioAcceso rol="1" password="" confirmPassword="" errores={{}}
      isEdit puedeCambiarRol={hasPermission(rol, 'cambiarRolUsuario')}
      onRolChange={noop} onPasswordChange={noop} onConfirmPasswordChange={noop} />);
    const estado = renderToStaticMarkup(<UsuarioEstadoSocio estado="1" socio={false} matriculaPagada={false}
      comentario="" errores={{}} puedeCambiarEstado={hasPermission(rol, 'cambiarEstadoUsuario')}
      puedeCambiarSocio={hasPermission(rol, 'cambiarEstadoUsuario')}
      onEstadoChange={noop} onSocioChange={noop} onMatriculaPagadaChange={noop} onComentarioChange={noop} />);
    assert.equal(acceso.includes('id="rol"'), rol === 'Administrador');
    assert.equal(estado.includes('id="estado"'), rol === 'Administrador');
    assert.equal(estado.includes('disabled'), rol !== 'Administrador');
  });
}

test('En edición, Operador marca Activo, Socio y Matrícula sin el selector de estado', () => {
  const noop = () => {};
  const html = renderToStaticMarkup(<UsuarioEstadoSocio estado="1" socio={false} matriculaPagada={false}
    comentario="" errores={{}} mostrarActivo puedeCambiarEstado={false} puedeCambiarSocio
    onEstadoChange={noop} onSocioChange={noop} onMatriculaPagadaChange={noop} onComentarioChange={noop} />);
  assert.equal(html.includes('id="estado"'), false);
  assert.equal(html.includes('id="activo"'), true);
  assert.equal(html.includes('disabled'), false);
});

test('El alta pide contraseña solo si un Administrador crea Operador o Administrador', () => {
  const noop = () => {};
  const marcar = (rol: string, sesion: string) => renderToStaticMarkup(
    <UsuarioAcceso rol={rol} password="" confirmPassword="" errores={{}} isEdit={false}
      puedeCambiarRol={sesion === 'Administrador'} currentUserRole={sesion}
      onRolChange={noop} onPasswordChange={noop} onConfirmPasswordChange={noop} />,
  );
  assert.equal(marcar('1', 'Administrador').includes('id="password"'), true);
  assert.equal(marcar('1', 'Administrador').includes('required'), false);
  assert.equal(marcar('2', 'Administrador').includes('id="password"'), true);
  assert.equal(marcar('2', 'Administrador').includes('id="confirmPassword"'), true);
  assert.equal(marcar('2', 'Administrador').includes('required'), true);
  assert.equal(marcar('3', 'Administrador').includes('id="password"'), true);
  assert.equal(marcar('1', 'Operador').includes('id="password"'), false);
  assert.equal(marcar('2', 'Operador').includes('id="password"'), false);
  const edicion = renderToStaticMarkup(
    <UsuarioAcceso rol="1" password="" confirmPassword="" errores={{}} isEdit
      currentUserRole="Administrador" onRolChange={noop} onPasswordChange={noop} onConfirmPasswordChange={noop} />,
  );
  assert.equal(edicion.includes('id="password"'), true);
  assert.equal(edicion.includes('required'), false);
});
