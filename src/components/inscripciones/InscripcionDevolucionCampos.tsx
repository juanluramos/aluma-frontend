interface Props {
  usuario: string;
  actividad: string;
  importe: string;
  error: string;
  conflicto: boolean;
  submitting: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
  onConsultar?: () => void;
}

export default function InscripcionDevolucionCampos({
  usuario,
  actividad,
  importe,
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
          <label htmlFor="inscripcion-devolucion-usuario">Usuario</label>
          <input id="inscripcion-devolucion-usuario" value={usuario} readOnly />
        </div>
        <div className="usuario-form-field">
          <label htmlFor="inscripcion-devolucion-actividad">Actividad</label>
          <input id="inscripcion-devolucion-actividad" value={actividad} readOnly />
        </div>
        <div className="usuario-form-field">
          <label htmlFor="inscripcion-devolucion-importe">Precio aplicado</label>
          <input id="inscripcion-devolucion-importe" value={importe} readOnly />
        </div>
      </div>
      <p className="usuario-form-error" role="note">
        Esta operación registrará una devolución y cerrará la inscripción.
      </p>
      {error ? <div className="usuario-form-error" role="alert">{error}</div> : null}
      {conflicto && onConsultar ? (
        <button type="button" className="usuario-form-cancel" onClick={onConsultar} disabled={submitting}>
          Volver a consultar
        </button>
      ) : null}
      <div className="usuario-form-actions">
        <button type="button" className="usuario-form-cancel" onClick={onCancelar} disabled={submitting}>
          Cancelar
        </button>
        <button type="submit" className="usuario-form-submit" disabled={submitting}>
          {submitting ? "Guardando..." : "Confirmar devolución"}
        </button>
      </div>
    </form>
  );
}
