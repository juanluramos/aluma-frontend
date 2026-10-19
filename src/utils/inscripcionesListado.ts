import { ordenarPagosPorFecha } from "./pagosListado";
import type { Inscripcion } from '../types/inscripcion';

export type CampoOrdenInscripcion = 'codigo' | 'usuario' | 'actividad' | 'fecha' | 'fechaPago';

export function direccionAlOrdenar(
  campo: CampoOrdenInscripcion,
  campoActual: CampoOrdenInscripcion | null,
  direccionActual: 'asc' | 'desc',
): 'asc' | 'desc' {
  if (campo === campoActual) return direccionActual === 'asc' ? 'desc' : 'asc';
  return campo === 'fecha' || campo === 'fechaPago' || campo === 'codigo' ? 'desc' : 'asc';
}

export function ordenarInscripciones(
  inscripciones: readonly Inscripcion[],
  campo: CampoOrdenInscripcion,
  direccion: 'asc' | 'desc',
): Inscripcion[] {
  if (campo === 'fechaPago') return ordenarPagosPorFecha(inscripciones, direccion);
  const factor = direccion === 'asc' ? 1 : -1;
  function valor(item: Inscripcion): string {
    if (campo === 'actividad') return item.Actividad?.titulo.trim() || 'Actividad no disponible';
    return [item.Usuario?.nombre, item.Usuario?.apellido1, item.Usuario?.apellido2]
      .filter(Boolean).join(' ') || 'Usuario no disponible';
  }
  return [...inscripciones].sort((a, b) => {
    if (campo === 'codigo') return (a.id_inscripcion - b.id_inscripcion) * factor;
    if (campo === 'fecha') {
      const fechaA = Date.parse(a.apuntadoFecha);
      const fechaB = Date.parse(b.apuntadoFecha);
      if (Number.isNaN(fechaA)) return Number.isNaN(fechaB) ? 0 : 1;
      if (Number.isNaN(fechaB)) return -1;
      return (fechaA - fechaB) * factor;
    }
    return valor(a).localeCompare(valor(b), 'es', { sensitivity: 'base', numeric: true }) * factor;
  });
}
