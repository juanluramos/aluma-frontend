import { usePreferenciaSesion } from "../hooks/usePreferenciaSesion";
import FiltroEstado from "../components/FiltroEstado";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { hasPermission } from "../auth/permissions";
import InscripcionFormModal from "../components/inscripciones/InscripcionFormModal";
import InscripcionesTable from "../components/inscripciones/InscripcionesTable";
import Paginacion, { REGISTROS_POR_PAGINA } from "../components/Paginacion";
import { useSesionInscripcion } from "../components/inscripciones/useSesionInscripcion";
import { getEstadosInscripcion, getEstadosPago, getMetodosPago } from "../services/catalogoPagoService";
import { getInscripciones, type InscripcionCreada } from "../services/inscripcionService";
import type { EstadoInscripcionCatalogo, EstadoPagoCatalogo, MetodoPagoCatalogo } from "../types/catalogoPago";
import { inscripcionesDeLaSesion } from "../utils/alcanceInscripcion";
import {
  destinoInscripcion,
  inscripcionEnEdicion,
  navegacionSinInscripcion,
} from "../utils/aperturaInscripcion";
import { direccionAlOrdenar, ordenarInscripciones, type CampoOrdenInscripcion } from "../utils/inscripcionesListado";
import { mensajeListaEspera } from "../utils/promocionInscripcion";
import type { Inscripcion } from "../types/inscripcion";
import buscarIcono from "../assets/icons/navigation/buscar.webp";
import inscritoVerde from "../assets/icons/navigation/inscrito-verde.webp";
import inscritoRojo from "../assets/icons/navigation/inscrito-rojo.webp";
import inscritoAmarillo from "../assets/icons/navigation/inscrito-amarillo.webp";
import "./InscripcionesPage.css";
import { filtrarPagos } from "../utils/pagosListado";

function mensajeError(causa: unknown): string {
  return causa instanceof Error ? causa.message : "No se pudieron cargar las inscripciones.";
}

export default function InscripcionesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { rol, idUsuario } = useSesionInscripcion();
  const puedeCrear = hasPermission(rol, "verInscripciones");
  const puedeEditar = hasPermission(rol, "gestionarInscripciones");
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [alta, setAlta] = useState(false);
  const [avisoEspera, setAvisoEspera] = useState("");
  const [edicion, setEdicion] = useState<Inscripcion | null>(null);
  const [metodos, setMetodos] = useState<MetodoPagoCatalogo[]>([]);
  const [estados, setEstados] = useState<EstadoPagoCatalogo[]>([]);
  const [estadosInscripcion, setEstadosInscripcion] = useState<EstadoInscripcionCatalogo[]>([]);
  const [errorCatalogo, setErrorCatalogo] = useState("");
  const [errorCatalogoPago, setErrorCatalogoPago] = useState("");
  const [estadoFiltro, setEstadoFiltro] = usePreferenciaSesion<string[]>("inscripciones.estadoFiltro", ["Activa"]);
  const [estadoPagoFiltro, setEstadoPagoFiltro] = usePreferenciaSesion<string[]>("pagos.estadoFiltro", []);
  const [metodoFiltro, setMetodoFiltro] = usePreferenciaSesion<string[]>("pagos.metodoFiltro", []);
  const [busqueda, setBusqueda] = usePreferenciaSesion<string>("inscripciones.busqueda", "");
  const [pagina, setPagina] = usePreferenciaSesion<number>("inscripciones.pagina", 1);
  const [campoOrden, setCampoOrden] = usePreferenciaSesion<CampoOrdenInscripcion | null>("inscripciones.campoOrden", "fecha", [null, "codigo", "usuario", "actividad", "fecha", "fechaPago"]);
  const [direccionOrden, setDireccionOrden] = usePreferenciaSesion<'asc' | 'desc'>("inscripciones.direccionOrden", 'desc', ["asc", "desc"]);
  const inscripcionesOrdenadas = useMemo(
    () => campoOrden ? ordenarInscripciones(inscripciones, campoOrden, direccionOrden) : inscripciones,
    [inscripciones, campoOrden, direccionOrden],
  );

  const edicionAbierta = inscripcionEnEdicion(edicion, location.state, inscripciones, cargando, puedeEditar);

  useEffect(() => {
    if (!navegacionSinInscripcion(location.state, inscripciones, cargando, puedeEditar)) return;
    navigate("/inscripciones", { replace: true, state: null });
  }, [location.state, cargando, inscripciones, puedeEditar, navigate]);

  useEffect(() => {
    if (!avisoEspera) return undefined;
    const temporizador = window.setTimeout(() => setAvisoEspera(""), 4000);
    return () => window.clearTimeout(temporizador);
  }, [avisoEspera]);

  function cambiarOrden(campo: CampoOrdenInscripcion) {
    setDireccionOrden(direccionAlOrdenar(campo, campoOrden, direccionOrden));
    setCampoOrden(campo);
    setPagina(1);
  }

  function recargar() {
    getInscripciones()
      .then((datos) => {
        setInscripciones(inscripcionesDeLaSesion(datos, puedeEditar, idUsuario));
        setError("");
      })
      .catch((causa: unknown) => {
        setError(mensajeError(causa));
      });
  }

  useEffect(() => {
    let activo = true;

    getInscripciones()
      .then((datos) => {
        if (activo) setInscripciones(inscripcionesDeLaSesion(datos, puedeEditar, idUsuario));
      })
      .catch((causa: unknown) => {
        if (!activo) return;
        setError(mensajeError(causa));
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [puedeEditar, idUsuario]);

  useEffect(() => {
    let activo = true;
    getEstadosInscripcion()
      .then((datos) => {
        if (!activo) return;
        setEstadosInscripcion(datos);
        setErrorCatalogo("");
      })
      .catch((causa: unknown) => {
        if (!activo) return;
        setEstadosInscripcion([]);
        setErrorCatalogo(causa instanceof Error
          ? causa.message
          : "No se pudieron cargar los estados de inscripción.");
      });
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    if (!puedeEditar) return undefined;
    let activo = true;
    Promise.all([getMetodosPago(), getEstadosPago()])
      .then(([metodosPago, estadosPago]) => {
        if (!activo) return;
        setMetodos(metodosPago);
        setEstados(estadosPago);
        setErrorCatalogoPago("");
      })
      .catch((causa: unknown) => {
        if (!activo) return;
        setMetodos([]);
        setEstados([]);
        setErrorCatalogoPago(causa instanceof Error ? causa.message : "No se pudieron cargar los datos de pago.");
      });
    return () => {
      activo = false;
    };
  }, [puedeEditar]);

  function cerrarEdicion() {
    setEdicion(null);
    if (destinoInscripcion(location.state) != null) {
      navigate("/inscripciones", { replace: true, state: null });
    }
  }

  function consultarInscripcion() {
    getInscripciones()
      .then((datos) => {
        const visibles = inscripcionesDeLaSesion(datos, puedeEditar, idUsuario);
        setInscripciones(visibles);
        setError("");
        setEdicion((actual) => {
          if (!actual) return null;
          return visibles.find((item) => item.id_inscripcion === actual.id_inscripcion) ?? null;
        });
      })
      .catch((causa: unknown) => {
        setError(mensajeError(causa));
      });
  }

  const resumenInscripciones = [
    { estado: "Activa", etiqueta: "Activas", icono: inscritoVerde, color: "green" },
    { estado: "Cerrada", etiqueta: "Cerradas", icono: inscritoRojo, color: "red" },
    { estado: "En espera", etiqueta: "En espera", icono: inscritoAmarillo, color: "yellow" },
  ].map(item => {
    const estado = estadosInscripcion.find(estado => estado.nombre === item.estado);
    return {
      ...item,
      total: inscripciones.filter(inscripcion => inscripcion.id_estado_inscripcion === estado?.id_estado_inscripcion).length,
    };
  });

  const inscripcionesFiltradas = filtrarPagos(
    inscripcionesOrdenadas, busqueda, estados, metodos,
    puedeEditar ? estadoPagoFiltro : [], puedeEditar ? metodoFiltro : [],
  ).filter(({ id_estado_inscripcion }) => {
    const estado = estadosInscripcion.find(item => item.id_estado_inscripcion === id_estado_inscripcion);
    return estado !== undefined && estadoFiltro.includes(estado.nombre);
  });
  const totalPaginas = Math.max(1, Math.ceil(inscripcionesFiltradas.length / REGISTROS_POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const inicioPagina = (paginaActual - 1) * REGISTROS_POR_PAGINA;
  const inscripcionesPagina = inscripcionesFiltradas.slice(inicioPagina, inicioPagina + REGISTROS_POR_PAGINA);

  return (
    <div className="inscripciones-page">
      <div className="inscripciones-stats">
        {resumenInscripciones.map(({ estado, etiqueta, icono, color, total }) => (
          <div className="inscripciones-stat" key={estado}>
            <div className={`inscripciones-stat-icon inscripciones-stat-icon-${color}`}>
              <img src={icono} alt="" aria-hidden="true" />
            </div>
            <div>
              <span className="inscripciones-stat-label">{etiqueta}</span>
              <strong className="inscripciones-stat-value">{total}</strong>
            </div>
          </div>
        ))}
      </div>

      <div className="inscripciones-list-toolbar list-toolbar list-toolbar-compact">
        <div className="inscripciones-list-title">
          <strong>Caja</strong>
          <span>Mostrando {inscripcionesFiltradas.length} resultados</span>
        </div>
        <div className="inscripciones-list-actions list-actions">
          <div className="inscripciones-search-wrapper list-search-wrapper">
            <img src={buscarIcono} alt="" aria-hidden="true" className="inscripciones-search-icon list-search-icon" />
            <input type="text" aria-label="Buscar usuario o actividad" placeholder="Buscar usuario o actividad..."
              className="inscripciones-search list-search" value={busqueda}
              onChange={evento => { setBusqueda(evento.target.value); setPagina(1); }} />
          </div>
          <FiltroEstado
            titulo="Filtrar inscripciones"
            opciones={[['Activa', 'Activa'], ['Cerrada', 'Cerrada'], ['En espera', 'En espera']]}
            seleccion={estadoFiltro}
            grupoSecundario={puedeEditar ? {
              titulo: "Pago",
              opciones: estados.map(estado => [estado.nombre_estado, estado.nombre_estado]),
              seleccion: estadoPagoFiltro.length === 0 ? estados.map(estado => estado.nombre_estado) : estadoPagoFiltro,
            } : undefined}
            grupoTerciario={puedeEditar ? {
              titulo: "Método",
              opciones: [...metodos.map(metodo => [metodo.nombre, metodo.nombre] as [string, string]), ["Sin método", "Sin método"]],
              seleccion: metodoFiltro.length === 0 ? [...metodos.map(metodo => metodo.nombre), "Sin método"] : metodoFiltro,
            } : undefined}
            onAplicar={(estadosInscripcion, estadosPago = [], metodosSeleccionados = []) => {
              setEstadoFiltro(estadosInscripcion);
              if (puedeEditar) {
                setEstadoPagoFiltro(estadosPago.length ? estadosPago : ["__ninguno__"]);
                setMetodoFiltro(metodosSeleccionados.length ? metodosSeleccionados : ["__ninguno__"]);
              }
              setPagina(1);
            }}
          />
        {puedeCrear ? (
          <button
            type="button"
            className="inscripciones-new-button list-new-button"
            onClick={() => setAlta(true)}
          >
            + Nueva inscripción
          </button>
        ) : null}
        </div>
      </div>

      {avisoEspera ? (
        <p className="inscripciones-aviso" role="status">{avisoEspera}</p>
      ) : null}
      {error ? (
        <div className="inscripciones-error" role="alert">
          {error}
        </div>
      ) : null}
      {puedeEditar && errorCatalogoPago ? (
        <div className="inscripciones-error" role="alert">{errorCatalogoPago}</div>
      ) : null}
      {errorCatalogo ? (
        <div className="inscripciones-error" role="alert">
          {errorCatalogo}
        </div>
      ) : null}

      <div className="inscripciones-table-container">
        {cargando ? (
          <p className="inscripciones-mensaje">Cargando inscripciones...</p>
        ) : error ? null : inscripcionesFiltradas.length === 0 ? (
          <p className="inscripciones-mensaje">
            {inscripciones.length === 0 ? 'No hay inscripciones registradas.' : 'No se encontraron inscripciones con los filtros seleccionados.'}
          </p>
        ) : (
          <InscripcionesTable
            inscripciones={inscripcionesPagina}
            campoOrden={campoOrden}
            direccionOrden={direccionOrden}
            onCambiarOrden={cambiarOrden}
            estadosInscripcion={estadosInscripcion}
            estadosPago={estados}
            metodosPago={metodos}
            puedeEditar={puedeEditar}
            onEditar={setEdicion}
          />
        )}
      </div>
      {!cargando && !error && inscripcionesFiltradas.length > 0 ? (
        <Paginacion
          pagina={paginaActual}
          totalPaginas={totalPaginas}
          onCambiar={setPagina}
        />
      ) : null}
      {alta ? (
        <InscripcionFormModal
          onClose={() => setAlta(false)}
          onCreada={(creada: InscripcionCreada) => {
            setAlta(false);
            const aviso = mensajeListaEspera(creada.id_estado_inscripcion, estadosInscripcion);
            setAvisoEspera(aviso ?? "");
            if (aviso && !estadoFiltro.includes("En espera")) {
              setEstadoFiltro([...estadoFiltro, "En espera"]);
            }
            recargar();
          }}
        />
      ) : null}
      {edicionAbierta ? (
        <InscripcionFormModal
          variante={puedeEditar ? "inscripcion" : "pago"}
          inscripcion={edicionAbierta}
          metodos={metodos}
          estados={estados}
          estadosInscripcion={estadosInscripcion}
          onClose={cerrarEdicion}
          onEditada={() => {
            cerrarEdicion();
            recargar();
          }}
          onCobrada={() => {
            cerrarEdicion();
            recargar();
          }}
          onDevuelta={() => {
            cerrarEdicion();
            recargar();
          }}
          onCancelada={() => {
            cerrarEdicion();
            recargar();
          }}
          onActivada={() => {
            cerrarEdicion();
            recargar();
          }}
          onConsultar={consultarInscripcion}
        />
      ) : null}
    </div>
  );
}
