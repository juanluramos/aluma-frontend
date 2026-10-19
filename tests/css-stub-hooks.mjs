/** Hooks ESM: ignora imports .css y de imágenes en tests Node. */
export async function load(url, context, nextLoad) {
  if (url.endsWith('.css')) {
    return {
      format: 'module',
      shortCircuit: true,
      source: 'export default {}',
    };
  }

  if (/\.(webp|png|gif|jpe?g|svg)$/.test(url)) {
    return {
      format: 'module',
      shortCircuit: true,
      source: 'export default "icono"',
    };
  }

  return nextLoad(url, context);
}
