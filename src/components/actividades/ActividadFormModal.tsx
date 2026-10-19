import { useRef, useState, type SubmitEvent } from "react";
import Modal from "../modal/Modal";
import ActividadCampos from "./ActividadCampos";
import ActividadInscritos from "./ActividadInscritos";
import { hasPermission } from "../../auth/permissions";
import { useRole } from "../../auth/useRole";
import type { Actividad } from "../../types/actividad";
import { obtenerValoresIniciales } from "../../utils/actividadFormState";
import { construirDatosActividad } from "../../utils/actividadFormPayload";
import { validarActividad, type ErroresActividad } from "../../utils/validacionesActividad";
import { ActividadApiError, createActividad, updateActividad } from "../../services/actividadService";
import "../usuarios/UsuarioFormModal.css";
import "./ActividadInscritos.css";

interface Props {
  actividad?: Actividad;
  onClose: () => void;
  onSaved: (actividad: Actividad) => void;
}

// La página monta una instancia nueva en cada apertura para descartar borradores.
export default function ActividadFormModal({ actividad, onClose, onSaved }: Props) {
  const role = useRole();
  const puedeGestionar = hasPermission(role, "gestionarActividades");
  const [valores, setValores] = useState(() => obtenerValoresIniciales(actividad));
  const [errores, setErrores] = useState<ErroresActividad>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pestana, setPestana] = useState<"datos" | "inscritos">("datos");
  const [editando, setEditando] = useState(false);
  const guardando = useRef(false);
  const soloLectura = Boolean(actividad) && !editando;

  function cancelarEdicion() {
    if (guardando.current) return;
    setValores(obtenerValoresIniciales(actividad));
    setErrores({});
    setError("");
    setEditando(false);
  }

  function cerrar() {
    if (!guardando.current) onClose();
  }

  async function guardar(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (guardando.current) return;
    if (!puedeGestionar) {
      setError("No tienes permiso para gestionar actividades.");
      return;
    }
    const validacion = validarActividad(valores);
    setErrores(validacion);
    setError("");
    if (Object.keys(validacion).length) return;
    guardando.current = true;
    setSubmitting(true);
    try {
      const datos = construirDatosActividad(valores, actividad);
      const guardada = actividad
        ? await updateActividad(actividad.id_actividad, datos)
        : await createActividad(datos);
      onSaved(guardada);
    } catch (causa) {
      if (causa instanceof ActividadApiError) setErrores(causa.errores);
      setError(causa instanceof Error ? causa.message : "No se pudo guardar la actividad.");
    } finally {
      guardando.current = false;
      setSubmitting(false);
    }
  }

  return <Modal isOpen title={actividad ? "Actividad" : "Nueva actividad"} onClose={cerrar}>
    {actividad ? (
      <div className="actividad-pestanas" role="tablist" aria-label="Secciones de la actividad">
        <button type="button" className="actividad-pestana" role="tab" id="actividad-tab-datos"
          aria-selected={pestana === "datos"} aria-controls="actividad-panel-datos"
          onClick={() => setPestana("datos")}>
          Datos
        </button>
        <button type="button" className="actividad-pestana" role="tab" id="actividad-tab-inscritos"
          aria-selected={pestana === "inscritos"} aria-controls="actividad-panel-inscritos"
          onClick={() => setPestana("inscritos")}>
          Inscritos
        </button>
      </div>
    ) : null}
    {actividad ? (
      <div className="actividad-paneles">
        <form className={`usuario-form actividad-panel${soloLectura ? " actividad-solo-lectura" : ""}`} id="actividad-panel-datos" role="tabpanel"
          aria-labelledby="actividad-tab-datos" aria-hidden={pestana !== "datos"} inert={pestana !== "datos"}
          noValidate onSubmit={guardar} aria-busy={submitting}>
          <ActividadCampos valores={valores} errores={errores} soloLectura={soloLectura} disabled={submitting || !puedeGestionar}
            onChange={(campo, valor) => {
              setValores(actual => ({ ...actual, [campo]: valor }));
              setErrores(actual => ({ ...actual, [campo]: undefined }));
            }} />
          {error && <div className="usuario-form-error" role="alert">{error}</div>}
          <div className="usuario-form-actions">
            <button type="button" className="usuario-form-cancel" onClick={editando ? cancelarEdicion : cerrar} disabled={submitting}>Cancelar</button>
            {editando ? (
              <button key="guardar" type="submit" className="usuario-form-submit" disabled={submitting || !puedeGestionar}>
                {submitting ? "Guardando..." : "Guardar cambios"}
              </button>
            ) : (
              <button key="editar" type="button" className="usuario-form-submit" disabled={!puedeGestionar}
                onClick={(event) => { event.preventDefault(); setEditando(true); }}>
                Editar
              </button>
            )}
          </div>
        </form>
        <div className="actividad-panel actividad-panel-inscritos" role="tabpanel" id="actividad-panel-inscritos"
          aria-labelledby="actividad-tab-inscritos" aria-hidden={pestana !== "inscritos"} inert={pestana !== "inscritos"}>
          <div className="actividad-inscritos-cuerpo">
            <ActividadInscritos idActividad={actividad.id_actividad} />
          </div>
          <div className="usuario-form-actions">
            <button type="button" className="usuario-form-cancel" onClick={cerrar}>Cancelar</button>
          </div>
        </div>
      </div>
    ) : (
      <form className="usuario-form" noValidate onSubmit={guardar} aria-busy={submitting}>
        <ActividadCampos valores={valores} errores={errores} disabled={submitting || !puedeGestionar}
          onChange={(campo, valor) => {
            setValores(actual => ({ ...actual, [campo]: valor }));
            setErrores(actual => ({ ...actual, [campo]: undefined }));
          }} />
        {error && <div className="usuario-form-error" role="alert">{error}</div>}
        <div className="usuario-form-actions">
          <button type="button" className="usuario-form-cancel" onClick={cerrar} disabled={submitting}>Cancelar</button>
          <button type="submit" className="usuario-form-submit" disabled={submitting || !puedeGestionar}>
            {submitting ? "Guardando..." : "Guardar actividad"}
          </button>
        </div>
      </form>
    )}
  </Modal>;
}
