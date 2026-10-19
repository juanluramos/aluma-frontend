import { authenticatedFetch } from "../services/authService";
import { getActividades } from "../services/actividadService";
import { getUsuarios } from "../services/usuarioService";
import { nombreCompletoUsuario, normalizarBusqueda } from "./usuariosListado";

export interface OpcionActividad {
  id_actividad: number;
  titulo: string;
}

export interface OpcionUsuario {
  id_usuario: number;
  nombre: string;
  codigo?: string;
}

function porNombre<T>(items: T[], texto: (item: T) => string): T[] {
  return [...items].sort((a, b) => texto(a).localeCompare(texto(b), "es"));
}

export async function cargarActividadesInscripcion(): Promise<OpcionActividad[]> {
  const actividades = await getActividades();

  return porNombre(
    actividades.map((actividad) => ({
      id_actividad: actividad.id_actividad,
      titulo: actividad.titulo.trim() || "Actividad no disponible",
    })),
    (actividad) => actividad.titulo,
  );
}

export async function cargarUsuariosInscripcion(): Promise<OpcionUsuario[]> {
  const usuarios = await getUsuarios();

  return porNombre(
    usuarios.map((usuario) => ({
      id_usuario: usuario.id_usuario,
      nombre: nombreCompletoUsuario(usuario) || "Usuario no disponible",
      codigo: usuario.codUsuario?.trim() ?? "",
    })),
    (usuario) => usuario.nombre,
  );
}

export function buscarActividadesInscripcion(
  actividades: readonly OpcionActividad[],
  titulo: string,
  codigo: string,
): OpcionActividad[] {
  const consultaTitulo = normalizarBusqueda(titulo);
  const consultaCodigo = normalizarBusqueda(codigo);
  if (!consultaTitulo && !consultaCodigo) return [];

  return actividades.filter((actividad) => {
    const coincideTitulo = !consultaTitulo
      || normalizarBusqueda(actividad.titulo).includes(consultaTitulo);
    const coincideCodigo = !consultaCodigo
      || String(actividad.id_actividad).includes(consultaCodigo);
    return coincideTitulo && coincideCodigo;
  });
}

export function buscarUsuariosInscripcion(
  usuarios: readonly OpcionUsuario[],
  nombre: string,
  codigo: string,
): OpcionUsuario[] {
  const consultaNombre = normalizarBusqueda(nombre);
  const consultaCodigo = normalizarBusqueda(codigo);
  if (!consultaNombre && !consultaCodigo) return [];

  return usuarios.filter((usuario) => {
    const coincideNombre = !consultaNombre
      || normalizarBusqueda(usuario.nombre).includes(consultaNombre);
    const codigoUsuario = normalizarBusqueda(usuario.codigo ?? "");
    const coincideCodigo = !consultaCodigo
      || (codigoUsuario !== "" && codigoUsuario.includes(consultaCodigo));
    return coincideNombre && coincideCodigo;
  });
}

export async function cargarNombrePropio(id: number): Promise<string> {
  try {
    const response = await authenticatedFetch(`/usuarios/${id}`);
    if (!response.ok) return "Tu usuario";

    const usuario = await response.json() as {
      nombre?: string;
      apellido1?: string | null;
      apellido2?: string | null;
    };
    const nombre = [usuario.nombre, usuario.apellido1, usuario.apellido2]
      .filter(Boolean)
      .join(" ");

    return nombre || "Tu usuario";
  } catch {
    return "Tu usuario";
  }
}
