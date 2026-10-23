import { chromium } from "playwright";
import assert from "node:assert/strict";

const base = process.env.ALUMA_TEST_BASE ?? "http://127.0.0.1:5173";
const browser = await chromium.launch({ headless: true, channel: process.env.ALUMA_TEST_BROWSER ?? "chrome" });

const estadosInscripcion = [
  { id_estado_inscripcion: 15, nombre: "Activa" },
  { id_estado_inscripcion: 16, nombre: "Cerrada" },
];
const estados = [
  { id_estado_pago: 11, nombre_estado: "Pendiente" },
  { id_estado_pago: 22, nombre_estado: "Pagado" },
  { id_estado_pago: 33, nombre_estado: "Devolución" },
  { id_estado_pago: 44, nombre_estado: "Cancelado" },
];

function fila(titulo, parcial) {
  return {
    id_inscripcion: parcial.id_inscripcion,
    id_usuario: 9,
    id_actividad: 12,
    precioAplicado: "25.00",
    id_estado_pago: 22,
    id_estado_inscripcion: 15,
    id_metodo_pago: 7,
    apuntadoFecha: "2026-10-01T00:00:00.000Z",
    fechaPago: "2026-10-02",
    comentario: "Nota inicial",
    createAt: "2026-10-01T10:00:00.000Z",
    updateAt: "2026-10-01T10:00:00.000Z",
    Usuario: { id_usuario: 9, nombre: "Ana", apellido1: "García", apellido2: "López" },
    Actividad: { id_actividad: 12, titulo },
    ...parcial,
  };
}

function listadoInicial() {
  return [
    fila("Taller pagado", { id_inscripcion: 4 }),
    fila("Taller pendiente", { id_inscripcion: 5, id_estado_pago: 11, id_metodo_pago: null, fechaPago: null }),
    fila("Taller devuelto", { id_inscripcion: 6, id_estado_pago: 33, id_estado_inscripcion: 16 }),
    fila("Taller cancelado", { id_inscripcion: 7, id_estado_pago: 44 }),
  ];
}

try {
  const page = await browser.newPage();
  let rolActual = "Usuario";
  let fallo = 0;
  let cortarRed = false;
  let writes = 0;
  let lecturas = 0;
  let latest = null;
  let lista = listadoInicial();

  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname.includes("/auth/")) {
      return route.fulfill({
        json: {
          token: `header.${Buffer.from(JSON.stringify({
            rol: rolActual,
            id_usuario: 3,
            exp: Date.now() / 1000 + 3600,
          })).toString("base64")}.signature`,
        },
      });
    }
    if (request.method() === "GET" && url.pathname.endsWith("/metodos-pago")) {
      return route.fulfill({ json: [{ id_metodo_pago: 7, nombre: "Bizum" }] });
    }
    if (request.method() === "GET" && url.pathname.endsWith("/estados-pago")) {
      return route.fulfill({ json: estados });
    }
    if (request.method() === "GET" && url.pathname.endsWith("/estados-inscripcion")) {
      return route.fulfill({ json: estadosInscripcion });
    }
    if (request.method() === "GET" && url.pathname.endsWith("/inscripciones")) {
      lecturas += 1;
      return route.fulfill({ json: lista });
    }
    if (request.method() === "PUT" && /\/inscripciones\/\d+$/.test(url.pathname)) {
      writes += 1;
      latest = request.postDataJSON();
      if (cortarRed) {
        cortarRed = false;
        return route.abort("failed");
      }
      await new Promise((resolve) => setTimeout(resolve, 150));
      if (fallo) {
        return route.fulfill({
          status: fallo,
          json: {
            message: fallo === 400 ? "La devolución no es válida" : "El historial contable requiere revisión",
          },
        });
      }
      const id = Number(url.pathname.split("/").at(-1));
      lista = lista.map((item) => (
        item.id_inscripcion === id
          ? { ...item, id_estado_pago: latest.id_estado_pago, id_estado_inscripcion: 16 }
          : item
      ));
      return route.fulfill({ json: { id_inscripcion: id } });
    }
    return route.fulfill({ status: 404, json: { message: "Ruta no prevista" } });
  });

  async function abrir(rol) {
    rolActual = rol;
    writes = 0;
    lecturas = 0;
    fallo = 0;
    cortarRed = false;
    latest = null;
    lista = listadoInicial();
    await page.goto(`${base}/tests/inscripcionesDevolucion.browser.html`);
    await page.getByText("Taller pagado", { exact: true }).waitFor();
  }

  async function abrirFila(titulo) {
    await page.getByText(titulo, { exact: true }).click();
    await page.getByRole("dialog").waitFor();
  }

  await abrir("Usuario");
  await page.getByText("Taller pagado", { exact: true }).click();
  assert.equal(await page.getByRole("dialog").count(), 0);
  assert.equal(await page.getByRole("button", { name: "Registrar devolución" }).count(), 0);
  assert.equal(writes, 0);
  console.log("PASS Usuario: no puede registrar devoluciones");

  for (const rol of ["Operador", "Administrador"]) {
    await abrir(rol);
    for (const titulo of ["Taller pendiente", "Taller devuelto", "Taller cancelado"]) {
      await abrirFila(titulo);
      assert.equal(await page.getByRole("button", { name: "Registrar devolución" }).count(), 0);
      await page.getByRole("button", { name: titulo === "Taller pendiente" ? "Cerrar modal" : "Cancelar", exact: true }).click();
      await page.getByRole("dialog").waitFor({ state: "detached" });
    }

    await abrirFila("Taller pagado");
    assert.equal(await page.getByRole("dialog").count(), 1);
    assert.equal(await page.getByLabel("Precio aplicado").count(), 0);
    await page.getByRole("button", { name: "Registrar devolución" }).click();
    await page.getByRole("heading", { name: "Registrar devolución" }).waitFor();
    assert.equal(await page.getByRole("dialog").count(), 1);
    const importe = page.getByLabel("Precio aplicado", { exact: true });
    assert.equal(await importe.inputValue(), "25.00 €");
    assert.equal(await importe.isEditable(), false);
    assert.equal(await page.getByLabel("Usuario", { exact: true }).inputValue(), "Ana García López");
    assert.equal(await page.getByLabel("Actividad", { exact: true }).inputValue(), "Taller pagado");
    await page.getByText("Esta operación registrará una devolución y cerrará la inscripción.").waitFor();
    await page.getByRole("button", { name: "Cancelar", exact: true }).click();
    await page.getByRole("heading", { name: "Inscripción", exact: true }).waitFor();
    assert.equal(writes, 0);

    await page.getByRole("button", { name: "Registrar devolución" }).click();
    fallo = 400;
    await page.getByRole("button", { name: "Confirmar devolución" }).click();
    await page.getByText("La devolución no es válida").waitFor();
    assert.equal(await page.getByRole("dialog").count(), 1);
    assert.equal(writes, 1);
    assert.deepEqual(latest, { id_estado_pago: 33 });

    fallo = 409;
    await page.getByRole("button", { name: "Confirmar devolución" }).click();
    await page.getByText("El historial contable requiere revisión").waitFor();
    assert.equal(writes, 2);
    const consulta = page.waitForResponse((response) => (
      response.url().includes("/inscripciones") && response.request().method() === "GET"
    ));
    await page.getByRole("button", { name: "Volver a consultar" }).click();
    await consulta;
    assert.equal(writes, 2);

    cortarRed = true;
    await page.getByRole("button", { name: "Confirmar devolución" }).click();
    await page.getByText("No se pudo confirmar si la devolución se registró").waitFor();
    assert.equal(writes, 3);
    assert.equal(await page.getByRole("dialog").count(), 1);

    fallo = 0;
    writes = 0;
    const lecturasAntes = lecturas;
    await page.locator("form").evaluate((form) => {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    await page.getByRole("dialog").waitFor({ state: "detached" });
    assert.equal(writes, 1);
    assert.deepEqual(latest, { id_estado_pago: 33 });
    await page.locator("tr", { hasText: "Taller pagado" }).getByText("Devolución", { exact: true }).waitFor();
    assert.ok(lecturas > lecturasAntes);
    await page.getByText("Taller pagado", { exact: true }).click();
    await page.getByRole("dialog").waitFor();
    assert.equal(await page.getByRole("button", { name: "Registrar devolución" }).count(), 0);
    await page.getByRole("button", { name: "Cancelar", exact: true }).click();
    console.log(`PASS ${rol}: devuelve desde el modal y actualiza el listado`);
  }
} finally {
  await browser.close();
}
