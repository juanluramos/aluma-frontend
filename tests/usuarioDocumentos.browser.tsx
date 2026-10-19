// Abrir /tests/usuarioDocumentos.browser.html con Vite. No conecta con la API.
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import UsuarioFormModal from '../src/components/usuarios/UsuarioFormModal';
import { session } from '../src/services/authService';
import type { Usuario } from '../src/services/usuarioService';

const usuario: Usuario = {
  id_usuario: 42, codUsuario: null, id_tipo_documento: 4,
  numeroDocumento: 'X1234567A', nombre: 'Ana', apellido1: null, apellido2: null,
  email: 'ana@example.test', telefono: null, socio: false, matriculaPagada: false,
  id_rol: 1, id_estado_usuario: 1, comentario: null, fechaInscripcion: '2026-01-15',
};
const root = createRoot(document.getElementById('root')!);
const peticiones: { method: string; body: Record<string, unknown> }[] = [];
const originalFetch = window.fetch;
window.fetch = async (_input, init) => {
  const body = JSON.parse(String(init?.body ?? '{}')) as Record<string, unknown>;
  if (body.password === 'login-test') {
    const payload = { rol: 'Administrador', id_usuario: 1, exp: Math.floor(Date.now() / 1000) + 3600 };
    return Response.json({ token: `header.${btoa(JSON.stringify(payload))}.signature` });
  }
  peticiones.push({ method: init?.method ?? 'GET', body });
  return Response.json({ ...usuario, ...body });
};

function comprobar(condicion: unknown, mensaje: string): asserts condicion {
  if (!condicion) throw new Error(mensaje);
}
function cambiar(id: string, value: string): void {
  const campo = document.getElementById(id) as HTMLInputElement | HTMLSelectElement;
  comprobar(campo, `Falta ${id}`);
  const prototype = campo instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(campo, value);
  flushSync(() => campo.dispatchEvent(new Event(campo instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true })));
}
function montar(mode: 'create' | 'edit', key: string): void {
  flushSync(() => root.render(<UsuarioFormModal key={key} isOpen mode={mode} usuario={mode === 'edit' ? usuario : undefined} onClose={() => undefined} />));
}
async function guardar(): Promise<void> {
  flushSync(() => document.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  await new Promise(resolve => setTimeout(resolve, 50));
}

async function ejecutar(): Promise<void> {
  await session.login('test@example.test', 'login-test');
  montar('create', 'crear');
  cambiar('numeroDocumento', 'x1234567a');
  cambiar('tipoDocumento', '3');
  comprobar(!document.getElementById('numeroDocumento-error'), 'Pasaporte general aceptable');
  cambiar('tipoDocumento', '2');
  comprobar(document.getElementById('numeroDocumento-error')?.textContent === 'El NIE no es válido.', 'Error de NIE al cambiar tipo');
  comprobar(document.getElementById('numeroDocumento')?.getAttribute('aria-describedby') === 'numeroDocumento-error', 'Error asociado al campo');
  cambiar('tipoDocumento', '4');
  comprobar(document.getElementById('numeroDocumento-error'), 'Permiso comprueba letra de NIE');
  cambiar('numeroDocumento', ' x1234567l ');
  comprobar(!document.getElementById('numeroDocumento-error'), 'Error desaparece al corregir');
  cambiar('nombre', 'Ana');
  cambiar('email', 'ana@example.test');
  comprobar(document.getElementById('password'), 'El administrador ve la contraseña en el alta');
  comprobar(document.getElementById('email')?.hasAttribute('required') === false, 'El email no es obligatorio para Usuario');
  comprobar(document.getElementById('password')?.hasAttribute('required') === false, 'El rol Usuario no obliga la contraseña');
  await guardar();
  comprobar(peticiones.at(-1)?.method === 'POST', 'Crear Usuario envía POST sin contraseña');
  comprobar(!('password' in peticiones.at(-1)!.body), 'El alta de Usuario no envía contraseña');
  montar('create', 'crear-operador');
  cambiar('nombre', 'Ana');
  cambiar('email', 'ana@example.test');
  cambiar('numeroDocumento', ' x1234567l ');
  cambiar('tipoDocumento', '4');
  cambiar('rol', '2');
  comprobar(document.getElementById('email')?.hasAttribute('required') === true, 'Operador exige email');
  await guardar();
  comprobar(peticiones.length === 1 && document.getElementById('password-error'), 'Operador exige contraseña');
  cambiar('password', 'Clave123');
  cambiar('confirmPassword', 'Clave123');
  await guardar();
  comprobar(peticiones.at(-1)?.method === 'POST', 'Crear envía POST');
  comprobar(peticiones.at(-1)?.body.password === 'Clave123', 'El alta de Operador envía la contraseña');
  comprobar(peticiones.at(-1)?.body.numeroDocumento === 'X1234567L', 'Documento normalizado al crear');
  comprobar(peticiones.at(-1)?.body.fechaInscripcion === (document.getElementById('fechaInscripcion') as HTMLInputElement).value, 'La alta envía la fecha del formulario');

  montar('edit', 'editar-heredado');
  cambiar('nombre', 'Ana María');
  await guardar();
  comprobar(peticiones.at(-1)?.method === 'PUT', 'Editar documento heredado permite cambiar nombre');
  comprobar(!('numeroDocumento' in peticiones.at(-1)!.body), 'Documento heredado no se reenvía');
  comprobar(!('id_tipo_documento' in peticiones.at(-1)!.body), 'Tipo heredado no se reenvía');
  comprobar(!('password' in peticiones.at(-1)!.body), 'Edición mantiene contraseña actual');

  montar('edit', 'editar-documento');
  const antes = peticiones.length;
  cambiar('numeroDocumento', 'Y1234567A');
  await guardar();
  comprobar(peticiones.length === antes, 'Edición rechaza otro NIE incorrecto');
  cambiar('numeroDocumento', ' y1234567x ');
  await guardar();
  comprobar(peticiones.at(-1)?.body.numeroDocumento === 'Y1234567X', 'Editar normaliza documento nuevo');
  comprobar(peticiones.at(-1)?.body.id_tipo_documento === 4, 'Editar envía el tipo correcto');

  montar('create', 'crear-sin-documento');
  comprobar(document.getElementById('tipoDocumento')?.hasAttribute('required') === false, 'El tipo deja de ser obligatorio');
  comprobar(document.getElementById('numeroDocumento')?.hasAttribute('required') === false, 'El número deja de ser obligatorio');
  cambiar('nombre', 'Luis');
  cambiar('email', 'luis@example.test');
  await guardar();
  comprobar(peticiones.at(-1)?.method === 'POST', 'Alta sin documento envía POST');
  comprobar(!('numeroDocumento' in peticiones.at(-1)!.body), 'Alta sin documento no envía número');
  comprobar(!('id_tipo_documento' in peticiones.at(-1)!.body), 'Alta sin documento no envía tipo');
}

try {
  await ejecutar();
  document.getElementById('resultado')!.textContent = 'PASS: cambio de tipo, errores accesibles, creación, edición, normalización, documentos heredados y contraseñas.';
} catch (error) {
  document.getElementById('resultado')!.textContent = `FAIL: ${String(error)}`;
} finally {
  window.fetch = originalFetch;
  root.unmount();
}
