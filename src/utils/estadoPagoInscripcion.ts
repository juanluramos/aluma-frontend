import type { EstadoPagoCatalogo } from "../types/catalogoPago";

export function nombreEstadoPago(id: number, estados: readonly EstadoPagoCatalogo[]): string {
  const catalogo = estados.find((estado) => estado.id_estado_pago === id)?.nombre_estado;
  if (catalogo) return catalogo;
  switch (id) {
    case 1:
      return "Pendiente";
    case 2:
      return "Pagado";
    case 3:
      return "Devolución";
    case 4:
      return "Cancelado";
    default:
      return "Desconocido";
  }
}
