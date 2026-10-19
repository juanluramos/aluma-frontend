import { chromium } from "playwright";
import assert from "node:assert/strict";

const base = process.env.ALUMA_TEST_BASE ?? "http://127.0.0.1:5173";
const browser = await chromium.launch({ headless: true, channel: process.env.ALUMA_TEST_BROWSER ?? "chrome" });

function fila(concepto, importe = "25.00") {
  return {
    id: concepto.length,
    fecha: "2026-10-02",
    tipo: "Cobro",
    concepto,
    usuario: "Ana Ruiz",
    actividad: "Ruta",
    metodoPago: "Efectivo",
    importe,
  };
}

function resumen(cobrado, pendiente = "350.10") {
  const devuelto = "0.00";
  return {
    totalCobrado: cobrado,
    totalDevuelto: devuelto,
    saldoNeto: cobrado,
    pendienteCobro: pendiente,
  };
}

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  let fallar = false;
  let retenerEnero = false;
  let soltarEnero = () => {};
  let esperaEnero = Promise.resolve();
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.includes("/auth/")) {
      return route.fulfill({
        json: { token: `h.${Buffer.from(JSON.stringify({ rol: "Administrador", id_usuario: 1, exp: Date.now() / 1000 + 3600 })).toString("base64")}.s` },
      });
    }
    const desde = url.searchParams.get("desde") ?? "";
    if (retenerEnero && desde === "2026-01-01") await esperaEnero;
    if (fallar) return route.fulfill({ status: 500, json: { message: "Error interno del servidor" } });
    if (url.pathname.endsWith("/contabilidad/resumen")) {
      if (url.searchParams.get("q") === "zzzz") return route.fulfill({ json: resumen("0.00") });
      if (url.searchParams.get("tipo") === "Cobro") return route.fulfill({ json: resumen("20.00") });
      if (desde === "2026-01-01") return route.fulfill({ json: resumen("10.00") });
      if (desde === "2026-02-01") return route.fulfill({ json: resumen("40.00") });
      return route.fulfill({ json: resumen("100.00") });
    }
    if (url.pathname.endsWith("/movimientos")) {
      const tipo = url.searchParams.get("tipo");
      const concepto = tipo === "Cobro"
        ? "Repetido"
        : desde === "2026-01-01"
          ? "Enero"
          : desde === "2026-02-01"
            ? "Febrero"
            : "Inicial";
      const vacio = url.searchParams.get("q") === "zzzz";
      return route.fulfill({
        json: {
          movimientos: vacio ? [] : [fila(concepto, desde === "2026-02-01" ? "40.00" : "100.00")],
          total: vacio ? 0 : 1,
          pagina: Number(url.searchParams.get("pagina") || "1"),
          totalPaginas: vacio ? 0 : 1,
        },
      });
    }
    return route.fulfill({ status: 404, json: {} });
  });

  async function abrir() {
    await page.goto(`${base}/tests/contabilidad.browser.html`);
    await page.getByText("Total cobrado").waitFor();
  }

  await abrir();
  await page.getByText("Importe pendiente actualmente, independiente de los filtros").waitFor();
  assert.match((await page.locator(".contabilidad-stat-value").nth(0).innerText()).replace(/\s/g, " "), /100,00/);
  assert.match((await page.locator(".contabilidad-stat-value").nth(3).innerText()).replace(/\s/g, " "), /350,10/);
  assert.match(await page.locator("tbody tr").innerText(), /Inicial/);
  console.log("PASS resumen cargado y pendiente descrito");

  esperaEnero = new Promise((resolve) => { soltarEnero = resolve; });
  retenerEnero = true;
  await page.getByRole("button", { name: "Filtros", exact: true }).click();
  await page.getByLabel("Desde").fill("2026-01-01");
  await page.getByRole("button", { name: "Aplicar filtros" }).click();
  await page.getByText("Actualizando resumen...").waitFor();
  assert.equal(await page.getByText("100,00").count(), 0);
  assert.equal(await page.getByText("Inicial").count(), 0);
  assert.match((await page.locator(".contabilidad-stat-value").innerText()).replace(/\s/g, " "), /350,10/);
  console.log("PASS el cambio de período oculta las cifras anteriores");

  await page.getByRole("button", { name: "Filtros", exact: true }).click();
  await page.getByLabel("Desde").fill("2026-02-01");
  await page.getByRole("button", { name: "Aplicar filtros" }).click();
  await page.getByText("Febrero").waitFor();
  assert.match((await page.locator(".contabilidad-stat-value").first().innerText()).replace(/\s/g, " "), /40,00/);
  soltarEnero();
  await page.waitForTimeout(300);
  assert.equal(await page.getByText("Enero").count(), 0);
  assert.equal(await page.getByText("10,00").count(), 0);
  assert.match((await page.locator(".contabilidad-stat-value").first().innerText()).replace(/\s/g, " "), /40,00/);
  console.log("PASS una respuesta antigua no sustituye a la más reciente");

  fallar = true;
  await page.getByRole("button", { name: "Filtros", exact: true }).click();
  await page.getByRole("checkbox", { name: "Cobro" }).click();
  await page.getByRole("button", { name: "Aplicar filtros" }).click();
  await page.getByRole("alert").waitFor();
  await page.getByText("Error interno del servidor").waitFor();
  assert.equal(await page.getByText("40,00").count(), 0);
  assert.equal(await page.getByText("0,00").count(), 0);
  assert.equal(await page.getByText("Febrero").count(), 0);
  assert.equal(await page.getByText("Total cobrado").count(), 0);
  assert.equal(await page.locator("tbody tr").count(), 0);
  assert.equal(await page.getByRole("checkbox", { name: "Cobro" }).isChecked(), true);
  assert.match((await page.locator(".contabilidad-stat-value").innerText()).replace(/\s/g, " "), /350,10/);
  console.log("PASS el error no conserva importes ni movimientos del filtro anterior");

  fallar = false;
  await page.getByRole("button", { name: "Reintentar" }).click();
  await page.getByText("Repetido").waitFor();
  assert.match((await page.locator(".contabilidad-stat-value").first().innerText()).replace(/\s/g, " "), /20,00/);
  assert.equal(await page.getByRole("alert").count(), 0);
  console.log("PASS reintento con los filtros conservados");

  await page.getByRole("button", { name: "Filtros", exact: true }).click();
  await page.getByLabel("Desde").fill("");
  await page.getByRole("checkbox", { name: "Todos" }).click();
  await page.getByRole("button", { name: "Aplicar filtros" }).click();
  await page.getByText("Inicial").waitFor();
  await page.getByLabel("Buscar").fill("zzzz");
  await page.getByText("No se encontraron movimientos con los filtros seleccionados.").waitFor();
  assert.equal(await page.getByRole("alert").count(), 0);
  assert.equal(await page.getByText("Error interno del servidor").count(), 0);
  console.log("PASS sin resultados distinto del error, y limpiar filtros");
} finally {
  await browser.close();
}
