export type MovimientoUsuario = {
  fecha: string;
  textoFecha: string;
  descripcion: string;
};

type InscripcionMovimiento = {
  id_usuario: number;
  id_actividad: number;
  apuntadoFecha: string;
  Actividad: { titulo: string } | null;
};

type ActividadMovimiento = {
  id_actividad: number;
  titulo: string;
  fecha: string | null;
};

type CuotaMovimiento = {
  id_usuario: number;
  pagoAnio: number;
  fechaPago: string;
};

function diaIso(valor: string): string {
  const dia = valor.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(dia) ? dia : "";
}

/** 2026-01-01 → 1/1/26 */
export function textoFechaMovimiento(valor: string): string {
  const dia = diaIso(valor);
  if (!dia) return "";
  const [anio, mes, numero] = dia.split("-");
  return `${Number(numero)}/${Number(mes)}/${anio.slice(2)}`;
}

export function movimientosDeUsuario(
  idUsuario: number,
  inscripciones: InscripcionMovimiento[],
  actividades: ActividadMovimiento[],
  cuotas: CuotaMovimiento[],
): MovimientoUsuario[] {
  const porActividad = new Map(actividades.map(actividad => [actividad.id_actividad, actividad]));
  const filas: MovimientoUsuario[] = [];

  for (const inscripcion of inscripciones) {
    if (inscripcion.id_usuario !== idUsuario) continue;
    const actividad = porActividad.get(inscripcion.id_actividad);
    const descripcion = (actividad?.titulo ?? inscripcion.Actividad?.titulo ?? "").trim();
    const fecha = diaIso(actividad?.fecha ?? "") || diaIso(inscripcion.apuntadoFecha);
    const textoFecha = textoFechaMovimiento(fecha);
    if (!descripcion || !textoFecha) continue;
    filas.push({ fecha, textoFecha, descripcion });
  }

  for (const cuota of cuotas) {
    if (cuota.id_usuario !== idUsuario) continue;
    const fecha = diaIso(cuota.fechaPago);
    const textoFecha = textoFechaMovimiento(fecha);
    if (!textoFecha) continue;
    filas.push({ fecha, textoFecha, descripcion: `Cuota ${cuota.pagoAnio}` });
  }

  return filas.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.descripcion.localeCompare(b.descripcion, "es"));
}
