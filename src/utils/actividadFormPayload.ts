import type { Actividad } from "../types/actividad";
import type { ActividadFormState } from "./actividadFormState";

export interface ActividadPayload {
  titulo: string;
  fecha: string | null;
  aforo?: number | null;
  importeSocio: number | null;
  importeNoSocio: number | null;
  id_estado_actividad: number;
  comentario: string | null;
}

export function construirDatosActividad(datos: ActividadFormState, original?: Actividad): ActividadPayload {
  const aforo = datos.aforo === "" ? null : Number(datos.aforo);
  // En edición, omitir lo que no cambió; null elimina explícitamente el límite.
  // En creación se mantiene la omisión del aforo vacío (contrato POST actual).
  const actualizarAforo = original ? aforo !== original.aforo : aforo !== null;
  return {
    titulo: datos.titulo.trim(),
    fecha: datos.fecha || null,
    ...(actualizarAforo ? { aforo } : {}),
    importeSocio: datos.importeSocio === "" ? null : Number(datos.importeSocio),
    importeNoSocio: datos.importeNoSocio === "" ? null : Number(datos.importeNoSocio),
    id_estado_actividad: Number(datos.id_estado_actividad),
    comentario: datos.comentario.trim() || null,
  };
}
