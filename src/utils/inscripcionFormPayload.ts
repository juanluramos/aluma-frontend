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

export interface InscripcionEdicionPayload {
  id_usuario: number;
  id_actividad: number;
  comentario: string | null;
}

// La edición envía usuario, actividad y comentario. El precio aplicado no se incluye.
export function construirEdicionInscripcion(datos: InscripcionFormState): InscripcionEdicionPayload {
  return {
    id_usuario: Number(datos.id_usuario),
    id_actividad: Number(datos.id_actividad),
    comentario: datos.comentario.trim() || null,
  };
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
