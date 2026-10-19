import type { Actividad } from "../types/actividad";

export type CampoOrden = "titulo" | "fecha";

export type DireccionOrden = "asc" | "desc";

const ESTADOS_FILTRO: Record<number, string> = {
  1: "activo",
  2: "inactivo",
  3: "pendiente",
};

function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function filtrarActividades(
  actividades: readonly Actividad[],
  busqueda: string,
  estadoFiltro: readonly string[],
): Actividad[] {
  const consulta = normalizarTexto(busqueda);
  return actividades.filter((actividad) => {
    const estado = ESTADOS_FILTRO[actividad.id_estado_actividad];
    return normalizarTexto(actividad.titulo).includes(consulta)
      && estado !== undefined
      && estadoFiltro.includes(estado);
  });
}

function compararTitulo(actividadA: Actividad, actividadB: Actividad): number {
  return actividadA.titulo.localeCompare(actividadB.titulo, "es", {
    sensitivity: "base",
    numeric: true,
  });
}

function compararFecha(actividadA: Actividad, actividadB: Actividad): number {
  const fechaA = actividadA.fecha;
  const fechaB = actividadB.fecha;

  if (!fechaA && !fechaB) return 0;
  if (!fechaA) return 1;
  if (!fechaB) return -1;

  const tiempoA = Date.parse(fechaA);
  const tiempoB = Date.parse(fechaB);

  if (Number.isNaN(tiempoA) && Number.isNaN(tiempoB)) return 0;
  if (Number.isNaN(tiempoA)) return 1;
  if (Number.isNaN(tiempoB)) return -1;

  return tiempoA - tiempoB;
}

export function ordenarActividades(
  actividades: readonly Actividad[],
  campo: CampoOrden,
  direccion: DireccionOrden,
): Actividad[] {
  const factor = direccion === "asc" ? 1 : -1;

  return [...actividades].sort((actividadA, actividadB) => {
    const resultado =
      campo === "fecha"
        ? compararFecha(actividadA, actividadB)
        : compararTitulo(actividadA, actividadB);

    if (resultado === 0) return 0;

    const sinFecha =
      campo === "fecha" && (!actividadA.fecha || !actividadB.fecha);

    return sinFecha ? resultado : resultado * factor;
  });
}
