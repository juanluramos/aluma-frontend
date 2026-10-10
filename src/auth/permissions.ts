export type Rol =
  | "Usuario"
  | "Operador"
  | "Administrador";

export type Permission =
  | "verDashboard"
  | "verUsuarios"
  | "crearUsuarios"
  | "editarUsuarios"
  | "cambiarEstadoUsuario"
  | "verActividades"
  | "gestionarActividades"
  | "verInscripciones"
  | "gestionarInscripciones"
  | "verContabilidad";

export const permissions: Record<Permission, Rol[]> = {
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
};

export function hasPermission(
  rol: Rol | null | undefined,
  permission: Permission
): boolean {
  return rol != null && permissions[permission].includes(rol);
}
