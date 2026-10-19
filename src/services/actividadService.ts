import type { Actividad } from "../types/actividad";
import type { ActividadPayload } from "../utils/actividadFormPayload";
import type { ErroresActividad } from "../utils/validacionesActividad";
import { authenticatedFetch } from "./authService";

export class ActividadApiError extends Error {
  status: number;
  errores: ErroresActividad;

  constructor(message: string, status: number, errores: ErroresActividad = {}) {
    super(message);
    this.status = status;
    this.errores = errores;
  }
}

async function solicitar<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await authenticatedFetch(path, init);
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const errores: ErroresActividad = {};
    const campos = ["titulo", "fecha", "aforo", "importeSocio", "importeNoSocio", "id_estado_actividad", "comentario"];
    if (Array.isArray(body?.errors)) {
      for (const issue of body.errors) {
        const campo = issue?.path?.[0];
        if (campos.includes(campo) && typeof issue.message === "string") {
          errores[campo as keyof ErroresActividad] = issue.message;
        }
      }
    }
    const mensaje = response.status === 401 ? "Tu sesión ha caducado. Vuelve a iniciar sesión."
      : response.status === 403 ? "No tienes permiso para gestionar actividades."
      : response.status >= 500 ? "No se pudo completar la operación. Inténtalo de nuevo."
      : typeof body?.message === "string" ? body.message : "No se pudo completar la operación de actividades.";
    throw new ActividadApiError(mensaje, response.status, errores);
  }
  return response.json();
}

export function getActividades(): Promise<Actividad[]> {
  return solicitar("/actividades");
}

export function createActividad(datos: ActividadPayload): Promise<Actividad> {
  return solicitar("/actividades", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos),
  });
}

export function updateActividad(id: number, datos: ActividadPayload): Promise<Actividad> {
  return solicitar(`/actividades/${id}`, {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos),
  });
}
