import { PAGO_ANIO_MAXIMO, PAGO_ANIO_MINIMO } from "./validacionesCuota";

export const MENSAJE_CONFIGURACION_DUPLICADA = "No puede existir más de una configuración para el mismo año.";
export const MENSAJE_CONFIGURACION_EN_USO = "No se puede eliminar la configuración porque existen cuotas registradas para ese año.";

export type DatosConfiguracionCuota = {
  anio: number;
  importe: number;
};

export type ErroresConfiguracionCuota = {
  anio?: string;
  importe?: string;
};

const ENTERO = /^\d+$/;

export function textoImporteConfiguracion(importe: string): string {
  const [entera, decimal = "00"] = importe.split(".");
  return `${entera},${decimal.padEnd(2, "0").slice(0, 2)}`;
}

function importeNormalizado(texto: string): string | null {
  const limpio = texto.trim().replace(/\s/g, "").replace("€", "").replace(",", ".");
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(limpio)) return null;
  const [entera, decimal = ""] = limpio.split(".");
  const normalizado = `${String(Number(entera))}.${decimal.padEnd(2, "0")}`;
  const valor = Number(normalizado);
  if (!Number.isFinite(valor) || valor <= 0 || valor > 99999999.99) return null;
  return normalizado;
}

export function validarConfiguracionCuota(anioTexto: string, importeTexto: string): {
  errores: ErroresConfiguracionCuota;
  datos?: DatosConfiguracionCuota;
} {
  const errores: ErroresConfiguracionCuota = {};
  const anio = Number(anioTexto);
  if (!ENTERO.test(anioTexto.trim()) || !Number.isInteger(anio) || anio < PAGO_ANIO_MINIMO || anio > PAGO_ANIO_MAXIMO) {
    errores.anio = `El año de la cuota debe ser un entero entre ${PAGO_ANIO_MINIMO} y ${PAGO_ANIO_MAXIMO}.`;
  }
  const importe = importeNormalizado(importeTexto);
  if (!importe) {
    errores.importe = "El importe debe ser mayor que 0, con un máximo de 2 decimales y hasta 99999999.99.";
  }
  if (errores.anio || errores.importe || !importe) return { errores };
  return { errores, datos: { anio, importe: Number(importe) } };
}

export function mensajeConfiguracionCuota(
  status: number,
  code: string | undefined,
  accion: "cargar" | "guardar" | "eliminar",
): string {
  if (status === 401) return "Tu sesión ha caducado. Vuelve a iniciar sesión.";
  if (status === 403) return "No tienes permiso para gestionar la configuración de la cuota.";
  if (code === "CONFIGURACION_CUOTA_DUPLICADA") return MENSAJE_CONFIGURACION_DUPLICADA;
  if (code === "CONFIGURACION_CUOTA_EN_USO") return MENSAJE_CONFIGURACION_EN_USO;
  if (status >= 500) {
    if (accion === "eliminar") return "No se pudo eliminar la configuración. Inténtalo de nuevo.";
    if (accion === "cargar") return "No se pudo cargar la configuración. Inténtalo de nuevo.";
    return "No se pudo guardar la configuración. Inténtalo de nuevo.";
  }
  if (accion === "eliminar") return "No se pudo eliminar la configuración.";
  if (accion === "cargar") return "No se pudo cargar la configuración.";
  return "No se pudo guardar la configuración.";
}

export type ConfiguracionCuotaLista = {
  id_configuracion: number;
  anio: number;
  importe: string;
};

export function guardarConfiguracionEnLista<T extends ConfiguracionCuotaLista>(lista: readonly T[], actual: T): T[] {
  return [...lista.filter((item) => item.id_configuracion !== actual.id_configuracion), actual]
    .sort((a, b) => b.anio - a.anio || b.id_configuracion - a.id_configuracion);
}

export function quitarConfiguracionDeLista<T extends ConfiguracionCuotaLista>(lista: readonly T[], id: number): T[] {
  return lista.filter((item) => item.id_configuracion !== id);
}
