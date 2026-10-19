import type { Actividad } from "../types/actividad";

export interface ActividadFormState {
  titulo: string;
  fecha: string;
  aforo: string;
  importeSocio: string;
  importeNoSocio: string;
  id_estado_actividad: string;
  comentario: string;
}

// EstadoActividad: IDs y nombres verificados en la BD (consulta de solo lectura).
// La API actual no expone un endpoint de catálogo.
export const ESTADOS_ACTIVIDAD = [
  { id: 1, nombre: "Activo" },
  { id: 2, nombre: "Inactivo" },
  { id: 3, nombre: "Pendiente" },
] as const;

export function obtenerValoresIniciales(actividad?: Actividad): ActividadFormState {
  return {
    titulo: actividad?.titulo ?? "",
    fecha: actividad?.fecha?.slice(0, 10) ?? "",
    aforo: actividad?.aforo?.toString() ?? "",
    importeSocio: actividad?.importeSocio?.toString() ?? "",
    importeNoSocio: actividad?.importeNoSocio?.toString() ?? "",
    id_estado_actividad: actividad?.id_estado_actividad.toString() ?? "",
    comentario: actividad?.comentario ?? "",
  };
}
