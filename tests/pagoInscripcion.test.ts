import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import InscripcionCobroCampos from "../src/components/inscripciones/InscripcionCobroCampos.tsx";
import type { EstadoPagoCatalogo } from "../src/types/catalogoPago.ts";
import type { Inscripcion } from "../src/types/inscripcion.ts";
import { construirDevolucionInscripcion, construirPagoInscripcion } from "../src/utils/pagoInscripcionPayload.ts";
import {
  fechaLocalHoy,
  idEstadoPorNombre,
  idInscripcionPorNombre,
  puedeRegistrarDevolucion,
  puedeRegistrarPago,
  validarPago,
} from "../src/utils/pagoInscripcion.ts";

const estados: EstadoPagoCatalogo[] = [
  { id_estado_pago: 11, nombre_estado: "Pendiente" },
  { id_estado_pago: 22, nombre_estado: "Pagado" },
  { id_estado_pago: 33, nombre_estado: "Devolución" },
  { id_estado_pago: 44, nombre_estado: "Cancelado" },
];

const inscripcion = {
  id_inscripcion: 4,
  id_usuario: 9,
  id_actividad: 12,
  precioAplicado: "25.00",
  id_estado_pago: 11,
  id_estado_inscripcion: 15,
  id_metodo_pago: null,
  apuntadoFecha: "2026-10-01T00:00:00.000Z",
  fechaPago: null,
  comentario: null,
  createAt: "2026-10-01T10:00:00.000Z",
  updateAt: "2026-10-01T10:00:00.000Z",
  posicionEspera: null,
  plazasOcupadas: 0,
  plazasDisponibles: null,
  aforo: null,
  puedePromocionar: false,
  Usuario: { id_usuario: 9, nombre: "Ana", apellido1: "García", apellido2: "López" },
  Actividad: { id_actividad: 12, titulo: "Taller de cerámica" },
} satisfies Inscripcion;

test("la fecha local no usa el día UTC", () => {
  const medianoche = new Date(2026, 9, 14, 0, 30);
  assert.equal(fechaLocalHoy(medianoche), "2026-10-14");
  assert.equal(fechaLocalHoy(new Date(2026, 0, 5)), "2026-01-05");
});

const estadosInscripcion = [
  { id_estado_inscripcion: 15, nombre: "Activa" },
  { id_estado_inscripcion: 16, nombre: "Cerrada" },
];

test("Pagado y Pendiente salen del nombre del catálogo", () => {
  assert.equal(idEstadoPorNombre(estados, "Pagado"), 22);
  assert.equal(idEstadoPorNombre(estados, "Pendiente"), 11);
  assert.equal(idEstadoPorNombre(estados, "Cobrado"), null);
  assert.equal(idInscripcionPorNombre(estadosInscripcion, "Activa"), 15);
  assert.equal(idInscripcionPorNombre(estadosInscripcion, "Cerrada"), 16);
  assert.equal(idInscripcionPorNombre([], "Activa"), null);
});

test("solo se puede cobrar una activa pendiente con importe positivo", () => {
  assert.equal(puedeRegistrarPago(inscripcion, estados, estadosInscripcion, true), true);
  assert.equal(puedeRegistrarPago(inscripcion, estados, estadosInscripcion, false), false);
  assert.equal(puedeRegistrarPago({ ...inscripcion, id_estado_pago: 22 }, estados, estadosInscripcion, true), false);
  assert.equal(puedeRegistrarPago({ ...inscripcion, id_estado_inscripcion: 16 }, estados, estadosInscripcion, true), false);
  assert.equal(puedeRegistrarPago({ ...inscripcion, id_estado_inscripcion: 99 }, estados, estadosInscripcion, true), false);
  assert.equal(puedeRegistrarPago({ ...inscripcion, id_estado_pago: 44 }, estados, estadosInscripcion, true), false);
  assert.equal(puedeRegistrarPago({ ...inscripcion, id_estado_pago: 33 }, estados, estadosInscripcion, true), false);
  assert.equal(puedeRegistrarPago({ ...inscripcion, precioAplicado: "0.00" }, estados, estadosInscripcion, true), false);
  assert.equal(puedeRegistrarPago({ ...inscripcion, precioAplicado: null }, estados, estadosInscripcion, true), false);
  assert.equal(puedeRegistrarPago(inscripcion, [], estadosInscripcion, true), false);
  assert.equal(puedeRegistrarPago(inscripcion, estados, [], true), false);
});

test("la devolución solo se ofrece sobre un cobro pagado válido", () => {
  const pagada = {
    ...inscripcion,
    id_estado_pago: 22,
    id_metodo_pago: 7,
    fechaPago: "2026-10-14",
  };
  assert.equal(puedeRegistrarDevolucion(pagada, estados, true), true);
  assert.equal(puedeRegistrarDevolucion(pagada, estados, false), false);
  assert.equal(puedeRegistrarDevolucion(inscripcion, estados, true), false);
  assert.equal(puedeRegistrarDevolucion({ ...pagada, id_estado_pago: 33 }, estados, true), false);
  assert.equal(puedeRegistrarDevolucion({ ...pagada, id_estado_pago: 44 }, estados, true), false);
  assert.equal(puedeRegistrarDevolucion({ ...pagada, id_estado_pago: 99 }, estados, true), false);
  assert.equal(puedeRegistrarDevolucion({ ...pagada, precioAplicado: "0.00" }, estados, true), false);
  assert.equal(puedeRegistrarDevolucion({ ...pagada, precioAplicado: null }, estados, true), false);
  assert.equal(puedeRegistrarDevolucion({ ...pagada, id_metodo_pago: null }, estados, true), false);
  assert.equal(puedeRegistrarDevolucion({ ...pagada, fechaPago: null }, estados, true), false);
  assert.equal(puedeRegistrarDevolucion(pagada, [], true), false);
  assert.equal(puedeRegistrarDevolucion(pagada, estados.filter((estado) => estado.nombre_estado !== "Devolución"), true), false);
});

test("el cuerpo de la devolución solo contiene el estado", () => {
  const cuerpo = construirDevolucionInscripcion(33);
  assert.deepEqual(cuerpo, { id_estado_pago: 33 });
  assert.deepEqual(Object.keys(cuerpo), ["id_estado_pago"]);
});

test("el cuerpo del cobro tiene exactamente tres campos", () => {
  const cuerpo = construirPagoInscripcion(22, 7, "2026-10-14");
  assert.deepEqual(cuerpo, {
    id_estado_pago: 22,
    id_metodo_pago: 7,
    fechaPago: "2026-10-14",
  });
  assert.deepEqual(Object.keys(cuerpo), ["id_estado_pago", "id_metodo_pago", "fechaPago"]);
});

test("el cobro exige método y fecha reales", () => {
  assert.deepEqual(validarPago("", "2026-10-14"), { metodo: "Selecciona un método de pago." });
  assert.deepEqual(validarPago("7", ""), { fecha: "Indica una fecha de pago válida." });
  assert.deepEqual(validarPago("7", "2026-10-14"), {});
});

test("el importe del cobro es de solo lectura y usa los métodos recibidos", () => {
  const html = renderToStaticMarkup(createElement(InscripcionCobroCampos, {
    usuario: "Ana García López",
    actividad: "Taller de cerámica",
    importe: "25.00 €",
    metodos: [{ id_metodo_pago: 7, nombre: "Bizum" }],
    metodo: "7",
    fecha: "2026-10-14",
    errores: {},
    disabled: false,
    onMetodo: () => undefined,
    onFecha: () => undefined,
  }));

  assert.match(html, /Ana García López/);
  assert.match(html, /Taller de cerámica/);
  assert.match(html, /25\.00 €/);
  assert.match(html, /id="inscripcion-importe"[^>]*readOnly/);
  assert.match(html, /Bizum/);
  assert.match(html, /value="7"/);
  assert.match(html, /value="2026-10-14"/);
  assert.doesNotMatch(html, /precioAplicado/);
  assert.doesNotMatch(html, /Estado de pago/);
});
