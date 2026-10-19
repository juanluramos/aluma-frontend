type InscripcionConUsuario = {
  id_usuario: number;
};

/** Quien no gestiona inscripciones solo ve las suyas. Sin id de sesión, no ve ninguna. */
export function inscripcionesDeLaSesion<T extends InscripcionConUsuario>(
  inscripciones: readonly T[],
  puedeGestionar: boolean,
  idUsuario: number | null,
): T[] {
  if (puedeGestionar) return [...inscripciones];
  if (idUsuario == null) return [];
  return inscripciones.filter((inscripcion) => inscripcion.id_usuario === idUsuario);
}
