import test from "node:test";
import assert from "node:assert/strict";
import { etiquetaUsuarioCuota, resultadoGuardadoCuota, valoresDesdeCuota, valoresInicialesCuota } from "../src/utils/cuotaFormState.ts";
import { construirActualizacionCuota, construirDatosCuota } from "../src/utils/cuotaFormPayload.ts";
import { validarCuota } from "../src/utils/validacionesCuota.ts";
import { insertarCuotaOrdenada, textoComentarioCuota } from "../src/utils/cuotasListado.ts";
import type { Cuota } from "../src/services/cuotaService.ts";

const ahora = new Date(2026, 9, 19, 0, 30);
const base = valoresInicialesCuota(ahora);

function cuota(parcial: Pick<Cuota, "id_cuota" | "pagoAnio">): Cuota {
  return {
    id_usuario: 1,
    fechaPago: "2026-10-19",
    importePagado: "30.00",
    comentario: null,
    createAt: "2026-10-19T10:00:00.000Z",
    updateAt: "2026-10-19T10:00:00.000Z",
    Usuario: { id_usuario: 1, codUsuario: "ALU01", nombre: "Ana", apellido1: "García", apellido2: null },
    ...parcial,
  };
}

test("la fecha inicial usa el día local y el año en curso", () => {
  assert.equal(base.fechaPago, "2026-10-19");
  assert.equal(base.pagoAnio, "2026");
  assert.equal(base.id_usuario, "");
  assert.equal(base.comentario, "");
});

test("el selector muestra código y nombre, y omite el código nulo", () => {
  assert.equal(etiquetaUsuarioCuota({
    id_usuario: 4,
    codUsuario: "ALU001",
    nombre: "juan",
    apellido1: "LUIS",
    apellido2: "ramos",
  }), "ALU001 - Juan Luis Ramos");
  assert.equal(etiquetaUsuarioCuota({
    id_usuario: 5,
    codUsuario: null,
    nombre: "Ana",
    apellido1: "García",
    apellido2: null,
  }), "Ana García");
  assert.equal(etiquetaUsuarioCuota({
    id_usuario: 6,
    codUsuario: "   ",
    nombre: "Luis",
    apellido1: null,
    apellido2: null,
  }), "Luis");
});

test("valida usuario, año, fecha y comentario como el backend", () => {
  assert.deepEqual(validarCuota({ ...base, id_usuario: "15", comentario: "  Nota áéí \" €  " }), {});
  assert.equal(validarCuota({ ...base, id_usuario: "" }).id_usuario, "Selecciona un usuario.");
  assert.ok(validarCuota({ ...base, id_usuario: "0" }).id_usuario);
  assert.ok(validarCuota({ ...base, id_usuario: "1.5" }).id_usuario);
  assert.ok(validarCuota({ ...base, pagoAnio: "1969" }).pagoAnio);
  assert.ok(validarCuota({ ...base, pagoAnio: "2101" }).pagoAnio);
  assert.ok(validarCuota({ ...base, pagoAnio: "2026.5" }).pagoAnio);
  assert.deepEqual(validarCuota({ ...base, id_usuario: "1", pagoAnio: "1970" }), {});
  assert.deepEqual(validarCuota({ ...base, id_usuario: "1", pagoAnio: "2100" }), {});
  assert.equal(validarCuota({ ...base, id_usuario: "1", fechaPago: "2026-02-30" }).fechaPago, "La fecha de pago no es válida.");
  assert.equal(validarCuota({ ...base, id_usuario: "1", comentario: "linea\u000B" }).comentario, "El comentario contiene caracteres no permitidos.");
  assert.equal(validarCuota({ ...base, id_usuario: "1", comentario: "ok\u0000" }).comentario, "El comentario contiene caracteres no permitidos.");
  assert.equal(validarCuota({ ...base, id_usuario: "1", comentario: `${"a".repeat(500)}\n` }).comentario, undefined);
  assert.equal(validarCuota({ ...base, id_usuario: "1", comentario: "a".repeat(501) }).comentario, "El comentario no puede superar los 500 caracteres.");
  assert.equal(validarCuota({ ...base, id_usuario: "1", comentario: "Línea\ncon tab\tok" }).comentario, undefined);
});

test("el alta envía números y omite el comentario vacío", () => {
  assert.deepEqual(construirDatosCuota({ ...base, id_usuario: "15", comentario: "   " }), {
    id_usuario: 15,
    pagoAnio: 2026,
    fechaPago: "2026-10-19",
  });
  assert.deepEqual(construirDatosCuota({ ...base, id_usuario: "15", comentario: "  Nota  " }).comentario, "Nota");
});

test("la edición precarga la cuota y aplica las mismas validaciones", () => {
  const origen = {
    ...cuota({ id_cuota: 8, pagoAnio: 2025 }),
    id_usuario: 15,
    fechaPago: "2026-10-19T00:00:00.000Z",
    comentario: null,
  };
  const valores = valoresDesdeCuota(origen);
  assert.deepEqual(valores, {
    id_usuario: "15",
    pagoAnio: "2025",
    fechaPago: "2026-10-19",
    comentario: "",
  });
  assert.equal(textoComentarioCuota(origen.comentario), "-");
  assert.equal(textoComentarioCuota("  Nota  "), "Nota");
  assert.deepEqual(validarCuota(valores), {});
  assert.equal(validarCuota({ ...valores, pagoAnio: "1969" }).pagoAnio, validarCuota({ ...base, pagoAnio: "1969" }).pagoAnio);
  assert.equal(validarCuota({ ...valores, fechaPago: "2026-02-30" }).fechaPago, "La fecha de pago no es válida.");
  assert.equal(validarCuota({ ...valores, comentario: "ok\u0000" }).comentario, "El comentario contiene caracteres no permitidos.");
});

test("el payload de edición envía la fecha en texto y el comentario recortado", () => {
  const valores = valoresDesdeCuota({
    ...cuota({ id_cuota: 8, pagoAnio: 2025 }),
    id_usuario: 15,
    fechaPago: "2026-10-19",
    comentario: "  Nota  ",
  });
  assert.deepEqual(construirActualizacionCuota({ ...valores, pagoAnio: "2024" }), {
    id_usuario: 15,
    pagoAnio: 2024,
    fechaPago: "2026-10-19",
    comentario: "Nota",
  });
  assert.equal(construirActualizacionCuota({ ...valores, comentario: "   " }).comentario, "");
});

test("un 409 conserva los datos y no cierra; el éxito sí cierra", () => {
  const valores = valoresDesdeCuota({
    ...cuota({ id_cuota: 8, pagoAnio: 2025 }),
    comentario: "Nota que no debe perderse",
  });
  const fallo = resultadoGuardadoCuota(valores, "Este usuario ya tiene una cuota registrada para ese año.");
  assert.equal(fallo.cerrar, false);
  assert.equal(fallo.mensaje, "Este usuario ya tiene una cuota registrada para ese año.");
  assert.deepEqual(fallo.valores, valores);
  assert.equal(resultadoGuardadoCuota(valores, null).cerrar, true);
});

test("editar el año sustituye la fila y mantiene el orden", () => {
  const lista = [cuota({ id_cuota: 2, pagoAnio: 2026 }), cuota({ id_cuota: 8, pagoAnio: 2025 })];
  const actualizada = { ...lista[1], pagoAnio: 2027, comentario: null };
  const orden = insertarCuotaOrdenada(lista, actualizada);
  assert.deepEqual(orden.map((item) => item.id_cuota), [8, 2]);
  assert.equal(orden.filter((item) => item.id_cuota === 8).length, 1);
  assert.equal(textoComentarioCuota(orden[0].comentario), "-");
});

test("inserta la cuota por año e id descendentes", () => {
  const lista = [cuota({ id_cuota: 2, pagoAnio: 2026 }), cuota({ id_cuota: 1, pagoAnio: 2024 })];
  const orden = insertarCuotaOrdenada(lista, cuota({ id_cuota: 3, pagoAnio: 2025 })).map((item) => item.id_cuota);
  assert.deepEqual(orden, [2, 3, 1]);
  const mismoAnio = insertarCuotaOrdenada(lista, cuota({ id_cuota: 4, pagoAnio: 2026 })).map((item) => item.id_cuota);
  assert.deepEqual(mismoAnio, [4, 2, 1]);
});
