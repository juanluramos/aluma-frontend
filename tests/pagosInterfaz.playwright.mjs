import { chromium } from "playwright";
import assert from "node:assert/strict";

const base = process.env.ALUMA_TEST_BASE ?? "http://127.0.0.1:5173";
const browser = await chromium.launch({ headless: true, channel: process.env.ALUMA_TEST_BROWSER ?? "chrome" });
const estados = [
  { id_estado_pago: 11, nombre_estado: "Pendiente" },
  { id_estado_pago: 22, nombre_estado: "Pagado" },
  { id_estado_pago: 33, nombre_estado: "Devolución" },
  { id_estado_pago: 44, nombre_estado: "Cancelado" },
];
const metodos = [{ id_metodo_pago: 7, nombre: "Bizum" }];
const fila = {
  id_inscripcion: 1,
  id_usuario: 9,
  id_actividad: 12,
  precioAplicado: "25.00",
  id_estado_pago: 22,
  id_estado_inscripcion: 15,
  id_metodo_pago: 7,
  apuntadoFecha: "2026-10-01",
  fechaPago: "2026-10-02",
  comentario: null,
  createAt: "2026-10-01T00:00:00.000Z",
  updateAt: "2026-10-01T00:00:00.000Z",
  posicionEspera: null,
  plazasOcupadas: 0,
  plazasDisponibles: 1,
  aforo: 2,
  puedePromocionar: false,
  Usuario: { id_usuario: 9, nombre: "Ana", apellido1: "García", apellido2: null },
  Actividad: { id_actividad: 12, titulo: "Taller" },
};

try {
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  let rol = "Operador";
  let fallarCatalogo = false;
  let soltarCatalogo = () => {};
  let catalogo = new Promise((resolve) => { soltarCatalogo = resolve; });

  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.includes("/auth/")) {
      return route.fulfill({
        json: { token: `h.${Buffer.from(JSON.stringify({ rol, id_usuario: 9, exp: Date.now() / 1000 + 3600 })).toString("base64")}.s` },
      });
    }
    if (url.pathname.endsWith("/estados-inscripcion")) return route.fulfill({ json: [{ id_estado_inscripcion: 15, nombre: "Activa" }] });
    if (url.pathname.endsWith("/inscripciones")) return route.fulfill({ json: [fila] });
    if (url.pathname.endsWith("/estados-pago") || url.pathname.endsWith("/metodos-pago")) {
      if (fallarCatalogo) return route.fulfill({ status: 500, json: { message: "No se pudieron cargar los estados de pago." } });
      await catalogo;
      return route.fulfill({ json: url.pathname.endsWith("/metodos-pago") ? metodos : estados });
    }
    return route.fulfill({ status: 404, json: {} });
  });

  async function abrir() {
    await page.goto(`${base}/tests/pagosInterfaz.browser.html`);
    await page.getByRole("heading", { name: "Pagos" }).waitFor();
  }

  rol = "Usuario";
  await abrir();
  await page.getByText("Tus pagos", { exact: true }).waitFor();
  assert.equal(await page.getByText("Cargando resumen...").count(), 0);
  assert.equal(await page.getByText("Pagados", { exact: true }).count(), 0);
  console.log("PASS Usuario: Tus pagos y sin tarjetas");

  rol = "Operador";
  await abrir();
  await page.getByText("Gestión de pagos", { exact: true }).waitFor();
  await page.getByRole("status").waitFor();
  assert.equal(await page.getByText("Pagados", { exact: true }).count(), 0);
  soltarCatalogo();
  await page.getByText("Pagados", { exact: true }).waitFor();
  const valores = await page.locator(".inscripciones-stat-value").allTextContents();
  assert.deepEqual(valores, ["1", "0", "0", "0"]);
  assert.equal(valores.some((valor) => valor.includes("€")), false);
  await page.getByRole("button", { name: "Filtrado" }).click();
  await page.getByRole("group", { name: "Filtrar pagos" }).getByText("Método", { exact: true }).waitFor();
  await page.getByRole("checkbox", { name: "Bizum" }).waitFor();
  await page.getByRole("checkbox", { name: "Sin método" }).waitFor();
  await page.getByRole("checkbox", { name: "Pendiente" }).waitFor();
  console.log("PASS Operador: resumen, método y gestión de pagos");

  fallarCatalogo = true;
  rol = "Administrador";
  await abrir();
  await page.getByText("Gestión de pagos", { exact: true }).waitFor();
  await page.getByRole("alert").waitFor();
  await page.getByText("No se pudieron cargar los estados de pago.").waitFor();
  assert.equal(await page.getByText("Pagados", { exact: true }).count(), 0);
  console.log("PASS Administrador: error de catálogo sin ceros");
} finally {
  await browser.close();
}
