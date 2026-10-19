import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import InscripcionCampos from "../src/components/inscripciones/InscripcionCampos.tsx";
import InscripcionFormModal from "../src/components/inscripciones/InscripcionFormModal.tsx";
import InscripcionesPage from "../src/pages/InscripcionesPage.tsx";
import { API_URL, session } from "../src/services/authService.ts";
import type { Inscripcion } from "../src/types/inscripcion.ts";
import type { InscripcionFormState } from "../src/utils/inscripcionFormState.ts";

function token(rol: string, id: number): string {
  const payload = { rol, id_usuario: id, exp: Math.floor(Date.now() / 1000) + 60 * 60 };
  return `header.${Buffer.from(JSON.stringify(payload)).toString("base64")}.signature`;
}

async function entrar(rol: string, id: number): Promise<void> {
  globalThis.fetch = (async (input) => {
    const url = String(input);
    if (url === `${API_URL}/auth/login` || url === `${API_URL}/auth/refresh`) {
      return Response.json({ token: token(rol, id) });
    }
    return Response.json([]);
  }) as typeof fetch;
  await session.login(`${rol}@example.test`, "clave");
}

const valores: InscripcionFormState = { id_usuario: "9", id_actividad: "12", comentario: "" };

test("Los selectores muestran nombres y no identificadores sueltos", () => {
  const html = renderToStaticMarkup(createElement(InscripcionCampos, {
    valores,
    errores: { id_actividad: "Selecciona una actividad." },
    disabled: false,
    elegirUsuario: true,
    usuarios: [{ id_usuario: 9, nombre: "Ana García López", codigo: "ALU-9" }],
    nombrePropio: "",
    actividades: [{ id_actividad: 12, titulo: "Taller de cerámica" }],
    onChange: () => undefined,
  }));

  assert.match(html, /Ana García López/);
  assert.match(html, /ALU-9/);
  assert.match(html, /Código socio/);
  assert.match(html, /Buscar usuario/);
  assert.doesNotMatch(html, /id="inscripcion-id_usuario"[^>]*<option/);
  assert.match(html, /Taller de cerámica/);
  assert.match(html, /Buscar actividad/);
  assert.match(html, /Código actividad/);
  assert.doesNotMatch(html, /<select/);
  assert.doesNotMatch(html, /Precio/);
  assert.doesNotMatch(html, /Estado de pago/);
  assert.doesNotMatch(html, />9</);
  assert.doesNotMatch(html, />12</);
});

test("Usuario, operador y administrador abren el alta; solo la gestión elige usuario", async () => {
  for (const rol of ["Operador", "Administrador"]) {
    await entrar(rol, 3);
    const pagina = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(InscripcionesPage)));
    const modal = renderToStaticMarkup(createElement(InscripcionFormModal, {
      onClose: () => undefined,
      onCreada: () => undefined,
    }));

    assert.match(pagina, /Nueva inscripción/);
    assert.doesNotMatch(pagina, /modal-container/);
    assert.match(modal, /Nueva inscripción/);
    assert.match(modal, /Buscar usuario/);
    assert.match(modal, /Código socio/);
    assert.doesNotMatch(modal, /Selecciona un usuario/);
    assert.match(modal, /Buscar actividad/);
    assert.match(modal, /Código actividad/);
    assert.match(modal, /Comentarios/);
    assert.match(modal, /Cancelar/);
    assert.match(modal, /Cerrar modal/);
    assert.match(modal, /Crear inscripción/);
    assert.match(modal, /disabled/);
    assert.doesNotMatch(modal, /Precio/);
    assert.doesNotMatch(modal, /Estado de pago/);
    assert.doesNotMatch(modal, /Método de pago/);
  }

  await entrar("Usuario", 7);
  const pagina = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(InscripcionesPage)));
  const modal = renderToStaticMarkup(createElement(InscripcionFormModal, {
    onClose: () => undefined,
    onCreada: () => undefined,
  }));

  assert.match(pagina, /Nueva inscripción/);
  assert.match(modal, /Tu usuario/);
  assert.doesNotMatch(modal, /Selecciona un usuario/);
  assert.doesNotMatch(modal, /Código socio/);
  assert.match(modal, /Buscar actividad/);
  assert.match(modal, /Código actividad/);
});

const edicion: Inscripcion = {
  id_inscripcion: 4,
  id_usuario: 9,
  id_actividad: 12,
  precioAplicado: "25.00",
  id_estado_pago: 2,
  id_estado_inscripcion: 1,
  id_metodo_pago: 3,
  apuntadoFecha: "2026-10-01T00:00:00.000Z",
  fechaPago: "2026-10-02T00:00:00.000Z",
  comentario: "Nota inicial",
  createAt: "2026-10-01T10:00:00.000Z",
  updateAt: "2026-10-01T10:00:00.000Z",
  posicionEspera: null,
  plazasOcupadas: 0,
  plazasDisponibles: null,
  aforo: null,
  puedePromocionar: false,
  Usuario: { id_usuario: 9, nombre: "Ana", apellido1: "García", apellido2: "López" },
  Actividad: { id_actividad: 12, titulo: "Taller de cerámica" },
};

test("La edición precarga usuario, actividad y comentario sin campos económicos", async () => {
  for (const rol of ["Operador", "Administrador"]) {
    await entrar(rol, 3);
    const html = renderToStaticMarkup(createElement(InscripcionFormModal, {
      inscripcion: edicion,
      onClose: () => undefined,
      onEditada: () => undefined,
    }));

    assert.match(html, /Editar inscripción/);
    assert.match(html, /Ana García López/);
    assert.match(html, /Taller de cerámica/);
    assert.match(html, /Nota inicial/);
    assert.match(html, /Guardar cambios/);
    assert.match(html, />Cerrar</);
    assert.match(html, /disabled/);
    assert.doesNotMatch(html, /Selecciona un usuario/);
    assert.doesNotMatch(html, /Selecciona una actividad/);
    assert.doesNotMatch(html, /Precio/);
    assert.doesNotMatch(html, /Estado de pago/);
    assert.doesNotMatch(html, /Método de pago/);
    assert.doesNotMatch(html, /Fecha de pago/);
  }

  await entrar("Usuario", 7);
  const html = renderToStaticMarkup(createElement(InscripcionFormModal, {
    inscripcion: edicion,
    onClose: () => undefined,
    onEditada: () => undefined,
  }));
  const boton = html.match(/<button type="submit"[^>]*>/)?.[0] ?? "";
  assert.match(boton, /disabled/);
  assert.match(html.match(/<textarea[^>]*>/)?.[0] ?? "", /disabled/);
  assert.doesNotMatch(html, /Registrar pago/);
});

const catalogo = {
  metodos: [
    { id_metodo_pago: 7, nombre: "Bizum" },
    { id_metodo_pago: 8, nombre: "Transferencia" },
  ],
  estados: [
    { id_estado_pago: 11, nombre_estado: "Pendiente" },
    { id_estado_pago: 22, nombre_estado: "Pagado" },
    { id_estado_pago: 33, nombre_estado: "Devolución" },
    { id_estado_pago: 44, nombre_estado: "Cancelado" },
  ],
  estadosInscripcion: [
    { id_estado_inscripcion: 15, nombre: "Activa" },
    { id_estado_inscripcion: 16, nombre: "Cerrada" },
  ],
};

function pendiente(parcial: Partial<typeof edicion> = {}): typeof edicion {
  return {
    ...edicion,
    precioAplicado: "25.00",
    id_estado_pago: 11,
    id_estado_inscripcion: 15,
    ...parcial,
  };
}

test("Registrar pago solo aparece en una inscripción activa, pendiente y con importe", async () => {
  for (const rol of ["Operador", "Administrador"]) {
    await entrar(rol, 3);
    const html = renderToStaticMarkup(createElement(InscripcionFormModal, {
      inscripcion: pendiente(),
      ...catalogo,
      onClose: () => undefined,
    }));
    assert.match(html, /Registrar pago/);
    assert.doesNotMatch(html, /Método de pago/);
    assert.doesNotMatch(html, /Fecha de pago/);
    assert.doesNotMatch(html, /Confirmar pago/);
    assert.doesNotMatch(html, /value="7"/);
  }

  const ocultas = [
    pendiente({ id_estado_pago: 22 }),
    pendiente({ id_estado_inscripcion: 16 }),
    pendiente({ id_estado_inscripcion: 99 }),
    pendiente({ id_estado_pago: 44 }),
    pendiente({ id_estado_pago: 33 }),
    pendiente({ precioAplicado: "0.00" }),
    pendiente({ precioAplicado: null }),
  ];

  await entrar("Operador", 3);
  for (const inscripcion of ocultas) {
    const html = renderToStaticMarkup(createElement(InscripcionFormModal, {
      inscripcion,
      ...catalogo,
      onClose: () => undefined,
    }));
    assert.doesNotMatch(html, /Registrar pago/);
  }

  await entrar("Usuario", 7);
  const html = renderToStaticMarkup(createElement(InscripcionFormModal, {
    inscripcion: pendiente(),
    ...catalogo,
    onClose: () => undefined,
  }));
  assert.doesNotMatch(html, /Registrar pago/);
  assert.doesNotMatch(html, /Registrar devolución/);
});

test("Registrar devolución solo aparece en un cobro pagado", async () => {
  const pagada = pendiente({
    id_estado_pago: 22,
    id_metodo_pago: 7,
    fechaPago: "2026-10-14",
    precioAplicado: "25.00",
  });

  for (const rol of ["Operador", "Administrador"]) {
    await entrar(rol, 3);
    const html = renderToStaticMarkup(createElement(InscripcionFormModal, {
      inscripcion: pagada,
      ...catalogo,
      onClose: () => undefined,
    }));
    assert.match(html, /Registrar devolución/);
    assert.doesNotMatch(html, /Registrar pago/);
    assert.doesNotMatch(html, /Confirmar devolución/);
    assert.doesNotMatch(html, /Precio aplicado/);
    assert.doesNotMatch(html, /cerrará la inscripción/);
  }

  const ocultas = [
    pendiente(),
    pendiente({ id_estado_pago: 33, id_metodo_pago: 7, fechaPago: "2026-10-14" }),
    pendiente({ id_estado_pago: 44, id_metodo_pago: 7, fechaPago: "2026-10-14" }),
    pendiente({ id_estado_pago: 22, id_metodo_pago: null, fechaPago: "2026-10-14" }),
    pendiente({ id_estado_pago: 22, id_metodo_pago: 7, fechaPago: null }),
    pendiente({ id_estado_pago: 22, id_metodo_pago: 7, fechaPago: "2026-10-14", precioAplicado: "0.00" }),
  ];
  await entrar("Operador", 3);
  for (const inscripcion of ocultas) {
    const html = renderToStaticMarkup(createElement(InscripcionFormModal, {
      inscripcion,
      ...catalogo,
      onClose: () => undefined,
    }));
    assert.doesNotMatch(html, /Registrar devolución/);
  }

  await entrar("Usuario", 7);
  const html = renderToStaticMarkup(createElement(InscripcionFormModal, {
    inscripcion: pagada,
    ...catalogo,
    onClose: () => undefined,
  }));
  assert.doesNotMatch(html, /Registrar devolución/);
});

test("Activar inscripción solo aparece para la primera persona en espera", async () => {
  const estadosInscripcion = [
    ...catalogo.estadosInscripcion,
    { id_estado_inscripcion: 17, nombre: "En espera" },
  ];
  const espera = pendiente({
    id_estado_inscripcion: 17,
    id_estado_pago: 11,
    posicionEspera: 1,
    plazasOcupadas: 1,
    plazasDisponibles: 1,
    aforo: 2,
    puedePromocionar: true,
  });

  await entrar("Operador", 3);
  const visible = renderToStaticMarkup(createElement(InscripcionFormModal, {
    inscripcion: espera,
    ...catalogo,
    estadosInscripcion,
    onClose: () => undefined,
  }));
  assert.match(visible, /Activar inscripción/);
  assert.match(visible, /id="inscripcion-espera-estado"[^>]*value="En espera"/);
  assert.match(visible, /id="inscripcion-espera-posicion"[^>]*value="1"/);
  assert.match(visible, /id="inscripcion-espera-ocupadas"[^>]*value="1"/);
  assert.match(visible, /id="inscripcion-espera-aforo"[^>]*value="2"/);
  assert.doesNotMatch(visible, /Confirmar activación/);
  assert.doesNotMatch(visible, /ocupará una plaza disponible/);

  const segunda = renderToStaticMarkup(createElement(InscripcionFormModal, {
    inscripcion: { ...espera, posicionEspera: 2, puedePromocionar: false },
    ...catalogo,
    estadosInscripcion,
    onClose: () => undefined,
  }));
  assert.match(segunda, /id="inscripcion-espera-posicion"[^>]*value="2"/);
  assert.doesNotMatch(segunda, /Activar inscripción/);

  const sinLimite = renderToStaticMarkup(createElement(InscripcionFormModal, {
    inscripcion: { ...espera, aforo: null, plazasDisponibles: null },
    ...catalogo,
    estadosInscripcion,
    onClose: () => undefined,
  }));
  assert.match(sinLimite, /Sin límite/);
  assert.match(sinLimite, /Activar inscripción/);

  const sinPendiente = renderToStaticMarkup(createElement(InscripcionFormModal, {
    inscripcion: { ...espera, id_estado_pago: 22 },
    ...catalogo,
    estadosInscripcion,
    onClose: () => undefined,
  }));
  assert.doesNotMatch(sinPendiente, /Activar inscripción/);

  const sinCatalogo = renderToStaticMarkup(createElement(InscripcionFormModal, {
    inscripcion: espera,
    ...catalogo,
    onClose: () => undefined,
  }));
  assert.doesNotMatch(sinCatalogo, /Activar inscripción/);
  assert.doesNotMatch(sinCatalogo, /Posición en la lista/);

  await entrar("Usuario", 7);
  const usuario = renderToStaticMarkup(createElement(InscripcionFormModal, {
    inscripcion: espera,
    ...catalogo,
    estadosInscripcion,
    onClose: () => undefined,
  }));
  assert.doesNotMatch(usuario, /Activar inscripción/);
});
