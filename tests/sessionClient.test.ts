import test from 'node:test';
import assert from 'node:assert/strict';
import { SessionClient, IDLE_MS } from '../src/services/sessionClient.ts';

const initial = new Date('2026-10-09T10:00:00Z').getTime();
function fixture() {
  let now = initial;
  let expired = 0;
  let refreshStatus = 200;
  let protectedStatus = 200;
  let serial = 0;
  const calls: { path: string; headers: Headers; at: number }[] = [];
  let release: (() => void) | undefined;
  let gate: Promise<void> | undefined;
  const token = () => `header.${btoa(JSON.stringify({ exp: Math.floor(now / 1000) + 900, serial: serial++ }))}.signature`;
  const fetcher = async (url: string | URL | Request, init?: RequestInit) => {
    const path = String(url);
    calls.push({ path, headers: new Headers(init?.headers), at: now });
    if (path.endsWith('/refresh')) {
      await gate;
      return Response.json(refreshStatus === 200 ? { token: token() } : { code: 'SESSION_EXPIRED' }, { status: refreshStatus });
    }
    if (path.endsWith('/login')) return Response.json({ token: token() });
    if (path.endsWith('/logout')) return new Response(null, { status: 204 });
    return Response.json({}, { status: protectedStatus });
  };
  const client = new SessionClient({ baseUrl: '/api', fetch: fetcher, now: () => now, onExpired: () => { expired++; } });
  return {
    client, calls, setTime: (value: number) => { now = initial + value; }, expired: () => expired,
    refreshStatus: (value: number) => { refreshStatus = value; }, protectedStatus: (value: number) => { protectedStatus = value; },
    block: () => { gate = new Promise<void>(resolve => { release = resolve; }); }, release: () => release?.(),
  };
}

test('Actividad a 10:30,11:00,11:40 mantiene sesion hasta 12:40', async () => {
  const f = fixture(); await f.client.login('user', 'pass');
  for (const minute of [30, 60, 100]) {
    f.setTime(minute * 60_000); f.client.activity(); await f.client.syncActivity();
    assert.equal((await f.client.authenticatedFetch('/usuarios')).status, 200);
  }
  f.setTime(160 * 60_000 - 1); assert(f.client.checkIdle());
  f.setTime(160 * 60_000); assert.equal(f.client.checkIdle(), false);
  assert.equal(f.client.getToken(), null); assert.equal(f.expired(), 1);
  await assert.rejects(f.client.authenticatedFetch('/dashboard'));
  await assert.rejects(f.client.restore());
  f.client.activity(); assert.equal(f.client.getToken(), null);
});

test('Peticiones de fondo y renovaciones de JWT no amplian inactividad', async () => {
  const f = fixture(); await f.client.login('user', 'pass');
  for (const minute of [16, 32, 48]) {
    f.setTime(minute * 60_000); await f.client.authenticatedFetch('/dashboard'); await f.client.syncActivity();
  }
  assert(f.calls.filter(c => c.path.endsWith('/refresh')).every(c => c.headers.get('X-Aluma-Activity') === '0'));
  f.setTime(IDLE_MS); assert.equal(f.client.checkIdle(), false);
});

test('Peticiones paralelas comparten una unica renovacion', async () => {
  const f = fixture(); await f.client.login('user', 'pass'); f.setTime(16 * 60_000); f.block();
  const promises = Array.from({ length: 8 }, () => f.client.authenticatedFetch('/usuarios'));
  assert.equal(f.calls.filter(c => c.path.endsWith('/refresh')).length, 1);
  f.release(); await Promise.all(promises);
  assert.equal(f.calls.filter(c => c.path.endsWith('/usuarios')).length, 8);
});

test('401 no renovable limpia token; 401 persistente solo reintenta una vez', async () => {
  const f = fixture(); await f.client.login('user', 'pass');
  f.protectedStatus(401); f.refreshStatus(401);
  await assert.rejects(f.client.authenticatedFetch('/usuarios'));
  assert.equal(f.client.getToken(), null); assert.equal(f.expired(), 1);
  const other = fixture(); await other.client.login('user', 'pass'); other.protectedStatus(401);
  assert.equal((await other.client.authenticatedFetch('/usuarios')).status, 401);
  assert.equal(other.expired(), 1);
  assert.equal(other.calls.filter(c => c.path.endsWith('/usuarios')).length, 2);
});

test('Logout durante renovacion no restaura credenciales con respuesta tardia', async () => {
  const f = fixture(); await f.client.login('user', 'pass'); f.block();
  const refreshing = f.client.refresh().catch(() => {});
  const logout = f.client.logout();
  assert.equal(f.client.getToken(), null);
  f.release(); await refreshing; await logout;
  assert.equal(f.client.getToken(), null); assert(f.client.isExpired());
});

test('Reabrir pagina tras 60 minutos no renueva; cookie expirada tampoco', async () => {
  const f = fixture(); f.client.shareActivity(initial); f.setTime(IDLE_MS);
  await assert.rejects(f.client.restore()); assert.equal(f.calls.length, 0);
  const other = fixture(); other.refreshStatus(401);
  await assert.rejects(other.client.restore()); assert(other.client.isExpired());
});

test('Comunica la edad del ultimo evento, no la hora del temporizador', async () => {
  const f = fixture(); await f.client.login('user', 'pass');
  f.setTime(10_000); f.client.activity();
  f.setTime(30_000); await f.client.syncActivity();
  const call = f.calls.find(c => c.path.endsWith('/refresh'))!;
  assert.equal(call.headers.get('X-Aluma-Activity-Age'), '20000');
  await f.client.syncActivity();
  assert.equal(f.calls.filter(c => c.path.endsWith('/refresh')).length, 1);
});

test('Una renovacion en segundo plano no retrasa actividad cerca de los 60 minutos', async () => {
  const f = fixture(); await f.client.login('user', 'pass');
  f.setTime(59 * 60_000 + 45_000); await f.client.refresh(false);
  f.setTime(59 * 60_000 + 50_000); f.client.activity(); await f.client.syncActivity();
  assert.equal(f.calls.at(-1)!.headers.get('X-Aluma-Activity'), '1');
  f.setTime(61 * 60_000); assert(f.client.checkIdle());
});

test('Recargar una pagina aun activa cuenta como navegacion, no revive una caducada', async () => {
  const f = fixture(); f.client.shareActivity(initial); f.setTime(59 * 60_000);
  await f.client.restore();
  f.setTime(61 * 60_000); assert(f.client.checkIdle());
  f.setTime(119 * 60_000); assert.equal(f.client.checkIdle(), false);
});

test('Ocultar la pestaña envia la ultima actividad pendiente sin inventar actividad', async () => {
  const f = fixture(); await f.client.login('user', 'pass');
  f.setTime(10_000); f.client.activity();
  f.setTime(12_000); await f.client.syncActivity(true);
  const call = f.calls.at(-1)!;
  assert.equal(call.headers.get('X-Aluma-Activity-Age'), '2000');
  const count = f.calls.length;
  await f.client.syncActivity(true);
  assert.equal(f.calls.length, count);
});
