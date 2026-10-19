import type { Usuario } from '../services/usuarioService';
import { ordenFechaCalendario } from './fechaCalendario';

export type CampoOrden = 'fechaInscripcion' | 'codigo' | 'nombre';

export type DireccionOrden = 'asc' | 'desc';

export type EstadoFiltroUsuarios = '' | 'activo' | 'pendiente' | 'inactivo';

export type SocioFiltroUsuarios = '' | 'socio' | 'no-socio';

export type CriteriosFiltroUsuarios = {
  busqueda: string;
  estado: EstadoFiltroUsuarios | string;
  socio: SocioFiltroUsuarios | string;
};

export type EstadisticasUsuarios = {
  total: number;
  activos: number;
  pendientes: number;
};

export function normalizarBusqueda(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function capitalizarTexto(valor: string): string {
  const texto = valor.trim();
  if (texto === "") return "";
  return texto.charAt(0).toLocaleUpperCase("es") + texto.slice(1).toLocaleLowerCase("es");
}

export function nombreCompletoUsuario(usuario: {
  nombre: string;
  apellido1?: string | null;
  apellido2?: string | null;
}): string {
  return [usuario.nombre, usuario.apellido1, usuario.apellido2]
    .filter((parte): parte is string => typeof parte === "string" && parte.trim() !== "")
    .map(capitalizarTexto)
    .join(" ");
}

export function filtrarUsuarios(
  usuarios: readonly Usuario[],
  criterios: CriteriosFiltroUsuarios,
): Usuario[] {
  const textoBusqueda = normalizarBusqueda(criterios.busqueda);

  return usuarios.filter((usuario) => {
    const nombreCompleto = normalizarBusqueda(nombreCompletoUsuario(usuario));
    const codigo = normalizarBusqueda(usuario.codUsuario ?? '');

    const coincideBusqueda =
      !textoBusqueda
      || nombreCompleto.includes(textoBusqueda)
      || codigo.startsWith(textoBusqueda);

    let coincideEstado = true;

    if (criterios.estado === 'activo') {
      coincideEstado = usuario.id_estado_usuario === 1;
    }

    if (criterios.estado === 'pendiente') {
      coincideEstado = usuario.id_estado_usuario === 3;
    }

    if (criterios.estado === 'inactivo') {
      coincideEstado = usuario.id_estado_usuario === 2;
    }

    let coincideSocio = true;

    if (criterios.socio === 'socio') {
      coincideSocio = usuario.socio;
    }

    if (criterios.socio === 'no-socio') {
      coincideSocio = !usuario.socio;
    }

    return coincideBusqueda && coincideEstado && coincideSocio;
  });
}

export function ordenarUsuarios(
  usuarios: readonly Usuario[],
  campo: CampoOrden,
  direccion: DireccionOrden,
): Usuario[] {
  return [...usuarios].sort((usuarioA, usuarioB) => {
    if (campo === 'fechaInscripcion') {
      const resultado = ordenFechaCalendario(usuarioA.fechaInscripcion) - ordenFechaCalendario(usuarioB.fechaInscripcion);
      return direccion === 'asc' ? resultado : -resultado;
    }

    let valorA = '';
    let valorB = '';

    if (campo === 'codigo') {
      valorA = usuarioA.codUsuario ?? '';
      valorB = usuarioB.codUsuario ?? '';
    }

    if (campo === 'nombre') {
      valorA = nombreCompletoUsuario(usuarioA);
      valorB = nombreCompletoUsuario(usuarioB);
    }

    const resultado = valorA.localeCompare(valorB, 'es', {
      sensitivity: 'base',
      numeric: true,
    });

    return direccion === 'asc' ? resultado : -resultado;
  });
}

export function calcularEstadisticasUsuarios(
  usuarios: readonly Usuario[],
): EstadisticasUsuarios {
  return {
    total: usuarios.length,
    activos: usuarios.filter((usuario) => usuario.id_estado_usuario === 1).length,
    pendientes: usuarios.filter((usuario) => !usuario.matriculaPagada).length,
  };
}

export function reemplazarUsuarioEnLista(
  usuarios: readonly Usuario[],
  usuarioActualizado: Usuario,
): Usuario[] {
  return usuarios.map((usuario) =>
    usuario.id_usuario === usuarioActualizado.id_usuario
      ? usuarioActualizado
      : usuario,
  );
}

export function eliminarUsuarioDeLista(
  usuarios: readonly Usuario[],
  id: number,
): Usuario[] {
  return usuarios.filter((usuario) => usuario.id_usuario !== id);
}
