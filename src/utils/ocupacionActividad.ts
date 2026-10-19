import type { Actividad } from "../types/actividad";

export type LineasPlazas = {
  ocupadas: string;
  disponibles: string;
  espera: string;
  completa: boolean;
  hayEspera: boolean;
};

export function lineasPlazas(
  actividad: Pick<Actividad, "aforo" | "plazasOcupadas" | "plazasDisponibles" | "personasEnEspera">,
): LineasPlazas {
  const espera = String(actividad.personasEnEspera);
  if (actividad.aforo === null) {
    return {
      ocupadas: `${actividad.plazasOcupadas} / Sin límite`,
      disponibles: "Sin límite",
      espera,
      completa: false,
      hayEspera: actividad.personasEnEspera > 0,
    };
  }
  return {
    ocupadas: `${actividad.plazasOcupadas}/${actividad.aforo}`,
    disponibles: String(actividad.plazasDisponibles),
    espera,
    completa: actividad.plazasOcupadas >= actividad.aforo,
    hayEspera: actividad.personasEnEspera > 0,
  };
}
