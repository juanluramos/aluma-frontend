import type { Inscripcion } from "../types/inscripcion";

export interface InscripcionFormState {
  id_usuario: string;
  id_actividad: string;
  comentario: string;
}

export function valoresDesdeInscripcion(inscripcion: Inscripcion): InscripcionFormState {
  return {
    id_usuario: String(inscripcion.id_usuario),
    id_actividad: String(inscripcion.id_actividad),
    comentario: inscripcion.comentario ?? "",
  };
}

export function valoresIniciales(
  idPropio: number | null,
  fijarUsuario: boolean,
): InscripcionFormState {
  return {
    id_usuario: fijarUsuario && idPropio !== null ? String(idPropio) : "",
    id_actividad: "",
    comentario: "",
  };
}
