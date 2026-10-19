import Modal from "../modal/Modal";
import type { Usuario } from "../../services/usuarioService";
import { nombreCompletoUsuario } from "../../utils/usuariosListado";
import "./ConfirmarEliminarUsuario.css";

type ConfirmarEliminarUsuarioProps = {
  usuario: Usuario | null;
  isOpen: boolean;
  submitting: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

function ConfirmarEliminarUsuario({
  usuario,
  isOpen,
  submitting,
  error = null,
  onCancel,
  onConfirm,
}: ConfirmarEliminarUsuarioProps) {
  function handleClose() {
    if (submitting) {
      return;
    }

    onCancel();
  }

  const nombre = usuario ? nombreCompletoUsuario(usuario) : "";
  const codigo = usuario?.codUsuario?.trim() || null;

  return (
    <Modal
      isOpen={isOpen}
      title="Eliminar usuario definitivamente"
      onClose={handleClose}
    >
      <div className="confirmar-eliminar-usuario">
        {usuario ? (
          <p className="confirmar-eliminar-usuario-identidad">
            <span className="confirmar-eliminar-usuario-nombre">
              {nombre}
            </span>
            {codigo ? (
              <span className="confirmar-eliminar-usuario-codigo">
                {" "}
                ({codigo})
              </span>
            ) : null}
          </p>
        ) : null}

        <p className="confirmar-eliminar-usuario-aviso">
          Esta eliminación es irreversible. El usuario se borrará de forma
          definitiva y no podrá recuperarse.
        </p>

        <p className="confirmar-eliminar-usuario-relacionados">
          La operación puede ser bloqueada cuando existan registros relacionados.
        </p>

        {error ? (
          <div className="confirmar-eliminar-usuario-error" role="alert">
            {error}
          </div>
        ) : null}

        <div className="confirmar-eliminar-usuario-actions">
          <button
            type="button"
            className="confirmar-eliminar-usuario-cancel"
            onClick={handleClose}
            disabled={submitting}
          >
            Cancelar
          </button>

          <button
            type="button"
            className="confirmar-eliminar-usuario-submit"
            onClick={onConfirm}
            disabled={submitting}
          >
            {submitting ? "Eliminando..." : "Eliminar definitivamente"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default ConfirmarEliminarUsuario;
