import type { UpdateUsuarioData, Usuario } from '../services/usuarioService';

export type PerfilEditable = Pick<Usuario, 'nombre' | 'apellido1' | 'apellido2' | 'telefono' | 'email'>;

/** La contraseña solo viaja si el usuario escribe una nueva. */
export function datosPerfil(perfil: PerfilEditable, password: string): UpdateUsuarioData {
  const datos: UpdateUsuarioData = {
    nombre: perfil.nombre,
    apellido1: perfil.apellido1 ?? '',
    apellido2: perfil.apellido2 ?? '',
    telefono: perfil.telefono ?? '',
    email: perfil.email,
  };
  const clave = password.trim();
  return clave ? { ...datos, password: clave } : datos;
}
