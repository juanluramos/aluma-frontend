import test from "node:test";
import assert from "node:assert/strict";
import { API_URL, session } from "../src/services/authService.ts";
import { getEstadosInscripcion } from "../src/services/catalogoPagoService.ts";

const originalFetch = globalThis.fetch;

function tokenUsuario(): string {
  const payload = {
    rol: "Usuario",
    id_usuario: 7,
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
  };
  return `header.${Buffer.from(JSON.stringify(payload)).toString("base64")}.signature`;
}

test("GET /estados-inscripcion devuelve el catálogo y explica el fallo", async () => {
  const urls: string[] = [];
  globalThis.fetch = (async (input, init) => {
    const url = String(input);
    urls.push(url);
    if (url.endsWith("/auth/login") || url.endsWith("/auth/refresh")) {
      return Response.json({ token: tokenUsuario() });
    }
    if (url.endsWith("/estados-inscripcion") && (init?.method ?? "GET") === "GET") {
      return Response.json([
        { id_estado_inscripcion: 15, nombre: "Activa" },
        { id_estado_inscripcion: 16, nombre: "Cerrada" },
      ]);
    }
    return Response.json({ message: "No disponible" }, { status: 403 });
  }) as typeof fetch;

  try {
    await session.login("usuario@example.test", "login-test");
    assert.deepEqual(await getEstadosInscripcion(), [
      { id_estado_inscripcion: 15, nombre: "Activa" },
      { id_estado_inscripcion: 16, nombre: "Cerrada" },
    ]);
    assert.equal(urls.at(-1), `${API_URL}/estados-inscripcion`);

    globalThis.fetch = (async (input) => {
      const url = String(input);
      if (url.endsWith("/auth/login") || url.endsWith("/auth/refresh")) {
        return Response.json({ token: tokenUsuario() });
      }
      return new Response("fallo", { status: 500 });
    }) as typeof fetch;
    await assert.rejects(
      () => getEstadosInscripcion(),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.equal(error.message, "No se pudieron cargar los estados de inscripción.");
        return true;
      },
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
