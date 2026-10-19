import type { CreateCuotaData, UpdateCuotaData } from "../services/cuotaService";
import type { CuotaFormState } from "./cuotaFormState";

export function construirDatosCuota(valores: CuotaFormState): CreateCuotaData {
  const comentario = valores.comentario.trim();
  const datos: CreateCuotaData = {
    id_usuario: Number(valores.id_usuario),
    pagoAnio: Number(valores.pagoAnio),
    fechaPago: valores.fechaPago,
  };
  if (comentario) datos.comentario = comentario;
  return datos;
}

export function construirActualizacionCuota(valores: CuotaFormState): UpdateCuotaData {
  return {
    id_usuario: Number(valores.id_usuario),
    pagoAnio: Number(valores.pagoAnio),
    fechaPago: valores.fechaPago,
    comentario: valores.comentario.trim(),
  };
}
