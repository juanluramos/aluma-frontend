import test from "node:test";
import assert from "node:assert/strict";
import { API_URL, session } from "../src/services/authService.ts";
import { activarInscripcion, createInscripcion, getInscripciones, InscripcionApiError, registrarDevolucionInscripcion, registrarPagoInscripcion, updateInscripcion } from "../src/services/inscripcionService.ts";
import type { InscripcionPayload } from "../src/utils/inscripcionFormPayload.ts";
import type { Inscripcion } from "../src/types/inscripcion.ts";

const originalFetch = globalThis.fetch;

const inscripcion: Inscripcion = {
  id_inscripcion: 4,
  id_usuario: 1,
  id_actividad: 2,
  precioAplicado: "25.00",
  id_estado_pago: 1,
  id_estado_inscripcion: 1,
  id_metodo_pago: null,
  apuntadoFecha: "2026-10-01T00:00:00.000Z",
  fechaPago: null,
  comentario: null,
  createAt: "2026-10-01T10:00:00.000Z",
  updateAt: "2026-10-01T10:00:00.000Z",
  posicionEspera: null,
  plazasOcupadas: 0,
  plazasDisponibles: null,
  aforo: null,
  puedePromocionar: false,
  Usuario: {
    id_usuario: 1,
    nombre: "Ana",
    apellido1: "García",
    apellido2: null,
  },
  Actividad: {
    id_actividad: 2,
    titulo: "Taller",
  },
};

function tokenAdmin(): string {
  const payload = {
    rol: "Administrador",
    id_usuario: 1,
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
  };
  return `header.${Buffer.from(JSON.stringify(payload)).toString("base64")}.signature`;
}

function instalarFetch(
  handler: (url: string, init?: RequestInit) => Response,
): { urls: string[]; methods: string[]; authorization: Array<string | null> } {
  const urls: string[] = [];
  const methods: string[] = [];
  const authorization: Array<string | null> = [];

  globalThis.fetch = (async (input, init) => {
    const url = String(input);
    const method = (init?.method ?? "GET").toUpperCase();
    const headers = new Headers(init?.headers);
    urls.push(url);
    methods.push(method);
    authorization.push(headers.get("Authorization"));

    if (url.endsWith("/auth/login") || url.endsWith("/auth/refresh")) {
      return Response.json({ token: tokenAdmin() });
    }
    if (url.endsWith("/auth/logout")) {
      return new Response(null, { status: 204 });
    }

    return handler(url, init);
  }) as typeof fetch;

  return { urls, methods, authorization };
}

test.before(async () => {
  instalarFetch(() => Response.json([]));
  await session.login("admin@example.test", "login-test");
});

test.after(() => {
  globalThis.fetch = originalFetch;
});

test("GET /inscripciones devuelve el listado tipado", async () => {
  const llamadas = instalarFetch(() => Response.json([inscripcion]));
  const datos = await getInscripciones();

  assert.deepEqual(datos, [inscripcion]);
  assert.equal(llamadas.urls.at(-1), `${API_URL}/inscripciones`);
  assert.equal(llamadas.methods.at(-1), "GET");
  assert.ok(llamadas.authorization.at(-1)?.startsWith("Bearer "));
});

test("Un error HTTP usa el mensaje del servidor", async () => {
  instalarFetch(() => Response.json(
    { message: "No tienes permisos para consultar esta inscripción", code: "FORBIDDEN" },
    { status: 403 },
  ));

  await assert.rejects(
    () => getInscripciones(),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.equal(error.message, "No tienes permisos para consultar esta inscripción");
      return true;
    },
  );
});

const alta: InscripcionPayload = {
  id_usuario: 9,
  id_actividad: 12,
  id_estado_pago: 1,
  apuntadoFecha: "2026-10-14",
  comentario: "Primera clase",
};

test("POST /inscripciones crea sin precio ni datos de cobro y el GET siguiente conserva las relaciones", async () => {
  const cuerpos: string[] = [];
  const llamadas = instalarFetch((_url, init) => {
    const method = (init?.method ?? "GET").toUpperCase();
    if (method === "POST") {
      cuerpos.push(String(init?.body ?? ""));
      return Response.json({ id_inscripcion: 8 }, { status: 201 });
    }
    return Response.json([inscripcion]);
  });

  const creada = await createInscripcion(alta);
  assert.equal(creada.id_estado_inscripcion, null);
  const listado = await getInscripciones();

  assert.deepEqual(JSON.parse(cuerpos[0] ?? ""), alta);
  assert.equal(Object.hasOwn(JSON.parse(cuerpos[0] ?? ""), "precioAplicado"), false);
  assert.deepEqual(llamadas.methods.slice(-2), ["POST", "GET"]);
  assert.equal(llamadas.urls.at(-2), `${API_URL}/inscripciones`);
  assert.equal(listado[0]?.Usuario?.nombre, "Ana");
  assert.equal(listado[0]?.Actividad?.titulo, "Taller");
});

test("El alta devuelve el estado cuando el aforo deja la inscripción en espera", async () => {
  instalarFetch(() => Response.json({ id_inscripcion: 8, id_estado_inscripcion: 17 }, { status: 201 }));

  const creada = await createInscripcion(alta);

  assert.equal(creada.id_estado_inscripcion, 17);
});

test("Un 403 de alta conserva el mensaje del servidor", async () => {
  instalarFetch(() => Response.json(
    { message: "No puedes crear una inscripcion para otro usuario", code: "FORBIDDEN" },
    { status: 403 },
  ));

  await assert.rejects(
    () => createInscripcion(alta),
    (error: unknown) => {
      assert.ok(error instanceof InscripcionApiError);
      assert.equal(error.status, 403);
      assert.equal(error.message, "No puedes crear una inscripcion para otro usuario");
      return true;
    },
  );
});

test("Un 409 de alta muestra el conflicto y un 400 reparte los errores de campo", async () => {
  instalarFetch(() => Response.json(
    { message: "El usuario ya tiene una inscripción activa para esta actividad", code: "ACTIVE_ENROLLMENT_ALREADY_EXISTS" },
    { status: 409 },
  ));

  await assert.rejects(
    () => createInscripcion(alta),
    (error: unknown) => {
      assert.ok(error instanceof InscripcionApiError);
      assert.equal(error.message, "El usuario ya tiene una inscripción activa para esta actividad");
      return true;
    },
  );

  instalarFetch(() => Response.json({
    message: "Datos no válidos",
    code: "VALIDATION_ERROR",
    errors: [{ path: ["id_actividad"], message: "Selecciona una actividad." }],
  }, { status: 400 }));

  await assert.rejects(
    () => createInscripcion(alta),
    (error: unknown) => {
      assert.ok(error instanceof InscripcionApiError);
      assert.equal(error.message, "Datos no válidos");
      assert.equal(error.errores.id_actividad, "Selecciona una actividad.");
      return true;
    },
  );
});

test("Un alta sin JSON usa el mensaje por defecto", async () => {
  instalarFetch(() => new Response("fallo", { status: 500 }));

  await assert.rejects(
    () => createInscripcion(alta),
    (error: unknown) => {
      assert.ok(error instanceof InscripcionApiError);
      assert.equal(error.message, "No se pudo completar la operación. Inténtalo de nuevo.");
      return true;
    },
  );
});

test("PUT /inscripciones/:id envía solo el comentario y conserva el error HTTP", async () => {
  const cuerpos: string[] = [];
  const llamadas = instalarFetch((_url, init) => {
    cuerpos.push(String(init?.body ?? ""));
    return Response.json(inscripcion);
  });

  await updateInscripcion(4, { comentario: "Nota revisada" });

  const cuerpo = JSON.parse(cuerpos[0] ?? "") as Record<string, unknown>;
  assert.deepEqual(cuerpo, { comentario: "Nota revisada" });
  assert.deepEqual(Object.keys(cuerpo), ["comentario"]);
  assert.equal(llamadas.methods.at(-1), "PUT");
  assert.equal(llamadas.urls.at(-1), `${API_URL}/inscripciones/4`);
  assert.ok(llamadas.authorization.at(-1)?.startsWith("Bearer "));

  instalarFetch(() => Response.json(
    { message: "El historial contable requiere revisión", code: "INCONSISTENT_ACCOUNTING_HISTORY" },
    { status: 409 },
  ));
  await assert.rejects(
    () => updateInscripcion(4, { comentario: "Nota revisada" }),
    (error: unknown) => {
      assert.ok(error instanceof InscripcionApiError);
      assert.equal(error.status, 409);
      assert.equal(error.message, "El historial contable requiere revisión");
      return true;
    },
  );

  instalarFetch(() => Response.json({
    message: "Datos no válidos",
    errors: [{ path: ["comentario"], message: "Comentario rechazado" }],
  }, { status: 400 }));
  await assert.rejects(
    () => updateInscripcion(4, { comentario: null }),
    (error: unknown) => {
      assert.ok(error instanceof InscripcionApiError);
      assert.equal(error.errores.comentario, "Comentario rechazado");
      return true;
    },
  );

  instalarFetch(() => Response.json({}, { status: 403 }));
  await assert.rejects(
    () => updateInscripcion(4, { comentario: "Nota" }),
    (error: unknown) => {
      assert.ok(error instanceof InscripcionApiError);
      assert.equal(error.message, "No tienes permiso para editar inscripciones.");
      return true;
    },
  );
});

test("PUT de cobro envía solo estado, método y fecha", async () => {
  const cuerpos: string[] = [];
  const llamadas = instalarFetch((_url, init) => {
    cuerpos.push(String(init?.body ?? ""));
    return Response.json(inscripcion);
  });

  await registrarPagoInscripcion(4, {
    id_estado_pago: 22,
    id_metodo_pago: 7,
    fechaPago: "2026-10-14",
  });

  const cuerpo = JSON.parse(cuerpos[0] ?? "") as Record<string, unknown>;
  assert.deepEqual(cuerpo, {
    id_estado_pago: 22,
    id_metodo_pago: 7,
    fechaPago: "2026-10-14",
  });
  assert.deepEqual(Object.keys(cuerpo), ["id_estado_pago", "id_metodo_pago", "fechaPago"]);
  assert.equal(llamadas.methods.at(-1), "PUT");
  assert.equal(llamadas.urls.at(-1), `${API_URL}/inscripciones/4`);

  const rechazos = [
    [400, { message: "La fecha de pago es obligatoria" }, "La fecha de pago es obligatoria"],
    [403, {}, "No tienes permiso para registrar pagos."],
    [409, { message: "La inscripción ya no está pendiente" }, "La inscripción ya no está pendiente"],
  ] as const;

  for (const [status, json, mensaje] of rechazos) {
    instalarFetch(() => Response.json(json, { status }));
    await assert.rejects(
      () => registrarPagoInscripcion(4, {
        id_estado_pago: 22,
        id_metodo_pago: 7,
        fechaPago: "2026-10-14",
      }),
      (error: unknown) => {
        assert.ok(error instanceof InscripcionApiError);
        assert.equal(error.status, status);
        assert.equal(error.message, mensaje);
        return true;
      },
    );
  }
});

test("PUT de devolución envía solo el estado Devolución", async () => {
  const cuerpos: string[] = [];
  const llamadas = instalarFetch((_url, init) => {
    cuerpos.push(String(init?.body ?? ""));
    return Response.json(inscripcion);
  });

  await registrarDevolucionInscripcion(4, { id_estado_pago: 33 });

  const cuerpo = JSON.parse(cuerpos[0] ?? "") as Record<string, unknown>;
  assert.deepEqual(cuerpo, { id_estado_pago: 33 });
  assert.deepEqual(Object.keys(cuerpo), ["id_estado_pago"]);
  assert.equal(llamadas.methods.at(-1), "PUT");
  assert.equal(llamadas.urls.at(-1), `${API_URL}/inscripciones/4`);

  const rechazos = [
    [400, { message: "La devolución no es válida" }, "La devolución no es válida"],
    [403, {}, "No tienes permiso para registrar devoluciones."],
    [409, { message: "El historial contable requiere revisión" }, "El historial contable requiere revisión"],
  ] as const;

  for (const [status, json, mensaje] of rechazos) {
    instalarFetch(() => Response.json(json, { status }));
    await assert.rejects(
      () => registrarDevolucionInscripcion(4, { id_estado_pago: 33 }),
      (error: unknown) => {
        assert.ok(error instanceof InscripcionApiError);
        assert.equal(error.status, status);
        assert.equal(error.message, mensaje);
        return true;
      },
    );
  }
});

test("Un 401 de cobro informa de que la sesión ha caducado", async () => {
  const ventana = globalThis.window;
  globalThis.window = { dispatchEvent() {} } as unknown as Window & typeof globalThis;
  instalarFetch(() => Response.json({ message: "Sesión no válida" }, { status: 401 }));
  try {
    await assert.rejects(
      () => registrarPagoInscripcion(4, {
        id_estado_pago: 22,
        id_metodo_pago: 7,
        fechaPago: "2026-10-14",
      }),
      (error: unknown) => {
        assert.ok(error instanceof InscripcionApiError);
        assert.equal(error.status, 401);
        assert.equal(error.message, "Tu sesión ha caducado. Vuelve a iniciar sesión.");
        return true;
      },
    );
  } finally {
    if (ventana === undefined) Reflect.deleteProperty(globalThis, "window");
    else globalThis.window = ventana;
    instalarFetch(() => Response.json([]));
    await session.login("admin@example.test", "login-test");
  }
});

test("PATCH de activación no envía cuerpo", async () => {
  const llamadas = instalarFetch((_url, init) => {
    assert.equal(init?.body, undefined);
    return new Response(null, { status: 200 });
  });

  await activarInscripcion(4);

  assert.equal(llamadas.methods.at(-1), "PATCH");
  assert.equal(llamadas.urls.at(-1), `${API_URL}/inscripciones/4/activar`);

  instalarFetch(() => Response.json({ message: "No hay plaza disponible" }, { status: 409 }));
  await assert.rejects(
    () => activarInscripcion(4),
    (error: unknown) => {
      assert.ok(error instanceof InscripcionApiError);
      assert.equal(error.status, 409);
      assert.equal(error.message, "No hay plaza disponible");
      return true;
    },
  );
});

test("Un error sin JSON usa el mensaje por defecto", async () => {
  instalarFetch(() => new Response("fallo", { status: 500 }));

  await assert.rejects(
    () => getInscripciones(),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.equal(error.message, "Error al obtener las inscripciones");
      return true;
    },
  );
});
