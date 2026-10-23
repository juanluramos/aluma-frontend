import test from "node:test";
import assert from "node:assert/strict";
import { hasPermission } from "../src/auth/permissions.ts";
import { construirDatosInscripcion, construirEdicionInscripcion } from "../src/utils/inscripcionFormPayload.ts";
import { valoresDesdeInscripcion, valoresIniciales } from "../src/utils/inscripcionFormState.ts";
import type { Inscripcion } from "../src/types/inscripcion.ts";
import { validarInscripcion } from "../src/utils/validacionesInscripcion.ts";

test("El formulario nace vacío y el rol Usuario queda fijado a su id", () => {
  assert.deepEqual(valoresIniciales(null, false), {
    id_usuario: "",
    id_actividad: "",
    comentario: "",
  });
  assert.equal(valoresIniciales(7, true).id_usuario, "7");
});

test("Usuario, actividad y comentario vacío se validan sin copiar reglas de precio", () => {
  assert.deepEqual(validarInscripcion({ id_usuario: "", id_actividad: "", comentario: "" }), {
    id_usuario: "Selecciona un usuario.",
    id_actividad: "Selecciona una actividad.",
  });
  assert.deepEqual(validarInscripcion({ id_usuario: "0", id_actividad: "1.5", comentario: "nota" }), {
    id_usuario: "Selecciona un usuario.",
    id_actividad: "Selecciona una actividad.",
  });
  assert.deepEqual(validarInscripcion({
    id_usuario: "9",
    id_actividad: "12",
    comentario: "  Primera clase  ",
  }), {});
});

test("El alta envía Pendiente y omite precio, método y fecha de pago", () => {
  const datos = construirDatosInscripcion({
    id_usuario: "9",
    id_actividad: "12",
    comentario: "  Primera clase  ",
  }, "2026-10-14");

  assert.deepEqual(datos, {
    id_usuario: 9,
    id_actividad: 12,
    id_estado_pago: 1,
    apuntadoFecha: "2026-10-14",
    comentario: "Primera clase",
  });
  assert.equal(construirDatosInscripcion({
    id_usuario: "9",
    id_actividad: "12",
    comentario: "   ",
  }, "2026-10-14").comentario, null);
});

const inscrita: Inscripcion = {
  id_inscripcion: 4,
  id_usuario: 9,
  id_actividad: 12,
  precioAplicado: "25.00",
  id_estado_pago: 2,
  id_estado_inscripcion: 1,
  id_metodo_pago: 3,
  apuntadoFecha: "2026-10-01T00:00:00.000Z",
  fechaPago: "2026-10-02T00:00:00.000Z",
  comentario: "  Nota inicial  ",
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

test("La edición precarga usuario y actividad y el PUT no envía el precio", () => {
  assert.deepEqual(valoresDesdeInscripcion(inscrita), {
    id_usuario: "9",
    id_actividad: "12",
    comentario: "  Nota inicial  ",
  });
  assert.equal(valoresDesdeInscripcion({ ...inscrita, comentario: null }).comentario, "");
  const cuerpo = construirEdicionInscripcion({
    id_usuario: "9",
    id_actividad: "12",
    comentario: "  Nota revisada  ",
  });
  assert.deepEqual(cuerpo, {
    id_usuario: 9,
    id_actividad: 12,
    comentario: "Nota revisada",
  });
  assert.equal("precioAplicado" in cuerpo, false);
  assert.equal(construirEdicionInscripcion({
    id_usuario: "1",
    id_actividad: "2",
    comentario: "   ",
  }).comentario, null);
  assert.deepEqual(validarInscripcion({
    id_usuario: "",
    id_actividad: "",
    comentario: "Nota",
  }), {
    id_usuario: "Selecciona un usuario.",
    id_actividad: "Selecciona una actividad.",
  });
});

test("Crear inscripciones sigue el permiso de consulta y elegir usuario el de gestión", () => {
  for (const rol of ["Usuario", "Operador", "Administrador"] as const) {
    assert.equal(hasPermission(rol, "verInscripciones"), true);
  }
  assert.equal(hasPermission(null, "verInscripciones"), false);
  assert.equal(hasPermission("Usuario", "gestionarInscripciones"), false);
  assert.equal(hasPermission("Operador", "gestionarInscripciones"), true);
  assert.equal(hasPermission("Administrador", "gestionarInscripciones"), true);
});
