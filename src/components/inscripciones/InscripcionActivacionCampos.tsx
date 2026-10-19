interface Props {
  usuario: string;
  actividad: string;
  error: string;
  conflicto: boolean;
  submitting: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
  onConsultar?: () => void;
}

export default function InscripcionActivacionCampos({
  usuario,
  actividad,
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
          <label htmlFor="inscripcion-activar-usuario">Usuario</label>
          <input id="inscripcion-activar-usuario" value={usuario} readOnly />
        </div>
        <div className="usuario-form-field">
          <label htmlFor="inscripcion-activar-actividad">Actividad</label>
          <input id="inscripcion-activar-actividad" value={actividad} readOnly />
        </div>
      </div>
      <p role="note">
        Esta persona pasará de En espera a Activa y ocupará una plaza disponible. El pago continuará Pendiente.
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
          {submitting ? "Guardando..." : "Confirmar activación"}
        </button>
      </div>
    </form>
  );
}
