import test from 'node:test';
import assert from 'node:assert/strict';
import { API_URL, session } from '../src/services/authService.ts';
import { deleteUsuario } from '../src/services/usuarioService.ts';

type FetchCall = {
  url: string;
  method: string;
  authorization: string | null;
};

const originalFetch = globalThis.fetch;
const calls: FetchCall[] = [];
let jsonReads = 0;

function tokenAdmin(): string {
  const payload = {
    rol: 'Administrador',
    id_usuario: 1,
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
  };
  return `header.${Buffer.from(JSON.stringify(payload)).toString('base64')}.signature`;
}

function instalarFetch(
  handler: (url: string, init?: RequestInit) => Response,
): void {
  calls.length = 0;
  jsonReads = 0;
  globalThis.fetch = (async (input, init) => {
    const url = String(input);
    const method = (init?.method ?? 'GET').toUpperCase();
    const headers = new Headers(init?.headers);
    calls.push({
      url,
      method,
      authorization: headers.get('Authorization'),
    });

    if (url.endsWith('/auth/login') || url.endsWith('/auth/refresh')) {
      return Response.json({ token: tokenAdmin() });
    }
    if (url.endsWith('/auth/logout')) {
      return new Response(null, { status: 204 });
    }

    const response = handler(url, init);
    const originalJson = response.json.bind(response);
    response.json = async () => {
      jsonReads += 1;
      return originalJson();
    };
    return response;
  }) as typeof fetch;
}

test.before(async () => {
  instalarFetch(() => new Response(null, { status: 204 }));
  await session.login('admin@example.test', 'login-test');
});

test.after(() => {
  globalThis.fetch = originalFetch;
});

test('DELETE correcto con respuesta 204', async () => {
  instalarFetch(() => new Response(null, { status: 204 }));
  await assert.doesNotReject(() => deleteUsuario(42));
});

test('URL y método HTTP correctos', async () => {
  instalarFetch(() => new Response(null, { status: 204 }));
  await deleteUsuario(7);
  const borrado = calls.find(call => call.method === 'DELETE');
  assert.ok(borrado);
  assert.equal(borrado.url, `${API_URL}/usuarios/7`);
  assert.equal(borrado.method, 'DELETE');
});

test('Usa autenticación', async () => {
  instalarFetch(() => new Response(null, { status: 204 }));
  await deleteUsuario(3);
  const borrado = calls.find(call => call.method === 'DELETE');
  assert.ok(borrado?.authorization?.startsWith('Bearer '));
});

test('No interpreta JSON en respuesta 204', async () => {
  instalarFetch(() => new Response(null, { status: 204 }));
  await deleteUsuario(42);
  assert.equal(jsonReads, 0);
});

async function assertError(
  status: number,
  code: string,
  message: string,
): Promise<void> {
  instalarFetch(() => Response.json({ message, code }, { status }));
  await assert.rejects(
    () => deleteUsuario(99),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.equal(error.message, message);
      assert.equal((error as Error & { code?: string }).code, code);
      return true;
    },
  );
}

test('Error 403 SELF_DELETION_FORBIDDEN', async () => {
  await assertError(
    403,
    'SELF_DELETION_FORBIDDEN',
    'No puedes eliminar tu propia cuenta',
  );
});

test('Error 403 FORBIDDEN', async () => {
  await assertError(
    403,
    'FORBIDDEN',
    'No tienes permisos para realizar esta operación',
  );
});

test('Error 404 USER_NOT_FOUND', async () => {
  await assertError(404, 'USER_NOT_FOUND', 'Usuario no encontrado');
});

test('Error 409 FOREIGN_KEY_CONSTRAINT', async () => {
  await assertError(
    409,
    'FOREIGN_KEY_CONSTRAINT',
    'La operación incumple una relación entre datos',
  );
});
