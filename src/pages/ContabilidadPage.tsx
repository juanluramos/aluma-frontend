import { useEffect, useRef, useState } from "react";
import pagosVerde from "../assets/icons/navigation/pagos-euro-verde.webp";
import pagosRojo from "../assets/icons/navigation/pagos-euro-rojo.webp";
import pagosAzul from "../assets/icons/navigation/pagos-euro-azul.webp";
import pagosAmarillo from "../assets/icons/navigation/pagos-euro-amarillo.webp";
import FiltrosMovimiento from "../components/contabilidad/FiltrosMovimiento";
import MenuExportarContabilidad from "../components/contabilidad/MenuExportarContabilidad";
import MovimientosTable from "../components/contabilidad/MovimientosTable";
import Paginacion from "../components/Paginacion";
import logoAluma from "../assets/icons/logo/aluma.webp";
import {
  getMovimientos,
  getResumenContable,
  type ListadoMovimientos,
  type ResumenContable,
} from "../services/contabilidadService";
import { formatoEuro } from "../utils/formatoEuro";
import { abrirInformeParaImprimir } from "../utils/generarInformeContabilidadPdf";
import { prepararInformeContabilidad } from "../utils/prepararInformeContabilidad";
import {
  consultaInicial,
  errorRangoFechas,
  hayFiltroContable,
  type ConsultaContable,
} from "../utils/filtrosContabilidad";
import "./ContabilidadPage.css";

const TARJETAS_FILTRADAS = [
  { clave: "totalCobrado", etiqueta: "Total cobrado", icono: pagosVerde, color: "green" },
  { clave: "totalDevuelto", etiqueta: "Total devuelto", icono: pagosRojo, color: "red" },
  { clave: "saldoNeto", etiqueta: "Saldo neto", icono: pagosAzul, color: "blue" },
] as const;

type ResumenFiltrado = Pick<ResumenContable, "totalCobrado" | "totalDevuelto" | "saldoNeto">;

function mensajeError(causa: unknown, defecto: string): string {
  return causa instanceof Error && causa.message ? causa.message : defecto;
}

export default function ContabilidadPage() {
  const [busqueda, setBusqueda] = useState("");
  const [consulta, setConsulta] = useState<ConsultaContable>(consultaInicial);
  const [resumenFiltrado, setResumenFiltrado] = useState<ResumenFiltrado | null>(null);
  const [pendiente, setPendiente] = useState<string | null>(null);
  const [listado, setListado] = useState<ListadoMovimientos | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [reintento, setReintento] = useState(0);
  const [exportando, setExportando] = useState(false);
  const [progresoExportacion, setProgresoExportacion] = useState("");
  const [avisoExportacion, setAvisoExportacion] = useState("");
  const [ofreceDescarga, setOfreceDescarga] = useState(false);
  const temporizador = useRef<number | null>(null);
  const exportandoRef = useRef(false);
  const informeRetenido = useRef<Awaited<ReturnType<typeof prepararInformeContabilidad>> | null>(null);
  const peticion = useRef(0);
  const consultaRef = useRef(consulta);
  const errorFechas = errorRangoFechas(consulta.desde, consulta.hasta);

  useEffect(() => {
    if (errorRangoFechas(consulta.desde, consulta.hasta)) return undefined;
    const id = peticion.current;
    let cancelado = false;
    Promise.allSettled([getResumenContable(consulta), getMovimientos(consulta)])
      .then(([resultadoResumen, resultadoListado]) => {
        if (cancelado || id !== peticion.current) return;
        if (resultadoResumen.status === "fulfilled") {
          setResumenFiltrado({
            totalCobrado: resultadoResumen.value.totalCobrado,
            totalDevuelto: resultadoResumen.value.totalDevuelto,
            saldoNeto: resultadoResumen.value.saldoNeto,
          });
          setPendiente(resultadoResumen.value.pendienteCobro);
        } else {
          setResumenFiltrado(null);
        }
        setListado(resultadoListado.status === "fulfilled" ? resultadoListado.value : null);
        if (resultadoResumen.status === "rejected") {
          setError(mensajeError(resultadoResumen.reason, "No se pudo cargar el resumen económico."));
        } else if (resultadoListado.status === "rejected") {
          setError(mensajeError(resultadoListado.reason, "No se pudieron cargar los movimientos."));
        } else {
          setError("");
        }
      })
      .finally(() => {
        if (!cancelado && id === peticion.current) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [consulta, reintento]);

  useEffect(() => () => {
    if (temporizador.current) window.clearTimeout(temporizador.current);
  }, []);

  function prepararConsulta(siguiente: ConsultaContable) {
    consultaRef.current = siguiente;
    setConsulta(siguiente);
    peticion.current += 1;
    setError("");
    setResumenFiltrado(null);
    setListado(null);
    setCargando(!errorRangoFechas(siguiente.desde, siguiente.hasta));
  }

  function aplicar(parcial: Partial<ConsultaContable>, pagina?: number) {
    prepararConsulta({ ...consultaRef.current, ...parcial, pagina: pagina ?? 1 });
  }

  function cambiarBusqueda(valor: string) {
    setBusqueda(valor);
    if (temporizador.current) window.clearTimeout(temporizador.current);
    temporizador.current = window.setTimeout(() => aplicar({ q: valor.trim() }), 300);
  }

  async function exportar(modo: "descargar" | "imprimir") {
    if (exportandoRef.current || errorFechas) return;
    const q = busqueda.trim();
    const seleccion = consultaRef.current.q === q
      ? consultaRef.current
      : { ...consultaRef.current, q, pagina: 1 };
    exportandoRef.current = true;
    setExportando(true);
    setAvisoExportacion("");
    setOfreceDescarga(false);
    informeRetenido.current = null;
    try {
      setProgresoExportacion("Preparando informe…");
      const preparado = await prepararInformeContabilidad(seleccion, logoAluma, (obtenidos, total) => {
        setProgresoExportacion(`Preparando informe… ${obtenidos} de ${total}`);
      });
      if (modo === "descargar") {
        preparado.documento.save(preparado.nombre);
        return;
      }
      if (!abrirInformeParaImprimir(preparado.documento)) {
        informeRetenido.current = preparado;
        setOfreceDescarga(true);
        setAvisoExportacion("El navegador ha bloqueado la ventana de impresión. Descarga el PDF para abrirlo o imprimirlo.");
      }
    } catch (causa: unknown) {
      setAvisoExportacion(mensajeError(causa, "No se pudo preparar el informe."));
    } finally {
      exportandoRef.current = false;
      setExportando(false);
      setProgresoExportacion("");
    }
  }

  function descargarInformeRetenido() {
    const preparado = informeRetenido.current;
    if (!preparado) return;
    preparado.documento.save(preparado.nombre);
    setOfreceDescarga(false);
    setAvisoExportacion("");
  }

  function reintentar() {
    peticion.current += 1;
    setError("");
    setResumenFiltrado(null);
    setListado(null);
    setCargando(true);
    setReintento((valor) => valor + 1);
  }

  const primeraCarga = cargando && pendiente === null && !error;
  const resumenVisible = Boolean(resumenFiltrado) && !cargando;
  const vacio = listado?.total === 0;

  return (
    <div className="contabilidad-page">
      {cargando ? (
        <p className="contabilidad-estado" role="status">
          {pendiente === null ? "Cargando resumen..." : "Actualizando resumen..."}
        </p>
      ) : null}
      {error ? (
        <p className="contabilidad-estado contabilidad-error" role="alert">{error}</p>
      ) : null}
      {error && !cargando && !errorFechas ? (
        <button type="button" className="contabilidad-limpiar contabilidad-reintentar" onClick={reintentar}>
          Reintentar
        </button>
      ) : null}

      {resumenVisible || pendiente !== null ? (
        <div className="contabilidad-stats">
          {resumenVisible && resumenFiltrado ? TARJETAS_FILTRADAS.map(({ clave, etiqueta, icono, color }) => (
            <div className="contabilidad-stat" key={clave}>
              <div className={`contabilidad-stat-icon contabilidad-stat-icon-${color}`}>
                <img src={icono} alt="" aria-hidden="true" />
              </div>
              <div>
                <span className="contabilidad-stat-label">{etiqueta}</span>
                <strong className="contabilidad-stat-value">{formatoEuro(resumenFiltrado[clave])}</strong>
              </div>
            </div>
          )) : null}
          {pendiente !== null ? (
            <div className="contabilidad-stat">
              <div className="contabilidad-stat-icon contabilidad-stat-icon-yellow">
                <img src={pagosAmarillo} alt="" aria-hidden="true" />
              </div>
              <div>
                <span className="contabilidad-stat-label">Pendiente actual</span>
                <strong className="contabilidad-stat-value">{formatoEuro(pendiente)}</strong>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {primeraCarga ? null : (
        <>
          <div className="contabilidad-acciones">
            <MenuExportarContabilidad
              deshabilitado={exportando || Boolean(errorFechas)}
              onDescargar={() => void exportar("descargar")}
              onImprimir={() => void exportar("imprimir")}
            />
            <FiltrosMovimiento
              consulta={consulta}
              busqueda={busqueda}
              onAplicar={(filtros) => aplicar(filtros)}
              onBusqueda={cambiarBusqueda}
            />
          </div>
          {progresoExportacion ? (
            <p className="contabilidad-estado" role="status">{progresoExportacion}</p>
          ) : null}
          {avisoExportacion ? (
            <p className="contabilidad-estado contabilidad-error" role="alert">{avisoExportacion}</p>
          ) : null}
          {ofreceDescarga ? (
            <button type="button" className="contabilidad-limpiar contabilidad-reintentar" onClick={descargarInformeRetenido}>
              Descargar PDF
            </button>
          ) : null}
          {errorFechas ? (
            <p className="contabilidad-estado contabilidad-error" role="alert">{errorFechas}</p>
          ) : null}
          {errorFechas || (error && !listado) ? null : cargando ? (
            <p className="contabilidad-estado" role="status">Cargando movimientos...</p>
          ) : vacio ? (
            <p className="contabilidad-estado">
              {hayFiltroContable(consulta)
                ? "No se encontraron movimientos con los filtros seleccionados."
                : "No hay movimientos registrados."}
            </p>
          ) : listado ? (
            <MovimientosTable
              movimientos={listado.movimientos}
              orden={consulta.orden}
              onOrdenar={() => aplicar({ orden: consulta.orden === "desc" ? "asc" : "desc" })}
            />
          ) : null}
          {!cargando && !errorFechas && listado && listado.total > 0 ? (
            <Paginacion pagina={listado.pagina} totalPaginas={listado.totalPaginas} onCambiar={(pagina) => aplicar({}, pagina)} />
          ) : null}
        </>
      )}
    </div>
  );
}
