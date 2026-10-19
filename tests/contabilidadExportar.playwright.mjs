import { readFileSync } from "node:fs";
import { chromium } from "playwright";
import assert from "node:assert/strict";

const base = process.env.ALUMA_TEST_BASE ?? "http://127.0.0.1:5173";
const browser = await chromium.launch({ headless: true, channel: process.env.ALUMA_TEST_BROWSER ?? "chrome" });

const filas = Array.from({ length: 25 }, (_, indice) => ({
  id: indice + 1,
  fecha: `2026-10-${String((indice % 28) + 1).padStart(2, "0")}`,
  tipo: indice === 24 ? "Devolución" : "Cobro",
  concepto: "Cobro inscripción",
  usuario: indice === 0 ? "Ana Ruiz" : null,
  actividad: indice === 0 ? "Senderismo por la sierra" : "Ruta",
  metodoPago: "Efectivo",
  importe: indice === 24 ? "-12.50" : "25.00",
}));

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const peticiones = [];
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.includes("/auth/")) {
      const rol = "Administrador";
      return route.fulfill({
        json: { token: `h.${Buffer.from(JSON.stringify({ rol, id_usuario: 1, exp: Date.now() / 1000 + 3600 })).toString("base64")}.s` },
      });
    }
    if (url.pathname.endsWith("/movimientos")) {
      const pagina = Number(url.searchParams.get("pagina") || "1");
      const limite = Number(url.searchParams.get("limite") || "23");
      peticiones.push({ pagina, limite });
      const inicio = (pagina - 1) * limite;
      return route.fulfill({
        json: {
          movimientos: filas.slice(inicio, inicio + limite),
          total: filas.length,
          pagina,
          totalPaginas: Math.ceil(filas.length / limite),
        },
      });
    }
    if (url.pathname.endsWith("/contabilidad/resumen")) {
      return route.fulfill({
        json: {
          totalCobrado: "600.00",
          totalDevuelto: "12.50",
          saldoNeto: "587.50",
          pendienteCobro: "246.25",
        },
      });
    }
    return route.fulfill({ status: 404, json: {} });
  });

  await page.goto(`${base}/tests/contabilidad.browser.html`);
  const exportar = page.getByRole("button", { name: "Exportar" });
  await exportar.waitFor();
  const imagen = await exportar.locator("img").evaluate((elemento) => ({
    ancho: elemento.naturalWidth,
    alto: elemento.naturalHeight,
    fondo: getComputedStyle(elemento).backgroundColor,
    ajuste: getComputedStyle(elemento).objectFit,
  }));
  assert.equal(imagen.ancho, 200);
  assert.equal(imagen.alto, 200);
  assert.equal(imagen.ajuste, "contain");
  assert.equal(imagen.fondo, "rgba(0, 0, 0, 0)");
  console.log("PASS icono exportar visible y transparente");

  await exportar.click();
  await page.getByRole("menuitem", { name: "Descargar PDF" }).waitFor();
  await page.getByRole("menuitem", { name: "Imprimir" }).waitFor();
  await page.keyboard.press("Escape");
  assert.equal(await page.getByRole("menuitem").count(), 0);
  await exportar.click();
  await page.locator("h1, .contabilidad-stat").first().click({ position: { x: 4, y: 4 } });
  assert.equal(await page.getByRole("menuitem").count(), 0);
  console.log("PASS menú, Escape y clic fuera");

  await exportar.focus();
  await page.keyboard.press("Enter");
  const descarga = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: "Descargar PDF" }).click();
  const archivo = await descarga;
  assert.match(archivo.suggestedFilename(), /^ALUMA_Contabilidad_\d{4}-\d{2}-\d{2}\.pdf$/);
  const texto = readFileSync(await archivo.path()).toString("latin1");
  assert.match(texto, /Informe de Contabilidad/);
  assert.match(texto, /no depende de los filtros seleccionados/);
  assert.match(texto, /Senderismo por la sierra/);
  assert.match(texto, /Página 1 de /);
  assert.deepEqual(peticiones.filter((peticion) => peticion.limite === 100).map((peticion) => peticion.pagina), [1]);
  assert.ok(peticiones.some((peticion) => peticion.limite === 23));
  console.log("PASS descarga con todos los movimientos y resumen");

  await exportar.click();
  const ventana = page.waitForEvent("popup");
  await page.getByRole("menuitem", { name: "Imprimir" }).click();
  const impresa = await ventana;
  assert.match(impresa.url(), /^blob:/);
  await impresa.close();
  console.log("PASS impresión abre el mismo PDF");
} finally {
  await browser.close();
}
