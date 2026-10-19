import { chromium } from "playwright";
import assert from "node:assert/strict";

const base = process.env.ALUMA_TEST_BASE ?? "http://127.0.0.1:5173";
const browser = await chromium.launch({ headless: true, channel: process.env.ALUMA_TEST_BROWSER ?? "chrome" });

const filas = [
  ...Array.from({ length: 22 }, (_, indice) => ({
    id: indice + 1,
    fecha: `2026-10-${String(24 - indice).padStart(2, "0")}`,
    tipo: "Cobro",
    concepto: "Cobro inscripción",
    usuario: indice === 0 ? "Ana Ruiz" : "Nora Díaz",
    actividad: indice === 0 ? "Senderismo" : "Ruta",
    metodoPago: "Efectivo",
    importe: "25.00",
  })),
  {
    id: 23,
    fecha: "2026-10-02",
    tipo: "Devolución",
    concepto: "Devolución inscripción",
    usuario: "Luis Pérez",
    actividad: "Taller",
    metodoPago: "Tarjeta",
    importe: "-25.00",
  },
  {
    id: 24,
    fecha: "2026-09-15",
    tipo: "Cobro",
    concepto: "Cobro inscripción",
    usuario: "Nora Díaz",
    actividad: "Ruta",
    metodoPago: "Efectivo",
    importe: "25.00",
  },
  {
    id: 25,
    fecha: "2026-09-01",
    tipo: "Ajuste",
    concepto: "Ajuste caja",
    usuario: null,
    actividad: null,
    metodoPago: null,
    importe: "5.00",
  },
];

function centimos(importe) {
  const negativo = importe.startsWith("-");
  const [entero, decimal = ""] = importe.replace("-", "").split(".");
  const valor = Number(entero) * 100 + Number((decimal + "00").slice(0, 2));
  return negativo ? -valor : valor;
}

function textoCentimos(valor) {
  const negativo = valor < 0;
  const absoluto = Math.abs(valor);
  return `${negativo ? "-" : ""}${Math.floor(absoluto / 100)}.${String(absoluto % 100).padStart(2, "0")}`;
}

function coincide(fila, params) {
  const desde = params.get("desde");
  const hasta = params.get("hasta");
  const tipo = params.get("tipo");
  const q = (params.get("q") ?? "").toLocaleLowerCase("es");
  if (desde && fila.fecha < desde) return false;
  if (hasta && fila.fecha > hasta) return false;
  if (tipo && fila.tipo !== tipo) return false;
  if (!q) return true;
  return [fila.concepto, fila.usuario, fila.actividad].filter(Boolean).join(" ").toLocaleLowerCase("es").includes(q);
}

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  let fallar = false;
  let invalidas = 0;
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.includes("/auth/")) {
      const rol = "Administrador";
      return route.fulfill({
        json: { token: `h.${Buffer.from(JSON.stringify({ rol, id_usuario: 1, exp: Date.now() / 1000 + 3600 })).toString("base64")}.s` },
      });
    }
    if (url.pathname.endsWith("/movimientos")) {
      if (fallar) return route.fulfill({ status: 500, json: { message: "Error interno del servidor" } });
      const desde = url.searchParams.get("desde");
      const hasta = url.searchParams.get("hasta");
      if (desde && hasta && desde > hasta) invalidas += 1;
      const orden = url.searchParams.get("orden") === "asc" ? 1 : -1;
      const seleccion = filas.filter((fila) => coincide(fila, url.searchParams))
        .sort((a, b) => (a.fecha < b.fecha ? -orden : a.fecha > b.fecha ? orden : 0));
      const pagina = Number(url.searchParams.get("pagina") || "1");
      const paginaFilas = seleccion.slice((pagina - 1) * 23, pagina * 23);
      return route.fulfill({
        json: {
          movimientos: paginaFilas,
          total: seleccion.length,
          pagina,
          totalPaginas: seleccion.length === 0 ? 0 : Math.ceil(seleccion.length / 23),
        },
      });
    }
    if (url.pathname.endsWith("/contabilidad/resumen")) {
      if (fallar) return route.fulfill({ status: 500, json: { message: "Error interno del servidor" } });
      const seleccion = filas.filter((fila) => coincide(fila, url.searchParams));
      const tipo = url.searchParams.get("tipo");
      const cobrado = tipo === "Devolución" || tipo === "Ajuste"
        ? 0
        : seleccion.filter((fila) => fila.tipo === "Cobro").reduce((total, fila) => total + centimos(fila.importe), 0);
      const devuelto = tipo === "Cobro" || tipo === "Ajuste"
        ? 0
        : Math.abs(seleccion.filter((fila) => fila.tipo === "Devolución").reduce((total, fila) => total + centimos(fila.importe), 0));
      return route.fulfill({
        json: {
          totalCobrado: textoCentimos(cobrado),
          totalDevuelto: textoCentimos(devuelto),
          saldoNeto: textoCentimos(cobrado - devuelto),
          pendienteCobro: "350.10",
        },
      });
    }
    return route.fulfill({ status: 404, json: {} });
  });

  async function abrir() {
    await page.goto(`${base}/tests/contabilidad.browser.html`);
  }

  function importes() {
    return page.locator(".contabilidad-stat-value").allTextContents()
      .then((valores) => valores.map((valor) => valor.replace(/\s/g, " ")));
  }

  await abrir();
  await page.getByRole("button", { name: "Fecha" }).waitFor();
  await page.getByText("Pendiente actual", { exact: true }).waitFor();
  assert.equal(await page.locator("tbody tr").count(), 23);
  assert.match((await page.locator("tbody tr").first().innerText()).replace(/\s/g, " "), /24\/10\/2026/);
  assert.match(await page.locator("tbody tr").first().innerText(), /Cobro/);
  const tarjeta = await importes();
  assert.match(tarjeta[0], /575,00/);
  assert.match(tarjeta[1], /25,00/);
  assert.match(tarjeta[2], /550,00/);
  assert.match(tarjeta[3], /350,10/);
  console.log("PASS listado, signos y resumen de todas las páginas");

  await page.getByRole("button", { name: "Filtros", exact: true }).click();
  await page.getByLabel("Desde").fill("2026-10-01");
  await page.getByLabel("Hasta").fill("2026-10-31");
  await page.getByRole("button", { name: "Aplicar filtros" }).click();
  await page.waitForFunction(() => (document.querySelector(".contabilidad-stat-value")?.textContent ?? "").includes("550,00"));
  const periodo = await importes();
  assert.match(periodo[0], /550,00/);
  assert.match(periodo[3], /350,10/);
  assert.equal(await page.getByText("Ajuste caja").count(), 0);
  console.log("PASS filtro por fechas y pendiente actual");

  await page.getByRole("button", { name: "Filtros", exact: true }).click();
  await page.getByRole("checkbox", { name: "Devolución" }).click();
  await page.getByRole("button", { name: "Aplicar filtros" }).click();
  await page.getByText("Luis Pérez").waitFor();
  assert.equal(await page.locator("tbody tr").count(), 1);
  assert.match((await page.locator("tbody td").last().innerText()).replace(/\s/g, " "), /-25,00/);
  const soloDevolucion = await importes();
  assert.match(soloDevolucion[0], /0,00/);
  assert.match(soloDevolucion[1], /25,00/);
  console.log("PASS filtro por tipo y signo negativo");

  await page.getByRole("button", { name: "Filtros", exact: true }).click();
  await page.getByLabel("Desde").fill("");
  await page.getByLabel("Hasta").fill("");
  await page.getByRole("checkbox", { name: "Todos" }).click();
  await page.getByRole("button", { name: "Aplicar filtros" }).click();
  await page.getByText("Senderismo").waitFor();
  await page.getByLabel("Buscar").fill("Senderismo");
  await page.waitForFunction(() => document.querySelectorAll("tbody tr").length === 1);
  assert.match(await page.locator("tbody tr").innerText(), /Ana Ruiz/);
  console.log("PASS búsqueda");

  await page.getByLabel("Buscar").fill("");
  await page.getByText("Página 1 de 2").waitFor();
  await page.getByRole("button", { name: "Fecha" }).click();
  await page.getByText("01/09/2026").waitFor();
  assert.match(await page.locator("tbody tr").first().innerText(), /Ajuste/);
  console.log("PASS ordenación ascendente");

  await page.getByRole("button", { name: "Fecha" }).click();
  await page.getByText("24/10/2026").waitFor();
  await page.getByRole("button", { name: "Siguiente" }).click();
  await page.getByText("Página 2 de 2").waitFor();
  assert.equal(await page.locator("tbody tr").count(), 2);
  console.log("PASS paginación");

  await page.getByRole("button", { name: "Filtros", exact: true }).click();
  await page.getByRole("checkbox", { name: "Ajuste" }).click();
  await page.getByRole("button", { name: "Aplicar filtros" }).click();
  await page.getByText("Ajuste caja").waitFor();
  assert.equal(await page.getByRole("cell", { name: "—", exact: true }).count(), 3);
  console.log("PASS relaciones ausentes");

  await page.getByRole("button", { name: "Filtros", exact: true }).click();
  await page.getByRole("checkbox", { name: "Todos" }).click();
  await page.getByRole("button", { name: "Aplicar filtros" }).click();
  await page.getByLabel("Buscar").fill("zzzz");
  await page.getByText("No se encontraron movimientos con los filtros seleccionados.").waitFor();
  console.log("PASS sin resultados");

  await page.getByRole("button", { name: "Filtros", exact: true }).click();
  await page.getByLabel("Desde").fill("2026-10-05");
  await page.getByLabel("Hasta").fill("2026-10-01");
  await page.getByRole("button", { name: "Aplicar filtros" }).click();
  await page.getByRole("alert").waitFor();
  await page.getByText("La fecha inicial no puede ser posterior a la final.").waitFor();
  assert.equal(invalidas, 0);
  console.log("PASS rango de fechas inválido");

  fallar = true;
  await abrir();
  await page.getByRole("alert").waitFor();
  await page.getByText("Error interno del servidor").waitFor();
  assert.equal(await page.locator(".contabilidad-stat").count(), 0);
  console.log("PASS error de API");
} finally {
  await browser.close();
}
