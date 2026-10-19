import test from "node:test";
import assert from "node:assert/strict";
import type { EstadoInscripcionCatalogo, EstadoPagoCatalogo } from "../src/types/catalogoPago.ts";
import type { Inscripcion } from "../src/types/inscripcion.ts";
import { mensajeListaEspera, puedeActivarInscripcion, textoAforo } from "../src/utils/promocionInscripcion.ts";

const estados: EstadoPagoCatalogo[] = [
  { id_estado_pago: 11, nombre_estado: "Pendiente" },
  { id_estado_pago: 22, nombre_estado: "Pagado" },
];

const estadosInscripcion: EstadoInscripcionCatalogo[] = [
  { id_estado_inscripcion: 15, nombre: "Activa" },
  { id_estado_inscripcion: 17, nombre: "En espera" },
];

const espera = {
  id_inscripcion: 4,
  id_usuario: 9,
  id_actividad: 12,
  precioAplicado: "10.00",
  id_estado_pago: 11,
  id_estado_inscripcion: 17,
  id_metodo_pago: null,
  apuntadoFecha: "2026-10-14T00:00:00.000Z",
  fechaPago: null,
  comentario: null,
  createAt: "2026-10-14T10:00:00.000Z",
  updateAt: "2026-10-14T10:00:00.000Z",
  posicionEspera: 1,
  plazasOcupadas: 0,
  plazasDisponibles: 1,
  aforo: 1,
  puedePromocionar: true,
  Usuario: null,
  Actividad: null,
} satisfies Inscripcion;

test("El botón de activación sigue al indicador del backend y a los catálogos", () => {
  assert.equal(puedeActivarInscripcion(espera, estados, estadosInscripcion, true), true);
  assert.equal(puedeActivarInscripcion(espera, estados, estadosInscripcion, false), false);
  assert.equal(puedeActivarInscripcion({ ...espera, puedePromocionar: false }, estados, estadosInscripcion, true), false);
  assert.equal(puedeActivarInscripcion({ ...espera, id_estado_inscripcion: 15 }, estados, estadosInscripcion, true), false);
  assert.equal(puedeActivarInscripcion({ ...espera, id_estado_pago: 22 }, estados, estadosInscripcion, true), false);
  assert.equal(puedeActivarInscripcion(espera, [], estadosInscripcion, true), false);
  assert.equal(puedeActivarInscripcion(espera, estados, [], true), false);
  assert.equal(textoAforo(null), "Sin límite");
  assert.equal(textoAforo(3), "3");
  assert.equal(mensajeListaEspera(17, estadosInscripcion), "El socio se ha añadido a la lista de espera.");
  assert.equal(mensajeListaEspera(15, estadosInscripcion), null);
  assert.equal(mensajeListaEspera(null, estadosInscripcion), null);
  assert.equal(mensajeListaEspera(17, []), null);
});
