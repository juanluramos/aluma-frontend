export type Rol =
  | "Usuario"
  | "Operador"
  | "Administrador";

export type Permission =
  | "verDashboard"
  | "verUsuarios"
  | "crearUsuarios"
  | "editarUsuarios"
  | "editarPerfil"
  | "cambiarRolUsuario"
  | "cambiarEstadoUsuario"
  | "eliminarUsuarios"
  | "verActividades"
  | "gestionarActividades"
  | "verInscripciones"
  | "gestionarInscripciones"
  | "verContabilidad"
  | "verCuotas"
  | "gestionarConfiguracionCuota";

export const permissions: Record<Permission, Rol[]> = {
  editarPerfil: ["Usuario", "Operador", "Administrador"],
  cambiarRolUsuario: ["Administrador"],
  verDashboard: [
    "Usuario",
    "Operador",
    "Administrador",
  ],

  verUsuarios: [
    "Operador",
    "Administrador",
  ],

  crearUsuarios: [
    "Operador",
    "Administrador",
  ],

  editarUsuarios: [
    "Operador",
    "Administrador",
  ],

  cambiarEstadoUsuario: [
    "Administrador",
  ],

  eliminarUsuarios: [
    "Administrador",
  ],

  verActividades: [
    "Usuario",
    "Operador",
    "Administrador",
  ],

  gestionarActividades: [
    "Operador",
    "Administrador",
  ],

  verInscripciones: [
    "Usuario",
    "Operador",
    "Administrador",
  ],

  gestionarInscripciones: [
    "Operador",
    "Administrador",
  ],

  verContabilidad: [
    "Administrador",
  ],

  verCuotas: [
    "Operador",
    "Administrador",
  ],

  gestionarConfiguracionCuota: [
    "Administrador",
  ],
};

export function hasPermission(
  rol: Rol | null | undefined,
  permission: Permission
): boolean {
  return rol != null && permissions[permission].includes(rol);
}
