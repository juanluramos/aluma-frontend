import type { Cuota } from "../services/cuotaService";
import { formatoEuro } from "./formatoEuro";
import { capitalizarTexto, nombreCompletoUsuario, normalizarBusqueda } from "./usuariosListado";

export type FiltroCuotas = {
  busqueda: string;
  anio: number | null;
};

function codigoUsuario(usuario: Cuota["Usuario"]): string {
  return usuario.codUsuario ?? "";
}

export function textoCodigoCuota(usuario: Cuota["Usuario"]): string {
  const codigo = usuario.codUsuario?.trim() ?? "";
  return codigo === "" ? "-" : codigo;
}

function textoUsuarioCuota(cuota: Cuota): string {
  return [cuota.Usuario.nombre, cuota.Usuario.apellido1, cuota.Usuario.apellido2, codigoUsuario(cuota.Usuario)]
    .filter((parte): parte is string => typeof parte === "string" && parte.trim() !== "")
    .join(" ");
}

export function aniosDisponiblesCuotas(cuotas: readonly Cuota[], anioSeleccionado: number | null = null): number[] {
  const anios = new Set(cuotas.map((cuota) => cuota.pagoAnio));
  if (anioSeleccionado !== null) anios.add(anioSeleccionado);
  return [...anios].sort((a, b) => b - a);
}

export function filtrarCuotas(cuotas: readonly Cuota[], filtro: FiltroCuotas): Cuota[] {
  const consulta = normalizarBusqueda(filtro.busqueda);
  return cuotas.filter((cuota) => {
    const coincideAnio = filtro.anio === null || cuota.pagoAnio === filtro.anio;
    const coincideTexto = consulta === "" || normalizarBusqueda(textoUsuarioCuota(cuota)).includes(consulta);
    return coincideAnio && coincideTexto;
  });
}

export function filtrosCuotasActivos(filtro: FiltroCuotas): boolean {
  return normalizarBusqueda(filtro.busqueda) !== "" || filtro.anio !== null;
}

export { capitalizarTexto };

export function nombreVisibleCuota(usuario: {
  nombre: string;
  apellido1: string | null;
  apellido2: string | null;
}): string {
  return nombreCompletoUsuario(usuario);
}

export function importeVisibleCuota(importePagado: string): string {
  return formatoEuro(importePagado);
}

function centimosDeImporte(importe: string): number {
  const visible = importe.trim();
  const negativo = visible.startsWith("-");
  const absoluto = negativo ? visible.slice(1) : visible;
  if (!/^\d+(\.\d+)?$/.test(absoluto)) return 0;
  const [entero, decimal = ""] = absoluto.split(".");
  const centimos = Number(entero) * 100 + Number(decimal.padEnd(2, "0").slice(0, 2));
  if (!Number.isSafeInteger(centimos)) return 0;
  return negativo ? -centimos : centimos;
}

function textoDesdeCentimos(centimos: number): string {
  const signo = centimos < 0 ? "-" : "";
  const absoluto = Math.abs(centimos);
  return `${signo}${Math.trunc(absoluto / 100)}.${String(absoluto % 100).padStart(2, "0")}`;
}

export type ResumenCuotasAnio = {
  cantidad: number;
  total: string;
};

export function resumenCuotasAnio(cuotas: readonly Cuota[], anio: number): ResumenCuotasAnio {
  let cantidad = 0;
  let centimos = 0;
  for (const cuota of cuotas) {
    if (cuota.pagoAnio !== anio) continue;
    cantidad += 1;
    centimos += centimosDeImporte(cuota.importePagado);
  }
  return { cantidad, total: textoDesdeCentimos(centimos) };
}

export function totalImportesCuotas(cuotas: readonly Cuota[]): string {
  return textoDesdeCentimos(cuotas.reduce((suma, cuota) => suma + centimosDeImporte(cuota.importePagado), 0));
}

export function textoComentarioCuota(comentario: string | null): string {
  const texto = capitalizarTexto(comentario ?? "");
  return texto === "" ? "-" : texto;
}

export type CampoOrdenCuota = "anio" | "socio" | "fechaPago";
export type DireccionOrdenCuota = "asc" | "desc";

export function direccionAlOrdenarCuota(
  campo: CampoOrdenCuota,
  campoActual: CampoOrdenCuota,
  direccionActual: DireccionOrdenCuota,
): DireccionOrdenCuota {
  if (campo === campoActual) return direccionActual === "asc" ? "desc" : "asc";
  return campo === "socio" ? "asc" : "desc";
}

export function ordenarCuotas(
  cuotas: readonly Cuota[],
  campo: CampoOrdenCuota,
  direccion: DireccionOrdenCuota,
): Cuota[] {
  const factor = direccion === "asc" ? 1 : -1;
  return [...cuotas].sort((a, b) => {
    const empate = a.id_cuota - b.id_cuota;
    if (campo === "anio") return ((a.pagoAnio - b.pagoAnio) || empate) * factor;
    if (campo === "fechaPago") return (a.fechaPago.localeCompare(b.fechaPago) || empate) * factor;
    const nombre = nombreVisibleCuota(a.Usuario).localeCompare(nombreVisibleCuota(b.Usuario), "es", { sensitivity: "base" });
    return (nombre || empate) * factor;
  });
}

export function insertarCuotaOrdenada(cuotas: Cuota[], nueva: Cuota): Cuota[] {
  return [...cuotas.filter((cuota) => cuota.id_cuota !== nueva.id_cuota), nueva]
    .sort((a, b) => b.pagoAnio - a.pagoAnio || b.id_cuota - a.id_cuota);
}

export function eliminarCuotaDeLista(cuotas: Cuota[], idCuota: number): Cuota[] {
  return cuotas.filter((cuota) => cuota.id_cuota !== idCuota);
}

export const AVISO_CUOTA_ANIO_ACTUAL = "Esta cuota corresponde al año actual. Al eliminarla, el usuario puede dejar de ser socio y se recalcularán los precios de sus inscripciones pendientes.";

export function avisoBorradoCuotaAnioActual(pagoAnio: number, anioActual = new Date().getFullYear()): string | null {
  return pagoAnio === anioActual ? AVISO_CUOTA_ANIO_ACTUAL : null;
}

export function preguntaBorradoCuota(pagoAnio: number, nombre: string): string {
  return `¿Eliminar la cuota de ${pagoAnio} de ${nombre}?`;
}

export function decidirBorradoCuota(accion: "abrir" | "cancelar" | "confirmar" | "error"): {
  confirmacion: boolean;
  quitarDelListado: boolean;
} {
  if (accion === "confirmar") return { confirmacion: false, quitarDelListado: true };
  if (accion === "error") return { confirmacion: true, quitarDelListado: false };
  if (accion === "cancelar") return { confirmacion: false, quitarDelListado: false };
  return { confirmacion: true, quitarDelListado: false };
}
