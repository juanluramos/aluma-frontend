import test from "node:test";
import assert from "node:assert/strict";
import type { Inscripcion } from "../src/types/inscripcion.ts";
import {
  inscripcionEnEdicion,
  navegacionSinInscripcion,
} from "../src/utils/aperturaInscripcion.ts";

function inscripcion(id: number): Inscripcion {
  return {
    id_inscripcion: id,
    id_usuario: 9,
    id_actividad: 12,
    precioAplicado: "8.00",
    id_estado_pago: 11,
    id_estado_inscripcion: 15,
    id_metodo_pago: null,
    apuntadoFecha: "2026-10-18T00:00:00.000Z",
    fechaPago: null,
    comentario: null,
    createAt: "2026-10-18T00:00:00.000Z",
    updateAt: "2026-10-18T00:00:00.000Z",
    posicionEspera: null,
    plazasOcupadas: 1,
    plazasDisponibles: 1,
    aforo: 2,
    puedePromocionar: false,
    Usuario: { id_usuario: 9, nombre: "Ana", apellido1: "García", apellido2: "López" },
    Actividad: { id_actividad: 12, titulo: "Taller de cerámica" },
  };
}

const lista = [inscripcion(8), inscripcion(3)];
const state = { abrirInscripcion: 8 };

test("la navegación abre la inscripción cuando el listado ya está cargado", () => {
  assert.equal(inscripcionEnEdicion(null, state, lista, true, true), null);
  assert.equal(navegacionSinInscripcion(state, lista, true, true), false);
  assert.equal(inscripcionEnEdicion(null, state, lista, false, true)?.id_inscripcion, 8);
  assert.equal(navegacionSinInscripcion(state, lista, false, true), false);
});

test("sin permiso o sin la inscripción se limpia la navegación y no se abre", () => {
  assert.equal(inscripcionEnEdicion(null, state, lista, false, false), null);
  assert.equal(navegacionSinInscripcion(state, lista, false, false), true);
  assert.equal(inscripcionEnEdicion(null, { abrirInscripcion: 99 }, lista, false, true), null);
  assert.equal(navegacionSinInscripcion({ abrirInscripcion: 99 }, lista, false, true), true);
  assert.equal(navegacionSinInscripcion({ abrirInscripcion: "8" }, lista, false, true), false);
  assert.equal(navegacionSinInscripcion(null, lista, false, true), false);
});

test("la edición abierta a mano prevalece y se conserva al limpiar la navegación", () => {
  const manual = inscripcion(3);
  assert.equal(inscripcionEnEdicion(manual, state, lista, false, true)?.id_inscripcion, 3);
  assert.equal(inscripcionEnEdicion(manual, null, lista, false, true)?.id_inscripcion, 3);
});
