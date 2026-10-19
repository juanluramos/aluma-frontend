export interface PagoInscripcionPayload {
  id_estado_pago: number;
  id_metodo_pago: number;
  fechaPago: string;
}

export interface DevolucionInscripcionPayload {
  id_estado_pago: number;
}

export function construirDevolucionInscripcion(idEstadoDevolucion: number): DevolucionInscripcionPayload {
  return { id_estado_pago: idEstadoDevolucion };
}

export function construirPagoInscripcion(
  idEstadoPagado: number,
  idMetodo: number,
  fechaPago: string,
): PagoInscripcionPayload {
  return {
    id_estado_pago: idEstadoPagado,
    id_metodo_pago: idMetodo,
    fechaPago,
  };
}
