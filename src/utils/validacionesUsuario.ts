import { esFechaCalendario } from './fechaCalendario';

const LETRAS_DOCUMENTO = 'TRWAGMYFPDXBNJZSQVHLCKE';
export const normalizarDocumento = (valor: string) => valor.trim().toUpperCase();
export const normalizarTelefono = (valor: string) => valor.replace(/\s/g, '');
export const normalizarEmail = (valor: string) => valor.trim().toLowerCase();

export function validarDni(valor: string): boolean {
  const dni = normalizarDocumento(valor);
  return /^\d{8}[A-Z]$/.test(dni) && LETRAS_DOCUMENTO[Number(dni.slice(0, 8)) % 23] === dni[8];
}

export function validarNie(valor: string): boolean {
  const nie = normalizarDocumento(valor);
  if (!/^[XYZ]\d{7}[A-Z]$/.test(nie)) return false;
  const numero = 'XYZ'.indexOf(nie[0]) + nie.slice(1, 8);
  return validarDni(numero + nie[8]);
}

// Política de formato de ALUMA (5–20 alfanuméricos), no una regla universal
// ni una validación de MRZ o autenticidad. No se conoce el país emisor.
export function validarPasaporte(valor: string): boolean {
  return /^[A-Z0-9]{5,20}$/.test(normalizarDocumento(valor));
}

export function validarPermisoTrabajo(valor: string): boolean {
  const numero = normalizarDocumento(valor);
  // Sin subtipo solo reconocemos NIE completos; el resto conserva el formato
  // genérico de ALUMA. No acredita vigencia ni autorización para trabajar.
  if (/^[XYZ]\d{7}[A-Z]$/.test(numero)) return validarNie(numero);
  return /^[A-Z0-9-]{5,30}$/.test(numero) && /[A-Z0-9]/.test(numero);
}

export function validarTelefono(valor: string): boolean {
  // Móviles (6, 71–79) y numeración geográfica (81–88, 91–98).
  return /^(?:\+34)?(?:6\d|7[1-9]|[89][1-8])\d{7}$/.test(normalizarTelefono(valor));
}

export function validarEmail(valor: string): boolean {
  const email = normalizarEmail(valor);
  const partes = email.split('@');
  if (partes.length !== 2 || email.length > 254) return false;
  const [local, dominio] = partes;
  return local.length <= 64 && /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/i.test(local)
    && dominio.includes('.') && dominio.split('.').every(segmento => /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(segmento) && segmento.length <= 63);
}

export function validarCodigoUsuario(valor: string): boolean {
  return /^(?:[A-Z0-9_-]{1,10})?$/.test(valor.trim().toUpperCase());
}

export function validarNombre(valor: string, obligatorio = true): boolean {
  const texto = valor.trim();
  return (!obligatorio && texto === '') || (texto.length <= 50 && /^[\p{L}\p{M} -]+$/u.test(texto) && /\p{L}/u.test(texto));
}

export function validarPassword(valor: string): boolean {
  const password = valor.trim();
  return password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password);
}

export type FormularioUsuario = {
  codUsuario: string;
  tipoDocumento: string;
  numeroDocumento: string;
  nombre: string;
  apellido1: string;
  apellido2: string;
  email: string;
  telefono: string;
  comentario: string;
  fechaInscripcion: string;
  password: string;
  confirmPassword: string;
};
export type ErroresUsuario = Partial<Record<keyof FormularioUsuario, string>>;

export function validarDocumentoUsuario(tipoDocumento: string, numeroDocumento: string): ErroresUsuario {
  const errores: ErroresUsuario = {};
  const tipo = tipoDocumento.trim();
  const numero = numeroDocumento.trim();
  if (tipo === '' && numero === '') return errores;
  switch (tipo) {
    case '1': if (!validarDni(numeroDocumento)) errores.numeroDocumento = 'El DNI no es válido.'; break;
    case '2': if (!validarNie(numeroDocumento)) errores.numeroDocumento = 'El NIE no es válido.'; break;
    case '3': if (!validarPasaporte(numeroDocumento)) errores.numeroDocumento = 'El pasaporte no tiene un formato válido.'; break;
    case '4': if (!validarPermisoTrabajo(numeroDocumento)) errores.numeroDocumento = 'El permiso de trabajo no tiene un formato válido.'; break;
    default: errores.tipoDocumento = 'Selecciona un tipo de documento.';
  }
  return errores;
}

export function normalizarUsuario(formulario: FormularioUsuario): FormularioUsuario {
  return {
    codUsuario: formulario.codUsuario.trim().toUpperCase(),
    tipoDocumento: formulario.tipoDocumento.trim(),
    numeroDocumento: normalizarDocumento(formulario.numeroDocumento),
    nombre: formulario.nombre.trim(),
    apellido1: formulario.apellido1.trim(),
    apellido2: formulario.apellido2.trim(),
    email: normalizarEmail(formulario.email),
    telefono: normalizarTelefono(formulario.telefono),
    comentario: formulario.comentario.trim(),
    fechaInscripcion: formulario.fechaInscripcion.trim(),
    password: formulario.password.trim(),
    confirmPassword: formulario.confirmPassword.trim(),
  };
}

export function validarUsuario(
  formulario: FormularioUsuario,
  mode: 'create' | 'edit',
  contexto: { exigePassword?: boolean; exigeEmail?: boolean } = {},
): ErroresUsuario {
  const datos = normalizarUsuario(formulario);
  const errores: ErroresUsuario = {};
  Object.assign(errores, validarDocumentoUsuario(datos.tipoDocumento, datos.numeroDocumento));
  if (!validarCodigoUsuario(datos.codUsuario)) errores.codUsuario = 'El código de usuario no tiene un formato válido.';
  if (!datos.nombre) errores.nombre = 'El nombre es obligatorio.';
  else if (!validarNombre(datos.nombre)) errores.nombre = 'El nombre solo puede contener letras, espacios y guiones (máximo 50 caracteres).';
  if (!validarNombre(datos.apellido1, false)) errores.apellido1 = 'El primer apellido solo puede contener letras, espacios y guiones (máximo 50 caracteres).';
  if (!validarNombre(datos.apellido2, false)) errores.apellido2 = 'El segundo apellido solo puede contener letras, espacios y guiones (máximo 50 caracteres).';
  if (!datos.email) {
    if (contexto.exigeEmail) errores.email = 'El email es obligatorio para un operador o un administrador.';
  } else if (!validarEmail(datos.email)) errores.email = 'El email no es válido.';
  if (datos.telefono && !validarTelefono(datos.telefono)) errores.telefono = 'El teléfono no es válido.';
  const cambiaPassword = mode === 'edit' && (formulario.password !== '' || formulario.confirmPassword !== '');
  if ((mode === 'create' && contexto.exigePassword) || cambiaPassword) {
    if (!validarPassword(datos.password)) errores.password = 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.';
    if (datos.password !== datos.confirmPassword) errores.confirmPassword = 'Las contraseñas no coinciden.';
    else if (!datos.confirmPassword) errores.confirmPassword = 'Confirma la contraseña.';
  }
  if (datos.comentario.length > 500) errores.comentario = 'Los comentarios no pueden superar los 500 caracteres.';
  if (!datos.fechaInscripcion) errores.fechaInscripcion = 'La fecha de inscripción es obligatoria.';
  else if (!esFechaCalendario(datos.fechaInscripcion)) errores.fechaInscripcion = 'La fecha de inscripción no es válida.';
  return errores;
}
