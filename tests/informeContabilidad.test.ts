import test from "node:test";
import assert from "node:assert/strict";
import { consultaInicial, parametrosContables } from "../src/utils/filtrosContabilidad.ts";
import {
  nombreInformeContabilidad,
  reunirMovimientos,
  textoCelda,
  textoPeriodo,
} from "../src/utils/informeContabilidad.ts";
import { generarInformeContabilidadPdf } from "../src/utils/generarInformeContabilidadPdf.ts";
import type { ListadoMovimientos, MovimientoContable } from "../src/services/contabilidadService.ts";

function movimiento(id: number, importe = "25.00"): MovimientoContable {
  return {
    id,
    fecha: "2026-10-02",
    tipo: importe.startsWith("-") ? "Devolución" : "Cobro",
    concepto: `Movimiento ${id}`,
    usuario: id % 2 === 0 ? null : "Ana Ruiz",
    actividad: "Ruta de senderismo",
    metodoPago: null,
    importe,
  };
}

function pagina(total: number, ids: number[]): ListadoMovimientos {
  return {
    movimientos: ids.map((id) => movimiento(id, id === 2 ? "-10.00" : "25.00")),
    total,
    pagina: 1,
    totalPaginas: 1,
  };
}

test("el nombre usa el mes del filtro o, si no es un mes concreto, la fecha de generación", () => {
  const generado = new Date(2026, 9, 15);
  const octubre = { ...consultaInicial, desde: "2026-10-01", hasta: "2026-10-31" };
  assert.equal(nombreInformeContabilidad(octubre, generado), "ALUMA_Contabilidad_2026-10.pdf");
  const dosMeses = { ...consultaInicial, desde: "2026-10-01", hasta: "2026-11-02" };
  assert.equal(nombreInformeContabilidad(dosMeses, generado), "ALUMA_Contabilidad_2026-10-15.pdf");
  assert.equal(nombreInformeContabilidad(consultaInicial, generado), "ALUMA_Contabilidad_2026-10-15.pdf");
  assert.equal(textoPeriodo(octubre), "01/10/2026 – 31/10/2026");
  assert.equal(textoCelda(null), "—");
  assert.equal(parametrosContables({ ...consultaInicial, pagina: 2 }, true, 100), "?pagina=2&orden=desc&limite=100");
});

test("el informe reúne todas las páginas y no acepta un listado incompleto", async () => {
  const pedidos: number[] = [];
  const movimientos = await reunirMovimientos(consultaInicial, async (consulta) => {
    pedidos.push(consulta.pagina);
    if (consulta.pagina === 1) return pagina(3, [1, 2]);
    return pagina(3, [3]);
  });
  assert.deepEqual(pedidos, [1, 2]);
  assert.deepEqual(movimientos.map((fila) => fila.id), [1, 2, 3]);

  await assert.rejects(
    () => reunirMovimientos(consultaInicial, async (consulta) => (
      consulta.pagina > 1
        ? { movimientos: [], total: 4, pagina: consulta.pagina, totalPaginas: 1 }
        : pagina(4, [1])
    )),
    /No se pudo completar el informe/,
  );
  await assert.rejects(
    () => reunirMovimientos(consultaInicial, async (consulta) => {
      if (consulta.pagina === 2) throw new Error("Error interno del servidor");
      return pagina(3, [1, 2]);
    }),
    /Error interno del servidor/,
  );
});

test("el PDF incluye el resumen de la API, el signo y la página", () => {
  const documento = generarInformeContabilidadPdf({
    consulta: { ...consultaInicial, desde: "2026-10-01", hasta: "2026-10-31", tipo: "Cobro", q: "Senderismo" },
    resumen: {
      totalCobrado: "1250.50",
      totalDevuelto: "150.25",
      saldoNeto: "1100.25",
      pendienteCobro: "350.10",
    },
    movimientos: [movimiento(1, "25.00"), movimiento(2, "-10.00")],
    generado: new Date(2026, 9, 15, 21, 32),
    logo: null,
  });
  const texto = Buffer.from(documento.output("arraybuffer")).toString("latin1");
  assert.match(texto, /Informe de Contabilidad/);
  assert.match(texto, /Saldo neto de cobros/);
  assert.match(texto, /no depende de los filtros seleccionados/);
  assert.match(texto, /Senderismo/);
  assert.match(texto, /Página 1 de 1/);
  assert.equal(documento.getNumberOfPages(), 1);
  const largo = generarInformeContabilidadPdf({
    consulta: consultaInicial,
    resumen: { totalCobrado: "25.00", totalDevuelto: "0.00", saldoNeto: "25.00", pendienteCobro: "0.00" },
    movimientos: Array.from({ length: 40 }, (_, indice) => movimiento(indice + 1)),
    generado: new Date(2026, 9, 15, 21, 32),
    logo: null,
  });
  assert.ok(largo.getNumberOfPages() > 1);
  const textoLargo = Buffer.from(largo.output("arraybuffer")).toString("latin1");
  assert.match(textoLargo, new RegExp(`Página ${largo.getNumberOfPages()} de ${largo.getNumberOfPages()}`));
});

test("el informe repite el listado actual y no conserva una cuota borrada", async () => {
  const cuota: MovimientoContable = {
    id: -8,
    fecha: "2026-11-02",
    tipo: "Cobro",
    concepto: "Cuota 2027",
    usuario: "Luis Pérez",
    actividad: null,
    metodoPago: null,
    importe: "35.00",
  };
  const vigentes = await reunirMovimientos(consultaInicial, async () => ({
    movimientos: [cuota],
    total: 1,
    pagina: 1,
    totalPaginas: 1,
  }));
  assert.deepEqual(vigentes, [cuota]);

  const documento = generarInformeContabilidadPdf({
    consulta: consultaInicial,
    resumen: { totalCobrado: "35.00", totalDevuelto: "0.00", saldoNeto: "35.00", pendienteCobro: "350.10" },
    movimientos: vigentes,
    generado: new Date(2026, 10, 2, 12, 0),
    logo: null,
  });
  const texto = Buffer.from(documento.output("arraybuffer")).toString("latin1");
  assert.equal(texto.split("Cuota 2027").length - 1, 1);
  assert.match(texto, /Luis/);

  const borradas = await reunirMovimientos(consultaInicial, async () => ({
    movimientos: [],
    total: 0,
    pagina: 1,
    totalPaginas: 0,
  }));
  assert.deepEqual(borradas, []);
});
