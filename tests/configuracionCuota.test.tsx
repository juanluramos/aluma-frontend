import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { hasPermission, type Rol } from "../src/auth/permissions.ts";
import EnlaceCuotaAnual from "../src/components/configuracion/EnlaceCuotaAnual.tsx";
import ConfiguracionCuotaAnual from "../src/components/configuracion/ConfiguracionCuotaAnual.tsx";
import type { ConfiguracionCuotaAnual as Configuracion } from "../src/services/configuracionCuotaService.ts";
import { formatoEuro } from "../src/utils/formatoEuro.ts";
import {
  MENSAJE_CONFIGURACION_DUPLICADA,
  MENSAJE_CONFIGURACION_EN_USO,
  guardarConfiguracionEnLista,
  mensajeConfiguracionCuota,
  quitarConfiguracionDeLista,
  validarConfiguracionCuota,
} from "../src/utils/configuracionCuotaForm.ts";

const historico: Configuracion[] = [
  { id_configuracion: 3, anio: 2026, importe: "30.00", createAt: "", updateAt: "" },
  { id_configuracion: 2, anio: 2025, importe: "25.00", createAt: "", updateAt: "" },
  { id_configuracion: 1, anio: 2024, importe: "25.00", createAt: "", updateAt: "" },
];

function enlace(rol: Rol | null): string {
  return renderToStaticMarkup(createElement(MemoryRouter, null, createElement(EnlaceCuotaAnual, { rol })));
}

function panel(parcial: Partial<Parameters<typeof ConfiguracionCuotaAnual>[0]> = {}): string {
  return renderToStaticMarkup(createElement(ConfiguracionCuotaAnual, {
    configuraciones: historico,
    anio: "",
    importe: "",
    errores: {},
    error: "",
    seleccionId: null,
    guardando: false,
    onAnio: () => undefined,
    onImporte: () => undefined,
    onGuardar: () => undefined,
    onElegir: () => undefined,
    onNueva: () => undefined,
    onEliminar: () => undefined,
    ...parcial,
  }));
}

test("solo el administrador ve el enlace de cuota anual", () => {
  assert.equal(hasPermission("Administrador", "gestionarConfiguracionCuota"), true);
  assert.equal(hasPermission("Operador", "gestionarConfiguracionCuota"), false);
  assert.equal(hasPermission("Usuario", "gestionarConfiguracionCuota"), false);
  assert.match(enlace("Administrador"), /Cuota anual/);
  assert.match(enlace("Administrador"), /href="\/configuracion"/);
  assert.equal(enlace("Operador"), "");
  assert.equal(enlace("Usuario"), "");
  assert.equal(enlace(null), "");
});

test("el administrador ve el histórico y puede preparar un año nuevo", () => {
  const html = panel();
  assert.match(html, /Configuración de cuota anual/);
  assert.match(html, />Año</);
  assert.match(html, />Importe</);
  assert.match(html, />Guardar</);
  assert.ok(html.includes(formatoEuro("30.00")));
  assert.ok(html.includes(formatoEuro("25.00")));
  assert.match(html, />2026</);
  assert.match(html, />2025</);
  assert.match(html, />2024</);

  const alta = validarConfiguracionCuota("2027", "35,00");
  assert.deepEqual(alta.datos, { anio: 2027, importe: 35 });
  const creada: Configuracion = { id_configuracion: 4, anio: 2027, importe: "35.00", createAt: "", updateAt: "" };
  const conNuevo = guardarConfiguracionEnLista(historico, creada);
  assert.deepEqual(conNuevo.map((item) => item.anio), [2027, 2026, 2025, 2024]);
  assert.ok(panel({ configuraciones: conNuevo }).includes(formatoEuro("35.00")));
  assert.ok(panel({ configuraciones: conNuevo }).includes(formatoEuro("30.00")));
});

test("un año duplicado muestra el error y conserva el histórico", () => {
  assert.equal(mensajeConfiguracionCuota(409, "CONFIGURACION_CUOTA_DUPLICADA", "guardar"), MENSAJE_CONFIGURACION_DUPLICADA);
  const html = panel({ anio: "2026", importe: "40,00", error: MENSAJE_CONFIGURACION_DUPLICADA });
  assert.match(html, new RegExp(MENSAJE_CONFIGURACION_DUPLICADA));
  assert.match(html, />2026</);
  assert.ok(html.includes(formatoEuro("30.00")));
  assert.equal(historico[0]?.importe, "30.00");
});

test("editar el importe actualiza el año elegido y deja el resto igual", () => {
  const editada: Configuracion = { ...historico[0]!, importe: "35.00" };
  const lista = guardarConfiguracionEnLista(historico, editada);
  assert.equal(lista.find((item) => item.anio === 2026)?.importe, "35.00");
  assert.equal(lista.find((item) => item.anio === 2025)?.importe, "25.00");
  assert.equal(lista.find((item) => item.anio === 2024)?.importe, "25.00");
  const html = panel({ configuraciones: lista, anio: "2026", importe: "35,00", seleccionId: 3 });
  assert.ok(html.includes(formatoEuro("35.00")));
  assert.ok(html.includes(formatoEuro("25.00")));
  assert.match(html, />Eliminar</);
});

test("borrar una configuración usada muestra el error y el histórico sigue visible", () => {
  assert.equal(mensajeConfiguracionCuota(409, "CONFIGURACION_CUOTA_EN_USO", "eliminar"), MENSAJE_CONFIGURACION_EN_USO);
  const html = panel({ error: MENSAJE_CONFIGURACION_EN_USO, seleccionId: 3, anio: "2026", importe: "30,00" });
  assert.match(html, new RegExp(MENSAJE_CONFIGURACION_EN_USO.replace(".", "\\.")));
  assert.deepEqual(quitarConfiguracionDeLista(historico, 99), historico);
  assert.match(html, />2026</);
  assert.match(html, />2025</);
  assert.match(html, />2024</);
});

test("el importe rechaza cero, negativos y más de dos decimales", () => {
  assert.ok(validarConfiguracionCuota("", "30").errores.anio);
  assert.ok(validarConfiguracionCuota("1969", "30").errores.anio);
  assert.ok(validarConfiguracionCuota("2026", "0").errores.importe);
  assert.ok(validarConfiguracionCuota("2026", "-1").errores.importe);
  assert.ok(validarConfiguracionCuota("2026", "10,555").errores.importe);
  assert.equal(validarConfiguracionCuota("2026", "30,1").datos?.importe, 30.1);
});
