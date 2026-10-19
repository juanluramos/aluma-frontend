import { ESTADOS_ACTIVIDAD, type ActividadFormState } from "./actividadFormState";

export type ErroresActividad = Partial<Record<keyof ActividadFormState, string>>;

export function validarActividad(datos: ActividadFormState): ErroresActividad {
  const errores: ErroresActividad = {};
  if (!datos.titulo.trim() || datos.titulo.trim().length > 100) {
    errores.titulo = "Introduce un título de entre 1 y 100 caracteres.";
  }
  if (datos.fecha && (!/^\d{4}-\d{2}-\d{2}$/.test(datos.fecha) ||
    !Number.isFinite(Date.parse(datos.fecha)) ||
    new Date(datos.fecha).toISOString().slice(0, 10) !== datos.fecha)) {
    errores.fecha = "Introduce una fecha válida.";
  }
  if (datos.aforo && (!/^\d+$/.test(datos.aforo) || Number(datos.aforo) < 1 || Number(datos.aforo) > 2147483647)) {
    errores.aforo = "El aforo debe ser un entero entre 1 y 2147483647.";
  }
  for (const campo of ["importeSocio", "importeNoSocio"] as const) {
    if (datos[campo] && (!/^\d+(\.\d{1,2})?$/.test(datos[campo]) || Number(datos[campo]) > 99999999.99)) {
      errores[campo] = "Introduce un precio entre 0 y 99999999,99, con hasta dos decimales.";
    }
  }
  if (!ESTADOS_ACTIVIDAD.some(estado => String(estado.id) === datos.id_estado_actividad)) {
    errores.id_estado_actividad = "Selecciona un estado válido.";
  }
  return errores;
}
