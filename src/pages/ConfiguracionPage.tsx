import { useEffect, useState } from "react";
import { hasPermission } from "../auth/permissions";
import { useRole } from "../auth/useRole";
import ConfiguracionCuotaAnual from "../components/configuracion/ConfiguracionCuotaAnual";
import {
  ConfiguracionCuotaApiError,
  createConfiguracionCuota,
  deleteConfiguracionCuota,
  getConfiguracionesCuota,
  updateConfiguracionCuota,
  type ConfiguracionCuotaAnual as Configuracion,
} from "../services/configuracionCuotaService";
import {
  guardarConfiguracionEnLista,
  quitarConfiguracionDeLista,
  textoImporteConfiguracion,
  validarConfiguracionCuota,
  type ErroresConfiguracionCuota,
} from "../utils/configuracionCuotaForm";
import "./ConfiguracionPage.css";

export default function ConfiguracionPage() {
  const rol = useRole();
  const [configuraciones, setConfiguraciones] = useState<Configuracion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [anio, setAnio] = useState("");
  const [importe, setImporte] = useState("");
  const [errores, setErrores] = useState<ErroresConfiguracionCuota>({});
  const [error, setError] = useState("");
  const [seleccionId, setSeleccionId] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!hasPermission(rol, "gestionarConfiguracionCuota")) return undefined;
    let activo = true;
    getConfiguracionesCuota()
      .then((datos) => {
        if (activo) setConfiguraciones(datos);
      })
      .catch((causa: unknown) => {
        if (activo) setError(causa instanceof Error ? causa.message : "No se pudo cargar la configuración.");
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [rol]);

  if (!hasPermission(rol, "gestionarConfiguracionCuota")) {
    return <p className="configuracion-aviso" role="alert">No tienes permisos para acceder a esta sección.</p>;
  }

  function limpiar() {
    setSeleccionId(null);
    setAnio("");
    setImporte("");
    setErrores({});
    setError("");
  }

  function elegir(configuracion: Configuracion) {
    setSeleccionId(configuracion.id_configuracion);
    setAnio(String(configuracion.anio));
    setImporte(textoImporteConfiguracion(configuracion.importe));
    setErrores({});
    setError("");
  }

  async function guardar() {
    const validacion = validarConfiguracionCuota(anio, importe);
    setErrores(validacion.errores);
    if (!validacion.datos) {
      setError("");
      return;
    }
    setGuardando(true);
    setError("");
    try {
      const guardada = seleccionId === null
        ? await createConfiguracionCuota(validacion.datos)
        : await updateConfiguracionCuota(seleccionId, validacion.datos);
      setConfiguraciones((actuales) => guardarConfiguracionEnLista(actuales, guardada));
      if (seleccionId === null) limpiar();
      else elegir(guardada);
    } catch (causa) {
      setError(causa instanceof ConfiguracionCuotaApiError ? causa.message : "No se pudo guardar la configuración.");
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(id: number) {
    setGuardando(true);
    setError("");
    try {
      await deleteConfiguracionCuota(id);
      setConfiguraciones((actuales) => quitarConfiguracionDeLista(actuales, id));
      if (seleccionId === id) limpiar();
    } catch (causa) {
      setError(causa instanceof ConfiguracionCuotaApiError ? causa.message : "No se pudo eliminar la configuración.");
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) return <p className="configuracion-aviso" role="status">Cargando configuración...</p>;

  return (
    <div className="configuracion-page">
      <ConfiguracionCuotaAnual
        configuraciones={configuraciones}
        anio={anio}
        importe={importe}
        errores={errores}
        error={error}
        seleccionId={seleccionId}
        guardando={guardando}
        onAnio={setAnio}
        onImporte={setImporte}
        onGuardar={() => { void guardar(); }}
        onElegir={elegir}
        onNueva={limpiar}
        onEliminar={(id) => { void eliminar(id); }}
      />
    </div>
  );
}
