
import { ESTADOS_ACTIVIDAD } from "../../utils/actividadFormState";
import type { Actividad } from "../../types/actividad";
import { lineasPlazas } from "../../utils/ocupacionActividad";
import type { CampoOrden, DireccionOrden } from "../../utils/actividadesListado";

interface ActividadesTableProps {
  actividades: Actividad[];
  campoOrden: CampoOrden;
  direccionOrden: DireccionOrden;
  puedeEditar: boolean;
  onEditar: (actividad: Actividad) => void;
  onCambiarOrden: (campo: CampoOrden) => void;
}

/**
 * Devuelve el nombre del estado de una actividad.
 */
function obtenerEstado(id: number): string {
  return ESTADOS_ACTIVIDAD.find(estado => estado.id === id)?.nombre ?? "Desconocido";
}

function claseEstado(id: number): string {
  switch (id) {
    case 1:
      return "estado-activo";
    case 2:
      return "estado-inactivo";
    case 3:
      return "estado-pendiente";
    default:
      return "estado-desconocido";
  }
}

function iconoOrden(
  campo: CampoOrden,
  campoOrden: CampoOrden,
  direccionOrden: DireccionOrden,
): string {
  return campoOrden === campo && direccionOrden === "desc" ? "▼" : "▲";
}

/**
 * Muestra el listado de actividades.
 */
export default function ActividadesTable({
  actividades,
  campoOrden,
  direccionOrden,
  onCambiarOrden,
  puedeEditar,
  onEditar,
}: ActividadesTableProps) {
  return (
    <table className="actividades-tabla">
      <thead>
        <tr>
          <th>Código</th>
          <th>
            <button
              type="button"
              className="actividades-sort-button"
              onClick={() => onCambiarOrden("titulo")}
            >
              Actividad
              <span
                className={
                  campoOrden === "titulo" ? "sort-icon active" : "sort-icon"
                }
                aria-hidden="true"
              >
                {iconoOrden("titulo", campoOrden, direccionOrden)}
              </span>
            </button>
          </th>
          <th>
            <button
              type="button"
              className="actividades-sort-button"
              onClick={() => onCambiarOrden("fecha")}
            >
              Fecha
              <span
                className={
                  campoOrden === "fecha" ? "sort-icon active" : "sort-icon"
                }
                aria-hidden="true"
              >
                {iconoOrden("fecha", campoOrden, direccionOrden)}
              </span>
            </button>
          </th>
          <th>Ocupadas</th>
          <th>Disponibles</th>
          <th>En espera</th>
          <th>Precio socio</th>
          <th>Precio no socio</th>
          <th>Estado</th>
        </tr>
      </thead>

      <tbody>
        {actividades.map((actividad) => {
          const estado = obtenerEstado(
            actividad.id_estado_actividad
          );
          const plazas = lineasPlazas(actividad);

          return (
            <tr key={actividad.id_actividad}
              className={puedeEditar ? "actividades-row-editable" : undefined}
              tabIndex={puedeEditar ? 0 : undefined}
              aria-label={puedeEditar ? `Editar ${actividad.titulo}` : undefined}
              onClick={puedeEditar ? () => onEditar(actividad) : undefined}
              onKeyDown={puedeEditar ? (event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onEditar(actividad);
                }
              } : undefined}
            >
              <td>{actividad.id_actividad}</td>

              <td className="actividades-titulo">
                {actividad.titulo}
              </td>

              <td>
                {actividad.fecha
                  ? new Date(actividad.fecha).toLocaleDateString(
                      "es-ES",
                      { timeZone: "UTC" }
                    )
                  : "Sin fecha"}
              </td>

              <td className={plazas.completa ? "actividades-plazas-completas" : undefined}>
                {plazas.ocupadas}
              </td>
              <td>{plazas.disponibles}</td>
              <td className={plazas.hayEspera ? "actividades-plazas-con-espera" : undefined}>
                {plazas.espera}
              </td>

              <td>
                {actividad.importeSocio != null
                  ? `${actividad.importeSocio} €`
                  : "Sin precio"}
              </td>

              <td>
                {actividad.importeNoSocio != null
                  ? `${actividad.importeNoSocio} €`
                  : "Sin precio"}
              </td>

              <td className="actividades-table-estado">
                <span
                  className={`estado-etiqueta ${claseEstado(actividad.id_estado_actividad)}`}
                >
                  {estado}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
