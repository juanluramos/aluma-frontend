import { chromium } from "playwright";
import assert from "node:assert/strict";

const base = process.env.ALUMA_TEST_BASE ?? "http://127.0.0.1:5173";
const browser = await chromium.launch({ headless: true, channel: process.env.ALUMA_TEST_BROWSER ?? "chrome" });

function inscripcion(comentario) {
  return {
    id_inscripcion: 4,
    id_usuario: 9,
    id_actividad: 12,
    precioAplicado: "25.00",
    id_estado_pago: 2,
    id_estado_inscripcion: 1,
    id_metodo_pago: 3,
    apuntadoFecha: "2026-10-01T00:00:00.000Z",
    fechaPago: "2026-10-02T00:00:00.000Z",
    comentario,
    createAt: "2026-10-01T10:00:00.000Z",
    updateAt: "2026-10-01T10:00:00.000Z",
    Usuario: { id_usuario: 9, nombre: "Ana", apellido1: "García", apellido2: "López" },
    Actividad: { id_actividad: 12, titulo: "Taller de cerámica" },
  };
}

try {
  const page = await browser.newPage();
  let rolActual = "Usuario";
  let fallo = 0;
  let writes = 0;
  let lecturas = 0;
  let latest = null;
  let lista = [inscripcion("Nota inicial")];
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
    if (request.method() === "GET" && url.pathname.endsWith("/inscripciones")) {
      lecturas += 1;
      return route.fulfill({ json: lista });
    }
    if (request.method() === "PUT" && url.pathname.endsWith("/inscripciones/4")) {
      writes += 1;
      latest = request.postDataJSON();
      await new Promise((resolve) => setTimeout(resolve, 150));
      if (fallo) {
        return route.fulfill({
          status: fallo,
          json: { message: "El historial contable requiere revisión", code: "INCONSISTENT_ACCOUNTING_HISTORY" },
        });
      }
      lista = [inscripcion(latest.comentario)];
      return route.fulfill({ json: lista[0] });
    }
    return route.fulfill({ status: 404, json: { message: "Ruta no prevista" } });
  });

  async function abrir(rol) {
    rolActual = rol;
    writes = 0;
    lecturas = 0;
    fallo = 0;
    latest = null;
    lista = [inscripcion("Nota inicial")];
    await page.goto(`${base}/tests/inscripcionesEdicion.browser.html`);
    await page.getByText("Taller de cerámica", { exact: true }).waitFor();
  }

  await abrir("Usuario");
  await page.getByText("Taller de cerámica", { exact: true }).click();
  assert.equal(await page.getByRole("dialog").count(), 0);
  assert.equal(writes, 0);
  console.log("PASS Usuario: la fila no abre la edición");

  for (const rol of ["Operador", "Administrador"]) {
    await abrir(rol);
    await page.getByText("Taller de cerámica", { exact: true }).click();
    const dialogo = page.getByRole("dialog");
    await dialogo.waitFor();
    assert.equal(await page.getByLabel("Usuario", { exact: true }).inputValue(), "9");
    assert.equal(await page.getByRole("option", { name: "Ana García López" }).count(), 1);
    assert.equal(await page.getByLabel("Actividad", { exact: true }).inputValue(), "12");
    assert.equal(await page.getByLabel("Usuario", { exact: true }).isDisabled(), true);
    assert.equal(await page.getByLabel("Actividad", { exact: true }).isDisabled(), true);
    assert.equal(await page.getByLabel("Comentarios", { exact: true }).inputValue(), "Nota inicial");
    assert.equal(await page.getByLabel("Precio aplicado").count(), 0);
    assert.equal(await page.getByLabel("Estado de pago").count(), 0);
    assert.equal(await page.getByLabel("Método de pago").count(), 0);
    await page.getByLabel("Comentarios", { exact: true }).fill("Descartar");
    await page.getByRole("button", { name: "Cancelar", exact: true }).click();
    await dialogo.waitFor({ state: "detached" });
    assert.equal(writes, 0);

    await page.getByText("Taller de cerámica", { exact: true }).click();
    assert.equal(await page.getByLabel("Comentarios", { exact: true }).inputValue(), "Nota inicial");
    fallo = 409;
    await page.getByLabel("Comentarios", { exact: true }).fill("Intento rechazado");
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await page.getByText("El historial contable requiere revisión").waitFor();
    assert.equal(await dialogo.count(), 1);
    assert.equal(await page.getByLabel("Comentarios", { exact: true }).inputValue(), "Intento rechazado");
    assert.deepEqual(latest, { comentario: "Intento rechazado" });
    assert.equal(writes, 1);
    const lecturasTrasError = lecturas;

    fallo = 0;
    await page.locator("form").evaluate((form) => {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    await dialogo.waitFor({ state: "detached" });
    assert.equal(writes, 2);
    assert.deepEqual(latest, { comentario: "Intento rechazado" });
    assert.deepEqual(Object.keys(latest), ["comentario"]);
    assert.ok(lecturas > lecturasTrasError);
    await page.getByText("Taller de cerámica", { exact: true }).click();
    assert.equal(await page.getByLabel("Comentarios", { exact: true }).inputValue(), "Intento rechazado");
    await page.getByRole("button", { name: "Cancelar", exact: true }).click();
    console.log(`PASS ${rol}: edición de comentario sin campos económicos`);
  }
} finally {
  await browser.close();
}
