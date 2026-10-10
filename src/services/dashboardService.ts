import { authenticatedFetch } from "./authService";

export type DashboardSummary = {
  usuarios: number;
  usuariosActivos: number;
  actividadesActivas: number;
  inscripciones: number;
};

export type UpcomingActivity = {
  id: number;
  titulo: string;
  fecha: string;
  aforo: number | null;
  inscritos: number;
};

export type AnnualAttendance = {
  month: string;
  actual: number;
  anterior: number;
};

export type PaymentStatus = {
  name: string;
  value: number;
};

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const response = await authenticatedFetch(
    "/dashboard/resumen"
  );

  if (!response.ok) {
    throw new Error("Error al obtener el resumen del dashboard");
  }

  return response.json();
}

export async function getUpcomingActivities(): Promise<UpcomingActivity[]> {
  const response = await authenticatedFetch(
    "/dashboard/proximas-actividades"
  );

  if (!response.ok) {
    throw new Error("Error al obtener las próximas actividades");
  }

  return response.json();
}

export async function getAnnualAttendance(): Promise<AnnualAttendance[]> {
  const response = await authenticatedFetch(
    "/dashboard/asistencia-anual"
  );

  if (!response.ok) {
    throw new Error("Error al obtener la asistencia anual");
  }

  return response.json();
}

export async function getPaymentStatus(): Promise<PaymentStatus[]> {
  const response = await authenticatedFetch(
    "/dashboard/estado-pagos"
  );

  if (!response.ok) {
    throw new Error("Error al obtener el estado de pagos");
  }

  return response.json();
}