import type { EstadoInscripcionCatalogo, EstadoPagoCatalogo, MetodoPagoCatalogo } from "../types/catalogoPago";
import { authenticatedFetch } from "./authService";

async function leerCatalogo<T>(path: string, fallo: string): Promise<T[]> {
  const response = await authenticatedFetch(path);
  if (!response.ok) {
    const cuerpo = await response.json().catch(() => null) as { message?: unknown } | null;
    throw new Error(typeof cuerpo?.message === "string" ? cuerpo.message : fallo);
  }
  return response.json() as Promise<T[]>;
}

export function getMetodosPago(): Promise<MetodoPagoCatalogo[]> {
  return leerCatalogo("/metodos-pago", "No se pudieron cargar los métodos de pago.");
}

export function getEstadosPago(): Promise<EstadoPagoCatalogo[]> {
  return leerCatalogo("/estados-pago", "No se pudieron cargar los estados de pago.");
}

export function getEstadosInscripcion(): Promise<EstadoInscripcionCatalogo[]> {
  return leerCatalogo("/estados-inscripcion", "No se pudieron cargar los estados de inscripción.");
}
