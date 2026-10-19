const PREFIJO = 'aluma.listado.';

type Preferencia = string | number | null | string[];

export function leerPreferencia<T extends Preferencia>(clave: string, inicial: T, permitidos?: readonly Preferencia[]): T {
  try {
    const guardado = sessionStorage.getItem(PREFIJO + clave);
    if (guardado === null) return inicial;
    const valor: unknown = JSON.parse(guardado);
    const valido = permitidos
      ? permitidos.includes(valor as Preferencia)
      : Array.isArray(inicial)
        ? Array.isArray(valor) && valor.every(item => typeof item === 'string')
        : typeof valor === typeof inicial && (typeof valor !== 'number' || (Number.isInteger(valor) && valor > 0));
    return valido ? valor as T : inicial;
  } catch {
    return inicial;
  }
}

export function guardarPreferencia(clave: string, valor: Preferencia) {
  try { sessionStorage.setItem(PREFIJO + clave, JSON.stringify(valor)); }
  catch { /* La vista sigue funcionando si el navegador bloquea el almacenamiento. */ }
}

export function limpiarPreferenciasSesion() {
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const clave = sessionStorage.key(i);
      if (clave?.startsWith(PREFIJO)) sessionStorage.removeItem(clave);
    }
  } catch { /* Almacenamiento opcional. */ }
}
