import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const base = process.env.ALUMA_TEST_BASE ?? 'http://127.0.0.1:5174';
const browser = await chromium.launch({ headless: true, channel: process.env.ALUMA_TEST_BROWSER ?? "chrome" });
try {
  for (const rol of ['Usuario', 'Operador', 'Administrador']) {
    const page = await browser.newPage();
    let fallo = 0;
    let writes = 0;
    let latest;
    let lista = [{ id_actividad: 1, titulo: 'Taller', fecha: '2026-10-14T00:00:00.000Z', aforo: 20, plazasOcupadas: 0, plazasDisponibles: 20, personasEnEspera: 0, importeSocio: '0.00', importeNoSocio: '12.50', id_estado_actividad: 1, comentario: 'Notas' }];
    await page.route('**/api/**', async route => {
      const request = route.request();
      const url = new URL(request.url());
      assert.ok(!url.pathname.includes('/api/api/'));
      if (url.pathname.includes('/auth/')) {
        return route.fulfill({ json: { token: `header.${Buffer.from(JSON.stringify({ rol, id_usuario: 1, exp: Date.now() / 1000 + 3600 })).toString('base64')}.signature` } });
      }
      if (request.method() === 'GET') return route.fulfill({ json: lista });
      writes++;
      latest = { method: request.method(), path: url.pathname, body: request.postDataJSON() };
      await new Promise(resolve => setTimeout(resolve, 150));
      if (fallo === 409) {
        return route.fulfill({
          status: 409,
          json: {
            message: 'No puedes reducir el aforo a 2 plazas porque actualmente hay 3 ocupadas.',
            code: 'AFORO_INSUFICIENTE',
          },
        });
      }
      if (fallo) return route.fulfill({ status: fallo, json: { message: 'Error de prueba', errors: [{ path: ['titulo'], message: 'Título rechazado' }] } });
      const previo = request.method() === 'PUT' ? lista.find(old => old.id_actividad === 1) : {};
      const item = { plazasOcupadas: 0, plazasDisponibles: null, personasEnEspera: 0, ...previo, ...latest.body, id_actividad: request.method() === 'POST' ? 2 : 1 };
      lista = request.method() === 'POST' ? [...lista, item] : lista.map(old => old.id_actividad === 1 ? item : old);
      return route.fulfill({ status: request.method() === 'POST' ? 201 : 200, json: item });
    });
    await page.goto(`${base}/tests/actividadesForm.browser.html`);
    await page.getByText('Taller', { exact: true }).waitFor();
    assert.equal(await page.getByRole('columnheader', { name: 'Código', exact: true }).count(), 1);
    assert.equal(await page.getByRole('columnheader', { name: 'ID', exact: true }).count(), 0);
    if (rol === 'Usuario') {
      assert.equal(await page.getByRole('button', { name: /Nueva actividad/ }).count(), 0);
      await page.getByText('Taller', { exact: true }).click();
      assert.equal(await page.getByRole('dialog').count(), 0);
      assert.equal(writes, 0);
      await page.close();
      console.log('PASS Usuario: sin creación ni edición');
      continue;
    }
    const nueva = page.getByRole('button', { name: /Nueva actividad/ });
    await nueva.click();
    assert.equal(await page.getByLabel('Título', { exact: true }).inputValue(), '');
    await page.getByRole('button', { name: 'Guardar actividad' }).click();
    await page.getByText('Introduce un título de entre 1 y 100 caracteres.').waitFor();
    assert.equal(writes, 0);
    await page.getByLabel('Título', { exact: true }).fill('Descartar');
    await page.getByRole('button', { name: 'Cerrar modal', exact: true }).click();
    await nueva.click();
    assert.equal(await page.getByLabel('Título', { exact: true }).inputValue(), '');
    await page.getByLabel('Título', { exact: true }).fill('Nueva');
    await page.getByLabel('Estado', { exact: true }).selectOption('1');
    await page.getByLabel('Precio socio', { exact: true }).fill('0');
    await page.locator('form').evaluate(form => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    await page.getByRole('dialog').waitFor({ state: 'detached' });
    assert.equal(writes, 1);
    assert.equal(latest.method, 'POST');
    assert.equal(latest.body.importeSocio, 0);
    assert.equal(latest.body.fecha, null);
    assert.ok(!('aforo' in latest.body));
    await page.getByText('Nueva', { exact: true }).waitFor();
    await page.getByText('Taller', { exact: true }).click();
    await page.getByRole('heading', { name: 'Actividad', exact: true }).waitFor();
    for (const [label, value] of [['Título', 'Taller'], ['Fecha', '2026-10-14'], ['Aforo', '20'], ['Precio socio', '0.00'], ['Precio no socio', '12.50'], ['Estado', '1'], ['Comentarios', 'Notas']]) {
      assert.equal(await page.getByLabel(label, { exact: true }).inputValue(), value);
    }
    await page.getByRole('button', { name: 'Editar', exact: true }).click();
    await page.getByLabel('Título', { exact: true }).fill('Descartado');
    await page.keyboard.press('Escape');
    assert.equal(writes, 1);
    await page.getByText('Taller', { exact: true }).click();
    assert.equal(await page.getByLabel('Título', { exact: true }).inputValue(), 'Taller');
    for (const [entrada, enviado, esperado] of [
      ['30', 30, '30'], ['10', 10, '10'], ['', null, ''], ['20', 20, '20'], ['20', undefined, '20'],
    ]) {
      await page.getByRole('button', { name: 'Editar', exact: true }).click();
      await page.getByLabel('Aforo', { exact: true }).fill(entrada);
      await page.getByRole('button', { name: 'Guardar cambios' }).click();
      await page.getByRole('dialog').waitFor({ state: 'detached' });
      assert.equal(latest.body.aforo, enviado);
      assert.equal(Object.hasOwn(latest.body, 'aforo'), enviado !== undefined);
      if (enviado === null) await page.getByText('Sin límite', { exact: true }).first().waitFor();
      await page.getByText('Taller', { exact: true }).click();
      assert.equal(await page.getByLabel('Aforo', { exact: true }).inputValue(), esperado);
    }
    const listaAntes = JSON.stringify(lista);
    fallo = 409;
    await page.getByRole('button', { name: 'Editar', exact: true }).click();
    await page.getByLabel('Aforo', { exact: true }).fill('2');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await page.getByText('No puedes reducir el aforo a 2 plazas porque actualmente hay 3 ocupadas.').waitFor();
    assert.equal(await page.getByRole('dialog').count(), 1);
    assert.equal(await page.getByLabel('Aforo', { exact: true }).inputValue(), '2');
    assert.equal(await page.getByText('0/20', { exact: true }).count(), 1);
    assert.equal(JSON.stringify(lista), listaAntes);
    fallo = 0;
    await page.getByLabel('Aforo', { exact: true }).fill('20');
    await page.getByLabel('Título', { exact: true }).fill('Actualizado');
    for (const status of [400, 403, 404, 500, 401]) {
      fallo = status;
      await page.getByRole('button', { name: 'Guardar cambios' }).click();
      await page.locator('.usuario-form-error').waitFor();
      if (status !== 401) await page.waitForFunction(() => !document.querySelector('button[type=submit]').disabled);
      assert.equal(await page.getByRole('dialog').count(), 1);
      assert.equal(await page.getByLabel('Título', { exact: true }).inputValue(), 'Actualizado');
      if (status === 400) await page.getByText('Título rechazado').waitFor();
    }
    // El 401 final caduca la sesión; reabrir con login simulado permite reintentar.
    await page.reload();
    await page.getByText('Taller', { exact: true }).click();
    await page.getByRole('button', { name: 'Editar', exact: true }).click();
    await page.getByLabel('Título', { exact: true }).fill('Actualizado');
    fallo = 0;
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await page.getByRole('dialog').waitFor({ state: 'detached' });
    await page.getByText('Actualizado', { exact: true }).waitFor();
    assert.equal(latest.method, 'PUT');
    assert.equal(latest.path, '/api/actividades/1');
    await page.close();
    console.log(`PASS ${rol}: creación, validación, precarga, cancelación, doble envío, PUT, aforo 409, listado, HTTP 400/401/403/404/500`);
  }
} finally {
  await browser.close();
}
