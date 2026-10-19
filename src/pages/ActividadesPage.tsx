import { usePreferenciaSesion } from "../hooks/usePreferenciaSesion";
import FiltroEstado from "../components/FiltroEstado";
import { useEffect, useState } from "react";
import { hasPermission } from "../auth/permissions";
import { useRole } from "../auth/useRole";
import { getActividades } from "../services/actividadService";
import type { Actividad } from "../types/actividad";
import actividadesIconoActivos from "../assets/icons/navigation/calendario_verde.webp";
import actividadesIconoInactivos from "../assets/icons/navigation/calendario_rojo.webp";
import actividadesIconoPendientes from "../assets/icons/navigation/calendario_amarillo.webp";
import buscarIcono from "../assets/icons/navigation/buscar.webp";
import "./ActividadesPage.css";
import ActividadFormModal from "../components/actividades/ActividadFormModal";
import ActividadesTable from "../components/actividades/ActividadesTable";
import Paginacion, { REGISTROS_POR_PAGINA } from "../components/Paginacion";
import {
  filtrarActividades,
  ordenarActividades,
  type CampoOrden,
  type DireccionOrden,
} from "../utils/actividadesListado";
export default function ActividadesPage() {
  const role = useRole();
  const puedeGestionar = hasPermission(role, "gestionarActividades");
  const [formulario, setFormulario] = useState<{ actividad?: Actividad } | null>(null);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [busqueda, setBusqueda] = usePreferenciaSesion<string>("actividades.busqueda", "");
  const [estadoFiltro, setEstadoFiltro] = usePreferenciaSesion<string[]>("actividades.estadoFiltro", ["activo"]);
  const [campoOrden, setCampoOrden] = usePreferenciaSesion<CampoOrden>("actividades.campoOrden", "fecha", ["titulo", "fecha"]);
  const [direccionOrden, setDireccionOrden] = usePreferenciaSesion<DireccionOrden>("actividades.direccionOrden", "desc", ["asc", "desc"]);
  const [pagina, setPagina] = usePreferenciaSesion<number>("actividades.pagina", 1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let activo = true;
    getActividades()
      .then((datos) => {
        if (activo) setActividades(datos);
      })
      .catch((causa) => {
        if (activo) setError(causa instanceof Error ? causa.message : "No se pudieron cargar las actividades.");
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, []);
  const totalActivas = actividades.filter(
    (actividad) => actividad.id_estado_actividad === 1,
  ).length;
  const totalInactivas = actividades.filter(
    (actividad) => actividad.id_estado_actividad === 2,
  ).length;
  const totalPendientes = actividades.filter(
    (actividad) => actividad.id_estado_actividad === 3,
  ).length;
  const actividadesFiltradas = filtrarActividades(actividades, busqueda, estadoFiltro);
  const actividadesOrdenadas = ordenarActividades(
    actividadesFiltradas,
    campoOrden,
    direccionOrden,
  );
  const totalPaginas = Math.max(
    1,
    Math.ceil(actividadesOrdenadas.length / REGISTROS_POR_PAGINA),
  );
  const paginaActual = Math.min(pagina, totalPaginas);
  const inicioPagina = (paginaActual - 1) * REGISTROS_POR_PAGINA;
  const actividadesPagina = actividadesOrdenadas.slice(
    inicioPagina,
    inicioPagina + REGISTROS_POR_PAGINA,
  );
  function cambiarOrden(campo: CampoOrden) {
    if (campoOrden === campo) {
      setDireccionOrden((direccionActual) =>
        direccionActual === "asc" ? "desc" : "asc",
      );
      return;
    }
    setCampoOrden(campo);
    setDireccionOrden("asc");
  }


  return (
    <div className="actividades-page">
      <div className="actividades-stats">
        <div className="actividades-stat">
          <div className="actividades-stat-icon actividades-stat-icon-green">
            <img
              src={actividadesIconoActivos}
              alt=""
              aria-hidden="true"
            />
          </div>
          <div>
            <span className="actividades-stat-label">
              Activos
            </span>
            <strong className="actividades-stat-value">
              {totalActivas}
            </strong>
          </div>
        </div>
        <div className="actividades-stat">
          <div className="actividades-stat-icon actividades-stat-icon-red">
            <img
              src={actividadesIconoInactivos}
              alt=""
              aria-hidden="true"
            />
          </div>
          <div>
            <span className="actividades-stat-label">
              Inactivos
            </span>
            <strong className="actividades-stat-value">
              {totalInactivas}
            </strong>
          </div>
        </div>
        <div className="actividades-stat">
          <div className="actividades-stat-icon actividades-stat-icon-yellow">
            <img
              src={actividadesIconoPendientes}
              alt=""
              aria-hidden="true"
            />
          </div>
          <div>
            <span className="actividades-stat-label">
              Pendientes
            </span>
            <strong className="actividades-stat-value">
              {totalPendientes}
            </strong>
          </div>
        </div>
      </div>
      <div className="actividades-list-toolbar list-toolbar list-toolbar-compact">
        <div className="actividades-list-title">
          <div>
            <strong>Lista de actividades</strong>
            <span>
              Mostrando {actividadesFiltradas.length} resultados
            </span>
          </div>
        </div>
        <div className="actividades-list-actions list-actions">
          <div className="actividades-search-wrapper list-search-wrapper">
            <img
              src={buscarIcono}
              alt=""
              aria-hidden="true"
              className="actividades-search-icon list-search-icon"
            />
            <input
              type="text"
              aria-label="Buscar actividad"
              placeholder="Buscar actividad..."
              className="actividades-search list-search"
              value={busqueda}
              onChange={(evento) => { setBusqueda(evento.target.value); setPagina(1); }}
            />
          </div>
          <FiltroEstado titulo="Filtrar actividades" opciones={[['activo', 'Activos'], ['inactivo', 'Inactivos'], ['pendiente', 'Pendientes']]}
            seleccion={estadoFiltro}
            onAplicar={valores => { setEstadoFiltro(valores); setPagina(1); }} />
          {puedeGestionar ? (
            <button type="button" className="actividades-new-button list-new-button" onClick={() => setFormulario({})}>
              + Nueva actividad
            </button>
          ) : null}
        </div>
      </div>
      {error ? (
        <div className="actividades-error" role="alert">
          {error}
        </div>
      ) : null}
      <div className="actividades-table-container">
        {cargando ? (
          <p className="actividades-mensaje">Cargando actividades...</p>
        ) : actividades.length === 0 ? (
          <p className="actividades-mensaje">
            No hay actividades registradas.
          </p>
        ) : actividadesFiltradas.length === 0 ? (
          <p className="actividades-mensaje">
            No se encontraron actividades.
          </p>
        ) : (
          <ActividadesTable
            actividades={actividadesPagina}
            puedeEditar={puedeGestionar}
            onEditar={(actividad) => { if (puedeGestionar) setFormulario({ actividad }); }}
            campoOrden={campoOrden}
            direccionOrden={direccionOrden}
            onCambiarOrden={cambiarOrden}
          />
        )}
      </div>
      {!cargando && actividadesOrdenadas.length > 0 ? (
        <Paginacion
          pagina={paginaActual}
          totalPaginas={totalPaginas}
          onCambiar={setPagina}
        />
      ) : null}
      {formulario && (
        <ActividadFormModal actividad={formulario.actividad}
          onClose={() => setFormulario(null)}
          onSaved={() => {
            setFormulario(null);
            getActividades()
              .then((datos) => setActividades(datos))
              .catch((causa) => {
                setError(causa instanceof Error ? causa.message : "No se pudieron cargar las actividades.");
              });
          }} />
      )}
    </div>
  );
}
