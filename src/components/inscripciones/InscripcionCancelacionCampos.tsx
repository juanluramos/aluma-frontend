interface Props {
  usuario: string;
  actividad: string;
  liberaPlaza: boolean;
  error: string;
  conflicto: boolean;
  submitting: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
  onConsultar?: () => void;
}

export default function InscripcionCancelacionCampos({
  usuario,
  actividad,
  liberaPlaza,
  error,
  conflicto,
  submitting,
  onConfirmar,
  onCancelar,
  onConsultar,
}: Props) {
  return (
    <form
      className="usuario-form"
      noValidate
      aria-busy={submitting}
      onSubmit={(event) => {
        event.preventDefault();
        onConfirmar();
      }}
    >
      <div className="usuario-form-grid">
        <div className="usuario-form-field">
          <label htmlFor="inscripcion-cancelar-usuario">Usuario</label>
          <input id="inscripcion-cancelar-usuario" value={usuario} readOnly />
        </div>
        <div className="usuario-form-field">
          <label htmlFor="inscripcion-cancelar-actividad">Actividad</label>
          <input id="inscripcion-cancelar-actividad" value={actividad} readOnly />
        </div>
      </div>
      <p role="note">
        Se va a cancelar la reserva.{liberaPlaza ? " La plaza quedará libre para quienes están en espera." : ""}
      </p>
      {error ? <div className="usuario-form-error" role="alert">{error}</div> : null}
      {conflicto && onConsultar ? (
        <button type="button" className="usuario-form-cancel" onClick={onConsultar} disabled={submitting}>
          Volver a consultar
        </button>
      ) : null}
      <div className="usuario-form-actions">
        <button type="button" className="usuario-form-cancel" onClick={onCancelar} disabled={submitting}>
          Volver
        </button>
        <button type="submit" className="usuario-form-submit" disabled={submitting || conflicto}>
          {submitting ? "Guardando..." : "Confirmar cancelación"}
        </button>
      </div>
    </form>
  );
}
