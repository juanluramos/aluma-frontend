import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ConfirmarEliminarCuota from "../src/components/cuotas/ConfirmarEliminarCuota.tsx";
import type { Cuota } from "../src/services/cuotaService.ts";
import {
  AVISO_CUOTA_ANIO_ACTUAL,
  avisoBorradoCuotaAnioActual,
  decidirBorradoCuota,
  eliminarCuotaDeLista,
  preguntaBorradoCuota,
} from "../src/utils/cuotasListado.ts";

function cuota(pagoAnio: number, id = 8): Cuota {
  return {
    id_cuota: id,
    id_usuario: 15,
    pagoAnio,
    fechaPago: "2026-10-19",
    importePagado: "30.00",
    comentario: null,
    createAt: "2026-10-19T10:00:00.000Z",
    updateAt: "2026-10-19T10:00:00.000Z",
    Usuario: { id_usuario: 15, codUsuario: "ALU15", nombre: "Juan", apellido1: "Luis", apellido2: "Ramos" },
  };
}

function dialogo(actual: Cuota | null, isOpen: boolean, submitting = false, error: string | null = null): string {
  return renderToStaticMarkup(createElement(ConfirmarEliminarCuota, {
    cuota: actual,
    isOpen,
    submitting,
    error,
    onCancel: () => undefined,
    onConfirm: () => undefined,
  }));
}

test("la confirmación cerrada no se muestra y la abierta pide el borrado", () => {
  const anio = new Date().getFullYear();
  assert.equal(dialogo(cuota(anio), false), "");
  const abierta = dialogo(cuota(anio), true);
  assert.match(abierta, /Eliminar cuota/);
  assert.match(abierta, new RegExp(preguntaBorradoCuota(anio, "Juan Luis Ramos").replace("?", "\\?")));
  assert.match(abierta, /Fecha de pago: 19\/10\/2026/);
  assert.match(abierta, />Cancelar</);
  assert.match(abierta, />Eliminar cuota</);
});

test("cancelar no borra y un error conserva la cuota en la lista", () => {
  const lista = [cuota(2026, 8), cuota(2024, 2)];
  const cancelar = decidirBorradoCuota("cancelar");
  assert.deepEqual(cancelar, { confirmacion: false, quitarDelListado: false });
  assert.deepEqual(lista, lista);
  const error = decidirBorradoCuota("error");
  assert.equal(error.confirmacion, true);
  assert.equal(error.quitarDelListado, false);
  assert.deepEqual(decidirBorradoCuota("abrir"), { confirmacion: true, quitarDelListado: false });
  const confirmado = decidirBorradoCuota("confirmar");
  assert.deepEqual(confirmado.quitarDelListado ? eliminarCuotaDeLista(lista, 8) : lista, [lista[1]]);
  assert.deepEqual(error.quitarDelListado ? eliminarCuotaDeLista(lista, 8) : lista, lista);
});

test("el aviso del año actual solo aparece en la cuota de ese año", () => {
  const anio = new Date().getFullYear();
  assert.equal(avisoBorradoCuotaAnioActual(anio, anio), AVISO_CUOTA_ANIO_ACTUAL);
  assert.equal(avisoBorradoCuotaAnioActual(anio - 1, anio), null);
  const actual = dialogo(cuota(anio), true);
  const otra = dialogo(cuota(anio - 1), true);
  assert.match(actual, /puede dejar de ser socio/);
  assert.match(actual, /inscripciones pendientes/);
  assert.doesNotMatch(otra, /puede dejar de ser socio/);
  assert.doesNotMatch(otra, /inscripciones pendientes/);
});

test("mientras elimina se deshabilita el botón y un fallo sigue visible", () => {
  const anio = new Date().getFullYear();
  const enviando = dialogo(cuota(anio), true, true);
  assert.match(enviando, /confirmar-eliminar-usuario-submit[^>]*>Eliminando\.\.\.</);
  assert.match(enviando, /disabled/);
  const fallo = dialogo(cuota(anio), true, false, "No se pudo eliminar la cuota. Inténtalo de nuevo.");
  assert.match(fallo, /No se pudo eliminar la cuota/);
  assert.match(fallo, /role="alert"/);
  assert.match(fallo, />Eliminar cuota</);
});
