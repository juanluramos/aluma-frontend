import test from "node:test";
import assert from "node:assert/strict";
import { formatoEuro } from "../src/utils/formatoEuro.ts";

test("el importe de la API se muestra en euros con formato español", () => {
  const texto = formatoEuro("1250.50").replace(/\s/g, " ");
  assert.match(texto, /1250,50|1\.250,50/);
  assert.match(texto, /€/);
  assert.equal(formatoEuro("0.00").replace(/\s/g, " ").includes("0,00"), true);
  assert.match(formatoEuro("-10.10").replace(/\s/g, " "), /-10,10/);
});
