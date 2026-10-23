import type { InscripcionFormState } from "./inscripcionFormState";

export type ErroresInscripcion = Partial<Record<keyof InscripcionFormState, string>>;

function idValido(valor: string): boolean {
  return /^\d+$/.test(valor) && Number(valor) >= 1 && Number(valor) <= 2147483647;
}

export function validarInscripcion(datos: InscripcionFormState): ErroresInscripcion {
  const errores: ErroresInscripcion = {};

  if (!idValido(datos.id_usuario)) {
    errores.id_usuario = "Selecciona un usuario.";
  }

  if (!idValido(datos.id_actividad)) {
    errores.id_actividad = "Selecciona una actividad.";
  }

  return errores;
}
