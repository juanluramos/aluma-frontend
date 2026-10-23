import Modal from "../modal/Modal";
import type { MovimientoContable } from "../../services/contabilidadService";
import { textoDia } from "../../utils/filtrosContabilidad";
import { formatoEuro } from "../../utils/formatoEuro";
import "../usuarios/UsuarioFormModal.css";

type MovimientoModalProps = {
  movimiento: MovimientoContable;
  onClose: () => void;
};

function texto(valor: string | null): string {
  return valor?.trim() ? valor : "—";
}

export default function MovimientoModal({ movimiento, onClose }: MovimientoModalProps) {
  const negativo = movimiento.tipo === "Devolución" || movimiento.importe.startsWith("-");
  const campos: [string, string, boolean][] = [
    ["Fecha", textoDia(movimiento.fecha), false],
    ["Tipo", movimiento.tipo, false],
    ["Usuario", texto(movimiento.usuario), true],
    ["Concepto", movimiento.concepto, true],
    ["Actividad", texto(movimiento.actividad), true],
    ["Importe", formatoEuro(movimiento.importe), false],
    ["Método", texto(movimiento.metodoPago), false],
  ];

  return (
    <Modal isOpen title="Movimiento" className="modal-contabilidad" onClose={onClose}>
      <div className="usuario-form">
        <div className={`usuario-form-grid${negativo ? " movimiento-negativo" : ""}`}>
          {campos.map(([etiqueta, valor, completo]) => {
            const id = `movimiento-${etiqueta.toLowerCase()}`;
            return (
              <div className={completo ? "usuario-form-field usuario-form-field-full" : "usuario-form-field"} key={etiqueta}>
                <label htmlFor={id}>{etiqueta}</label>
                <input id={id} value={valor} readOnly disabled />
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
