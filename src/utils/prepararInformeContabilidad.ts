import { getResumenContable, obtenerMovimientosDelInforme } from "../services/contabilidadService";
import type { ConsultaContable } from "./filtrosContabilidad";
import { generarInformeContabilidadPdf, leerImagenInforme } from "./generarInformeContabilidadPdf";
import { nombreInformeContabilidad } from "./informeContabilidad";

/** Consulta el resumen y todas las páginas del filtro, y construye un único PDF. */
export async function prepararInformeContabilidad(
  consulta: ConsultaContable,
  logoUrl: string,
  alAvanzar?: (obtenidos: number, total: number) => void,
) {
  const [resumen, movimientos, logo] = await Promise.all([
    getResumenContable(consulta),
    obtenerMovimientosDelInforme(consulta, alAvanzar),
    leerImagenInforme(logoUrl),
  ]);
  const generado = new Date();
  return {
    documento: generarInformeContabilidadPdf({ consulta, resumen, movimientos, generado, logo }),
    nombre: nombreInformeContabilidad(consulta, generado),
  };
}
