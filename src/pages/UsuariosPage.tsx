import { usePreferenciaSesion } from "../hooks/usePreferenciaSesion";
import "./UsuariosPage.css";

import { useEffect, useState, useSyncExternalStore } from "react";

import { hasPermission } from "../auth/permissions";
import { useRole } from "../auth/useRole";

import Paginacion, { REGISTROS_POR_PAGINA } from "../components/Paginacion";
import ConfirmarEliminarUsuario from "../components/usuarios/ConfirmarEliminarUsuario";
import UsuarioFormModal from "../components/usuarios/UsuarioFormModal";
import UsuariosFiltros from "../components/usuarios/UsuariosFiltros";
import UsuariosTable from "../components/usuarios/UsuariosTable";

import { session } from "../services/authService";
import {
  deleteUsuario,
  getUsuarios,
  type Usuario,
} from "../services/usuarioService";

import {
  type CampoOrden,
  type DireccionOrden,
  calcularEstadisticasUsuarios,
  eliminarUsuarioDeLista,
  filtrarUsuarios,
  ordenarUsuarios,
  reemplazarUsuarioEnLista,
} from "../utils/usuariosListado";

import usuariosIcono from "../assets/icons/navigation/usuarios_icono.webp";
import activosIcono from "../assets/icons/navigation/activos_icono.webp";
import pendientesIcono from "../assets/icons/navigation/pendientes_icono.webp";
import buscarIcono from "../assets/icons/navigation/buscar.webp";

function UsuariosPage() {
  const role = useRole();
  const idUsuarioActual = useSyncExternalStore(
    session.subscribe,
    session.getUserId,
  );

  const [
    usuarios,
    setUsuarios,
  ] = useState<Usuario[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  /*
   * MODAL NUEVO USUARIO
   */

  const [
    nuevoUsuarioOpen,
    setNuevoUsuarioOpen,
  ] = useState(false);

  /*
   * MODAL EDITAR USUARIO
   */

  const [
    usuarioSeleccionado,
    setUsuarioSeleccionado,
  ] =
    useState<Usuario | null>(
      null,
    );

  const [
    editarUsuarioOpen,
    setEditarUsuarioOpen,
  ] = useState(false);

  /*
   * MODAL ELIMINAR USUARIO
   */

  const [
    usuarioAEliminar,
    setUsuarioAEliminar,
  ] = useState<Usuario | null>(null);

  const [
    eliminando,
    setEliminando,
  ] = useState(false);

  const [
    errorEliminar,
    setErrorEliminar,
  ] = useState<string | null>(null);

  const [
    recargarTras404,
    setRecargarTras404,
  ] = useState(false);

  /*
   * FILTROS
   */

  const [
    busqueda,
    setBusqueda,
  ] = usePreferenciaSesion<string>("usuarios.busqueda", "");

  const [
    estadoFiltro,
    setEstadoFiltro,
  ] = usePreferenciaSesion<string>("usuarios.estadoFiltro", "activo", ["", "activo", "pendiente", "inactivo", "ninguno"]);

  const [
    socioFiltro,
    setSocioFiltro,
  ] = usePreferenciaSesion<string>("usuarios.socioFiltro", "", ["", "socio", "no-socio", "ninguno"]);

  /*
   * ORDEN
   */

  const [
    campoOrden,
    setCampoOrden,
  ] =
    usePreferenciaSesion<CampoOrden>("usuarios.ordenCampo", "fechaInscripcion", ["fechaInscripcion", "codigo", "nombre"]);

  const [
    direccionOrden,
    setDireccionOrden,
  ] =
    usePreferenciaSesion<DireccionOrden>("usuarios.ordenDireccion", "desc", ["asc", "desc"]);

  const [pagina, setPagina] = usePreferenciaSesion<number>("usuarios.pagina", 1);


  /*
   * PERMISOS
   */

  const puedeEditarUsuarios =
    hasPermission(
      role,
      "editarUsuarios",
    );

  const puedeEliminarUsuarios =
    hasPermission(
      role,
      "eliminarUsuarios",
    );

  const puedeVerRol =
    hasPermission(
      role,
      "cambiarRolUsuario",
    );

  /*
   * CARGAR USUARIOS
   */

  useEffect(() => {
    async function cargarUsuarios() {
      try {
        setLoading(true);

        setError(null);

        const datos =
          await getUsuarios();

        setUsuarios(datos);
      } catch (error) {
        console.error(
          "Error al cargar usuarios:",
          error,
        );

        setError(
          error instanceof Error
            ? error.message
            : "No se han podido cargar los usuarios.",
        );
      } finally {
        setLoading(false);
      }
    }

    void cargarUsuarios();
  }, []);

  /*
   * ORDENACIÓN
   */

  function cambiarOrden(
    campo: CampoOrden,
  ) {
    if (
      campoOrden === campo
    ) {
      setDireccionOrden(
        (
          direccionActual,
        ) =>
          direccionActual ===
          "asc"
            ? "desc"
            : "asc",
      );

      return;
    }

    setCampoOrden(campo);

    setDireccionOrden(
      campo === "fechaInscripcion"
        ? "desc"
        : "asc",
    );
  }

  /*
   * EDITAR USUARIO
   */

  function handleEditarUsuario(
    usuario: Usuario,
  ) {
    if (
      !puedeEditarUsuarios
    ) {
      return;
    }

    setUsuarioSeleccionado(
      usuario,
    );

    setEditarUsuarioOpen(
      true,
    );
  }

  function handleCerrarEdicion() {
    setEditarUsuarioOpen(
      false,
    );

    setUsuarioSeleccionado(
      null,
    );
  }

  /*
   * ELIMINAR USUARIO
   */

  function handleSolicitarEliminar(usuario: Usuario) {
    if (!puedeEliminarUsuarios) {
      return;
    }

    if (idUsuarioActual === null) {
      return;
    }

    if (usuario.id_usuario === idUsuarioActual) {
      return;
    }

    setErrorEliminar(null);
    setRecargarTras404(false);
    setUsuarioAEliminar(usuario);
  }

  function handleCancelarEliminar() {
    if (eliminando) {
      return;
    }

    const debeRecargar = recargarTras404;

    setUsuarioAEliminar(null);
    setErrorEliminar(null);
    setRecargarTras404(false);

    if (debeRecargar) {
      void (async () => {
        try {
          setLoading(true);
          setError(null);
          const datos = await getUsuarios();
          setUsuarios(datos);
        } catch (causa) {
          console.error("Error al actualizar el listado:", causa);
          setError(
            causa instanceof Error
              ? causa.message
              : "No se han podido cargar los usuarios.",
          );
        } finally {
          setLoading(false);
        }
      })();
    }
  }

  function mensajeErrorEliminar(error: unknown): string {
    const code =
      error instanceof Error
        ? (error as Error & { code?: string }).code
        : undefined;

    switch (code) {
      case "SELF_DELETION_FORBIDDEN":
        return "No puedes eliminar tu propia cuenta.";
      case "FORBIDDEN":
        return "No tienes permiso para eliminar usuarios.";
      case "USER_NOT_FOUND":
        return "El usuario ya no existe. Cancela para actualizar el listado.";
      case "FOREIGN_KEY_CONSTRAINT":
        return "Existen datos relacionados con este usuario. Desactívalo en lugar de eliminarlo.";
      default:
        return error instanceof Error
          ? error.message
          : "No se ha podido eliminar el usuario. Inténtalo de nuevo.";
    }
  }

  async function handleConfirmarEliminar() {
    if (eliminando || usuarioAEliminar === null) {
      return;
    }

    if (!hasPermission(role, "eliminarUsuarios")) {
      setErrorEliminar("No tienes permiso para eliminar usuarios.");
      return;
    }

    if (idUsuarioActual === null) {
      setErrorEliminar(
        "No se ha podido verificar tu identidad. Vuelve a iniciar sesión.",
      );
      return;
    }

    if (usuarioAEliminar.id_usuario === idUsuarioActual) {
      setErrorEliminar("No puedes eliminar tu propia cuenta.");
      return;
    }

    const id = usuarioAEliminar.id_usuario;

    setEliminando(true);
    setErrorEliminar(null);
    setRecargarTras404(false);

    try {
      await deleteUsuario(id);

      setUsuarios((usuariosActuales) =>
        eliminarUsuarioDeLista(usuariosActuales, id),
      );

      setUsuarioAEliminar(null);
      setErrorEliminar(null);
    } catch (error) {
      console.error("Error al eliminar usuario:", error);

      const code =
        error instanceof Error
          ? (error as Error & { code?: string }).code
          : undefined;

      if (code === "USER_NOT_FOUND") {
        setRecargarTras404(true);
      }

      setErrorEliminar(mensajeErrorEliminar(error));
    } finally {
      setEliminando(false);
    }
  }

  /*
   * ESTADÍSTICAS
   */

  const {
    total: totalUsuarios,
    activos: totalActivos,
    pendientes: totalPendientes,
  } = calcularEstadisticasUsuarios(usuarios);

  /*
   * FILTRAR
   */

  const usuariosFiltrados = estadoFiltro === "ninguno" || socioFiltro === "ninguno" ? [] : filtrarUsuarios(usuarios, {
    busqueda,
    estado: estadoFiltro,
    socio: socioFiltro,
  });

  /*
   * ORDENAR
   */

  const usuariosOrdenados = ordenarUsuarios(
    usuariosFiltrados,
    campoOrden,
    direccionOrden,
  );

  const totalPaginas = Math.max(
    1,
    Math.ceil(usuariosOrdenados.length / REGISTROS_POR_PAGINA),
  );
  const paginaActual = Math.min(pagina, totalPaginas);
  const inicioPagina = (paginaActual - 1) * REGISTROS_POR_PAGINA;
  const usuariosPagina = usuariosOrdenados.slice(
    inicioPagina,
    inicioPagina + REGISTROS_POR_PAGINA,
  );

  return (
    <div className="usuarios-page">
      {/* ESTADÍSTICAS */}

      <div className="usuarios-stats">
        <div className="usuarios-stat">
          <div className="usuarios-stat-icon usuarios-stat-icon-red">
            <img
              src={
                usuariosIcono
              }
              alt=""
              aria-hidden="true"
            />
          </div>

          <div>
            <span className="usuarios-stat-label">
              {role === "Operador" ? "Socios" : "Usuarios"}
            </span>

            <strong className="usuarios-stat-value">
              {totalUsuarios}
            </strong>
          </div>
        </div>

        <div className="usuarios-stat">
          <div className="usuarios-stat-icon usuarios-stat-icon-green">
            <img
              src={
                activosIcono
              }
              alt=""
              aria-hidden="true"
            />
          </div>

          <div>
            <span className="usuarios-stat-label">
              Activos
            </span>

            <strong className="usuarios-stat-value">
              {totalActivos}
            </strong>
          </div>
        </div>

        <div className="usuarios-stat">
          <div className="usuarios-stat-icon usuarios-stat-icon-yellow">
            <img
              src={
                pendientesIcono
              }
              alt=""
              aria-hidden="true"
            />
          </div>

          <div>
            <span className="usuarios-stat-label">
              Pendientes
            </span>

            <strong className="usuarios-stat-value">
              {
                totalPendientes
              }
            </strong>
          </div>
        </div>
      </div>

      {/* CABECERA LISTADO */}

      <div className="usuarios-list-toolbar list-toolbar">
        <div className="usuarios-list-title">
          <div>
            <strong>
              Lista de socios
            </strong>

            <span>
              Mostrando{" "}
              {
                usuariosOrdenados.length
              }{" "}
              resultados
            </span>
          </div>
        </div>

        <div className="usuarios-list-actions list-actions">
          {/* BUSCADOR */}

          <div className="usuarios-search-wrapper list-search-wrapper">
            <img
              src={buscarIcono}
              alt=""
              aria-hidden="true"
              className="usuarios-search-icon list-search-icon"
            />

            <input
              type="text"
              aria-label="Buscar usuario"
              placeholder="Buscar usuario..."
              className="usuarios-search list-search"
              value={
                busqueda
              }
              onChange={event => { setBusqueda(event.target.value); setPagina(1); }}
            />
          </div>

          <UsuariosFiltros estado={estadoFiltro} socio={socioFiltro}
            onEstado={valor => { setEstadoFiltro(valor); setPagina(1); }}
            onSocio={valor => { setSocioFiltro(valor); setPagina(1); }} />

          {puedeEditarUsuarios && (
            <button
              type="button"
              className="usuarios-new-button list-new-button"
              onClick={() =>
                setNuevoUsuarioOpen(
                  true,
                )
              }
            >
              {role === "Operador" ? "+ Nuevo socio" : "+ Nuevo usuario"}
            </button>
          )}
        </div>
      </div>

      {/* ERROR */}

      {error && (
        <div
          className="usuarios-error"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* TABLA */}

      <UsuariosTable
        usuarios={usuariosPagina}
        loading={loading}
        campoOrden={campoOrden}
        direccionOrden={direccionOrden}
        puedeEditar={puedeEditarUsuarios}
        mostrarRol={puedeVerRol}
        onCambiarOrden={cambiarOrden}
        onEditar={handleEditarUsuario}
      />

      {!loading && usuariosOrdenados.length > 0 ? (
        <Paginacion
          pagina={paginaActual}
          totalPaginas={totalPaginas}
          onCambiar={setPagina}
        />
      ) : null}

      <ConfirmarEliminarUsuario
        usuario={usuarioAEliminar}
        isOpen={usuarioAEliminar !== null}
        submitting={eliminando}
        error={errorEliminar}
        onCancel={handleCancelarEliminar}
        onConfirm={() => {
          void handleConfirmarEliminar();
        }}
      />

      {/* MODAL CREAR */}

      <UsuarioFormModal
        key="nuevo-usuario"
        isOpen={
          nuevoUsuarioOpen
        }
        mode="create"
        onClose={() =>
          setNuevoUsuarioOpen(
            false,
          )
        }
        onCreated={(
          usuarioCreado,
        ) => {
          setUsuarios(
            (
              usuariosActuales,
            ) => [
              usuarioCreado,
              ...usuariosActuales,
            ],
          );

          setNuevoUsuarioOpen(
            false,
          );
        }}
      />

      {/* MODAL EDITAR */}

      {usuarioSeleccionado && (
        <UsuarioFormModal
          key={
            usuarioSeleccionado.id_usuario
          }
          isOpen={
            editarUsuarioOpen
          }
          mode="edit"
          usuario={
            usuarioSeleccionado
          }
          onClose={
            handleCerrarEdicion
          }
          onUpdated={(usuarioActualizado) => {
            setUsuarios((usuariosActuales) =>
              reemplazarUsuarioEnLista(usuariosActuales, usuarioActualizado),
            );

            handleCerrarEdicion();
          }}
          onSolicitarEliminar={
            puedeEliminarUsuarios &&
            idUsuarioActual !== null &&
            usuarioSeleccionado.id_usuario !== idUsuarioActual
              ? () => {
                  const usuario = usuarioSeleccionado;
                  handleCerrarEdicion();
                  handleSolicitarEliminar(usuario);
                }
              : undefined
          }
        />
      )}
    </div>
  );
}

export default UsuariosPage;
