import type { Usuario } from "../../services/usuarioService";
import { textoFechaInscripcion } from "../../utils/fechaCalendario";
import {
  nombreCompletoUsuario,
  type CampoOrden,
  type DireccionOrden,
} from "../../utils/usuariosListado";

type UsuariosTableProps = {
  usuarios: Usuario[];
  loading: boolean;
  campoOrden: CampoOrden;
  direccionOrden: DireccionOrden;
  puedeEditar: boolean;
  mostrarRol?: boolean;
  onCambiarOrden: (campo: CampoOrden) => void;
  onEditar: (usuario: Usuario) => void;
};

function nombreRol(idRol: number): string {
  if (idRol === 3) return "Administrador";
  if (idRol === 2) return "Operador";
  return "Usuario";
}

function claseRol(idRol: number): string {
  if (idRol === 3) return "rol-admin";
  if (idRol === 2) return "rol-operador";
  return "rol-usuario";
}

function textoEstadoUsuario(idEstado: number): string {
  if (idEstado === 1) return "Usuario activo";
  if (idEstado === 3) return "Usuario pendiente";
  return "Usuario inactivo";
}

function claseEstadoUsuario(idEstado: number): string {
  if (idEstado === 1) return "estado-indicador estado-indicador-activo";
  if (idEstado === 3) return "estado-indicador estado-indicador-pendiente";
  return "estado-indicador";
}

function UsuariosTable({
  usuarios,
  loading,
  campoOrden,
  direccionOrden,
  puedeEditar,
  mostrarRol = true,
  onCambiarOrden,
  onEditar,
}: UsuariosTableProps) {
  const columnas = mostrarRol ? 9 : 8;

  return (
    <div className="usuarios-table-container">
      <table className={mostrarRol ? "usuarios-table" : "usuarios-table usuarios-table-sin-rol"}>
        <thead>
          <tr>
            <th>
              <button
                type="button"
                className="usuarios-sort-button"
                onClick={() =>
                  onCambiarOrden(
                    "fechaInscripcion",
                  )
                }
              >
                Fecha inscripción

                <span
                  className={
                    campoOrden ===
                    "fechaInscripcion"
                      ? "sort-icon active"
                      : "sort-icon"
                  }
                  aria-hidden="true"
                >
                  {campoOrden ===
                    "fechaInscripcion" &&
                  direccionOrden ===
                    "desc"
                    ? "▼"
                    : "▲"}
                </span>
              </button>
            </th>

            <th>
              <button
                type="button"
                className="usuarios-sort-button"
                onClick={() =>
                  onCambiarOrden(
                    "codigo",
                  )
                }
              >
                Socio

                <span
                  className={
                    campoOrden ===
                    "codigo"
                      ? "sort-icon active"
                      : "sort-icon"
                  }
                  aria-hidden="true"
                >
                  {campoOrden ===
                    "codigo" &&
                  direccionOrden ===
                    "desc"
                    ? "▼"
                    : "▲"}
                </span>
              </button>
            </th>

            <th>
              <button
                type="button"
                className="usuarios-sort-button"
                onClick={() =>
                  onCambiarOrden(
                    "nombre",
                  )
                }
              >
                Nombre

                <span
                  className={
                    campoOrden ===
                    "nombre"
                      ? "sort-icon active"
                      : "sort-icon"
                  }
                  aria-hidden="true"
                >
                  {campoOrden ===
                    "nombre" &&
                  direccionOrden ===
                    "desc"
                    ? "▼"
                    : "▲"}
                </span>
              </button>
            </th>

            <th>
              Email
            </th>

            <th>
              Teléfono
            </th>

            <th>
              Socio
            </th>

            <th>
              Matrícula
            </th>

            {mostrarRol && (
              <th>
                Rol
              </th>
            )}

            <th>
              Activo
            </th>
          </tr>
        </thead>

        <tbody>
          {loading && (
            <tr>
              <td colSpan={columnas}>
                Cargando usuarios...
              </td>
            </tr>
          )}

          {!loading &&
            usuarios.length ===
              0 && (
              <tr>
                <td colSpan={columnas}>
                  No se han encontrado usuarios.
                </td>
              </tr>
            )}

          {!loading &&
            usuarios.map(
              (
                usuario,
              ) => (
                <tr
                  key={
                    usuario.id_usuario
                  }
                  className={
                    puedeEditar
                      ? "usuarios-table-row usuarios-table-row-editable"
                      : "usuarios-table-row"
                  }
                  onClick={() =>
                    onEditar(
                      usuario,
                    )
                  }
                >
                  <td>
                    {textoFechaInscripcion(usuario.fechaInscripcion)}
                  </td>

                  <td>
                    {usuario.codUsuario ??
                      "-"}
                  </td>

                  <td>
                    {nombreCompletoUsuario(usuario)}
                  </td>

                  <td>
                    {usuario.email ??
                      "-"}
                  </td>

                  <td>
                    {usuario.telefono ??
                      "-"}
                  </td>

                  <td>
                    {usuario.socio
                      ? "Sí"
                      : "No"}
                  </td>

                  <td>
                    {usuario.matriculaPagada
                      ? "Pagada"
                      : "Pendiente"}
                  </td>

                  {mostrarRol && (
                    <td>
                      <span
                        className={`rol-etiqueta ${claseRol(usuario.id_rol)}`}
                      >
                        {nombreRol(usuario.id_rol)}
                      </span>
                    </td>
                  )}

                  {/* ACTIVO (solo lectura; se edita en el modal) */}

                  <td className="usuarios-table-activo">
                    <span
                      className={claseEstadoUsuario(usuario.id_estado_usuario)}
                      title={textoEstadoUsuario(usuario.id_estado_usuario)}
                      aria-label={`${nombreCompletoUsuario(usuario)} ${textoEstadoUsuario(usuario.id_estado_usuario).replace("Usuario ", "está ")}`}
                      role="img"
                    />
                  </td>
                </tr>
              ),
            )}
        </tbody>
      </table>
    </div>
  );
}

export default UsuariosTable;
