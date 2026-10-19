import test from "node:test";
import assert from "node:assert/strict";
import {
  consultaInicial,
  errorRangoFechas,
  parametrosContables,
  textoDia,
} from "../src/utils/filtrosContabilidad.ts";

test("la fecha inicial posterior se rechaza y el día se muestra sin convertir zona horaria", () => {
  assert.equal(errorRangoFechas("2026-10-05", "2026-10-01"), "La fecha inicial no puede ser posterior a la final.");
  assert.equal(errorRangoFechas("2026-10-01", "2026-10-05"), "");
  assert.equal(errorRangoFechas("2026-10-01", ""), "");
  assert.equal(textoDia("2026-10-02"), "02/10/2026");
});

test("el resumen no pagina y el listado envía página y orden", () => {
  const consulta = { ...consultaInicial, desde: "2026-10-01", tipo: "Devolución" as const, pagina: 2, orden: "asc" as const };
  assert.equal(parametrosContables(consulta, false), "?desde=2026-10-01&tipo=Devoluci%C3%B3n");
  assert.equal(parametrosContables(consulta, true), "?desde=2026-10-01&tipo=Devoluci%C3%B3n&pagina=2&orden=asc");
  assert.equal(parametrosContables(consultaInicial, false), "");
});
