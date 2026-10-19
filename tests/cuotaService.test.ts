import test from "node:test";
import assert from "node:assert/strict";
import { API_URL, session } from "../src/services/authService.ts";
import { createCuota, CuotaApiError, deleteCuota, updateCuota, type Cuota } from "../src/services/cuotaService.ts";

const originalFetch = globalThis.fetch;

const cuota: Cuota = {
  id_cuota: 8,
  id_usuario: 15,
  pagoAnio: 2026,
  fechaPago: "2026-10-19",
  importePagado: "30.00",
  comentario: "Nota",
  createAt: "2026-10-19T10:00:00.000Z",
  updateAt: "2026-10-19T10:00:00.000Z",
    Usuario: { id_usuario: 15, codUsuario: "ALU15", nombre: "Ana", apellido1: "García", apellido2: null },
};

function tokenAdmin(): string {
  const payload = {
    rol: "Administrador",
    id_usuario: 1,
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
  };
  return `header.${Buffer.from(JSON.stringify(payload)).toString("base64")}.signature`;
}

function instalarFetch(handler: (url: string, init?: RequestInit) => Response) {
  const llamadas: Array<{ url: string; method: string; body: string | null }> = [];
  globalThis.fetch = (async (input, init) => {
    const url = String(input);
    const method = (init?.method ?? "GET").toUpperCase();
    const body = typeof init?.body === "string" ? init.body : null;
    llamadas.push({ url, method, body });
    if (url.endsWith("/auth/login") || url.endsWith("/auth/refresh")) {
      return Response.json({ token: tokenAdmin() });
    }
    if (url.endsWith("/auth/logout")) return new Response(null, { status: 204 });
    return handler(url, init);
  }) as typeof fetch;
  return llamadas;
}

test.before(async () => {
  instalarFetch(() => Response.json([]));
  await session.login("admin@example.test", "login-test");
});

test.after(() => {
  globalThis.fetch = originalFetch;
});

test("POST /cuotas envía el alta y devuelve la cuota", async () => {
  const llamadas = instalarFetch(() => Response.json(cuota, { status: 201 }));
  const creada = await createCuota({ id_usuario: 15, pagoAnio: 2026, fechaPago: "2026-10-19", comentario: "Nota" });
  assert.deepEqual(creada, cuota);
  assert.equal(llamadas.at(-1)?.url, `${API_URL}/cuotas`);
  assert.equal(llamadas.at(-1)?.method, "POST");
  assert.deepEqual(JSON.parse(llamadas.at(-1)?.body ?? "{}"), {
    id_usuario: 15,
    pagoAnio: 2026,
    fechaPago: "2026-10-19",
    comentario: "Nota",
  });
});

test("PUT /cuotas/:id envía la edición y un 409 conserva el mensaje controlado", async () => {
  const llamadas = instalarFetch(() => Response.json({ ...cuota, pagoAnio: 2024 }, { status: 200 }));
  const actualizada = await updateCuota(8, {
    id_usuario: 15,
    pagoAnio: 2024,
    fechaPago: "2026-10-19",
    comentario: "Nota revisada",
  });
  assert.equal(actualizada.pagoAnio, 2024);
  assert.equal(llamadas.at(-1)?.url, `${API_URL}/cuotas/8`);
  assert.equal(llamadas.at(-1)?.method, "PUT");
  assert.deepEqual(JSON.parse(llamadas.at(-1)?.body ?? "{}"), {
    id_usuario: 15,
    pagoAnio: 2024,
    fechaPago: "2026-10-19",
    comentario: "Nota revisada",
  });

  instalarFetch(() => Response.json(
    { message: "detalle interno que no debe usarse", code: "CUOTA_DUPLICADA" },
    { status: 409 },
  ));
  await assert.rejects(
    () => updateCuota(8, { id_usuario: 15, pagoAnio: 2026 }),
    (error: unknown) => {
      assert.ok(error instanceof CuotaApiError);
      assert.equal(error.status, 409);
      assert.equal(error.code, "CUOTA_DUPLICADA");
      assert.equal(error.message, "Este usuario ya tiene una cuota registrada para ese año.");
      return true;
    },
  );
});

test("DELETE /cuotas/:id acepta 204 sin leer JSON y oculta el error interno", async () => {
  let jsonLlamado = false;
  const llamadas = instalarFetch(() => {
    const respuesta = new Response(null, { status: 204 });
    const leer = respuesta.json.bind(respuesta);
    respuesta.json = () => {
      jsonLlamado = true;
      return leer();
    };
    return respuesta;
  });
  await deleteCuota(8);
  assert.equal(jsonLlamado, false);
  assert.equal(llamadas.at(-1)?.url, `${API_URL}/cuotas/8`);
  assert.equal(llamadas.at(-1)?.method, "DELETE");

  instalarFetch(() => Response.json(
    { message: "PrismaClientKnownRequestError en /var/secret", code: "INTERNAL_SERVER_ERROR" },
    { status: 500 },
  ));
  await assert.rejects(
    () => deleteCuota(8),
    (error: unknown) => {
      assert.ok(error instanceof CuotaApiError);
      assert.equal(error.status, 500);
      assert.equal(error.message, "No se pudo eliminar la cuota. Inténtalo de nuevo.");
      assert.equal(error.message.includes("secret"), false);
      return true;
    },
  );
});

test("409 CUOTA_DUPLICADA muestra el mensaje de año repetido", async () => {
  instalarFetch(() => Response.json(
    { message: "detalle interno que no debe usarse", code: "CUOTA_DUPLICADA" },
    { status: 409 },
  ));
  await assert.rejects(
    () => createCuota({ id_usuario: 15, pagoAnio: 2026 }),
    (error: unknown) => {
      assert.ok(error instanceof CuotaApiError);
      assert.equal(error.status, 409);
      assert.equal(error.code, "CUOTA_DUPLICADA");
      assert.equal(error.message, "Este usuario ya tiene una cuota registrada para ese año.");
      return true;
    },
  );
});

test("400 reparte los errores de campo y 500 no expone el detalle interno", async () => {
  instalarFetch(() => Response.json({
    message: "Datos no válidos",
    code: "VALIDATION_ERROR",
    errors: [{ path: ["pagoAnio"], message: "El año de la cuota debe ser un entero entre 1970 y 2100." }],
  }, { status: 400 }));
  await assert.rejects(
    () => createCuota({ id_usuario: 15, pagoAnio: 1800 }),
    (error: unknown) => {
      assert.ok(error instanceof CuotaApiError);
      assert.equal(error.errores.pagoAnio, "El año de la cuota debe ser un entero entre 1970 y 2100.");
      assert.equal(error.message, "Datos no válidos");
      return true;
    },
  );

  instalarFetch(() => Response.json(
    { message: "PrismaClientKnownRequestError en /var/secret", code: "INTERNAL_SERVER_ERROR" },
    { status: 500 },
  ));
  await assert.rejects(
    () => createCuota({ id_usuario: 15, pagoAnio: 2026 }),
    (error: unknown) => {
      assert.ok(error instanceof CuotaApiError);
      assert.equal(error.message, "No se pudo guardar la cuota. Inténtalo de nuevo.");
      assert.equal(error.message.includes("secret"), false);
      return true;
    },
  );
});
