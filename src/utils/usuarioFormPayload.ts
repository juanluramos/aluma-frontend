import type { FormularioUsuario } from './validacionesUsuario';
import type { CreateUsuarioData, UpdateUsuarioData } from '../services/usuarioService';

type DatosFormulario = Readonly<Omit<FormularioUsuario, 'confirmPassword'>>;
type EstadoAdministrativo = Readonly<{
  rol: string;
  estado: string;
  socio: boolean;
  matriculaPagada: boolean;
}>;
type OpcionesCreacion = Readonly<{
  puedeCambiarRol: boolean;
  puedeCambiarEstado: boolean;
  puedeCambiarSocio: boolean;
}>;
type OpcionesEdicion = Readonly<{
  documentoSinCambios: boolean;
  puedeCambiarRol: boolean;
  puedeCambiarEstado: boolean;
  puedeCambiarSocio: boolean;
}>;

const ID_ROL_USUARIO = 1;
const ID_ESTADO_ACTIVO = 1;

// Reciben los datos ya validados y normalizados por el formulario.
export function construirDatosCreacionUsuario(
  datos: DatosFormulario,
  administrativo: EstadoAdministrativo,
  opciones: OpcionesCreacion,
): CreateUsuarioData {
  const conDocumento = datos.tipoDocumento !== '' && datos.numeroDocumento !== '';
  const idRol = opciones.puedeCambiarRol ? Number(administrativo.rol) : ID_ROL_USUARIO;
  const conCuenta = idRol === 2 || idRol === 3;
  return {
    codUsuario: datos.codUsuario || undefined,
    ...(conDocumento && {
      id_tipo_documento: Number(datos.tipoDocumento),
      numeroDocumento: datos.numeroDocumento,
    }),
    nombre: datos.nombre,
    apellido1: datos.apellido1 || undefined,
    apellido2: datos.apellido2 || undefined,
    ...(datos.email ? { email: datos.email } : {}),
    telefono: datos.telefono || undefined,
    id_rol: idRol,
    socio: opciones.puedeCambiarSocio ? administrativo.socio : false,
    matriculaPagada: opciones.puedeCambiarSocio ? administrativo.matriculaPagada : false,
    id_estado_usuario: opciones.puedeCambiarEstado ? Number(administrativo.estado) : ID_ESTADO_ACTIVO,
    comentario: datos.comentario || undefined,
    fechaInscripcion: datos.fechaInscripcion,
    ...(conCuenta && datos.password ? { password: datos.password } : {}),
  };
}

export function construirDatosEdicionUsuario(
  datos: DatosFormulario,
  administrativo: EstadoAdministrativo,
  opciones: OpcionesEdicion,
): UpdateUsuarioData {
  return {
    codUsuario: datos.codUsuario || undefined,
    ...(!opciones.documentoSinCambios && (
      datos.tipoDocumento === '' && datos.numeroDocumento === ''
        ? { id_tipo_documento: null, numeroDocumento: null }
        : {
            id_tipo_documento: Number(datos.tipoDocumento),
            numeroDocumento: datos.numeroDocumento,
          }
    )),
    nombre: datos.nombre,
    apellido1: datos.apellido1 || undefined,
    apellido2: datos.apellido2 || undefined,
    email: datos.email || null,
    telefono: datos.telefono || undefined,
    ...(opciones.puedeCambiarRol && { id_rol: Number(administrativo.rol) }),
    ...(opciones.puedeCambiarSocio && {
      socio: administrativo.socio,
      matriculaPagada: administrativo.matriculaPagada,
    }),
    ...(opciones.puedeCambiarEstado && { id_estado_usuario: Number(administrativo.estado) }),
    comentario: datos.comentario || undefined,
    fechaInscripcion: datos.fechaInscripcion,
    ...(datos.password ? { password: datos.password } : {}),
  };
}
