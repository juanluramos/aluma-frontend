import test from "node:test";
import assert from "node:assert/strict";
import type { Cuota } from "../src/services/cuotaService.ts";
import {
  aniosDisponiblesCuotas,
  eliminarCuotaDeLista,
  filtrarCuotas,
  filtrosCuotasActivos,
  importeVisibleCuota,
  insertarCuotaOrdenada,
  nombreVisibleCuota,
  ordenarCuotas,
  resumenCuotasAnio,
  totalImportesCuotas,
  textoCodigoCuota,
  textoComentarioCuota,
  direccionAlOrdenarCuota,
} from "../src/utils/cuotasListado.ts";

function cuota(parcial: Partial<Cuota> & Pick<Cuota, "id_cuota" | "pagoAnio">, usuario?: Partial<Cuota["Usuario"]>): Cuota {
  return {
    id_usuario: 1,
    fechaPago: "2026-10-19",
    importePagado: "30.00",
    comentario: null,
    createAt: "2026-10-19T10:00:00.000Z",
    updateAt: "2026-10-19T10:00:00.000Z",
    Usuario: {
      id_usuario: 1,
      codUsuario: null,
      nombre: "Juan",
      apellido1: "Luis",
      apellido2: "Ramos",
      ...usuario,
    },
    ...parcial,
  };
}

const lista = [
  cuota({ id_cuota: 4, pagoAnio: 2026 }),
  cuota({ id_cuota: 3, pagoAnio: 2026 }, { nombre: "Ana", apellido1: "García", apellido2: null }),
  cuota({ id_cuota: 2, pagoAnio: 2025 }),
  cuota({ id_cuota: 1, pagoAnio: 2024 }, { nombre: "Luis", apellido1: "García", apellido2: "Soria" }),
];

test("la búsqueda encuentra nombre y apellido sin distinguir tildes ni mayúsculas", () => {
  assert.deepEqual(filtrarCuotas(lista, { busqueda: "juan", anio: null }).map((item) => item.id_cuota), [4, 2]);
  assert.deepEqual(filtrarCuotas(lista, { busqueda: "RAMOS", anio: null }).map((item) => item.id_cuota), [4, 2]);
  assert.deepEqual(filtrarCuotas(lista, { busqueda: "garcia", anio: null }).map((item) => item.id_cuota), [3, 1]);
  assert.deepEqual(filtrarCuotas(lista, { busqueda: "  GARCÍA ", anio: null }).map((item) => item.id_cuota), [3, 1]);
  assert.deepEqual(filtrarCuotas(lista, { busqueda: "soria", anio: null }).map((item) => item.id_cuota), [1]);
});

test("el año y la búsqueda se combinan y el orden original se mantiene", () => {
  assert.deepEqual(filtrarCuotas(lista, { busqueda: "", anio: 2026 }).map((item) => item.id_cuota), [4, 3]);
  assert.deepEqual(filtrarCuotas(lista, { busqueda: "juan", anio: 2025 }).map((item) => item.id_cuota), [2]);
  assert.equal(filtrarCuotas(lista, { busqueda: "juan", anio: 2024 }).length, 0);
});

test("los años salen de los datos, sin duplicados y en orden descendente", () => {
  assert.deepEqual(aniosDisponiblesCuotas(lista), [2026, 2025, 2024]);
  assert.deepEqual(aniosDisponiblesCuotas([...lista, cuota({ id_cuota: 9, pagoAnio: 2026 })]), [2026, 2025, 2024]);
  assert.deepEqual(aniosDisponiblesCuotas(lista, 2027), [2027, 2026, 2025, 2024]);
});

test("limpiar filtros vuelve a todos los resultados y el contador sigue al filtro", () => {
  const activo = { busqueda: "juan", anio: 2025 };
  assert.equal(filtrosCuotasActivos(activo), true);
  assert.equal(filtrarCuotas(lista, activo).length, 1);
  const limpio = { busqueda: "", anio: null };
  assert.equal(filtrosCuotasActivos(limpio), false);
  assert.equal(filtrosCuotasActivos({ busqueda: "   ", anio: null }), false);
  assert.equal(filtrarCuotas(lista, limpio).length, lista.length);
});

test("crear, editar y borrar respetan el filtro activo", () => {
  const creada = cuota({ id_cuota: 8, pagoAnio: 2026 }, { nombre: "Juan", apellido1: "Luis", apellido2: "Ramos" });
  const conAlta = insertarCuotaOrdenada(lista, creada);
  assert.deepEqual(filtrarCuotas(conAlta, { busqueda: "", anio: 2025 }).map((item) => item.id_cuota), [2]);
  assert.deepEqual(filtrarCuotas(conAlta, { busqueda: "juan", anio: null }).map((item) => item.id_cuota), [8, 4, 2]);

  const editada = { ...lista[2], pagoAnio: 2024 };
  const conEdicion = insertarCuotaOrdenada(lista, editada);
  assert.deepEqual(filtrarCuotas(conEdicion, { busqueda: "", anio: 2025 }).map((item) => item.id_cuota), []);
  assert.deepEqual(filtrarCuotas(conEdicion, { busqueda: "juan", anio: 2024 }).map((item) => item.id_cuota), [2]);

  const sinBorrada = eliminarCuotaDeLista(lista, 2);
  assert.deepEqual(filtrarCuotas(sinBorrada, { busqueda: "juan", anio: null }).map((item) => item.id_cuota), [4]);
});

test("nombre y comentario se muestran con la primera letra en mayúscula", () => {
  assert.equal(nombreVisibleCuota({ nombre: "juan", apellido1: "LUIS", apellido2: "ramos" }), "Juan Luis Ramos");
  assert.equal(nombreVisibleCuota({ nombre: "ángel", apellido1: null, apellido2: "  " }), "Ángel");
  assert.equal(textoComentarioCuota("  PAGO en efectivo "), "Pago en efectivo");
  assert.equal(textoComentarioCuota(null), "-");
  assert.equal(textoComentarioCuota("   "), "-");
});

test("el código de socio entra en la búsqueda y se muestra tal cual", () => {
  const conCodigo = cuota({ id_cuota: 6, pagoAnio: 2026 }, { codUsuario: "ALU001" });
  assert.deepEqual(filtrarCuotas([conCodigo], { busqueda: "alu001", anio: null }).map((item) => item.id_cuota), [6]);
  assert.equal(textoCodigoCuota(conCodigo.Usuario), "ALU001");
  assert.equal(textoCodigoCuota(cuota({ id_cuota: 7, pagoAnio: 2026 }).Usuario), "-");
});

function euros(importe: string): string {
  return importeVisibleCuota(importe).replace(/\s/g, " ");
}

test("el importe histórico se muestra en euros y la tabla usa importePagado", () => {
  assert.equal(euros("30"), "30,00 €");
  assert.equal(euros("30.00"), "30,00 €");
  assert.equal(euros("35.50"), "35,50 €");
  const historica = cuota({ id_cuota: 1, pagoAnio: 2024, importePagado: "35.50" });
  assert.equal(euros(historica.importePagado), "35,50 €");
});

test("las estadísticas cuentan y suman solo el importePagado del año pedido", () => {
  const anio = 2026;
  const actuales = [
    ...Array.from({ length: 10 }, (_, indice) => cuota({ id_cuota: indice + 1, pagoAnio: anio, importePagado: "30.00" })),
    cuota({ id_cuota: 11, pagoAnio: anio, importePagado: "35.00" }),
    cuota({ id_cuota: 12, pagoAnio: anio, importePagado: "35.00" }),
    cuota({ id_cuota: 13, pagoAnio: 2025, importePagado: "99.00" }),
    cuota({ id_cuota: 14, pagoAnio: 2024, importePagado: "40.00" }),
  ];
  assert.deepEqual(resumenCuotasAnio(actuales, anio), { cantidad: 12, total: "370.00" });
  assert.equal(euros(resumenCuotasAnio(actuales, anio).total), "370,00 €");
  assert.deepEqual(resumenCuotasAnio(actuales, 2025), { cantidad: 1, total: "99.00" });
  assert.deepEqual(resumenCuotasAnio([], anio), { cantidad: 0, total: "0.00" });
  assert.equal(resumenCuotasAnio([
    cuota({ id_cuota: 1, pagoAnio: anio, importePagado: "0.10" }),
    cuota({ id_cuota: 2, pagoAnio: anio, importePagado: "0.20" }),
  ], anio).total, "0.30");
});

test("el total del listado suma todos los importes filtrados y no solo una página", () => {
  const muchas = Array.from({ length: 24 }, (_, indice) => cuota({
    id_cuota: indice + 1,
    pagoAnio: indice % 2 === 0 ? 2026 : 2025,
    importePagado: "10.00",
  }));
  assert.equal(totalImportesCuotas(muchas), "240.00");
  assert.equal(totalImportesCuotas(muchas.slice(0, 23)), "230.00");
  assert.equal(totalImportesCuotas(filtrarCuotas(muchas, { busqueda: "", anio: 2026 })), "120.00");
  assert.equal(euros(totalImportesCuotas([
    cuota({ id_cuota: 1, pagoAnio: 2026, importePagado: "30.00" }),
    cuota({ id_cuota: 2, pagoAnio: 2024, importePagado: "35.50" }),
  ])), "65,50 €");
});

test("buscar o filtrar por año no cambia las estadísticas del año actual", () => {
  const anio = 2026;
  const antes = resumenCuotasAnio(lista, anio);
  const porNombre = filtrarCuotas(lista, { busqueda: "Ana", anio: null });
  const porAnio = filtrarCuotas(lista, { busqueda: "", anio: 2025 });
  assert.equal(porNombre.length, 1);
  assert.deepEqual(porAnio.map((item) => item.id_cuota), [2]);
  assert.deepEqual(resumenCuotasAnio(lista, anio), antes);
  assert.equal(antes.cantidad, 2);
  assert.notEqual(porNombre.length, antes.cantidad);
});

test("crear, cambiar de año y borrar actualizan las estadísticas del año", () => {
  const anio = 2026;
  let actuales = [
    cuota({ id_cuota: 1, pagoAnio: 2025, importePagado: "40.00" }),
    cuota({ id_cuota: 2, pagoAnio: anio, importePagado: "30.00" }),
  ];
  assert.deepEqual(resumenCuotasAnio(actuales, anio), { cantidad: 1, total: "30.00" });

  actuales = insertarCuotaOrdenada(actuales, cuota({ id_cuota: 3, pagoAnio: anio, importePagado: "35.00" }));
  assert.deepEqual(resumenCuotasAnio(actuales, anio), { cantidad: 2, total: "65.00" });

  actuales = insertarCuotaOrdenada(actuales, cuota({ id_cuota: 1, pagoAnio: anio, importePagado: "40.00" }));
  assert.deepEqual(resumenCuotasAnio(actuales, anio), { cantidad: 3, total: "105.00" });
  assert.deepEqual(resumenCuotasAnio(actuales, 2025), { cantidad: 0, total: "0.00" });

  actuales = eliminarCuotaDeLista(actuales, 2);
  assert.deepEqual(resumenCuotasAnio(actuales, anio), { cantidad: 2, total: "75.00" });
});

test("la fecha de pago ordena de la más moderna a la más antigua", () => {
  const reciente = cuota({ id_cuota: 1, pagoAnio: 2024, fechaPago: "2026-10-19" });
  const antigua = cuota({ id_cuota: 2, pagoAnio: 2026, fechaPago: "2024-01-02" });
  const misma = cuota({ id_cuota: 3, pagoAnio: 2025, fechaPago: "2026-10-19" });
  assert.deepEqual(ordenarCuotas([antigua, reciente, misma], "fechaPago", "desc").map((item) => item.id_cuota), [3, 1, 2]);
  assert.deepEqual(ordenarCuotas([antigua, reciente, misma], "fechaPago", "asc").map((item) => item.id_cuota), [2, 1, 3]);
  assert.equal(direccionAlOrdenarCuota("fechaPago", "fechaPago", "desc"), "asc");
  assert.equal(direccionAlOrdenarCuota("anio", "fechaPago", "desc"), "desc");
  assert.equal(direccionAlOrdenarCuota("socio", "fechaPago", "desc"), "asc");
  assert.deepEqual(
    ordenarCuotas([
      cuota({ id_cuota: 1, pagoAnio: 2024 }, { nombre: "Zoe" }),
      cuota({ id_cuota: 2, pagoAnio: 2026 }, { nombre: "ángel" }),
    ], "socio", "asc").map((item) => item.id_cuota),
    [2, 1],
  );
  assert.deepEqual(
    ordenarCuotas([
      cuota({ id_cuota: 1, pagoAnio: 2024 }),
      cuota({ id_cuota: 2, pagoAnio: 2026 }),
    ], "anio", "desc").map((item) => item.id_cuota),
    [2, 1],
  );
});
