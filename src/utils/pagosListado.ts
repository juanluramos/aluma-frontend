import type { EstadoPagoCatalogo, MetodoPagoCatalogo } from "../types/catalogoPago";
import type { Inscripcion } from "../types/inscripcion";

export type DireccionOrdenPago = "asc" | "desc";

export function normalizarTextoPago(texto: string): string {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export function nombreEstadoPagoCatalogo(id: number, estados: readonly EstadoPagoCatalogo[]): string {
  return estados.find((estado) => estado.id_estado_pago === id)?.nombre_estado ?? "Desconocido";
}

export function nombreMetodoPago(id: number | null, metodos: readonly MetodoPagoCatalogo[]): string {
  if (id == null) return "Sin método";
  return metodos.find((metodo) => metodo.id_metodo_pago === id)?.nombre ?? "Desconocido";
}

export function textoFechaPago(fecha: string | null): string {
  if (!fecha) return "Sin fecha";
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return "Sin fecha";
  return valor.toLocaleDateString("es-ES", { timeZone: "UTC" });
}

function nombreUsuario(inscripcion: Inscripcion): string {
  const usuario = inscripcion.Usuario;
  if (!usuario) return "Usuario no disponible";
  return [usuario.nombre, usuario.apellido1, usuario.apellido2].filter(Boolean).join(" ") || "Usuario no disponible";
}

function tituloActividad(inscripcion: Inscripcion): string {
  return inscripcion.Actividad?.titulo.trim() || "Actividad no disponible";
}

export function filtrarPagos(
  inscripciones: readonly Inscripcion[],
  consulta: string,
  estados: readonly EstadoPagoCatalogo[],
  metodos: readonly MetodoPagoCatalogo[],
  estadosSeleccionados: readonly string[],
  metodosSeleccionados: readonly string[],
): Inscripcion[] {
  const busqueda = normalizarTextoPago(consulta);
  return inscripciones.filter((inscripcion) => {
    const usuario = normalizarTextoPago(nombreUsuario(inscripcion));
    const actividad = normalizarTextoPago(tituloActividad(inscripcion));
    const coincideBusqueda = busqueda.length === 0 || usuario.includes(busqueda) || actividad.includes(busqueda);
    const estado = nombreEstadoPagoCatalogo(inscripcion.id_estado_pago, estados);
    const metodo = nombreMetodoPago(inscripcion.id_metodo_pago, metodos);
    const coincideEstado = estadosSeleccionados.length === 0 || estadosSeleccionados.includes(estado);
    const coincideMetodo = metodosSeleccionados.length === 0 || metodosSeleccionados.includes(metodo);
    return coincideBusqueda && coincideEstado && coincideMetodo;
  });
}

export function ordenarPagosPorFecha(
  inscripciones: readonly Inscripcion[],
  direccion: DireccionOrdenPago,
): Inscripcion[] {
  const factor = direccion === "asc" ? 1 : -1;
  return [...inscripciones].sort((a, b) => {
    const fechaA = a.fechaPago ? Date.parse(a.fechaPago) : Number.NaN;
    const fechaB = b.fechaPago ? Date.parse(b.fechaPago) : Number.NaN;
    const faltaA = Number.isNaN(fechaA);
    const faltaB = Number.isNaN(fechaB);
    if (faltaA || faltaB) return faltaA === faltaB ? 0 : faltaA ? 1 : -1;
    return (fechaA - fechaB) * factor;
  });
}
