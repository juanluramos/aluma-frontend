import type { MetodoPagoCatalogo } from "../../types/catalogoPago";

interface Props {
  usuario: string;
  actividad: string;
  importe: string;
  metodos: MetodoPagoCatalogo[];
  metodo: string;
  fecha: string;
  errores: { metodo?: string; fecha?: string };
  disabled: boolean;
  onMetodo: (valor: string) => void;
  onFecha: (valor: string) => void;
}

function errorCampo(id: string, mensaje?: string) {
  if (!mensaje) return null;
  return (
    <p id={`${id}-error`} className="usuario-form-field-error" role="alert">
      {mensaje}
    </p>
  );
}

export default function InscripcionCobroCampos({
  usuario,
  actividad,
  importe,
  metodos,
  metodo,
  fecha,
  errores,
  disabled,
  onMetodo,
  onFecha,
}: Props) {
  const idMetodo = "inscripcion-metodo-pago";
  const idFecha = "inscripcion-fecha-pago";

  return (
    <div className="usuario-form-grid">
      <div className="usuario-form-field">
        <label htmlFor="inscripcion-cobro-usuario">Usuario</label>
        <input id="inscripcion-cobro-usuario" value={usuario} readOnly />
      </div>
      <div className="usuario-form-field">
        <label htmlFor="inscripcion-cobro-actividad">Actividad</label>
        <input id="inscripcion-cobro-actividad" value={actividad} readOnly />
      </div>
      <div className="usuario-form-field">
        <label htmlFor="inscripcion-importe">Importe</label>
        <input id="inscripcion-importe" value={importe} readOnly />
      </div>
      <div className="usuario-form-field">
        <label htmlFor={idMetodo}>Método de pago</label>
        <select
          id={idMetodo}
          name="id_metodo_pago"
          value={metodo}
          disabled={disabled}
          required
          aria-invalid={Boolean(errores.metodo)}
          aria-describedby={errores.metodo ? `${idMetodo}-error` : undefined}
          onChange={(event) => onMetodo(event.target.value)}
        >
          <option value="">Selecciona un método</option>
          {metodos.map((item) => (
            <option key={item.id_metodo_pago} value={item.id_metodo_pago}>
              {item.nombre}
            </option>
          ))}
        </select>
        {errorCampo(idMetodo, errores.metodo)}
      </div>
      <div className="usuario-form-field">
        <label htmlFor={idFecha}>Fecha de pago</label>
        <input
          id={idFecha}
          name="fechaPago"
          type="date"
          value={fecha}
          disabled={disabled}
          required
          aria-invalid={Boolean(errores.fecha)}
          aria-describedby={errores.fecha ? `${idFecha}-error` : undefined}
          onChange={(event) => onFecha(event.target.value)}
        />
        {errorCampo(idFecha, errores.fecha)}
      </div>
    </div>
  );
}
