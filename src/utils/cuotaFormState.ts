import type { Cuota } from "../services/cuotaService";
import { fechaHoyCalendario, fechaParaCampo } from "./fechaCalendario";
import { capitalizarTexto, nombreVisibleCuota } from "./cuotasListado";

export type CuotaFormState = {
  id_usuario: string;
  pagoAnio: string;
  fechaPago: string;
  comentario: string;
};

export type UsuarioCuotaOpcion = {
  id_usuario: number;
  codUsuario: string | null;
  nombre: string;
  apellido1: string | null;
  apellido2: string | null;
};

export function valoresInicialesCuota(ahora = new Date()): CuotaFormState {
  return {
    id_usuario: "",
    pagoAnio: String(ahora.getFullYear()),
    fechaPago: fechaHoyCalendario(ahora),
    comentario: "",
  };
}

export function valoresDesdeCuota(cuota: Cuota): CuotaFormState {
  return {
    id_usuario: String(cuota.id_usuario),
    pagoAnio: String(cuota.pagoAnio),
    fechaPago: fechaParaCampo(cuota.fechaPago),
    comentario: capitalizarTexto(cuota.comentario ?? ""),
  };
}

export function resultadoGuardadoCuota(valores: CuotaFormState, mensajeError: string | null): {
  cerrar: boolean;
  valores: CuotaFormState;
  mensaje: string;
} {
  if (mensajeError === null) return { cerrar: true, valores, mensaje: "" };
  return { cerrar: false, valores, mensaje: mensajeError };
}

export function etiquetaUsuarioCuota(usuario: UsuarioCuotaOpcion): string {
  const nombre = nombreVisibleCuota(usuario);
  const codigo = usuario.codUsuario?.trim() ?? "";
  if (codigo && nombre) return `${codigo} - ${nombre}`;
  return codigo || nombre;
}
