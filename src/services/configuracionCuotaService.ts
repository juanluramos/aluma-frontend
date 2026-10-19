import { authenticatedFetch } from "./authService";
import { mensajeConfiguracionCuota, type DatosConfiguracionCuota } from "../utils/configuracionCuotaForm";

export type ConfiguracionCuotaAnual = {
  id_configuracion: number;
  anio: number;
  importe: string;
  createAt: string;
  updateAt: string;
};

export class ConfiguracionCuotaApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ConfiguracionCuotaApiError";
    this.status = status;
    this.code = code;
  }
}

type CuerpoError = { message?: unknown; code?: unknown };

function cuerpoError(valor: unknown): CuerpoError | null {
  return valor && typeof valor === "object" ? valor as CuerpoError : null;
}

function fallar(status: number, body: CuerpoError | null, accion: "cargar" | "guardar" | "eliminar"): never {
  const code = typeof body?.code === "string" ? body.code : undefined;
  throw new ConfiguracionCuotaApiError(mensajeConfiguracionCuota(status, code, accion), status, code);
}

export async function getConfiguracionesCuota(): Promise<ConfiguracionCuotaAnual[]> {
  const response = await authenticatedFetch("/configuracion-cuotas");
  if (!response.ok) fallar(response.status, cuerpoError(await response.json().catch(() => null)), "cargar");
  return response.json();
}

export async function createConfiguracionCuota(data: DatosConfiguracionCuota): Promise<ConfiguracionCuotaAnual> {
  const response = await authenticatedFetch("/configuracion-cuotas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) fallar(response.status, cuerpoError(await response.json().catch(() => null)), "guardar");
  return response.json();
}

export async function updateConfiguracionCuota(id: number, data: DatosConfiguracionCuota): Promise<ConfiguracionCuotaAnual> {
  const response = await authenticatedFetch(`/configuracion-cuotas/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) fallar(response.status, cuerpoError(await response.json().catch(() => null)), "guardar");
  return response.json();
}

export async function deleteConfiguracionCuota(id: number): Promise<void> {
  const response = await authenticatedFetch(`/configuracion-cuotas/${id}`, { method: "DELETE" });
  if (response.ok) return;
  fallar(response.status, cuerpoError(await response.json().catch(() => null)), "eliminar");
}
