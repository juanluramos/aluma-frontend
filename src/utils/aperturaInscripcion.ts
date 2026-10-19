import type { Inscripcion } from "../types/inscripcion";

export function destinoInscripcion(state: unknown): number | null {
  if (!state || typeof state !== "object" || !("abrirInscripcion" in state)) return null;
  const id = (state as { abrirInscripcion: unknown }).abrirInscripcion;
  return typeof id === "number" && Number.isInteger(id) ? id : null;
}

export function inscripcionDesdeNavegacion(
  state: unknown,
  inscripciones: readonly Inscripcion[],
  cargando: boolean,
  puedeEditar: boolean,
): Inscripcion | null {
  if (cargando || !puedeEditar) return null;
  const id = destinoInscripcion(state);
  if (id == null) return null;
  return inscripciones.find((inscripcion) => inscripcion.id_inscripcion === id) ?? null;
}

export function inscripcionEnEdicion(
  edicion: Inscripcion | null,
  state: unknown,
  inscripciones: readonly Inscripcion[],
  cargando: boolean,
  puedeEditar: boolean,
): Inscripcion | null {
  return edicion ?? inscripcionDesdeNavegacion(state, inscripciones, cargando, puedeEditar);
}

export function navegacionSinInscripcion(
  state: unknown,
  inscripciones: readonly Inscripcion[],
  cargando: boolean,
  puedeEditar: boolean,
): boolean {
  if (destinoInscripcion(state) == null || cargando) return false;
  return inscripcionDesdeNavegacion(state, inscripciones, cargando, puedeEditar) == null;
}
