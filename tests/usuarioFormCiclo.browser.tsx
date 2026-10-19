// Abrir /tests/usuarioFormCiclo.browser.html con Vite. No conecta con la API.
// Simula el montaje de UsuariosPage: create estable + edit condicional con key por ID.
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import UsuarioFormModal from '../src/components/usuarios/UsuarioFormModal';
import { session } from '../src/services/authService';
import type { Usuario } from '../src/services/usuarioService';
import { obtenerValoresIniciales } from '../src/utils/usuarioFormState';

const usuarioA: Usuario = {
  id_usuario: 1, codUsuario: 'ALU-A', id_tipo_documento: 2,
  numeroDocumento: 'X1234567L', nombre: 'Ana', apellido1: 'García', apellido2: 'López',
  email: 'ana@example.test', telefono: '612345678', socio: true, matriculaPagada: true,
  id_rol: 2, id_estado_usuario: 1, comentario: 'Usuario A', fechaInscripcion: '2024-05-02',
};

const usuarioB: Usuario = {
  id_usuario: 2, codUsuario: 'ALU-B', id_tipo_documento: 1,
  numeroDocumento: '12345678Z', nombre: 'Bruno', apellido1: 'Martín', apellido2: 'Ruiz',
  email: 'bruno@example.test', telefono: '722345678', socio: false, matriculaPagada: false,
  id_rol: 1, id_estado_usuario: 2, comentario: 'Usuario B', fechaInscripcion: '2025-11-03',
};

const root = createRoot(document.getElementById('root')!);
const originalFetch = window.fetch;

type EstadoPagina = {
  nuevoUsuarioOpen: boolean;
  editarUsuarioOpen: boolean;
  usuarioSeleccionado: Usuario | null;
  usuarioA: Usuario;
  usuarioB: Usuario;
};

let estado: EstadoPagina = {
  nuevoUsuarioOpen: false,
  editarUsuarioOpen: false,
  usuarioSeleccionado: null,
  usuarioA: { ...usuarioA },
  usuarioB: { ...usuarioB },
};

function tokenAdministrador(): string {
  const payload = {
    rol: 'Administrador',
    id_usuario: 1,
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
  };
  return `header.${btoa(JSON.stringify(payload))}.signature`;
}

window.fetch = async (input, init) => {
  const url = String(input);
  const method = init?.method ?? 'GET';
  const body = init?.body
    ? JSON.parse(String(init.body)) as Record<string, unknown>
    : {};

  if (url.includes('/auth/login') || body.password === 'login-test') {
    return Response.json({ token: tokenAdministrador() });
  }
  if (url.includes('/auth/refresh')) {
    return Response.json({ token: tokenAdministrador() });
  }
  if (url.includes('/auth/logout')) {
    return new Response(null, { status: 204 });
  }

  if (method === 'PUT') {
    const id = Number(url.split('/').pop());
    const actual = id === estado.usuarioA.id_usuario ? estado.usuarioA : estado.usuarioB;
    const resto = Object.fromEntries(Object.entries(body).filter(([clave]) => clave !== 'password'));
    return Response.json({ ...actual, ...resto, id_usuario: id });
  }

  return Response.json({ id_usuario: 99, ...body });
};

function comprobar(condicion: unknown, mensaje: string): asserts condicion {
  if (!condicion) throw new Error(mensaje);
}

function campo(id: string): HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement {
  const elemento = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
  comprobar(elemento, `Falta el campo ${id}`);
  return elemento;
}

function valor(id: string): string {
  return campo(id).value;
}

function checkboxes(): NodeListOf<HTMLInputElement> {
  return document.querySelectorAll('.usuario-form-options input[type="checkbox"]');
}

function cambiar(id: string, value: string): void {
  const elemento = campo(id);
  const prototype = elemento instanceof HTMLSelectElement
    ? HTMLSelectElement.prototype
    : elemento instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(elemento, value);
  const tipo = elemento instanceof HTMLSelectElement ? 'change' : 'input';
  flushSync(() => elemento.dispatchEvent(new Event(tipo, { bubbles: true })));
}

function marcarCheckbox(indice: 0 | 1, checked: boolean): void {
  const caja = checkboxes()[indice];
  comprobar(caja, `Falta checkbox ${indice}`);
  if (caja.checked === checked) return;
  flushSync(() => caja.click());
}

function renderPagina(): void {
  flushSync(() => {
    root.render(
      <>
        <UsuarioFormModal
          key="nuevo-usuario"
          isOpen={estado.nuevoUsuarioOpen}
          mode="create"
          onClose={() => {
            estado = { ...estado, nuevoUsuarioOpen: false };
            renderPagina();
          }}
        />
        {estado.usuarioSeleccionado && (
          <UsuarioFormModal
            key={estado.usuarioSeleccionado.id_usuario}
            isOpen={estado.editarUsuarioOpen}
            mode="edit"
            usuario={estado.usuarioSeleccionado}
            onClose={() => {
              estado = { ...estado, editarUsuarioOpen: false, usuarioSeleccionado: null };
              renderPagina();
            }}
            onUpdated={(usuarioActualizado) => {
              estado = {
                ...estado,
                usuarioA: estado.usuarioA.id_usuario === usuarioActualizado.id_usuario
                  ? usuarioActualizado
                  : estado.usuarioA,
                usuarioB: estado.usuarioB.id_usuario === usuarioActualizado.id_usuario
                  ? usuarioActualizado
                  : estado.usuarioB,
                editarUsuarioOpen: false,
                usuarioSeleccionado: null,
              };
              renderPagina();
            }}
          />
        )}
      </>,
    );
  });
}

function abrirCreacion(): void {
  estado = { ...estado, nuevoUsuarioOpen: true };
  renderPagina();
}

function abrirEdicion(usuario: Usuario): void {
  estado = { ...estado, usuarioSeleccionado: usuario, editarUsuarioOpen: true };
  renderPagina();
}

function cancelar(): void {
  const boton = document.querySelector('.usuario-form-cancel') as HTMLButtonElement | null;
  comprobar(boton, 'Falta el botón Cancelar');
  flushSync(() => boton.click());
}

async function guardar(): Promise<void> {
  flushSync(() => document.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  await new Promise(resolve => setTimeout(resolve, 50));
}

function comprobarFormulario(esperado: ReturnType<typeof obtenerValoresIniciales>, mensaje: string): void {
  const cajas = checkboxes();
  comprobar(cajas.length === (document.getElementById('activo') ? 3 : 2), `${mensaje}: faltan checkboxes`);
  comprobar(valor('codUsuario') === esperado.codUsuario, `${mensaje}: codUsuario`);
  comprobar(valor('tipoDocumento') === esperado.tipoDocumento, `${mensaje}: tipoDocumento`);
  comprobar(valor('numeroDocumento') === esperado.numeroDocumento, `${mensaje}: numeroDocumento`);
  comprobar(valor('nombre') === esperado.nombre, `${mensaje}: nombre`);
  comprobar(valor('apellido1') === esperado.apellido1, `${mensaje}: apellido1`);
  comprobar(valor('apellido2') === esperado.apellido2, `${mensaje}: apellido2`);
  comprobar(valor('email') === esperado.email, `${mensaje}: email`);
  comprobar(valor('telefono') === esperado.telefono, `${mensaje}: telefono`);
  comprobar(valor('comentario') === esperado.comentario, `${mensaje}: comentario`);
  comprobar(valor('fechaInscripcion') === esperado.fechaInscripcion, `${mensaje}: fechaInscripcion`);
  if (document.getElementById('password')) {
    comprobar(valor('password') === esperado.password, `${mensaje}: password`);
    comprobar(valor('confirmPassword') === esperado.confirmPassword, `${mensaje}: confirmPassword`);
  } else {
    comprobar(esperado.password === '' && esperado.confirmPassword === '', `${mensaje}: la creación de Usuario no muestra contraseña`);
  }
  comprobar(valor('rol') === esperado.rol, `${mensaje}: rol`);
  comprobar(valor('estado') === esperado.estado, `${mensaje}: estado`);
  comprobar(cajas[0]!.checked === esperado.socio, `${mensaje}: socio`);
  comprobar(cajas[1]!.checked === esperado.matriculaPagada, `${mensaje}: matriculaPagada`);
  const activo = document.getElementById('activo') as HTMLInputElement | null;
  comprobar(activo, `${mensaje}: falta Activo`);
  comprobar(activo.checked === (esperado.estado === '1'), `${mensaje}: activo`);
}

async function ejecutar(): Promise<void> {
  await session.login('test@example.test', 'login-test');
  renderPagina();

  // 1) Crear → rellenar → cancelar → reabrir → defaults
  abrirCreacion();
  cambiar('codUsuario', 'TMP01');
  cambiar('tipoDocumento', '2');
  cambiar('numeroDocumento', 'X1234567L');
  cambiar('nombre', 'Temporal');
  cambiar('apellido1', 'Uno');
  cambiar('apellido2', 'Dos');
  cambiar('email', 'temporal@example.test');
  cambiar('telefono', '612111111');
  cambiar('comentario', 'Borrador');
  cambiar('rol', '3');
  cambiar('estado', '2');
  cambiar('password', 'Clave123');
  cambiar('confirmPassword', 'Clave123');
  marcarCheckbox(0, true);
  marcarCheckbox(1, true);
  cancelar();
  comprobar(!estado.nuevoUsuarioOpen, 'Creación queda cerrada tras cancelar');
  abrirCreacion();
  comprobarFormulario(obtenerValoresIniciales('create'), 'Creación tras cancelar');

  // 2) Editar A → modificar → cancelar → abrir B → datos de B
  cancelar();
  abrirEdicion(estado.usuarioA);
  cambiar('nombre', 'Ana modificada');
  cambiar('email', 'ana-modificada@example.test');
  marcarCheckbox(0, false);
  marcarCheckbox(1, false);
  cambiar('comentario', 'Cambios de A no deben filtrarse a B');
  cancelar();
  comprobar(estado.usuarioSeleccionado === null, 'Edición se desmonta al cancelar');
  abrirEdicion(estado.usuarioB);
  comprobarFormulario(obtenerValoresIniciales('edit', usuarioB), 'Edición de B tras cancelar A');
  comprobar(valor('nombre') !== 'Ana modificada', 'B no conserva el nombre editado de A');
  comprobar(valor('email') !== 'ana-modificada@example.test', 'B no conserva el email editado de A');

  // 3) Editar A → guardar → reabrir A → datos actualizados desde la respuesta/estado
  cancelar();
  abrirEdicion(estado.usuarioA);
  cambiar('nombre', 'Ana Actualizada');
  cambiar('comentario', 'Guardado OK');
  marcarCheckbox(0, false);
  await guardar();
  comprobar(estado.usuarioSeleccionado === null, 'Edición se cierra tras guardar');
  comprobar(estado.usuarioA.nombre === 'Ana Actualizada', 'Estado de página conserva el nombre guardado');
  comprobar(estado.usuarioA.comentario === 'Guardado OK', 'Estado de página conserva el comentario guardado');
  comprobar(estado.usuarioA.socio === false, 'Estado de página conserva socio=false');
  abrirEdicion(estado.usuarioA);
  comprobarFormulario(obtenerValoresIniciales('edit', estado.usuarioA), 'Reabrir A tras guardar');
  comprobar(valor('nombre') === 'Ana Actualizada', 'Formulario muestra el nombre actualizado');
  comprobar(valor('comentario') === 'Guardado OK', 'Formulario muestra el comentario actualizado');
  comprobar(checkboxes()[0]!.checked === false, 'Formulario muestra socio actualizado');
}

try {
  await ejecutar();
  document.getElementById('resultado')!.textContent =
    'PASS: reinicio de creación, aislamiento A→B al cancelar y datos actualizados tras guardar A.';
} catch (error) {
  document.getElementById('resultado')!.textContent = `FAIL: ${String(error)}`;
} finally {
  window.fetch = originalFetch;
  root.unmount();
}
