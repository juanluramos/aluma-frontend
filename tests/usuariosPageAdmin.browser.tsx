// Abrir /tests/usuariosPageAdmin.browser.html con Vite. No conecta con la API real.
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import UsuariosPage from '../src/pages/UsuariosPage';
import { session } from '../src/services/authService';
import type { Usuario } from '../src/services/usuarioService';
import type { Rol } from '../src/auth/permissions';

const usuarioAna: Usuario = {
  id_usuario: 1, codUsuario: 'ALU-A', id_tipo_documento: 2,
  numeroDocumento: 'X1234567L', nombre: 'Ana', apellido1: 'García', apellido2: 'López',
  email: 'ana@example.test', telefono: '612345678', socio: true, matriculaPagada: true,
  id_rol: 2, id_estado_usuario: 1, comentario: 'Usuario A', fechaInscripcion: '2024-05-02',
};

const usuarioBruno: Usuario = {
  id_usuario: 2, codUsuario: 'ALU-B', id_tipo_documento: 1,
  numeroDocumento: '12345678Z', nombre: 'Bruno', apellido1: 'Martín', apellido2: 'Ruiz',
  email: 'bruno@example.test', telefono: '722345678', socio: false, matriculaPagada: false,
  id_rol: 1, id_estado_usuario: 1, comentario: 'Usuario B', fechaInscripcion: '2025-11-03',
};

const root = createRoot(document.getElementById('root')!);
const originalFetch = window.fetch;

type Peticion = { method: string; url: string; body: Record<string, unknown> };

let listaUsuarios: Usuario[] = [];
let peticiones: Peticion[] = [];
let falloCarga = false;
let falloPut = false;
let falloDelete: { status: number; code: string; message: string } | null = null;
let deleteDelayMs = 0;
let idUsuarioToken: number | null = 1;
let rolSesion: Rol = 'Administrador';
let siguienteId = 100;

function tokenConRol(rol: Rol, idUsuario: number | null = idUsuarioToken): string {
  const payload = {
    rol,
    ...(idUsuario !== null ? { id_usuario: idUsuario } : {}),
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
  };
  return `header.${btoa(JSON.stringify(payload))}.signature`;
}

function reiniciarDatos(): void {
  listaUsuarios = [
    { ...usuarioAna },
    { ...usuarioBruno },
  ];
  peticiones = [];
  falloCarga = false;
  falloPut = false;
  falloDelete = null;
  deleteDelayMs = 0;
  idUsuarioToken = 1;
  siguienteId = 100;
}

window.fetch = async (input, init) => {
  const url = String(input);
  const method = init?.method ?? 'GET';
  const body = init?.body
    ? JSON.parse(String(init.body)) as Record<string, unknown>
    : {};

  if (url.includes('/auth/login')) {
    const email = String(body.email);
    rolSesion = email.includes('operador')
      ? 'Operador'
      : email.includes('usuario')
        ? 'Usuario'
        : 'Administrador';
    return Response.json({ token: tokenConRol(rolSesion) });
  }
  if (url.includes('/auth/refresh')) {
    return Response.json({ token: tokenConRol(rolSesion) });
  }
  if (url.includes('/auth/logout')) {
    return new Response(null, { status: 204 });
  }

  if (url.includes('/usuarios') && method === 'GET' && !/\/usuarios\/\d+/.test(url)) {
    peticiones.push({ method, url, body });
    if (falloCarga) {
      return Response.json({ message: 'Error simulado al cargar usuarios' }, { status: 500 });
    }
    return Response.json(listaUsuarios);
  }

  if (url.includes('/usuarios') && method === 'POST') {
    peticiones.push({ method, url, body });
    const creado: Usuario = {
      id_usuario: siguienteId++,
      codUsuario: (body.codUsuario as string | undefined) ?? null,
      id_tipo_documento: Number(body.id_tipo_documento),
      numeroDocumento: String(body.numeroDocumento),
      nombre: String(body.nombre),
      apellido1: (body.apellido1 as string | undefined) ?? null,
      apellido2: (body.apellido2 as string | undefined) ?? null,
      email: String(body.email),
      telefono: (body.telefono as string | undefined) ?? null,
      socio: Boolean(body.socio),
      matriculaPagada: Boolean(body.matriculaPagada),
      id_rol: Number(body.id_rol),
      id_estado_usuario: Number(body.id_estado_usuario),
      comentario: (body.comentario as string | undefined) ?? null,
      fechaInscripcion: String(body.fechaInscripcion),
    };
    listaUsuarios = [creado, ...listaUsuarios];
    return Response.json(creado);
  }

  if (/\/usuarios\/\d+/.test(url) && method === 'PUT') {
    peticiones.push({ method, url, body });
    if (falloPut) {
      return Response.json({ message: 'Error simulado al actualizar usuario' }, { status: 500 });
    }
    const id = Number(url.split('/').pop());
    const indice = listaUsuarios.findIndex(u => u.id_usuario === id);
    if (indice < 0) {
      return Response.json({ message: 'Usuario no encontrado' }, { status: 404 });
    }
    const resto = Object.fromEntries(Object.entries(body).filter(([clave]) => clave !== 'password'));
    const actualizado = { ...listaUsuarios[indice]!, ...resto, id_usuario: id };
    listaUsuarios = listaUsuarios.map(u => u.id_usuario === id ? actualizado : u);
    return Response.json(actualizado);
  }

  if (/\/usuarios\/\d+/.test(url) && method === 'DELETE') {
    peticiones.push({ method, url, body });
    if (deleteDelayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, deleteDelayMs));
    }
    if (falloDelete) {
      return Response.json(
        { message: falloDelete.message, code: falloDelete.code },
        { status: falloDelete.status },
      );
    }
    const id = Number(url.split('/').pop());
    const existe = listaUsuarios.some(u => u.id_usuario === id);
    if (!existe) {
      return Response.json(
        { message: 'Usuario no encontrado', code: 'USER_NOT_FOUND' },
        { status: 404 },
      );
    }
    listaUsuarios = listaUsuarios.filter(u => u.id_usuario !== id);
    return new Response(null, { status: 204 });
  }

  return Response.json({ ok: true });
};

function comprobar(condicion: unknown, mensaje: string): asserts condicion {
  if (!condicion) throw new Error(mensaje);
}

async function esperar(ms = 40): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms));
}

async function esperarTexto(texto: string, intentos = 40): Promise<void> {
  for (let i = 0; i < intentos; i++) {
    if (document.body.textContent?.includes(texto)) return;
    await esperar(25);
  }
  throw new Error(`No apareció el texto: ${texto}`);
}

async function esperarSinTexto(texto: string, intentos = 40): Promise<void> {
  for (let i = 0; i < intentos; i++) {
    if (!document.body.textContent?.includes(texto)) return;
    await esperar(25);
  }
  throw new Error(`El texto sigue visible: ${texto}`);
}

function montarPagina(): void {
  flushSync(() => root.render(<UsuariosPage />));
}

function desmontarPagina(): void {
  flushSync(() => root.render(<div />));
}

async function iniciarSesion(rol: Rol): Promise<void> {
  const email =
    rol === 'Operador'
      ? 'operador@example.test'
      : rol === 'Usuario'
        ? 'usuario@example.test'
        : 'admin@example.test';
  await session.login(email, 'login-test');
  comprobar(session.getRole() === rol, `La sesión debe ser ${rol}`);
}

function mostrarTodos(): void {
  const boton = document.querySelector('.usuarios-filtros button.list-filter') as HTMLButtonElement | null;
  comprobar(boton, 'Falta el filtro de estado');
  flushSync(() => boton.click());
  const todos = document.querySelector('#usuarios-filtros-panel fieldset input[type="checkbox"]') as HTMLInputElement | null;
  comprobar(todos, 'Falta el filtro de estado');
  if (!todos.checked) flushSync(() => todos.click());
  flushSync(() => (document.querySelector('.usuarios-filtros-apply') as HTMLButtonElement).click());
}

function filaPorCodigo(codigo: string): HTMLTableRowElement {
  const filas = [...document.querySelectorAll('tbody tr.usuarios-table-row')] as HTMLTableRowElement[];
  const fila = filas.find(tr => tr.textContent?.includes(codigo));
  comprobar(fila, `No hay fila para ${codigo}`);
  return fila;
}

function cambiarCampo(id: string, value: string): void {
  const campo = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null;
  comprobar(campo, `Falta el campo ${id}`);
  const prototype = campo instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(campo, value);
  const tipo = campo instanceof HTMLSelectElement ? 'change' : 'input';
  flushSync(() => campo.dispatchEvent(new Event(tipo, { bubbles: true })));
}

function putsUsuarios(): Peticion[] {
  return peticiones.filter(p => p.method === 'PUT' && /\/usuarios\/\d+/.test(p.url));
}

function deletesUsuarios(): Peticion[] {
  return peticiones.filter(p => p.method === 'DELETE' && /\/usuarios\/\d+/.test(p.url));
}

async function abrirEdicion(codigo: string): Promise<void> {
  flushSync(() => filaPorCodigo(codigo).cells[1]!.click());
  await esperarTexto('Editar usuario');
}

function botonEliminarEnModal(): HTMLButtonElement | null {
  return document.querySelector('button.usuario-form-eliminar');
}

async function solicitarEliminarDesdeModal(codigo: string): Promise<void> {
  await abrirEdicion(codigo);
  const boton = botonEliminarEnModal();
  comprobar(boton, `Debe existir Eliminar en el modal de ${codigo}`);
  flushSync(() => boton.click());
  await esperarTexto('Eliminar usuario definitivamente');
  await esperarSinTexto('Editar usuario');
}

async function montarConCarga(): Promise<void> {
  desmontarPagina();
  peticiones = [];
  montarPagina();
  await esperarTexto('ALU-A');
  mostrarTodos();
}

async function ejecutar(): Promise<void> {
  reiniciarDatos();

  // 2) Error de carga
  falloCarga = true;
  await iniciarSesion('Administrador');
  desmontarPagina();
  montarPagina();
  await esperarTexto('Error simulado al cargar usuarios');
  comprobar(!document.querySelector('tr.usuarios-table-row'), 'Con error de carga no debe haber filas de usuario');
  falloCarga = false;

  // 1) Carga correcta
  reiniciarDatos();
  await montarConCarga();
  comprobar(document.body.textContent?.includes('ALU-B'), 'Debe mostrar también ALU-B con filtro Todos');
  const filasIniciales = [...document.querySelectorAll('tbody tr.usuarios-table-row')];
  comprobar(filasIniciales[0]?.textContent?.includes('ALU-B'), 'La fecha de inscripción más reciente va primero');
  comprobar(filasIniciales[1]?.textContent?.includes('ALU-A'), 'La fecha de inscripción más antigua va después');
  comprobar(peticiones.some(p => p.method === 'GET' && p.url.includes('/usuarios')), 'Debe pedir GET /usuarios');

  // 3) Rol en tabla: solo etiqueta, nunca desplegable
  reiniciarDatos();
  await iniciarSesion('Administrador');
  await montarConCarga();
  comprobar(!document.querySelector('select.rol-select'), 'El rol no debe ser desplegable en la tabla');
  comprobar(document.querySelector('.rol-etiqueta'), 'El rol se muestra como etiqueta');
  comprobar(filaPorCodigo('ALU-A').textContent?.includes('Operador'), 'Ana muestra rol Operador');

  // 6) Estado: solo indicador en tabla; Operador no ve select en modal
  reiniciarDatos();
  await iniciarSesion('Operador');
  await montarConCarga();
  comprobar(document.querySelector('.estado-indicador-activo'), 'La tabla muestra indicador activo');
  comprobar(!document.querySelector('.rol-etiqueta'), 'Operador no ve el rol en el listado');
  comprobar(![...document.querySelectorAll('th')].some(th => th.textContent?.trim() === 'Rol'), 'Operador no ve la cabecera Rol');
  comprobar(document.querySelector('.usuarios-new-button')?.textContent?.includes('Nuevo socio'), 'El botón de alta del operador es Nuevo socio');
  comprobar(!document.querySelector('.estado-checkbox'), 'Activo no es checkbox en la tabla');
  await abrirEdicion('ALU-A');
  comprobar(!document.querySelector('#estado'), 'Operador no puede cambiar el selector de estado');
  const cajas = [...document.querySelectorAll('.usuario-form-options input[type="checkbox"]')] as HTMLInputElement[];
  comprobar(cajas.length === 3 && cajas.every(caja => !caja.disabled), 'Operador puede editar los checkbox');
  flushSync(() => cajas[0]!.click());
  flushSync(() => document.querySelector('form.usuario-form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  await esperar(80);
  const edicion = [...peticiones].reverse().find(peticion => peticion.method === 'PUT');
  comprobar(edicion?.body.socio === false, 'Operador guarda el cambio de Socio');
  comprobar(Object.hasOwn(edicion?.body ?? {}, 'matriculaPagada'), 'Operador envía la matrícula');
  comprobar(Object.hasOwn(edicion?.body ?? {}, 'id_estado_usuario'), 'Operador envía Activo');
  comprobar(!Object.hasOwn(edicion?.body ?? {}, 'id_rol'), 'Operador no envía el rol');
  await esperarSinTexto('Editar usuario');

  flushSync(() => (document.querySelector('.usuarios-new-button') as HTMLButtonElement).click());
  await esperarTexto('Nuevo socio');
  const altas = [...document.querySelectorAll('.usuario-form-options input[type="checkbox"]')] as HTMLInputElement[];
  comprobar(altas.length === 3 && altas.every(caja => !caja.disabled), 'Operador puede marcar los checkbox en el alta');
  comprobar((document.getElementById('activo') as HTMLInputElement).checked, 'El alta empieza activa');
  flushSync(() => altas[0]!.click());
  flushSync(() => altas[1]!.click());
  cambiarCampo('nombre', 'Nuria');
  flushSync(() => document.querySelector('form.usuario-form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  await esperar(80);
  const alta = [...peticiones].reverse().find(peticion => peticion.method === 'POST');
  comprobar(alta?.body.socio === true, 'El alta guarda Socio');
  comprobar(alta?.body.matriculaPagada === true, 'El alta guarda la matrícula');
  comprobar(alta?.body.id_estado_usuario === 1, 'El alta guarda Activo');
  comprobar(alta?.body.id_rol === 1, 'El alta de operador sigue siendo Usuario');
  comprobar(!document.querySelector('[role="dialog"]'), 'El alta se cierra');

  // 7) Estado autorizado solo desde el modal
  reiniciarDatos();
  await iniciarSesion('Administrador');
  await montarConCarga();
  comprobar(
    filaPorCodigo('ALU-A').querySelector('.estado-indicador-activo'),
    'Ana empieza activa en la tabla',
  );
  await abrirEdicion('ALU-A');
  cambiarCampo('estado', '2');
  flushSync(() => document.querySelector('form.usuario-form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  await esperar(80);
  await esperarSinTexto('Editar usuario');
  comprobar(putsUsuarios().some(p => p.body.id_estado_usuario === 2), 'Debe enviarse PUT con estado 2');
  comprobar(
    filaPorCodigo('ALU-A').querySelector('.estado-indicador') &&
      !filaPorCodigo('ALU-A').querySelector('.estado-indicador-activo'),
    'El indicador refleja el estado inactivo',
  );

  // 8) Error al cambiar estado desde el modal
  const estadoAntes = listaUsuarios.find(u => u.id_usuario === 2)!.id_estado_usuario;
  falloPut = true;
  await abrirEdicion('ALU-B');
  cambiarCampo('estado', estadoAntes === 1 ? '2' : '1');
  flushSync(() => document.querySelector('form.usuario-form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  await esperarTexto('Error simulado al actualizar usuario');
  comprobar(listaUsuarios.find(u => u.id_usuario === 2)?.id_estado_usuario === estadoAntes, 'Mock sin cambios de estado en Bruno');
  falloPut = false;
  flushSync(() => (document.querySelector('.usuario-form-cancel') as HTMLButtonElement).click());
  await esperarSinTexto('Editar usuario');
  desmontarPagina();
  montarPagina();
  await esperarTexto('ALU-B');
  mostrarTodos();
  const indicadorBruno = filaPorCodigo('ALU-B').querySelector('.estado-indicador');
  comprobar(indicadorBruno, 'Bruno tiene indicador de estado');
  comprobar(
    Boolean(filaPorCodigo('ALU-B').querySelector('.estado-indicador-activo')) === (estadoAntes === 1),
    'Tras error de estado, al recargar la UI conserva el estado anterior',
  );

  // 9) Creación: nuevo registro al principio
  reiniciarDatos();
  await iniciarSesion('Administrador');
  await montarConCarga();
  comprobar(document.querySelector('.usuarios-new-button')?.textContent?.includes('Nuevo usuario'), 'El botón de alta del administrador es Nuevo usuario');
  flushSync(() => (document.querySelector('.usuarios-new-button') as HTMLButtonElement).click());
  await esperarTexto('Nuevo usuario');
  cambiarCampo('tipoDocumento', '2');
  cambiarCampo('numeroDocumento', 'Y1234567X');
  cambiarCampo('nombre', 'Carla');
  cambiarCampo('email', 'carla@example.test');
  comprobar(document.getElementById('password'), 'El administrador ve la contraseña en el alta');
  const activoAlta = document.getElementById('activo') as HTMLInputElement | null;
  comprobar(activoAlta?.checked === true && activoAlta.disabled === false, 'El alta muestra Activo marcado');
  flushSync(() => document.querySelector('form.usuario-form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  await esperar(80);
  await esperarTexto('Carla');
  comprobar(peticiones.some(p => p.method === 'POST' && p.url.includes('/usuarios') && !('password' in p.body)), 'Debe enviarse POST de creación sin contraseña');
  comprobar(listaUsuarios[0]?.nombre === 'Carla', 'El alta debe quedar al principio del estado/lista de usuarios');
  comprobar(document.body.textContent?.includes('Carla'), 'Carla debe verse en el listado (aunque la tabla ordene por nombre)');
  // Con orden por nombre la fila visible no tiene por qué ser la primera; el prepend es del estado.
  const filas = [...document.querySelectorAll('tbody tr.usuarios-table-row')].map(tr => tr.textContent ?? '');
  comprobar(filas.some(texto => texto.includes('Carla')), 'Debe existir una fila para Carla');

  // 10) Edición: sustituye registro y cierra modal
  reiniciarDatos();
  await iniciarSesion('Administrador');
  await montarConCarga();
  flushSync(() => filaPorCodigo('ALU-A').cells[1]!.click());
  await esperarTexto('Editar usuario');
  cambiarCampo('nombre', 'Ana Actualizada');
  flushSync(() => document.querySelector('form.usuario-form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  await esperar(80);
  await esperarSinTexto('Editar usuario');
  await esperarTexto('Ana Actualizada');
  comprobar(document.body.textContent?.includes('Ana Actualizada'), 'La tabla muestra el nombre editado');
  comprobar(!document.body.textContent?.includes('Editar usuario'), 'El modal de edición debe cerrarse');

  // 11) Eliminar: Operador no ve botón en el modal de edición
  reiniciarDatos();
  await iniciarSesion('Operador');
  await montarConCarga();
  comprobar(!document.querySelector('.usuarios-eliminar-button'), 'Operador no ve Eliminar en la tabla');
  await abrirEdicion('ALU-B');
  comprobar(!botonEliminarEnModal(), 'Operador no ve Eliminar en el modal');
  flushSync(() => (document.querySelector('.usuario-form-cancel') as HTMLButtonElement).click());
  await esperarSinTexto('Editar usuario');

  // 12) Eliminar: Admin no ve botón al editarse a sí mismo (id_usuario 1 = Ana)
  reiniciarDatos();
  await iniciarSesion('Administrador');
  await montarConCarga();
  await abrirEdicion('ALU-A');
  comprobar(!botonEliminarEnModal(), 'Admin no puede eliminarse a sí mismo');
  flushSync(() => (document.querySelector('.usuario-form-cancel') as HTMLButtonElement).click());
  await esperarSinTexto('Editar usuario');
  await abrirEdicion('ALU-B');
  comprobar(botonEliminarEnModal(), 'Admin sí ve Eliminar al editar a Bruno');
  flushSync(() => (document.querySelector('.usuario-form-cancel') as HTMLButtonElement).click());
  await esperarSinTexto('Editar usuario');

  // 13) Cancelar confirmación: no hay DELETE ni cambios
  const deletesAntesCancel = deletesUsuarios().length;
  await solicitarEliminarDesdeModal('ALU-B');
  flushSync(() => (document.querySelector('.confirmar-eliminar-usuario-cancel') as HTMLButtonElement).click());
  await esperarSinTexto('Eliminar usuario definitivamente');
  comprobar(deletesUsuarios().length === deletesAntesCancel, 'Cancelar no debe enviar DELETE');
  comprobar(listaUsuarios.some(u => u.id_usuario === 2), 'Bruno sigue en el mock');
  comprobar(document.body.textContent?.includes('ALU-B'), 'Bruno sigue visible');

  // 14) Confirmar eliminación correcta
  await solicitarEliminarDesdeModal('ALU-B');
  flushSync(() => (document.querySelector('.confirmar-eliminar-usuario-submit') as HTMLButtonElement).click());
  await esperar(80);
  await esperarSinTexto('Eliminar usuario definitivamente');
  comprobar(deletesUsuarios().some(p => p.url.endsWith('/usuarios/2')), 'Debe enviarse DELETE /usuarios/2');
  comprobar(!listaUsuarios.some(u => u.id_usuario === 2), 'Bruno eliminado del mock');
  comprobar(!document.body.textContent?.includes('ALU-B'), 'Bruno desaparece del listado');

  // 15) Error 409: modal abierto, listado intacto, mensaje de datos relacionados
  reiniciarDatos();
  await iniciarSesion('Administrador');
  await montarConCarga();
  falloDelete = {
    status: 409,
    code: 'FOREIGN_KEY_CONSTRAINT',
    message: 'La operación incumple una relación entre datos',
  };
  await solicitarEliminarDesdeModal('ALU-B');
  flushSync(() => (document.querySelector('.confirmar-eliminar-usuario-submit') as HTMLButtonElement).click());
  await esperarTexto('datos relacionados');
  comprobar(document.body.textContent?.includes('Eliminar usuario definitivamente'), 'El modal permanece abierto tras error');
  comprobar(listaUsuarios.some(u => u.id_usuario === 2), 'Bruno no se elimina del mock en 409');
  comprobar(document.body.textContent?.includes('ALU-B'), 'Bruno sigue en el listado tras 409');
  flushSync(() => (document.querySelector('.confirmar-eliminar-usuario-cancel') as HTMLButtonElement).click());
  await esperarSinTexto('Eliminar usuario definitivamente');
  falloDelete = null;

  // 16) Error 404: no quita del listado hasta cancelar/recargar
  reiniciarDatos();
  await iniciarSesion('Administrador');
  await montarConCarga();
  falloDelete = {
    status: 404,
    code: 'USER_NOT_FOUND',
    message: 'Usuario no encontrado',
  };
  await solicitarEliminarDesdeModal('ALU-B');
  flushSync(() => (document.querySelector('.confirmar-eliminar-usuario-submit') as HTMLButtonElement).click());
  await esperarTexto('ya no existe');
  comprobar(document.body.textContent?.includes('ALU-B'), 'Tras 404 no se elimina localmente sin confirmar servidor');
  comprobar(listaUsuarios.some(u => u.id_usuario === 2), 'Mock conserva Bruno tras 404 forzado');
  falloDelete = null;
  listaUsuarios = listaUsuarios.filter(u => u.id_usuario !== 2);
  flushSync(() => (document.querySelector('.confirmar-eliminar-usuario-cancel') as HTMLButtonElement).click());
  await esperar(80);
  await esperarSinTexto('ALU-B');

  // 17) Rol Usuario: sin botones de eliminación
  reiniciarDatos();
  await iniciarSesion('Usuario');
  await montarConCarga();
  comprobar(!document.querySelector('.usuarios-eliminar-button'), 'Usuario no ve Eliminar en la tabla');
  comprobar(!document.querySelector('.usuario-form-eliminar'), 'Usuario no ve Eliminar sin abrir edición');

  // 18) Sesión sin ID autenticado: sin botón Eliminar en el modal
  reiniciarDatos();
  idUsuarioToken = null;
  await iniciarSesion('Administrador');
  comprobar(session.getUserId() === null, 'La sesión no tiene id_usuario');
  await montarConCarga();
  await abrirEdicion('ALU-B');
  comprobar(!botonEliminarEnModal(), 'Sin id de sesión no hay Eliminar en el modal');
  flushSync(() => (document.querySelector('.usuario-form-cancel') as HTMLButtonElement).click());
  await esperarSinTexto('Editar usuario');
  idUsuarioToken = 1;

  // 19) Modal muestra usuario correcto; DELETE único; resto del listado intacto
  reiniciarDatos();
  await iniciarSesion('Administrador');
  await montarConCarga();
  const deletesAntesExito = deletesUsuarios().length;
  await solicitarEliminarDesdeModal('ALU-B');
  comprobar(document.body.textContent?.includes('Bruno Martín Ruiz'), 'Modal muestra el nombre de Bruno');
  comprobar(document.body.textContent?.includes('ALU-B'), 'Modal muestra el código de Bruno');
  flushSync(() => (document.querySelector('.confirmar-eliminar-usuario-submit') as HTMLButtonElement).click());
  await esperar(80);
  await esperarSinTexto('Eliminar usuario definitivamente');
  comprobar(deletesUsuarios().length === deletesAntesExito + 1, 'Solo una petición DELETE');
  comprobar(document.body.textContent?.includes('ALU-A'), 'Ana permanece en el listado');
  comprobar(listaUsuarios.some(u => u.id_usuario === 1), 'Ana permanece en el mock');

  // 20) Durante la petición: botones bloqueados
  reiniciarDatos();
  await iniciarSesion('Administrador');
  await montarConCarga();
  deleteDelayMs = 250;
  await solicitarEliminarDesdeModal('ALU-B');
  flushSync(() => (document.querySelector('.confirmar-eliminar-usuario-submit') as HTMLButtonElement).click());
  await esperar(40);
  const cancelDurante = document.querySelector('.confirmar-eliminar-usuario-cancel') as HTMLButtonElement | null;
  const submitDurante = document.querySelector('.confirmar-eliminar-usuario-submit') as HTMLButtonElement | null;
  comprobar(cancelDurante?.disabled === true, 'Cancelar deshabilitado durante submitting');
  comprobar(submitDurante?.disabled === true, 'Confirmar deshabilitado durante submitting');
  comprobar(submitDurante?.textContent?.includes('Eliminando'), 'Texto Eliminando... durante submitting');
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await esperar(20);
  comprobar(document.body.textContent?.includes('Eliminar usuario definitivamente'), 'Escape no cierra durante submitting');
  await esperar(300);
  await esperarSinTexto('Eliminar usuario definitivamente');
  deleteDelayMs = 0;

  // 21) Error 403 FORBIDDEN: mensaje y sin borrado local
  reiniciarDatos();
  await iniciarSesion('Administrador');
  await montarConCarga();
  falloDelete = { status: 403, code: 'FORBIDDEN', message: 'No tienes permisos' };
  await solicitarEliminarDesdeModal('ALU-B');
  flushSync(() => (document.querySelector('.confirmar-eliminar-usuario-submit') as HTMLButtonElement).click());
  await esperarTexto('No tienes permiso para eliminar usuarios');
  comprobar(listaUsuarios.some(u => u.id_usuario === 2), '403 no elimina del mock');
  comprobar(document.body.textContent?.includes('ALU-B'), '403 no elimina del listado');
  flushSync(() => (document.querySelector('.confirmar-eliminar-usuario-cancel') as HTMLButtonElement).click());
  falloDelete = null;

  // 22) Error 403 SELF_DELETION_FORBIDDEN
  reiniciarDatos();
  await iniciarSesion('Administrador');
  await montarConCarga();
  falloDelete = {
    status: 403,
    code: 'SELF_DELETION_FORBIDDEN',
    message: 'No puedes eliminar tu propia cuenta',
  };
  await solicitarEliminarDesdeModal('ALU-B');
  flushSync(() => (document.querySelector('.confirmar-eliminar-usuario-submit') as HTMLButtonElement).click());
  await esperarTexto('No puedes eliminar tu propia cuenta');
  comprobar(listaUsuarios.some(u => u.id_usuario === 2), 'SELF_DELETION no elimina del mock');
  flushSync(() => (document.querySelector('.confirmar-eliminar-usuario-cancel') as HTMLButtonElement).click());
  falloDelete = null;

  // 23) Error de servidor: permanece y se puede reintentar
  reiniciarDatos();
  await iniciarSesion('Administrador');
  await montarConCarga();
  falloDelete = { status: 500, code: 'INTERNAL', message: 'Error simulado del servidor' };
  await solicitarEliminarDesdeModal('ALU-B');
  flushSync(() => (document.querySelector('.confirmar-eliminar-usuario-submit') as HTMLButtonElement).click());
  await esperarTexto('Error simulado del servidor');
  comprobar(listaUsuarios.some(u => u.id_usuario === 2), 'Error 500 no elimina del mock');
  comprobar(document.body.textContent?.includes('ALU-B'), 'Error 500 no elimina del listado');
  falloDelete = null;
  const deletesAntesReintento = deletesUsuarios().length;
  flushSync(() => (document.querySelector('.confirmar-eliminar-usuario-submit') as HTMLButtonElement).click());
  await esperar(80);
  await esperarSinTexto('Eliminar usuario definitivamente');
  comprobar(deletesUsuarios().length === deletesAntesReintento + 1, 'Reintento tras error envía otro DELETE');
  comprobar(!document.body.textContent?.includes('ALU-B'), 'Tras reintento exitoso Bruno desaparece');

  // 24) Pérdida de permiso antes de confirmar: no DELETE
  reiniciarDatos();
  await iniciarSesion('Administrador');
  await montarConCarga();
  await solicitarEliminarDesdeModal('ALU-B');
  rolSesion = 'Operador';
  await session.refresh();
  comprobar(session.getRole() === 'Operador', 'La sesión pasa a Operador');
  const deletesAntesPermiso = deletesUsuarios().length;
  flushSync(() => (document.querySelector('.confirmar-eliminar-usuario-submit') as HTMLButtonElement).click());
  await esperarTexto('No tienes permiso para eliminar usuarios');
  comprobar(deletesUsuarios().length === deletesAntesPermiso, 'Sin permiso no se envía DELETE');
  comprobar(listaUsuarios.some(u => u.id_usuario === 2), 'Sin permiso Bruno permanece');
}

try {
  await ejecutar();
  document.getElementById('resultado')!.textContent =
    'PASS: integración eliminación administrativa UsuariosPage (mocks).';
} catch (error) {
  document.getElementById('resultado')!.textContent = `FAIL: ${String(error)}`;
} finally {
  window.fetch = originalFetch;
  root.unmount();
}
