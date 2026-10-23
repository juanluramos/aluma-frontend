import type { Inscripcion } from "../types/inscripcion";
import type { InscripcionComentarioPayload, InscripcionEdicionPayload, InscripcionPayload } from "../utils/inscripcionFormPayload";
import type { DevolucionInscripcionPayload, PagoInscripcionPayload } from "../utils/pagoInscripcionPayload";
import type { ErroresInscripcion } from "../utils/validacionesInscripcion";
import { authenticatedFetch } from "./authService";

const CAMPOS_ERROR = ["id_usuario", "id_actividad", "comentario"] as const;

type CuerpoError = {
  message?: unknown;
  errors?: Array<{ path?: unknown[]; message?: unknown }>;
} | null;

export class InscripcionApiError extends Error {
  status: number;
  errores: ErroresInscripcion;

  constructor(message: string, status: number, errores: ErroresInscripcion = {}) {
    super(message);
    this.status = status;
    this.errores = errores;
  }
}

function erroresCampos(cuerpo: CuerpoError): ErroresInscripcion {
  const errores: ErroresInscripcion = {};
  if (!Array.isArray(cuerpo?.errors)) return errores;

  for (const issue of cuerpo.errors) {
    const campo = issue?.path?.[0];
    if (
      typeof campo === "string" &&
      (CAMPOS_ERROR as readonly string[]).includes(campo) &&
      typeof issue.message === "string"
    ) {
      errores[campo as keyof ErroresInscripcion] = issue.message;
    }
  }

  return errores;
}

function mensajeEstado(
  status: number,
  cuerpo: CuerpoError,
  defecto: { denegado: string; fallo: string },
): string {
  if (status === 401) return "Tu sesión ha caducado. Vuelve a iniciar sesión.";
  if (status === 403) {
    return typeof cuerpo?.message === "string" ? cuerpo.message : defecto.denegado;
  }
  if (status >= 500) return "No se pudo completar la operación. Inténtalo de nuevo.";
  if (typeof cuerpo?.message === "string") return cuerpo.message;
  return defecto.fallo;
}

function mensajeAlta(status: number, cuerpo: CuerpoError): string {
  return mensajeEstado(status, cuerpo, {
    denegado: "No tienes permiso para crear inscripciones.",
    fallo: "No se pudo crear la inscripción.",
  });
}

function mensajeEdicion(status: number, cuerpo: CuerpoError): string {
  return mensajeEstado(status, cuerpo, {
    denegado: "No tienes permiso para editar inscripciones.",
    fallo: "No se pudo guardar la inscripción.",
  });
}

function mensajePago(status: number, cuerpo: CuerpoError): string {
  return mensajeEstado(status, cuerpo, {
    denegado: "No tienes permiso para registrar pagos.",
    fallo: "No se pudo registrar el pago.",
  });
}

function mensajeDevolucion(status: number, cuerpo: CuerpoError): string {
  return mensajeEstado(status, cuerpo, {
    denegado: "No tienes permiso para registrar devoluciones.",
    fallo: "No se pudo registrar la devolución.",
  });
}

function mensajeActivacion(status: number, cuerpo: CuerpoError): string {
  return mensajeEstado(status, cuerpo, {
    denegado: "No tienes permiso para activar inscripciones.",
    fallo: "No se pudo activar la inscripción.",
  });
}

export async function getInscripciones(): Promise<Inscripcion[]> {
  const response = await authenticatedFetch("/inscripciones");

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    throw new Error(
      errorData?.message ?? "Error al obtener las inscripciones",
    );
  }

  return response.json();
}

export async function updateInscripcion(
  id: number,
  datos: InscripcionEdicionPayload | InscripcionComentarioPayload,
): Promise<void> {
  const response = await authenticatedFetch(`/inscripciones/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });

  if (!response.ok) {
    const cuerpo = await response.json().catch(() => null) as CuerpoError;
    throw new InscripcionApiError(mensajeEdicion(response.status, cuerpo), response.status, erroresCampos(cuerpo));
  }
}

export async function registrarPagoInscripcion(id: number, datos: PagoInscripcionPayload): Promise<void> {
  const response = await authenticatedFetch(`/inscripciones/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });

  if (!response.ok) {
    const cuerpo = await response.json().catch(() => null) as CuerpoError;
    throw new InscripcionApiError(mensajePago(response.status, cuerpo), response.status, erroresCampos(cuerpo));
  }
}

export async function registrarDevolucionInscripcion(
  id: number,
  datos: DevolucionInscripcionPayload,
): Promise<void> {
  const response = await authenticatedFetch(`/inscripciones/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });

  if (!response.ok) {
    const cuerpo = await response.json().catch(() => null) as CuerpoError;
    throw new InscripcionApiError(mensajeDevolucion(response.status, cuerpo), response.status, erroresCampos(cuerpo));
  }
}

export async function activarInscripcion(id: number): Promise<void> {
  const response = await authenticatedFetch(`/inscripciones/${id}/activar`, {
    method: "PATCH",
  });

  if (!response.ok) {
    const cuerpo = await response.json().catch(() => null) as CuerpoError;
    throw new InscripcionApiError(mensajeActivacion(response.status, cuerpo), response.status);
  }
}

export type InscripcionCreada = {
  id_estado_inscripcion: number | null;
};

export async function createInscripcion(datos: InscripcionPayload): Promise<InscripcionCreada> {
  const response = await authenticatedFetch("/inscripciones", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });

  if (!response.ok) {
    const cuerpo = await response.json().catch(() => null) as CuerpoError;
    throw new InscripcionApiError(mensajeAlta(response.status, cuerpo), response.status, erroresCampos(cuerpo));
  }

  const cuerpo = await response.json().catch(() => null) as { id_estado_inscripcion?: unknown } | null;
  const idEstado = cuerpo?.id_estado_inscripcion;
  return { id_estado_inscripcion: typeof idEstado === "number" ? idEstado : null };
}

export async function cancelarInscripcion(id: number, idEstadoCancelado: number): Promise<void> {
  const response = await authenticatedFetch(`/inscripciones/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_estado_pago: idEstadoCancelado }),
  });
  if (!response.ok) {
    const cuerpo = await response.json().catch(() => null) as CuerpoError;
    throw new InscripcionApiError(mensajeEstado(response.status, cuerpo, {
      denegado: "No tienes permiso para cancelar inscripciones.",
      fallo: "No se pudo cancelar la inscripción.",
    }), response.status);
  }
}
