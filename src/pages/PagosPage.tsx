import pagosVerde from "../assets/icons/navigation/pagos-euro-verde.webp";
import pagosRojo from "../assets/icons/navigation/pagos-euro-rojo.webp";
import pagosAmarillo from "../assets/icons/navigation/pagos-euro-amarillo.webp";
import pagosAzul from "../assets/icons/navigation/pagos-euro-azul.webp";
import { useEffect, useMemo, useState } from "react";
import { hasPermission } from "../auth/permissions";
import FiltroEstado from "../components/FiltroEstado";
import InscripcionFormModal from "../components/inscripciones/InscripcionFormModal";
import PagosTable from "../components/pagos/PagosTable";
import Paginacion, { useRegistrosPorPagina } from "../components/Paginacion";
import { useSesionInscripcion } from "../components/inscripciones/useSesionInscripcion";
import { usePreferenciaSesion } from "../hooks/usePreferenciaSesion";
import { getEstadosInscripcion, getEstadosPago, getMetodosPago } from "../services/catalogoPagoService";
import { getInscripciones } from "../services/inscripcionService";
import type { EstadoInscripcionCatalogo, EstadoPagoCatalogo, MetodoPagoCatalogo } from "../types/catalogoPago";
import type { Inscripcion } from "../types/inscripcion";
import { inscripcionesDeLaSesion } from "../utils/alcanceInscripcion";
import { filtrarPagos, nombreEstadoPagoCatalogo, ordenarPagosPorFecha, type DireccionOrdenPago } from "../utils/pagosListado";
import buscarIcono from "../assets/icons/navigation/buscar.webp";
import "./InscripcionesPage.css";
import "./PagosPage.css";

function mensajeError(causa: unknown): string {
  return causa instanceof Error ? causa.message : "No se pudieron cargar los pagos.";
}

export default function PagosPage() {
  const { rol, idUsuario } = useSesionInscripcion();
  const puedeGestionar = hasPermission(rol, "gestionarInscripciones");
  const [pagos, setPagos] = useState<Inscripcion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [errorCatalogo, setErrorCatalogo] = useState("");
  const [rolCatalogo, setRolCatalogo] = useState(puedeGestionar);
  const [faseCatalogo, setFaseCatalogo] = useState<"cargando" | "listo" | "error" | "oculto">(
    puedeGestionar ? "cargando" : "oculto",
  );
  if (rolCatalogo !== puedeGestionar) {
    setRolCatalogo(puedeGestionar);
    setFaseCatalogo(puedeGestionar ? "cargando" : "oculto");
  }
  const [seleccion, setSeleccion] = useState<Inscripcion | null>(null);
  const [estados, setEstados] = useState<EstadoPagoCatalogo[]>([]);
  const [metodos, setMetodos] = useState<MetodoPagoCatalogo[]>([]);
  const [estadosInscripcion, setEstadosInscripcion] = useState<EstadoInscripcionCatalogo[]>([]);
  const [busqueda, setBusqueda] = usePreferenciaSesion<string>("pagos.busqueda", "");
  const [estadoFiltro, setEstadoFiltro] = usePreferenciaSesion<string[]>("pagos.estadoFiltro", []);
  const [metodoFiltro, setMetodoFiltro] = usePreferenciaSesion<string[]>("pagos.metodoFiltro", []);
  const [pagina, setPagina] = usePreferenciaSesion<number>("pagos.pagina", 1);
  const registrosPorPagina = useRegistrosPorPagina();
  const [direccionOrden, setDireccionOrden] = usePreferenciaSesion<DireccionOrdenPago>(
    "pagos.direccionOrden",
    "desc",
    ["asc", "desc"],
  );

  function recargar() {
    return getInscripciones()
      .then((datos) => {
        const visibles = inscripcionesDeLaSesion(datos, puedeGestionar, idUsuario);
        setPagos(visibles);
        setError("");
        return visibles;
      })
      .catch((causa: unknown) => {
        setError(mensajeError(causa));
        return [] as Inscripcion[];
      });
  }

  useEffect(() => {
    let activo = true;
    getInscripciones()
      .then((datos) => {
        if (activo) setPagos(inscripcionesDeLaSesion(datos, puedeGestionar, idUsuario));
      })
      .catch((causa: unknown) => {
        if (activo) setError(mensajeError(causa));
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    getEstadosInscripcion()
      .then((datos) => {
        if (activo) setEstadosInscripcion(datos);
      })
      .catch(() => {
        if (activo) setEstadosInscripcion([]);
      });
    return () => {
      activo = false;
    };
  }, [puedeGestionar, idUsuario]);

  useEffect(() => {
    if (!puedeGestionar) return undefined;
    let activo = true;
    Promise.all([
      getEstadosPago(),
      getMetodosPago(),
    ]).then(([estadosPago, metodosPago]) => {
      if (!activo) return;
      setEstados(estadosPago);
      setMetodos(metodosPago);
      setErrorCatalogo("");
      setFaseCatalogo("listo");
    }).catch((causa: unknown) => {
      if (!activo) return;
      setEstados([]);
      setMetodos([]);
      setErrorCatalogo(mensajeError(causa));
      setFaseCatalogo("error");
    });
    return () => {
      activo = false;
    };
  }, [puedeGestionar]);

  const resumenPagos = [
    { estado: "Pagado", etiqueta: "Pagados", icono: pagosVerde, color: "green" },
    { estado: "Devolución", etiqueta: "Devoluciones", icono: pagosRojo, color: "red" },
    { estado: "Pendiente", etiqueta: "Pendientes", icono: pagosAmarillo, color: "yellow" },
    { estado: "Cancelado", etiqueta: "Cancelados", icono: pagosAzul, color: "blue" },
  ].map(item => ({
    ...item,
    total: pagos.filter(pago => nombreEstadoPagoCatalogo(pago.id_estado_pago, estados) === item.estado).length,
  }));

  const ordenados = useMemo(
    () => ordenarPagosPorFecha(filtrarPagos(pagos, busqueda, estados, metodos, estadoFiltro, metodoFiltro), direccionOrden),
    [pagos, busqueda, estados, metodos, estadoFiltro, metodoFiltro, direccionOrden],
  );
  const totalPaginas = Math.max(1, Math.ceil(ordenados.length / registrosPorPagina));
  const paginaActual = Math.min(pagina, totalPaginas);
  const paginaPagos = ordenados.slice((paginaActual - 1) * registrosPorPagina, paginaActual * registrosPorPagina);

  function consultarPago() {
    recargar().then((datos) => {
      setSeleccion((actual) => actual
        ? datos.find((item) => item.id_inscripcion === actual.id_inscripcion) ?? null
        : null);
    });
  }

  function cerrarOperacion() {
    setSeleccion(null);
    recargar();
  }

  return (
    <div className="inscripciones-page">
      {faseCatalogo === "cargando" ? (
        <p className="pagos-resumen-carga" role="status">Cargando resumen...</p>
      ) : faseCatalogo === "error" ? (
        <div className="inscripciones-error" role="alert">{errorCatalogo}</div>
      ) : faseCatalogo === "listo" ? (
        <div className="inscripciones-stats">
          {resumenPagos.map(({ estado, etiqueta, icono, color, total }) => (
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
      ) : null}
      <div className="inscripciones-list-toolbar list-toolbar list-toolbar-compact">
        <div className="inscripciones-list-title">
          <strong>Lista de pagos</strong>
          <span>Mostrando {ordenados.length} resultados</span>
        </div>
        <div className="inscripciones-list-actions list-actions">
          <div className="inscripciones-search-wrapper list-search-wrapper">
            <img src={buscarIcono} alt="" aria-hidden="true" className="inscripciones-search-icon list-search-icon" />
            <input
              type="text"
              aria-label="Buscar usuario o actividad"
              placeholder="Buscar usuario o actividad..."
              className="inscripciones-search list-search"
              value={busqueda}
              onChange={(evento) => {
                setBusqueda(evento.target.value);
                setPagina(1);
              }}
            />
          </div>
          {puedeGestionar ? (
            <FiltroEstado
              titulo="Filtrar pagos"
              etiqueta="Filtrado"
              mostrarCancelar={false}
              opciones={estados.map(estado => [estado.nombre_estado, estado.nombre_estado])}
              seleccion={estadoFiltro.length === 0 ? estados.map(estado => estado.nombre_estado) : estadoFiltro}
              grupoSecundario={{
                titulo: "Método",
                opciones: [...metodos.map(metodo => [metodo.nombre, metodo.nombre] as [string, string]), ["Sin método", "Sin método"]],
                seleccion: metodoFiltro.length === 0 ? [...metodos.map(metodo => metodo.nombre), "Sin método"] : metodoFiltro,
              }}
              onAplicar={(estadosSeleccionados, metodosSeleccionados = []) => {
                setEstadoFiltro(estadosSeleccionados.length ? estadosSeleccionados : ["__ninguno__"]);
                setMetodoFiltro(metodosSeleccionados.length ? metodosSeleccionados : ["__ninguno__"]);
                setPagina(1);
              }}
            />
          ) : null}
        </div>
      </div>

      {error ? <div className="inscripciones-error" role="alert">{error}</div> : null}

      <div className="inscripciones-table-container">
        {cargando ? (
          <p className="inscripciones-mensaje">Cargando pagos...</p>
        ) : error ? null : ordenados.length === 0 ? (
          <p className="inscripciones-mensaje">
            {pagos.length === 0 ? "No hay pagos registrados." : "No se encontraron pagos con los filtros seleccionados."}
          </p>
        ) : (
          <PagosTable
            pagos={paginaPagos}
            estados={estados}
            metodos={metodos}
            direccionOrden={direccionOrden}
            onCambiarOrden={() => setDireccionOrden(direccionOrden === "asc" ? "desc" : "asc")}
            onSeleccionar={setSeleccion}
          />
        )}
      </div>
      {!cargando && !error && ordenados.length > 0 ? (
        <Paginacion pagina={paginaActual} totalPaginas={totalPaginas} onCambiar={setPagina} />
      ) : null}
      {seleccion ? (
        <InscripcionFormModal
          variante="pago"
          inscripcion={seleccion}
          metodos={metodos}
          estados={estados}
          estadosInscripcion={estadosInscripcion}
          onClose={() => setSeleccion(null)}
          onCobrada={cerrarOperacion}
          onDevuelta={cerrarOperacion}
          onConsultar={consultarPago}
        />
      ) : null}
    </div>
  );
}
