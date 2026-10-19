import type { FormEvent } from "react";
import { formatoEuro } from "../../utils/formatoEuro";
import type { ConfiguracionCuotaAnual as Configuracion } from "../../services/configuracionCuotaService";
import type { ErroresConfiguracionCuota } from "../../utils/configuracionCuotaForm";
import "../usuarios/UsuarioFormModal.css";

interface Props {
  configuraciones: Configuracion[];
  anio: string;
  importe: string;
  errores: ErroresConfiguracionCuota;
  error: string;
  seleccionId: number | null;
  guardando: boolean;
  onAnio: (valor: string) => void;
  onImporte: (valor: string) => void;
  onGuardar: () => void;
  onElegir: (configuracion: Configuracion) => void;
  onNueva: () => void;
  onEliminar: (id: number) => void;
}

export default function ConfiguracionCuotaAnual({
  configuraciones,
  anio,
  importe,
  errores,
  error,
  seleccionId,
  guardando,
  onAnio,
  onImporte,
  onGuardar,
  onElegir,
  onNueva,
  onEliminar,
}: Props) {
  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    onGuardar();
  }

  return (
    <section className="configuracion-cuota" aria-labelledby="configuracion-cuota-titulo">
      <div className="configuracion-cuota-cabecera">
        <h2 id="configuracion-cuota-titulo">Configuración de cuota anual</h2>
        <button type="button" className="configuracion-cuota-nueva" onClick={onNueva} disabled={guardando}>
          Nuevo año
        </button>
      </div>
      <form className="usuario-form configuracion-cuota-form" noValidate onSubmit={enviar}>
        <div className="usuario-form-grid">
          <div className="usuario-form-field">
            <label htmlFor="configuracion-cuota-anio">Año</label>
            <input
              id="configuracion-cuota-anio"
              name="anio"
              inputMode="numeric"
              value={anio}
              disabled={guardando}
              aria-invalid={Boolean(errores.anio)}
              aria-describedby={errores.anio ? "configuracion-cuota-anio-error" : undefined}
              onChange={(evento) => onAnio(evento.target.value)}
            />
            {errores.anio ? <p id="configuracion-cuota-anio-error" className="usuario-form-field-error" role="alert">{errores.anio}</p> : null}
          </div>
          <div className="usuario-form-field">
            <label htmlFor="configuracion-cuota-importe">Importe</label>
            <input
              id="configuracion-cuota-importe"
              name="importe"
              inputMode="decimal"
              placeholder="30,00"
              value={importe}
              disabled={guardando}
              aria-invalid={Boolean(errores.importe)}
              aria-describedby={errores.importe ? "configuracion-cuota-importe-error" : undefined}
              onChange={(evento) => onImporte(evento.target.value)}
            />
            {errores.importe ? <p id="configuracion-cuota-importe-error" className="usuario-form-field-error" role="alert">{errores.importe}</p> : null}
          </div>
        </div>
        {error ? <div className="usuario-form-error" role="alert">{error}</div> : null}
        <div className="usuario-form-actions">
          {seleccionId !== null ? (
            <button type="button" className="usuario-form-eliminar" onClick={() => onEliminar(seleccionId)} disabled={guardando}>
              Eliminar
            </button>
          ) : null}
          <button type="submit" className="usuario-form-submit" disabled={guardando}>
            {guardando ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
      <table className="configuracion-cuota-tabla">
        <thead>
          <tr>
            <th>Año</th>
            <th>Importe</th>
          </tr>
        </thead>
        <tbody>
          {configuraciones.length === 0 ? (
            <tr>
              <td colSpan={2}>No hay configuraciones de cuota.</td>
            </tr>
          ) : configuraciones.map((configuracion) => (
            <tr
              key={configuracion.id_configuracion}
              className={configuracion.id_configuracion === seleccionId ? "is-selected" : undefined}
              tabIndex={0}
              onClick={() => onElegir(configuracion)}
              onKeyDown={(evento) => {
                if (evento.key === "Enter" || evento.key === " ") {
                  evento.preventDefault();
                  onElegir(configuracion);
                }
              }}
            >
              <td>{configuracion.anio}</td>
              <td>{formatoEuro(configuracion.importe)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
