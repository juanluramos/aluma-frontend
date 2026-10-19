import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ListaInscritos } from "../src/components/actividades/ActividadInscritos.tsx";
import type { EstadoPagoCatalogo } from "../src/types/catalogoPago.ts";
import type { Inscripcion } from "../src/types/inscripcion.ts";
import { listasDeActividad } from "../src/utils/inscritosActividad.ts";

const estados: EstadoPagoCatalogo[] = [
  { id_estado_pago: 8, nombre_estado: "Pendiente" },
  { id_estado_pago: 9, nombre_estado: "Pagado" },
];

function inscripcion(parcial: Partial<Inscripcion> = {}): Inscripcion {
  return {
    id_inscripcion: 1,
    id_usuario: 9,
    id_actividad: 12,
    precioAplicado: "10.00",
    id_estado_pago: 8,
    id_estado_inscripcion: 1,
    id_metodo_pago: null,
    apuntadoFecha: "2026-10-01T00:00:00.000Z",
    fechaPago: null,
    comentario: null,
    createAt: "2026-10-01T10:00:00.000Z",
    updateAt: "2026-10-01T10:00:00.000Z",
    posicionEspera: null,
    plazasOcupadas: 0,
    plazasDisponibles: 20,
    aforo: 20,
    puedePromocionar: false,
    Usuario: { id_usuario: 9, nombre: "Ana", apellido1: "García", apellido2: null },
    Actividad: { id_actividad: 12, titulo: "Taller" },
    ...parcial,
  };
}

test("la pestaña reúne pagos Pagado y Pendiente y aparta la lista de espera", () => {
  const { inscritos, espera } = listasDeActividad([
    inscripcion({ id_inscripcion: 2, id_usuario: 3, id_estado_pago: 9, Usuario: { id_usuario: 3, nombre: "Zoe", apellido1: "Ruiz", apellido2: null } }),
    inscripcion({ id_inscripcion: 3, id_actividad: 4, Usuario: { id_usuario: 4, nombre: "Otra", apellido1: "Actividad", apellido2: null } }),
    inscripcion({ id_inscripcion: 5, id_estado_pago: 3, Usuario: { id_usuario: 5, nombre: "Luis", apellido1: "Cancelado", apellido2: null } }),
    inscripcion({
      id_inscripcion: 7,
      id_estado_inscripcion: 17,
      posicionEspera: 2,
      Usuario: { id_usuario: 7, nombre: "Nuria", apellido1: "Sanz", apellido2: null },
    }),
    inscripcion({
      id_inscripcion: 6,
      id_estado_inscripcion: 17,
      posicionEspera: 1,
      Usuario: { id_usuario: 6, nombre: "Bruno", apellido1: "Martín", apellido2: null },
    }),
    inscripcion(),
  ], 12, [
    ...estados,
    { id_estado_pago: 3, nombre_estado: "Cancelado" },
  ], 17);
  assert.deepEqual(inscritos.map((item) => item.id_inscripcion), [1, 2]);
  assert.deepEqual(espera.map((item) => item.id_inscripcion), [6, 7]);

  const html = renderToStaticMarkup(createElement(ListaInscritos, {
    inscripciones: inscritos,
    espera,
    estadosPago: estados,
  }));
  assert.match(html, /2 inscritos/);
  assert.match(html, /Ana García/);
  assert.match(html, />Pendiente</);
  assert.match(html, /Zoe Ruiz/);
  assert.match(html, />Pagado</);
  assert.match(html, /Lista de espera/);
  assert.match(html, /2 en espera/);
  assert.match(html, /Bruno Martín/);
  assert.match(html, /En espera · 1/);
  assert.match(html, /Nuria Sanz/);
  assert.match(html, /En espera · 2/);
  assert.doesNotMatch(html, /actividad-pago-/);
  assert.doesNotMatch(html, /Otra Actividad/);
  assert.doesNotMatch(html, /Luis Cancelado/);
  assert.ok(html.indexOf("Ana García") < html.indexOf("Zoe Ruiz"));
  assert.ok(html.indexOf("Bruno Martín") < html.indexOf("Nuria Sanz"));
  assert.match(html, /actividad-inscritos-scroll/);
});

test("una actividad sin inscripciones muestra el total y el estado vacío", () => {
  const html = renderToStaticMarkup(createElement(ListaInscritos, {
    inscripciones: [],
    espera: [],
    estadosPago: estados,
  }));
  assert.match(html, /0 inscritos/);
  assert.match(html, /No hay usuarios inscritos/);
  assert.match(html, /0 en espera/);
  assert.match(html, /No hay usuarios en lista de espera/);
  assert.doesNotMatch(html, /<button/);
});

test("pulsar un usuario abre su inscripción, también en la lista de espera", () => {
  const html = renderToStaticMarkup(createElement(ListaInscritos, {
    inscripciones: [inscripcion()],
    espera: [inscripcion({
      id_inscripcion: 6,
      id_estado_inscripcion: 17,
      posicionEspera: 1,
      Usuario: { id_usuario: 6, nombre: "Bruno", apellido1: "Martín", apellido2: null },
    })],
    estadosPago: estados,
    onSeleccionar: () => undefined,
  }));
  assert.match(html, /aria-label="Ver inscripción de Ana García"/);
  assert.match(html, /aria-label="Ver inscripción de Bruno Martín"/);
});
