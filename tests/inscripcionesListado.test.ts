import test from "node:test";
import assert from "node:assert/strict";
import type { Inscripcion } from "../src/types/inscripcion.ts";
import { direccionAlOrdenar, ordenarInscripciones } from "../src/utils/inscripcionesListado.ts";

function fila(id: number): Inscripcion {
  return {
    id_inscripcion: id,
    id_usuario: id,
    id_actividad: 1,
    precioAplicado: "0.00",
    id_estado_pago: 1,
    id_estado_inscripcion: 1,
    id_metodo_pago: null,
    apuntadoFecha: "2026-10-18T00:00:00.000Z",
    fechaPago: null,
    comentario: null,
    createAt: "2026-10-18T00:00:00.000Z",
    updateAt: "2026-10-18T00:00:00.000Z",
    posicionEspera: null,
    plazasOcupadas: 0,
    plazasDisponibles: null,
    aforo: null,
    puedePromocionar: false,
    Usuario: null,
    Actividad: null,
  };
}

test("El código de caja se ordena de mayor a menor", () => {
  const lista = [fila(4), fila(18), fila(2)];
  assert.deepEqual(ordenarInscripciones(lista, "codigo", "desc").map((item) => item.id_inscripcion), [18, 4, 2]);
  assert.deepEqual(ordenarInscripciones(lista, "codigo", "asc").map((item) => item.id_inscripcion), [2, 4, 18]);
  assert.equal(direccionAlOrdenar("codigo", "fecha", "desc"), "desc");
  assert.equal(direccionAlOrdenar("codigo", "codigo", "desc"), "asc");
});
