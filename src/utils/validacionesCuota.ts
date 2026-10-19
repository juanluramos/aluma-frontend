import { esFechaCalendario } from "./fechaCalendario";
import type { CuotaFormState } from "./cuotaFormState";

export const PAGO_ANIO_MINIMO = 1970;
export const PAGO_ANIO_MAXIMO = 2100;

export type ErroresCuota = Partial<Record<keyof CuotaFormState, string>>;

function claseControles(): string {
  const caracter = (codigo: number) => String.fromCharCode(codigo);
  return `[${caracter(0)}-${caracter(8)}${caracter(11)}${caracter(12)}${caracter(14)}-${caracter(31)}${caracter(127)}]`;
}

const CONTROLES = new RegExp(claseControles());
const ENTERO = /^\d+$/;

export function validarCuota(datos: CuotaFormState): ErroresCuota {
  const errores: ErroresCuota = {};
  const idUsuario = Number(datos.id_usuario);
  if (!ENTERO.test(datos.id_usuario) || !Number.isSafeInteger(idUsuario) || idUsuario < 1 || idUsuario > 2147483647) {
    errores.id_usuario = "Selecciona un usuario.";
  }
  const anio = Number(datos.pagoAnio);
  if (!ENTERO.test(datos.pagoAnio) || !Number.isInteger(anio) || anio < PAGO_ANIO_MINIMO || anio > PAGO_ANIO_MAXIMO) {
    errores.pagoAnio = `El año de la cuota debe ser un entero entre ${PAGO_ANIO_MINIMO} y ${PAGO_ANIO_MAXIMO}.`;
  }
  if (!esFechaCalendario(datos.fechaPago)) {
    errores.fechaPago = "La fecha de pago no es válida.";
  }
  if (CONTROLES.test(datos.comentario)) {
    errores.comentario = "El comentario contiene caracteres no permitidos.";
  } else if (datos.comentario.trim().length > 500) {
    errores.comentario = "El comentario no puede superar los 500 caracteres.";
  }
  return errores;
}
