import test from 'node:test';
import assert from 'node:assert/strict';
import { hasPermission, permissions, type Rol } from '../src/auth/permissions.ts';
import { SessionClient } from '../src/services/sessionClient.ts';

test('Matriz de permisos por rol y denegación sin rol', () => {
  for (const permission of Object.keys(permissions) as (keyof typeof permissions)[]) {
    assert.equal(hasPermission('Administrador', permission), true);
    assert.equal(hasPermission(null, permission), false);
    assert.equal(hasPermission(undefined, permission), false);
  }
  for (const permission of ['verUsuarios', 'crearUsuarios', 'editarUsuarios', 'gestionarActividades', 'gestionarInscripciones'] as const) {
    assert.equal(hasPermission('Usuario', permission), false);
    assert.equal(hasPermission('Operador', permission), true);
  }
  for (const role of ['Usuario', 'Operador'] as Rol[]) {
    assert.equal(hasPermission(role, 'cambiarEstadoUsuario'), false);
    assert.equal(hasPermission(role, 'verContabilidad'), false);
  }
});

test('Rol compartido: login, renovación, rol desconocido y cierre', async () => {
  let role = 'Operador';
  const client = new SessionClient({ baseUrl: '/api', fetch: async () => Response.json({ token: `header.${btoa(JSON.stringify({ rol: role, exp: Date.now() / 1000 + 900 }))}.signature` }) });
  let changes = 0;
  const unsubscribe = client.subscribe(() => changes++);
  assert.equal(client.getRole(), null);
  await client.login('user', 'pass');
  assert.equal(client.getRole(), 'Operador');
  role = 'Usuario'; await client.refresh();
  assert.equal(client.getRole(), 'Usuario');
  role = 'Root'; await client.refresh();
  assert.equal(client.getRole(), null);
  role = 'Administrador'; await client.refresh();
  client.expire();
  assert.equal(client.getRole(), null);
  assert.equal(changes, 5);
  unsubscribe();
});

test('Restaurar sesión obtiene el rol sin login adicional', async () => {
  const client = new SessionClient({ baseUrl: '/api', fetch: async () => Response.json({ token: `header.${btoa(JSON.stringify({ rol: 'Usuario' }))}.signature` }) });
  await client.restore();
  assert.equal(client.getRole(), 'Usuario');
});
