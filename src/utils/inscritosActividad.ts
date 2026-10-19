import type { EstadoPagoCatalogo } from "../types/catalogoPago";
import type { Inscripcion } from "../types/inscripcion";
import { nombreEstadoPago } from "./estadoPagoInscripcion";

export function nombreInscrito(usuario: Inscripcion["Usuario"]): string {
  if (!usuario) return "Usuario no disponible";
  const nombre = [usuario.nombre, usuario.apellido1, usuario.apellido2].filter(Boolean).join(" ");
  return nombre || "Usuario no disponible";
}

function porNombre(primera: Inscripcion, segunda: Inscripcion): number {
  return nombreInscrito(primera.Usuario).localeCompare(
    nombreInscrito(segunda.Usuario),
    "es",
    { sensitivity: "base" },
  );
}

function porEspera(primera: Inscripcion, segunda: Inscripcion): number {
  const posicionPrimera = primera.posicionEspera ?? Number.MAX_SAFE_INTEGER;
  const posicionSegunda = segunda.posicionEspera ?? Number.MAX_SAFE_INTEGER;
  if (posicionPrimera !== posicionSegunda) return posicionPrimera - posicionSegunda;
  return porNombre(primera, segunda);
}

export function listasDeActividad(
  inscripciones: readonly Inscripcion[],
  idActividad: number,
  estadosPago: readonly EstadoPagoCatalogo[],
  idEstadoEspera: number | null,
): { inscritos: Inscripcion[]; espera: Inscripcion[] } {
  const visibles = inscripciones
    .filter((inscripcion) => inscripcion.id_actividad === idActividad)
    .filter((inscripcion) => {
      const pago = nombreEstadoPago(inscripcion.id_estado_pago, estadosPago);
      return pago === "Pagado" || pago === "Pendiente";
    });
  const enEspera = (inscripcion: Inscripcion) => (
    idEstadoEspera != null
      ? inscripcion.id_estado_inscripcion === idEstadoEspera
      : inscripcion.posicionEspera != null
  );

  return {
    inscritos: visibles.filter((inscripcion) => !enEspera(inscripcion)).sort(porNombre),
    espera: visibles.filter(enEspera).sort(porEspera),
  };
}
