import type { EstadoInscripcionCatalogo, EstadoPagoCatalogo } from "../types/catalogoPago";
import type { Inscripcion } from "../types/inscripcion";

export function fechaLocalHoy(ahora = new Date()): string {
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const dia = String(ahora.getDate()).padStart(2, "0");
  return `${ahora.getFullYear()}-${mes}-${dia}`;
}

export function idEstadoPorNombre(estados: EstadoPagoCatalogo[], nombre: string): number | null {
  return estados.find((estado) => estado.nombre_estado === nombre)?.id_estado_pago ?? null;
}

export function idInscripcionPorNombre(estados: EstadoInscripcionCatalogo[], nombre: string): number | null {
  return estados.find((estado) => estado.nombre === nombre)?.id_estado_inscripcion ?? null;
}

export function textoImporte(precio: string | null): string {
  const visible = precio?.trim();
  return visible ? `${visible} €` : "Sin precio";
}

function importePositivo(precio: string | null): boolean {
  const visible = precio?.trim() ?? "";
  if (!/^\d+(\.\d+)?$/.test(visible)) return false;
  const [entero, decimal = ""] = visible.split(".");
  const centimos = Number(entero) * 100 + Number(decimal.padEnd(2, "0").slice(0, 2));
  return Number.isSafeInteger(centimos) && centimos > 0;
}

export function puedeRegistrarPago(
  inscripcion: Inscripcion,
  estados: EstadoPagoCatalogo[],
  estadosInscripcion: EstadoInscripcionCatalogo[],
  puedeGestionar: boolean,
): boolean {
  if (!puedeGestionar) return false;
  const activa = idInscripcionPorNombre(estadosInscripcion, "Activa");
  if (activa == null || inscripcion.id_estado_inscripcion !== activa) return false;
  const pendiente = idEstadoPorNombre(estados, "Pendiente");
  const pagado = idEstadoPorNombre(estados, "Pagado");
  if (pendiente == null || pagado == null) return false;
  return inscripcion.id_estado_pago === pendiente && importePositivo(inscripcion.precioAplicado);
}

export function puedeRegistrarDevolucion(
  inscripcion: Inscripcion,
  estados: EstadoPagoCatalogo[],
  puedeGestionar: boolean,
): boolean {
  if (!puedeGestionar) return false;
  const pagado = idEstadoPorNombre(estados, "Pagado");
  const devolucion = idEstadoPorNombre(estados, "Devolución");
  if (pagado == null || devolucion == null || inscripcion.id_estado_pago !== pagado) return false;
  if (inscripcion.id_metodo_pago == null || !inscripcion.fechaPago) return false;
  return importePositivo(inscripcion.precioAplicado);
}

export function validarPago(metodo: string, fecha: string): { metodo?: string; fecha?: string } {
  const errores: { metodo?: string; fecha?: string } = {};
  if (!/^\d+$/.test(metodo) || Number(metodo) < 1) {
    errores.metodo = "Selecciona un método de pago.";
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    errores.fecha = "Indica una fecha de pago válida.";
  }
  return errores;
}

export function puedeCancelarInscripcion(
  inscripcion: Inscripcion,
  estados: EstadoPagoCatalogo[],
  estadosInscripcion: EstadoInscripcionCatalogo[],
  puedeGestionar: boolean,
): boolean {
  const pendiente = idEstadoPorNombre(estados, "Pendiente");
  const cancelado = idEstadoPorNombre(estados, "Cancelado");
  const estado = estadosInscripcion.find(item => item.id_estado_inscripcion === inscripcion.id_estado_inscripcion)?.nombre;
  return puedeGestionar && pendiente !== null && cancelado !== null
    && inscripcion.id_estado_pago === pendiente
    && (estado === "Activa" || estado === "En espera");
}
