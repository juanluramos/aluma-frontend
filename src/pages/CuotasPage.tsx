import { useEffect, useState } from "react";
import { hasPermission } from "../auth/permissions";
import { useRole } from "../auth/useRole";
import buscarIcono from "../assets/icons/navigation/buscar.webp";
import pagosAzul from "../assets/icons/navigation/pagos-euro-azul.webp";
import pagosVerde from "../assets/icons/navigation/pagos-euro-verde.webp";
import Paginacion, { REGISTROS_POR_PAGINA } from "../components/Paginacion";
import CuotaFormModal from "../components/cuotas/CuotaFormModal";
import { getCuotas, type Cuota } from "../services/cuotaService";
import { textoFechaInscripcion } from "../utils/fechaCalendario";
import {
  aniosDisponiblesCuotas,
  direccionAlOrdenarCuota,
  eliminarCuotaDeLista,
  filtrarCuotas,
  filtrosCuotasActivos,
  importeVisibleCuota,
  insertarCuotaOrdenada,
  nombreVisibleCuota,
  ordenarCuotas,
  resumenCuotasAnio,
  textoCodigoCuota,
  textoComentarioCuota,
  totalImportesCuotas,
  type CampoOrdenCuota,
  type FiltroCuotas,
} from "../utils/cuotasListado";
import "./CuotasPage.css";

type FormularioCuota = { mode: "create" } | { mode: "edit"; cuota: Cuota };

export default function CuotasPage() {
  const puedeRegistrar = hasPermission(useRole(), "verCuotas");
  const [cuotas, setCuotas] = useState<Cuota[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [formulario, setFormulario] = useState<FormularioCuota | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [anio, setAnio] = useState<number | null>(null);
  const [pagina, setPagina] = useState(1);
  const filtro: FiltroCuotas = { busqueda, anio };
  const [campoOrden, setCampoOrden] = useState<CampoOrdenCuota>("fechaPago");
  const [direccionOrden, setDireccionOrden] = useState<"asc" | "desc">("desc");
  const cuotasVisibles = ordenarCuotas(filtrarCuotas(cuotas, filtro), campoOrden, direccionOrden);
  const totalPaginas = Math.max(1, Math.ceil(cuotasVisibles.length / REGISTROS_POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const inicioPagina = (paginaActual - 1) * REGISTROS_POR_PAGINA;
  const cuotasPagina = cuotasVisibles.slice(inicioPagina, inicioPagina + REGISTROS_POR_PAGINA);
  const resumenAnio = resumenCuotasAnio(cuotas, new Date().getFullYear());
  const anios = aniosDisponiblesCuotas(cuotas, anio);
  const filtrosActivos = filtrosCuotasActivos(filtro);

  useEffect(() => {
    let activo = true;
    getCuotas()
      .then((datos) => {
        if (activo) setCuotas(datos);
      })
      .catch((causa: unknown) => {
        if (activo) {
          setError(causa instanceof Error ? causa.message : "No se pudieron cargar las cuotas.");
        }
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  function cambiarOrden(campo: CampoOrdenCuota) {
    setDireccionOrden(direccionAlOrdenarCuota(campo, campoOrden, direccionOrden));
    setCampoOrden(campo);
  }

  function cabeceraOrden(campo: CampoOrdenCuota, etiqueta: string) {
    const activo = campoOrden === campo;
    return (
      <th aria-sort={activo ? (direccionOrden === "asc" ? "ascending" : "descending") : "none"}>
        <button type="button" className="cuotas-sort-button" onClick={() => cambiarOrden(campo)}>
          {etiqueta}
          <span className={`cuotas-sort-icon${activo ? " active" : ""}`} aria-hidden="true">
            {activo && direccionOrden === "desc" ? "▼" : "▲"}
          </span>
        </button>
      </th>
    );
  }

  return (
    <div className="cuotas-page">
      <div className="cuotas-stats">
        <div className="cuotas-stat">
          <div className="cuotas-stat-icon cuotas-stat-icon-green">
            <img src={pagosVerde} alt="" aria-hidden="true" />
          </div>
          <div>
            <span className="cuotas-stat-label">Cuotas cobradas este año</span>
            <strong className="cuotas-stat-value">{resumenAnio.cantidad}</strong>
          </div>
        </div>
        <div className="cuotas-stat">
          <div className="cuotas-stat-icon cuotas-stat-icon-blue">
            <img src={pagosAzul} alt="" aria-hidden="true" />
          </div>
          <div>
            <span className="cuotas-stat-label">Total recaudado este año</span>
            <strong className="cuotas-stat-value">{importeVisibleCuota(resumenAnio.total)}</strong>
          </div>
        </div>
      </div>
      <div className="list-toolbar">
        <div className="cuotas-list-title">
          <strong>Lista de cuotas</strong>
          <span>Mostrando {cuotasVisibles.length} resultados</span>
        </div>
        <div className="list-actions">
          <div className="list-search-wrapper">
            <img src={buscarIcono} alt="" aria-hidden="true" className="list-search-icon" />
            <input
              type="text"
              aria-label="Buscar socio"
              placeholder="Buscar socio..."
              className="list-search"
              value={busqueda}
              onChange={(evento) => { setBusqueda(evento.target.value); setPagina(1); }}
            />
          </div>
          <select
            aria-label="Año"
            className="list-filter"
            value={anio ?? ""}
            onChange={(evento) => { setAnio(evento.target.value === "" ? null : Number(evento.target.value)); setPagina(1); }}
          >
            <option value="">Todos los años</option>
            {anios.map((valor) => <option key={valor} value={valor}>{valor}</option>)}
          </select>
          {filtrosActivos ? (
            <button type="button" className="cuotas-limpiar" onClick={() => { setBusqueda(""); setAnio(null); setPagina(1); }}>
              Limpiar filtros
            </button>
          ) : null}
          {puedeRegistrar ? (
            <button type="button" className="list-new-button" onClick={() => setFormulario({ mode: "create" })}>
              + Nueva cuota
            </button>
          ) : null}
        </div>
      </div>
      {error && <p className="cuotas-aviso" role="alert">{error}</p>}
      <div className="cuotas-tabla-contenedor">
        <table className="cuotas-tabla">
          <thead>
            <tr>
              {cabeceraOrden("anio", "Año")}
              <th>Código</th>
              {cabeceraOrden("socio", "Socio")}
              {cabeceraOrden("fechaPago", "Fecha de pago")}
              <th>Importe</th>
              <th>Comentario</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr>
                <td colSpan={6}>Cargando cuotas...</td>
              </tr>
            ) : cuotas.length === 0 && !error ? (
              <tr>
                <td colSpan={6}>No hay cuotas registradas.</td>
              </tr>
            ) : cuotasVisibles.length === 0 ? (
              <tr>
                <td colSpan={6}>No hay cuotas que coincidan con los filtros.</td>
              </tr>
            ) : cuotasPagina.map((cuota) => (
              <tr
                key={cuota.id_cuota}
                className={puedeRegistrar ? "cuotas-fila" : undefined}
                tabIndex={puedeRegistrar ? 0 : undefined}
                onClick={puedeRegistrar ? () => setFormulario({ mode: "edit", cuota }) : undefined}
                onKeyDown={puedeRegistrar ? (evento) => {
                  if (evento.key !== "Enter" && evento.key !== " ") return;
                  evento.preventDefault();
                  setFormulario({ mode: "edit", cuota });
                } : undefined}
              >
                <td>{cuota.pagoAnio}</td>
                <td>{textoCodigoCuota(cuota.Usuario)}</td>
                <td>{nombreVisibleCuota(cuota.Usuario)}</td>
                <td>{textoFechaInscripcion(cuota.fechaPago)}</td>
                <td>{importeVisibleCuota(cuota.importePagado)}</td>
                <td>{textoComentarioCuota(cuota.comentario)}</td>
              </tr>
            ))}
          </tbody>
          {cuotasVisibles.length > 0 ? (
            <tfoot>
              <tr>
                <td />
                <td />
                <td />
                <td className="cuotas-total-etiqueta">Total</td>
                <td>{importeVisibleCuota(totalImportesCuotas(cuotasVisibles))}</td>
                <td />
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>
      {!cargando && cuotasVisibles.length > 0 ? (
        <Paginacion pagina={paginaActual} totalPaginas={totalPaginas} onCambiar={setPagina} />
      ) : null}
      {formulario && (
        <CuotaFormModal
          key={formulario.mode === "edit" ? formulario.cuota.id_cuota : "nueva"}
          isOpen
          mode={formulario.mode}
          cuota={formulario.mode === "edit" ? formulario.cuota : undefined}
          onClose={() => setFormulario(null)}
          onCreada={(cuota) => {
            setFormulario(null);
            setError("");
            setCuotas((actuales) => insertarCuotaOrdenada(actuales, cuota));
          }}
          onActualizada={(cuota) => {
            setFormulario(null);
            setError("");
            setCuotas((actuales) => insertarCuotaOrdenada(actuales, cuota));
          }}
          onEliminada={(idCuota) => {
            setFormulario(null);
            setError("");
            setCuotas((actuales) => eliminarCuotaDeLista(actuales, idCuota));
          }}
        />
      )}
    </div>
  );
}
