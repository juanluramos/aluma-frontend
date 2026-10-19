import { authenticatedFetch } from "./authService";
import { parametrosContables, type ConsultaContable } from "../utils/filtrosContabilidad";
import { LIMITE_INFORME_CONTABILIDAD, reunirMovimientos } from "../utils/informeContabilidad";

export type ResumenContable = {
  totalCobrado: string;
  totalDevuelto: string;
  saldoNeto: string;
  pendienteCobro: string;
};

export type MovimientoContable = {
  id: number;
  fecha: string;
  tipo: string;
  concepto: string;
  usuario: string | null;
  actividad: string | null;
  metodoPago: string | null;
  importe: string;
};

export type ListadoMovimientos = {
  movimientos: MovimientoContable[];
  total: number;
  pagina: number;
  totalPaginas: number;
};

export function getResumenContable(consulta: ConsultaContable): Promise<ResumenContable> {
  return pedir<ResumenContable>(
    `/contabilidad/resumen${parametrosContables(consulta, false)}`,
    "No se pudo cargar el resumen económico.",
  );
}

export function getMovimientos(consulta: ConsultaContable, limite?: number): Promise<ListadoMovimientos> {
  return pedir<ListadoMovimientos>(
    `/movimientos${parametrosContables(consulta, true, limite)}`,
    "No se pudieron cargar los movimientos.",
  );
}

/** Todas las páginas del filtro, no solo la visible en la tabla. */
export function obtenerMovimientosDelInforme(
  consulta: ConsultaContable,
  alAvanzar?: (obtenidos: number, total: number) => void,
): Promise<MovimientoContable[]> {
  return reunirMovimientos(
    consulta,
    (pagina) => getMovimientos(pagina, LIMITE_INFORME_CONTABILIDAD),
    alAvanzar,
  );
}

async function pedir<T>(ruta: string, fallo: string): Promise<T> {
  const response = await authenticatedFetch(ruta);
  if (!response.ok) {
    const cuerpo = await response.json().catch(() => null) as { message?: unknown } | null;
    throw new Error(typeof cuerpo?.message === "string" ? cuerpo.message : fallo);
  }
  return response.json() as Promise<T>;
}
