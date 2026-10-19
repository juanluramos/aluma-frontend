import test from "node:test";
import assert from "node:assert/strict";
import type { EstadoPagoCatalogo, MetodoPagoCatalogo } from "../src/types/catalogoPago.ts";
import type { Inscripcion } from "../src/types/inscripcion.ts";
import {
  filtrarPagos,
  nombreEstadoPagoCatalogo,
  nombreMetodoPago,
  ordenarPagosPorFecha,
} from "../src/utils/pagosListado.ts";

const estados: EstadoPagoCatalogo[] = [
  { id_estado_pago: 11, nombre_estado: "Pendiente" },
  { id_estado_pago: 22, nombre_estado: "Pagado" },
];
const metodos: MetodoPagoCatalogo[] = [
  { id_metodo_pago: 7, nombre: "Bizum" },
];

function pago(parcial: Partial<Inscripcion>): Inscripcion {
  return {
    id_inscripcion: 1,
    id_usuario: 9,
    id_actividad: 12,
    precioAplicado: "25.00",
    id_estado_pago: 11,
    id_estado_inscripcion: 15,
    id_metodo_pago: null,
    apuntadoFecha: "2026-10-01",
    fechaPago: null,
    comentario: null,
    createAt: "2026-10-01T00:00:00.000Z",
    updateAt: "2026-10-01T00:00:00.000Z",
    posicionEspera: null,
    plazasOcupadas: 0,
    plazasDisponibles: null,
    aforo: null,
    puedePromocionar: false,
    Usuario: { id_usuario: 9, nombre: "Ana", apellido1: "García", apellido2: "López" },
    Actividad: { id_actividad: 12, titulo: "Taller de cerámica" },
    ...parcial,
  };
}

test("el nombre de estado y método sale del catálogo, no de un id fijo", () => {
  assert.equal(nombreEstadoPagoCatalogo(11, estados), "Pendiente");
  assert.equal(nombreEstadoPagoCatalogo(1, estados), "Desconocido");
  assert.equal(nombreMetodoPago(7, metodos), "Bizum");
  assert.equal(nombreMetodoPago(null, metodos), "Sin método");
  assert.equal(nombreMetodoPago(3, metodos), "Desconocido");
});

test("la búsqueda encuentra usuario o actividad y los filtros usan el nombre del catálogo", () => {
  const lista = [
    pago({ id_inscripcion: 1, id_estado_pago: 11 }),
    pago({
      id_inscripcion: 2,
      id_estado_pago: 22,
      id_metodo_pago: 7,
      fechaPago: "2026-10-02",
      Usuario: { id_usuario: 4, nombre: "Luis", apellido1: "Pérez", apellido2: null },
      Actividad: { id_actividad: 8, titulo: "Senderismo" },
    }),
  ];
  assert.deepEqual(filtrarPagos(lista, "ceramica", estados, metodos, [], []).map((item) => item.id_inscripcion), [1]);
  assert.deepEqual(filtrarPagos(lista, "perez", estados, metodos, [], []).map((item) => item.id_inscripcion), [2]);
  assert.deepEqual(filtrarPagos(lista, "", estados, metodos, ["Pagado"], []).map((item) => item.id_inscripcion), [2]);
  assert.deepEqual(filtrarPagos(lista, "", estados, metodos, [], ["Sin método"]).map((item) => item.id_inscripcion), [1]);
  assert.deepEqual(filtrarPagos(lista, "", estados, metodos, [], ["Bizum"]).map((item) => item.id_inscripcion), [2]);
});

test("la fecha de pago ordena y deja sin fecha al final", () => {
  const lista = [
    pago({ id_inscripcion: 1, fechaPago: null }),
    pago({ id_inscripcion: 2, fechaPago: "2026-10-03" }),
    pago({ id_inscripcion: 3, fechaPago: "2026-09-01" }),
  ];
  assert.deepEqual(ordenarPagosPorFecha(lista, "asc").map((item) => item.id_inscripcion), [3, 2, 1]);
  assert.deepEqual(ordenarPagosPorFecha(lista, "desc").map((item) => item.id_inscripcion), [2, 3, 1]);
});
