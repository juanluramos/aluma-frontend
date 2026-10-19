import type { ErroresCuota } from "../utils/validacionesCuota";
import { authenticatedFetch } from "./authService";

export type CuotaUsuario = {
  id_usuario: number;
  codUsuario: string | null;
  nombre: string;
  apellido1: string | null;
  apellido2: string | null;
};

export type Cuota = {
  id_cuota: number;
  id_usuario: number;
  pagoAnio: number;
  fechaPago: string;
  importePagado: string;
  comentario: string | null;
  createAt: string;
  updateAt: string;
  Usuario: CuotaUsuario;
};

export type CreateCuotaData = {
  id_usuario: number;
  pagoAnio: number;
  fechaPago?: string;
  comentario?: string;
};

export type UpdateCuotaData = {
  id_usuario?: number;
  pagoAnio?: number;
  fechaPago?: string;
  comentario?: string;
};

export class CuotaApiError extends Error {
  status: number;
  code?: string;
  errores: ErroresCuota;

  constructor(message: string, status: number, code?: string, errores: ErroresCuota = {}) {
    super(message);
    this.name = "CuotaApiError";
    this.status = status;
    this.code = code;
    this.errores = errores;
  }
}

const MENSAJE_CUOTA_DUPLICADA = "Este usuario ya tiene una cuota registrada para ese año.";
const MENSAJE_CONFIGURACION_AUSENTE = "No existe una configuración de cuota para ese año.";

type CuerpoError = {
  message?: unknown;
  code?: unknown;
  errors?: unknown;
};

function cuerpoError(valor: unknown): CuerpoError | null {
  return valor && typeof valor === "object" ? valor as CuerpoError : null;
}

const CAMPOS_CUOTA = new Set<keyof ErroresCuota>(["id_usuario", "pagoAnio", "fechaPago", "comentario"]);

function esCampoCuota(valor: unknown): valor is keyof ErroresCuota {
  return typeof valor === "string" && CAMPOS_CUOTA.has(valor as keyof ErroresCuota);
}

function erroresCampos(body: CuerpoError | null): ErroresCuota {
  const errores: ErroresCuota = {};
  if (!Array.isArray(body?.errors)) return errores;
  for (const issue of body.errors) {
    if (!issue || typeof issue !== "object" || !("path" in issue) || !Array.isArray(issue.path)) continue;
    const message = "message" in issue && typeof issue.message === "string" ? issue.message : undefined;
    if (!message || !esCampoCuota(issue.path[0])) continue;
    errores[issue.path[0]] = message;
  }
  return errores;
}

function mensajeGuardado(status: number, body: CuerpoError | null, verbo: "registrar" | "modificar"): string {
  if (status === 401) return "Tu sesión ha caducado. Vuelve a iniciar sesión.";
  if (status === 403) return `No tienes permiso para ${verbo} cuotas.`;
  if (status === 409 && body?.code === "CUOTA_DUPLICADA") return MENSAJE_CUOTA_DUPLICADA;
  if (status === 409 && body?.code === "CONFIGURACION_CUOTA_NO_EXISTE") return MENSAJE_CONFIGURACION_AUSENTE;
  if (status >= 500) return "No se pudo guardar la cuota. Inténtalo de nuevo.";
  if (typeof body?.message === "string" && body.message.trim()) return body.message;
  return "No se pudo guardar la cuota.";
}

async function guardarCuota(
  path: string,
  method: "POST" | "PUT",
  data: CreateCuotaData | UpdateCuotaData,
  verbo: "registrar" | "modificar",
): Promise<Cuota> {
  const response = await authenticatedFetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const body = cuerpoError(await response.json().catch(() => null));
    const code = typeof body?.code === "string" ? body.code : undefined;
    throw new CuotaApiError(mensajeGuardado(response.status, body, verbo), response.status, code, erroresCampos(body));
  }

  return response.json();
}

export async function getCuotas(): Promise<Cuota[]> {
  const response = await authenticatedFetch("/cuotas");

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const mensaje = response.status === 401
      ? "Tu sesión ha caducado. Vuelve a iniciar sesión."
      : response.status === 403
        ? "No tienes permiso para ver las cuotas."
        : typeof body?.message === "string"
          ? body.message
          : "No se pudieron cargar las cuotas.";
    throw new Error(mensaje);
  }

  return response.json();
}

export function createCuota(data: CreateCuotaData): Promise<Cuota> {
  return guardarCuota("/cuotas", "POST", data, "registrar");
}

export function updateCuota(idCuota: number, data: UpdateCuotaData): Promise<Cuota> {
  return guardarCuota(`/cuotas/${idCuota}`, "PUT", data, "modificar");
}

function mensajeBorrado(status: number, body: CuerpoError | null): string {
  if (status === 401) return "Tu sesión ha caducado. Vuelve a iniciar sesión.";
  if (status === 403) return "No tienes permiso para eliminar cuotas.";
  if (status >= 500) return "No se pudo eliminar la cuota. Inténtalo de nuevo.";
  if (typeof body?.message === "string" && body.message.trim()) return body.message;
  return "No se pudo eliminar la cuota.";
}

export async function deleteCuota(idCuota: number): Promise<void> {
  const response = await authenticatedFetch(`/cuotas/${idCuota}`, { method: "DELETE" });
  if (response.ok) return;

  const body = cuerpoError(await response.json().catch(() => null));
  const code = typeof body?.code === "string" ? body.code : undefined;
  throw new CuotaApiError(mensajeBorrado(response.status, body), response.status, code);
}
