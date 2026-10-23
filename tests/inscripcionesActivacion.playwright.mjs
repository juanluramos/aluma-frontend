import { chromium } from "playwright";
import assert from "node:assert/strict";

const base = process.env.ALUMA_TEST_BASE ?? "http://127.0.0.1:5173";
const browser = await chromium.launch({ headless: true, channel: process.env.ALUMA_TEST_BROWSER ?? "chrome" });

const estadosInscripcion = [
  { id_estado_inscripcion: 15, nombre: "Activa" },
  { id_estado_inscripcion: 16, nombre: "Cerrada" },
  { id_estado_inscripcion: 17, nombre: "En espera" },
];
const estados = [
  { id_estado_pago: 11, nombre_estado: "Pendiente" },
  { id_estado_pago: 22, nombre_estado: "Pagado" },
];

function fila(titulo, parcial) {
  return {
    id_inscripcion: parcial.id_inscripcion,
    id_usuario: 9,
    id_actividad: 12,
    precioAplicado: "10.00",
    id_estado_pago: 11,
    id_estado_inscripcion: 17,
    id_metodo_pago: null,
    apuntadoFecha: "2026-10-14T00:00:00.000Z",
    fechaPago: null,
    comentario: null,
    createAt: "2026-10-14T10:00:00.000Z",
    updateAt: "2026-10-14T10:00:00.000Z",
    posicionEspera: 1,
    plazasOcupadas: 1,
    plazasDisponibles: 1,
    aforo: 2,
    puedePromocionar: true,
    Usuario: { id_usuario: 9, nombre: "Ana", apellido1: "García", apellido2: "López" },
    Actividad: { id_actividad: 12, titulo },
    ...parcial,
  };
}

function listadoInicial() {
  return [
    fila("Taller en espera", { id_inscripcion: 8 }),
    fila("Taller segunda", { id_inscripcion: 9, posicionEspera: 2, puedePromocionar: false }),
    fila("Taller sin limite", { id_inscripcion: 10, aforo: null, plazasDisponibles: null, plazasOcupadas: 0 }),
    fila("Taller activa", { id_inscripcion: 11, id_estado_inscripcion: 15, posicionEspera: null, puedePromocionar: false }),
  ];
}

try {
  const page = await browser.newPage();
  let rolActual = "Usuario";
  let fallo = 0;
  let cortarRed = false;
  let writes = 0;
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
      return route.fulfill({ json: lista });
    }
    if (request.method() === "PATCH" && /\/inscripciones\/\d+\/activar$/.test(url.pathname)) {
      writes += 1;
      assert.equal(request.postData(), null);
      if (cortarRed) {
        cortarRed = false;
        return route.abort("failed");
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
      if (fallo) {
        return route.fulfill({
          status: fallo,
          json: { message: fallo === 409 ? "No hay plaza disponible" : "No se pudo activar" },
        });
      }
      const id = Number(url.pathname.split("/").at(-2));
      lista = lista.map((item) => (
        item.id_inscripcion === id
          ? { ...item, id_estado_inscripcion: 15, posicionEspera: null, puedePromocionar: false }
          : item
      ));
      return route.fulfill({ json: { id_inscripcion: id } });
    }
    return route.fulfill({ status: 404, json: { message: "Ruta no prevista" } });
  });

  async function abrir(rol) {
    rolActual = rol;
    writes = 0;
    fallo = 0;
    cortarRed = false;
    lista = listadoInicial();
    await page.goto(`${base}/tests/inscripcionesActivacion.browser.html`);
    await page.getByText("Taller en espera", { exact: true }).waitFor();
  }

  async function abrirFila(titulo) {
    await page.getByText(titulo, { exact: true }).click();
    await page.getByRole("dialog").waitFor();
  }

  await abrir("Usuario");
  await page.getByText("Taller en espera", { exact: true }).click();
  assert.equal(await page.getByRole("dialog").count(), 0);
  assert.equal(await page.getByRole("button", { name: "Activar inscripción" }).count(), 0);
  assert.equal(writes, 0);
  console.log("PASS Usuario: no puede activar");

  for (const rol of ["Operador", "Administrador"]) {
    await abrir(rol);
    await abrirFila("Taller segunda");
    assert.equal(await page.getByLabel("Posición en la lista").inputValue(), "2");
    assert.equal(await page.getByRole("button", { name: "Activar inscripción" }).count(), 0);
    await page.getByRole("button", { name: "Cerrar modal", exact: true }).click();
    await page.getByRole("dialog").waitFor({ state: "detached" });

    await abrirFila("Taller activa");
    assert.equal(await page.getByRole("button", { name: "Activar inscripción" }).count(), 0);
    await page.getByRole("button", { name: "Cerrar modal", exact: true }).click();

    await abrirFila("Taller sin limite");
    assert.equal(await page.getByLabel("Aforo").inputValue(), "Sin límite");
    assert.equal(await page.getByRole("button", { name: "Activar inscripción" }).count(), 1);
    await page.getByRole("button", { name: "Cerrar modal", exact: true }).click();

    await abrirFila("Taller en espera");
    assert.equal(await page.getByRole("dialog").count(), 1);
    assert.equal(await page.getByLabel("Estado").inputValue(), "En espera");
    assert.equal(await page.getByLabel("Posición en la lista").inputValue(), "1");
    assert.equal(await page.getByLabel("Plazas ocupadas").inputValue(), "1");
    assert.equal(await page.getByLabel("Aforo").inputValue(), "2");
    assert.equal(await page.getByText("ocupará una plaza disponible").count(), 0);
    await page.getByRole("button", { name: "Activar inscripción" }).click();
    await page.getByRole("heading", { name: "Activar inscripción" }).waitFor();
    assert.equal(await page.getByRole("dialog").count(), 1);
    await page.getByText("Esta persona pasará de En espera a Activa y ocupará una plaza disponible. El pago continuará Pendiente.").waitFor();
    await page.getByRole("button", { name: "Cancelar", exact: true }).click();
    await page.getByRole("heading", { name: "Inscripción", exact: true }).waitFor();
    assert.equal(writes, 0);

    fallo = 409;
    await page.getByRole("button", { name: "Activar inscripción" }).click();
    await page.getByRole("button", { name: "Confirmar activación" }).click();
    await page.getByText("No hay plaza disponible").waitFor();
    assert.equal(await page.getByRole("dialog").count(), 1);
    assert.equal(writes, 1);
    const consulta = page.waitForResponse((response) => (
      response.url().includes("/inscripciones") && response.request().method() === "GET"
    ));
    await page.getByRole("button", { name: "Volver a consultar" }).click();
    await consulta;
    assert.equal(writes, 1);

    cortarRed = true;
    await page.getByRole("button", { name: "Confirmar activación" }).click();
    await page.getByText("No se pudo confirmar si la inscripción se activó.").waitFor();
    assert.equal(writes, 2);
    await page.getByRole("button", { name: "Cancelar", exact: true }).click();
    await page.getByRole("heading", { name: "Inscripción", exact: true }).waitFor();

    fallo = 0;
    writes = 0;
    await page.getByRole("button", { name: "Activar inscripción" }).click();
    await page.locator("form").evaluate((form) => {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    await page.getByRole("dialog").waitFor({ state: "detached" });
    assert.equal(writes, 1);
    const filaActivada = page.locator("tr", { hasText: "Taller en espera" });
    await filaActivada.getByText("Activa", { exact: true }).waitFor();
    await filaActivada.getByText("Pendiente", { exact: true }).waitFor();
    await page.getByText("Taller en espera", { exact: true }).click();
    await page.getByRole("dialog").waitFor();
    assert.equal(await page.getByRole("button", { name: "Activar inscripción" }).count(), 0);
    await page.getByRole("button", { name: "Cerrar modal", exact: true }).click();
    console.log(`PASS ${rol}: activa la primera persona y el pago sigue pendiente`);
  }
} finally {
  await browser.close();
}
