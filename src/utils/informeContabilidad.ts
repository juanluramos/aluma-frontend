import type { ConsultaContable } from "./filtrosContabilidad";
import { textoDia } from "./filtrosContabilidad";
import type { ListadoMovimientos, MovimientoContable } from "../services/contabilidadService";

/** Registros por petición al reunir el informe. El máximo que admite la API es 100. */
export const LIMITE_INFORME_CONTABILIDAD = 100;

/**
 * Recorre las páginas del listado hasta reunir exactamente el total anunciado.
 * Si una página falla o el total deja de coincidir, la promesa se rechaza y no hay informe parcial.
 */
export async function reunirMovimientos(
  consulta: ConsultaContable,
  leer: (consulta: ConsultaContable) => Promise<ListadoMovimientos>,
  alAvanzar?: (obtenidos: number, total: number) => void,
): Promise<MovimientoContable[]> {
  const acumulado: MovimientoContable[] = [];
  let totalEsperado: number | null = null;
  let pagina = 1;

  for (;;) {
    const lista = await leer({ ...consulta, pagina });
    if (!Number.isInteger(lista.total) || lista.total < 0) {
      throw new Error("No se pudo completar el informe de contabilidad.");
    }
    if (totalEsperado === null) totalEsperado = lista.total;
    else if (lista.total !== totalEsperado) {
      throw new Error("El listado cambió durante la preparación del informe.");
    }
    acumulado.push(...lista.movimientos);
    if (acumulado.length > totalEsperado) {
      throw new Error("No se pudo completar el informe de contabilidad.");
    }
    alAvanzar?.(acumulado.length, totalEsperado);
    if (acumulado.length === totalEsperado) return acumulado;
    if (lista.movimientos.length === 0 || pagina > 1000) {
      throw new Error("No se pudo completar el informe de contabilidad.");
    }
    pagina += 1;
  }
}

/** Un mes concreto usa AAAA-MM. El resto de informes llevan la fecha de generación. */
export function nombreInformeContabilidad(consulta: ConsultaContable, generado: Date): string {
  const mes = consulta.desde && consulta.hasta && consulta.desde.slice(0, 7) === consulta.hasta.slice(0, 7)
    ? consulta.desde.slice(0, 7)
    : fechaArchivo(generado);
  return `ALUMA_Contabilidad_${mes}.pdf`;
}

export function textoPeriodo(consulta: ConsultaContable): string {
  if (consulta.desde && consulta.hasta) return `${textoDia(consulta.desde)} – ${textoDia(consulta.hasta)}`;
  if (consulta.desde) return `Desde ${textoDia(consulta.desde)}`;
  if (consulta.hasta) return `Hasta ${textoDia(consulta.hasta)}`;
  return "Todos los movimientos";
}

export function textoCelda(valor: string | null): string {
  return valor?.trim() ? valor : "—";
}

export function textoGeneracion(fecha: Date): string {
  return fecha.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fechaArchivo(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}
