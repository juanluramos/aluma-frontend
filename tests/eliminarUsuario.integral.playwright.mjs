/**
 * Paso 7: verificación de harnesses de eliminación con Playwright.
 * No toca datos reales: las páginas de test usan mocks en memoria.
 *
 * Requiere Vite en :5173:
 *   node tests/eliminarUsuario.integral.playwright.mjs
 */
import { chromium } from 'playwright';

const BASE = process.env.ALUMA_TEST_BASE ?? 'http://127.0.0.1:5173';

const harnesses = [
  '/tests/usuariosPageAdmin.browser.html',
  '/tests/usuariosTable.browser.html',
  '/tests/confirmarEliminarUsuario.browser.html',
];

async function esperarResultado(page, timeoutMs = 90_000) {
  await page.waitForFunction(
    () => {
      const texto = document.getElementById('resultado')?.textContent ?? '';
      return texto.startsWith('PASS:') || texto.startsWith('FAIL:');
    },
    { timeout: timeoutMs },
  );
  return page.locator('#resultado').innerText();
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    for (const path of harnesses) {
      const url = `${BASE}${path}`;
      await page.goto(url, { waitUntil: 'networkidle' });
      const texto = await esperarResultado(page);
      if (!texto.startsWith('PASS:')) {
        throw new Error(`Harness falló en ${url}: ${texto}`);
      }
      console.log(`OK ${path} → ${texto}`);
    }
    console.log(`PASS Playwright: ${harnesses.length} harnesses de eliminación.`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(String(error));
  process.exit(1);
});
