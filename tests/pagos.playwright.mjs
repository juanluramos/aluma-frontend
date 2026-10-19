import { chromium } from "playwright";
import assert from "node:assert/strict";

const base = process.env.ALUMA_TEST_BASE ?? "http://127.0.0.1:5173";
const browser = await chromium.launch({ headless: true, channel: process.env.ALUMA_TEST_BROWSER ?? "chrome" });

const estadosInscripcion = [
  { id_estado_inscripcion: 15, nombre: "Activa" },
  { id_estado_inscripcion: 17, nombre: "En espera" },
];
const estados = [
  { id_estado_pago: 11, nombre_estado: "Pendiente" },
  { id_estado_pago: 22, nombre_estado: "Pagado" },
  { id_estado_pago: 33, nombre_estado: "Devolución" },
];
const metodos = [{ id_metodo_pago: 7, nombre: "Bizum" }];

function fila(parcial) {
  return {
    id_inscripcion: parcial.id_inscripcion,
    id_usuario: 9,
    id_actividad: 12,
    precioAplicado: "25.00",
    id_estado_pago: 11,
    id_estado_inscripcion: 15,
    id_metodo_pago: null,
    apuntadoFecha: "2026-10-01",
    fechaPago: null,
    comentario: null,
    createAt: "2026-10-01T00:00:00.000Z",
    updateAt: "2026-10-01T00:00:00.000Z",
    posicionEspera: null,
    plazasOcupadas: 0,
    plazasDisponibles: 10,
    aforo: 20,
    puedePromocionar: false,
    Usuario: { id_usuario: 9, nombre: "Ana", apellido1: "García", apellido2: "López" },
    Actividad: { id_actividad: 12, titulo: "Taller de cerámica" },
    ...parcial,
  };
}

function listadoInicial() {
  return [
    fila({ id_inscripcion: 1, Actividad: { id_actividad: 12, titulo: "Taller de cerámica" } }),
    fila({
      id_inscripcion: 2,
      id_usuario: 4,
      id_estado_pago: 22,
      id_metodo_pago: 7,
      fechaPago: "2026-10-02",
      Usuario: { id_usuario: 4, nombre: "Luis", apellido1: "Pérez", apellido2: null },
      Actividad: { id_actividad: 8, titulo: "Senderismo" },
    }),
    fila({
      id_inscripcion: 3,
      id_estado_inscripcion: 17,
      Actividad: { id_actividad: 13, titulo: "Lista de espera" },
    }),
    ...Array.from({ length: 21 }, (_, indice) => fila({
      id_inscripcion: 100 + indice,
      Actividad: { id_actividad: 20, titulo: `Extra ${indice + 1}` },
    })),
  ];
}

try {
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  let rolActual = "Usuario";
  let fallo = 0;
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
            id_usuario: 9,
            exp: Date.now() / 1000 + 3600,
          })).toString("base64")}.signature`,
        },
      });
    }
    if (request.method() === "GET" && url.pathname.endsWith("/metodos-pago")) {
      if (rolActual === "Usuario") return route.fulfill({ status: 403, json: { message: "No autorizado" } });
      return route.fulfill({ json: metodos });
    }
    if (request.method() === "GET" && url.pathname.endsWith("/estados-pago")) {
      if (rolActual === "Usuario") return route.fulfill({ status: 403, json: { message: "No autorizado" } });
      return route.fulfill({ json: estados });
    }
    if (request.method() === "GET" && url.pathname.endsWith("/estados-inscripcion")) {
      return route.fulfill({ json: estadosInscripcion });
    }
    if (request.method() === "GET" && url.pathname.endsWith("/inscripciones")) {
      lecturas += 1;
      const visibles = rolActual === "Usuario" ? lista.filter((item) => item.id_usuario === 9) : lista;
      return route.fulfill({ json: visibles });
    }
    if (request.method() === "PUT" && /\/inscripciones\/\d+$/.test(url.pathname)) {
      writes += 1;
      latest = request.postDataJSON();
      await new Promise((resolve) => setTimeout(resolve, 120));
      if (fallo) {
        return route.fulfill({ status: fallo, json: { message: "El pago no se puede registrar" } });
      }
      const id = Number(url.pathname.split("/").at(-1));
      lista = lista.map((item) => item.id_inscripcion === id ? { ...item, ...latest } : item);
      return route.fulfill({ json: { id_inscripcion: id } });
    }
    return route.fulfill({ status: 404, json: { message: "Ruta no prevista" } });
  });

  async function abrir(rol) {
    rolActual = rol;
    writes = 0;
    lecturas = 0;
    fallo = 0;
    latest = null;
    lista = listadoInicial();
    await page.goto(`${base}/tests/pagos.browser.html`);
    await page.getByText("Lista de pagos").waitFor();
  }

  await abrir("Usuario");
  await page.getByText("Taller de cerámica", { exact: true }).waitFor();
  assert.equal(await page.getByText("Senderismo", { exact: true }).count(), 0);
  assert.equal(await page.getByRole("button", { name: "Estado", exact: true }).count(), 0);
  await page.getByRole("row", { name: /Ver pago de Ana García López/ }).first().click();
  await page.getByRole("heading", { name: "Pago", exact: true }).waitFor();
  assert.equal(await page.getByRole("button", { name: "Registrar pago" }).count(), 0);
  assert.equal(await page.getByRole("button", { name: "Registrar devolución" }).count(), 0);
  assert.equal(writes, 0);
  await page.getByRole("button", { name: "Cerrar", exact: true }).click();
  console.log("PASS Usuario: solo sus pagos y sin acciones");

  for (const rol of ["Operador", "Administrador"]) {
    await abrir(rol);
    await page.getByLabel("Buscar usuario o actividad").fill("ceramica");
    await page.getByText("Senderismo", { exact: true }).waitFor({ state: "hidden" });
    await page.getByText("Taller de cerámica", { exact: true }).waitFor();
    await page.getByLabel("Buscar usuario o actividad").fill("perez");
    await page.getByText("Senderismo", { exact: true }).waitFor();
    await page.getByText("Taller de cerámica", { exact: true }).waitFor({ state: "hidden" });
    await page.getByLabel("Buscar usuario o actividad").fill("");

    await page.getByRole("button", { name: "Estado", exact: true }).click();
    await page.getByRole("checkbox", { name: "Todos" }).uncheck();
    await page.getByRole("checkbox", { name: "Pagado", exact: true }).check();
    await page.getByRole("button", { name: "Aplicar filtros" }).click();
    await page.getByText("Senderismo", { exact: true }).waitFor();
    assert.equal(await page.getByText("Taller de cerámica", { exact: true }).count(), 0);
    await page.getByRole("button", { name: "Estado", exact: true }).click();
    await page.getByRole("checkbox", { name: "Todos" }).check();
    await page.getByRole("button", { name: "Aplicar filtros" }).click();

    await page.getByRole("button", { name: "Método", exact: true }).click();
    await page.getByRole("checkbox", { name: "Todos" }).uncheck();
    await page.getByRole("checkbox", { name: "Bizum", exact: true }).check();
    await page.getByRole("button", { name: "Aplicar filtros" }).click();
    await page.getByText("Senderismo", { exact: true }).waitFor();
    assert.equal(await page.getByText("Lista de espera", { exact: true }).count(), 0);
    await page.getByRole("button", { name: "Método", exact: true }).click();
    await page.getByRole("checkbox", { name: "Todos" }).check();
    await page.getByRole("button", { name: "Aplicar filtros" }).click();

    const fechas = page.getByRole("button", { name: "Fecha de pago" });
    await fechas.click();
    await page.getByText("Página 1 de 2").waitFor();
    await page.getByRole("button", { name: "Siguiente" }).click();
    await page.getByText("Página 2 de 2").waitFor();
    await page.getByRole("button", { name: "Anterior" }).click();

    await page.getByRole("row", { name: "Ver pago de Ana García López" }).filter({ hasText: "Lista de espera" }).click();
    await page.getByRole("heading", { name: "Pago", exact: true }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Registrar pago" }).count(), 0);
    await page.getByRole("button", { name: "Cerrar", exact: true }).click();

    await page.getByRole("row", { name: "Ver pago de Ana García López" }).filter({ hasText: "Taller de cerámica" }).click();
    await page.getByRole("button", { name: "Registrar pago" }).click();
    await page.getByLabel("Método de pago", { exact: true }).selectOption("7");
    await page.getByLabel("Fecha de pago", { exact: true }).fill("2026-10-14");
    fallo = 409;
    await page.getByRole("button", { name: "Confirmar pago" }).click();
    await page.getByText("El pago no se puede registrar").waitFor();
    assert.equal(await page.getByRole("dialog").count(), 1);
    assert.equal(writes, 1);
    assert.deepEqual(latest, { id_estado_pago: 22, id_metodo_pago: 7, fechaPago: "2026-10-14" });
    assert.equal("precioAplicado" in latest, false);

    fallo = 0;
    writes = 0;
    const lecturasAntes = lecturas;
    await page.locator("form").evaluate((form) => {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    await page.getByRole("dialog").waitFor({ state: "detached" });
    assert.equal(writes, 1);
    assert.ok(lecturas > lecturasAntes);
    await page.getByRole("row", { name: "Ver pago de Ana García López" }).filter({ hasText: "Taller de cerámica" }).getByText("Pagado", { exact: true }).waitFor();

    await page.getByRole("row", { name: "Ver pago de Luis Pérez" }).click();
    await page.getByRole("button", { name: "Registrar devolución" }).click();
    writes = 0;
    await page.getByRole("button", { name: "Confirmar devolución" }).click();
    await page.getByRole("dialog").waitFor({ state: "detached" });
    assert.equal(writes, 1);
    assert.deepEqual(latest, { id_estado_pago: 33 });
    assert.deepEqual(Object.keys(latest), ["id_estado_pago"]);
    console.log(`PASS ${rol}: filtros, cobro, devolución, espera, conflicto y listado`);
  }
} finally {
  await browser.close();
}
