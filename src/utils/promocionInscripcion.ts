import type { EstadoInscripcionCatalogo, EstadoPagoCatalogo } from "../types/catalogoPago";
import type { Inscripcion } from "../types/inscripcion";
import { idEstadoPorNombre, idInscripcionPorNombre } from "./pagoInscripcion";

export const MENSAJE_LISTA_ESPERA = "El socio se ha añadido a la lista de espera.";

export function mensajeListaEspera(
  idEstadoInscripcion: number | null,
  estados: EstadoInscripcionCatalogo[],
): string | null {
  const espera = idInscripcionPorNombre(estados, "En espera");
  if (idEstadoInscripcion == null || espera == null || idEstadoInscripcion !== espera) return null;
  return MENSAJE_LISTA_ESPERA;
}

export function estaEnEspera(
  inscripcion: Inscripcion,
  estadosInscripcion: EstadoInscripcionCatalogo[],
): boolean {
  const espera = idInscripcionPorNombre(estadosInscripcion, "En espera");
  return espera != null && inscripcion.id_estado_inscripcion === espera;
}

export function puedeActivarInscripcion(
  inscripcion: Inscripcion,
  estadosPago: EstadoPagoCatalogo[],
  estadosInscripcion: EstadoInscripcionCatalogo[],
  puedeGestionar: boolean,
): boolean {
  if (!puedeGestionar || !inscripcion.puedePromocionar) return false;
  if (!estaEnEspera(inscripcion, estadosInscripcion)) return false;
  const pendiente = idEstadoPorNombre(estadosPago, "Pendiente");
  return pendiente != null && inscripcion.id_estado_pago === pendiente;
}

export function textoAforo(aforo: number | null): string {
  return aforo === null ? "Sin límite" : String(aforo);
}

export function textoPosicion(posicion: number | null): string {
  return posicion == null ? "—" : String(posicion);
}
