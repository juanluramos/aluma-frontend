import { chromium } from "playwright";
import assert from "node:assert/strict";

const base = process.env.ALUMA_TEST_BASE ?? "http://127.0.0.1:5173";
const browser = await chromium.launch({ headless: true, channel: process.env.ALUMA_TEST_BROWSER ?? "chrome" });
const resumen = {
  totalCobrado: "1250.50",
  totalDevuelto: "150.25",
  saldoNeto: "1100.25",
  pendienteCobro: "350.10",
};

try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  let rol = "Administrador";
  let modo = "espera";
  let soltar = () => {};
  let espera = new Promise((resolve) => { soltar = resolve; });

  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.includes("/auth/")) {
      return route.fulfill({
        json: { token: `h.${Buffer.from(JSON.stringify({ rol, id_usuario: 1, exp: Date.now() / 1000 + 3600 })).toString("base64")}.s` },
      });
    }
    if (url.pathname.endsWith("/movimientos")) {
      return route.fulfill({
        json: { movimientos: [], total: 0, pagina: 1, totalPaginas: 0 },
      });
    }
    if (url.pathname.endsWith("/contabilidad/resumen")) {
      if (modo === "denegado") return route.fulfill({ status: 403, json: { message: "No autorizado" } });
      if (modo === "error") return route.fulfill({ status: 500, json: { message: "Error interno del servidor" } });
      if (modo === "ceros") {
        return route.fulfill({
          json: { totalCobrado: "0.00", totalDevuelto: "0.00", saldoNeto: "0.00", pendienteCobro: "0.00" },
        });
      }
      if (modo === "espera") await espera;
      return route.fulfill({ json: resumen });
    }
    return route.fulfill({ status: 404, json: {} });
  });

  async function abrir() {
    await page.goto(`${base}/tests/contabilidad.browser.html`);
  }

  await abrir();
  await page.getByRole("status").waitFor();
  assert.equal(await page.getByText("Total cobrado").count(), 0);
  soltar();
  await page.getByText("Total cobrado").waitFor();
  const valores = await page.locator(".contabilidad-stat-value").allTextContents();
  assert.equal(valores.length, 4);
  const textos = valores.map((valor) => valor.replace(/\s/g, " "));
  assert.match(textos[0], /1250,50|1\.250,50/);
  assert.match(textos[1], /150,25/);
  assert.match(textos[2], /1100,25|1\.100,25/);
  assert.match(textos[3], /350,10/);
  console.log("PASS Administrador: importes en formato español");

  modo = "ceros";
  await abrir();
  await page.getByText("0,00").first().waitFor();
  assert.equal(await page.locator(".contabilidad-stat").count(), 4);
  console.log("PASS sin movimientos: ceros visibles");

  modo = "error";
  await abrir();
  await page.getByRole("alert").waitFor();
  await page.getByText("Error interno del servidor").waitFor();
  assert.equal(await page.getByText("Total cobrado").count(), 0);
  console.log("PASS error de conexión");

  modo = "denegado";
  rol = "Operador";
  await abrir();
  await page.getByRole("alert").waitFor();
  await page.getByText("No autorizado").waitFor();
  assert.equal(await page.locator(".contabilidad-stat").count(), 0);
  console.log("PASS Operador: el resumen queda denegado");
} finally {
  await browser.close();
}
