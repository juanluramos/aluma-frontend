export interface Actividad {
    id_actividad: number;
    titulo: string;
    fecha: string | null;
  aforo: number | null;
  plazasOcupadas: number;
  plazasDisponibles: number | null;
  personasEnEspera: number;
  importeSocio: string | null;
    importeNoSocio: string | null;
    comentario?: string | null;
    id_estado_actividad: number;
}