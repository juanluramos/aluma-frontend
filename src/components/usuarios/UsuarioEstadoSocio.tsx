import type { ErroresUsuario } from "../../utils/validacionesUsuario";

type UsuarioEstadoSocioProps = {
  estado: string;
  puedeCambiarEstado?: boolean;
  puedeCambiarSocio?: boolean;
  puedeMarcarActivo?: boolean;
  socio: boolean;
  matriculaPagada: boolean;
  comentario: string;
  mostrarActivo?: boolean;

  errores: ErroresUsuario;

  onEstadoChange: (value: string) => void;
  onSocioChange: (value: boolean) => void;
  onMatriculaPagadaChange: (
    value: boolean,
  ) => void;
  onComentarioChange: (value: string) => void;
};

function UsuarioEstadoSocio({
  estado,
  puedeCambiarEstado = true,
  puedeCambiarSocio = false,
  puedeMarcarActivo = puedeCambiarSocio,
  socio,
  matriculaPagada,
  comentario,
  mostrarActivo = false,

  errores,

  onEstadoChange,
  onSocioChange,
  onMatriculaPagadaChange,
  onComentarioChange,
}: UsuarioEstadoSocioProps) {
  return (
    <>
      {/* ESTADO */}

      {puedeCambiarEstado && <div className="usuario-form-field">
        <label htmlFor="estado">
          Estado
        </label>

        <select
          id="estado"
          value={estado}
          onChange={(event) =>
            onEstadoChange(event.target.value)
          }
        >
          <option value="1">
            Activo
          </option>

          <option value="3">
            Pendiente
          </option>

          <option value="2">
            Inactivo
          </option>
        </select>
      </div>}

      {/* SOCIO / MATRÍCULA */}

      <div className="usuario-form-options">
        <label className="usuario-form-check">
          <input
            type="checkbox"
            checked={socio}
            disabled={!puedeCambiarSocio}
            onChange={(event) =>
              onSocioChange(
                event.target.checked,
              )
            }
          />

          <span>Socio</span>
        </label>

        <label className="usuario-form-check">
          <input
            type="checkbox"
            checked={matriculaPagada}
            disabled={!puedeCambiarSocio}
            onChange={(event) =>
              onMatriculaPagadaChange(
                event.target.checked,
              )
            }
          />

          <span>
            Matrícula pagada
          </span>
        </label>

        {mostrarActivo && <label className="usuario-form-check">
          <input
            id="activo"
            type="checkbox"
            checked={estado === "1"}
            disabled={!puedeMarcarActivo}
            onChange={(event) =>
              onEstadoChange(event.target.checked ? "1" : "2")
            }
          />

          <span>Activo</span>
        </label>}
      </div>

      {/* COMENTARIOS */}

      <div className="usuario-form-field usuario-form-field-full">
        <label htmlFor="comentario">
          Comentarios
        </label>

        <textarea
          id="comentario"
          aria-invalid={Boolean(
            errores.comentario,
          )}
          aria-describedby={
            errores.comentario
              ? "comentario-error"
              : undefined
          }
          value={comentario}
          onChange={(event) =>
            onComentarioChange(
              event.target.value,
            )
          }
          placeholder="Añade un comentario..."
          maxLength={500}
          rows={3}
        />

        {errores.comentario && (
          <p
            id="comentario-error"
            className="usuario-form-field-error"
          >
            {errores.comentario}
          </p>
        )}
      </div>
    </>
  );
}

export default UsuarioEstadoSocio;