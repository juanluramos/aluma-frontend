import Modal from "../modal/Modal";
import type { Cuota } from "../../services/cuotaService";
import { textoFechaInscripcion } from "../../utils/fechaCalendario";
import { avisoBorradoCuotaAnioActual, nombreVisibleCuota, preguntaBorradoCuota } from "../../utils/cuotasListado";
import "../usuarios/ConfirmarEliminarUsuario.css";

type Props = {
  cuota: Cuota | null;
  isOpen: boolean;
  submitting: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmarEliminarCuota({ cuota, isOpen, submitting, error = null, onCancel, onConfirm }: Props) {
  function cerrar() {
    if (!submitting) onCancel();
  }

  const aviso = cuota ? avisoBorradoCuotaAnioActual(cuota.pagoAnio) : null;
  const fecha = cuota ? textoFechaInscripcion(cuota.fechaPago) : "-";

  return (
    <Modal isOpen={isOpen} title="Eliminar cuota" onClose={cerrar}>
      <div className="confirmar-eliminar-usuario">
        {cuota ? (
          <p className="confirmar-eliminar-usuario-identidad">
            <span className="confirmar-eliminar-usuario-nombre">
              {preguntaBorradoCuota(cuota.pagoAnio, nombreVisibleCuota(cuota.Usuario))}
            </span>
          </p>
        ) : null}
        {fecha !== "-" ? (
          <p className="confirmar-eliminar-usuario-relacionados">Fecha de pago: {fecha}</p>
        ) : null}
        {aviso ? <p className="confirmar-eliminar-usuario-aviso">{aviso}</p> : null}
        {error ? <div className="confirmar-eliminar-usuario-error" role="alert">{error}</div> : null}
        <div className="confirmar-eliminar-usuario-actions">
          <button type="button" className="confirmar-eliminar-usuario-cancel" onClick={cerrar} disabled={submitting}>
            Cancelar
          </button>
          <button type="button" className="confirmar-eliminar-usuario-submit" onClick={onConfirm} disabled={submitting}>
            {submitting ? "Eliminando..." : "Eliminar cuota"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
