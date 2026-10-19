import type { InscripcionFormState } from "./inscripcionFormState";

export interface InscripcionPayload {
  id_usuario: number;
  id_actividad: number;
  id_estado_pago: number;
  apuntadoFecha: string;
  comentario: string | null;
}

// El alta no envía precioAplicado: el backend guarda la tarifa de socio o de no socio.
// El estado Pendiente solo cumple el DTO; el servidor fija el estado y no genera cobro.
export const ESTADO_PAGO_PENDIENTE = 1;

export interface InscripcionComentarioPayload {
  comentario: string | null;
}

// La edición solo envía el comentario. El PUT también acepta precio, pago y referencias,
// pero cambiarlos no recalcula la tarifa y puede crear cobros o bloquear el historial.
export function construirComentarioInscripcion(datos: InscripcionFormState): InscripcionComentarioPayload {
  return { comentario: datos.comentario.trim() || null };
}

export function construirDatosInscripcion(
  datos: InscripcionFormState,
  apuntadoFecha: string,
): InscripcionPayload {
  return {
    id_usuario: Number(datos.id_usuario),
    id_actividad: Number(datos.id_actividad),
    id_estado_pago: ESTADO_PAGO_PENDIENTE,
    apuntadoFecha,
    comentario: datos.comentario.trim() || null,
  };
}
