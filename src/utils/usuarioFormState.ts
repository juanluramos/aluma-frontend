import type { Usuario } from '../services/usuarioService';
import { fechaHoyCalendario, fechaParaCampo } from './fechaCalendario';
import { capitalizarTexto } from './usuariosListado';
import type { FormularioUsuario } from './validacionesUsuario';

export type ValoresInicialesUsuarioForm = FormularioUsuario & {
  rol: string;
  estado: string;
  socio: boolean;
  matriculaPagada: boolean;
};

/**
 * Valores iniciales de los campos de negocio del formulario de usuario.
 * Conserva la semántica actual de los useState: la presencia de `usuario`
 * determina creación vs edición. `mode` forma parte de la API pública.
 */
export function obtenerValoresIniciales(
  mode: 'create' | 'edit',
  usuario?: Usuario,
): ValoresInicialesUsuarioForm {
  void mode;

  if (usuario) {
    return {
      codUsuario: usuario.codUsuario ?? '',
      tipoDocumento: usuario.id_tipo_documento == null ? '' : String(usuario.id_tipo_documento),
      numeroDocumento: usuario.numeroDocumento ?? '',
      nombre: capitalizarTexto(usuario.nombre ?? ''),
      apellido1: capitalizarTexto(usuario.apellido1 ?? ''),
      apellido2: capitalizarTexto(usuario.apellido2 ?? ''),
      email: usuario.email ?? '',
      telefono: usuario.telefono ?? '',
      comentario: capitalizarTexto(usuario.comentario ?? ''),
      fechaInscripcion: fechaParaCampo(usuario.fechaInscripcion),
      password: '',
      confirmPassword: '',
      rol: String(usuario.id_rol),
      estado: String(usuario.id_estado_usuario),
      socio: usuario.socio ?? false,
      matriculaPagada: usuario.matriculaPagada ?? false,
    };
  }

  return {
    codUsuario: '',
    tipoDocumento: '',
    numeroDocumento: '',
    nombre: '',
    apellido1: '',
    apellido2: '',
    email: '',
    telefono: '',
    comentario: '',
    fechaInscripcion: fechaHoyCalendario(),
    password: '',
    confirmPassword: '',
    rol: '1',
    estado: '1',
    socio: false,
    matriculaPagada: false,
  };
}
