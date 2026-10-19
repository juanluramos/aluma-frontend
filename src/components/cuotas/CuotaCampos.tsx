import type { CuotaFormState, UsuarioCuotaOpcion } from "../../utils/cuotaFormState";
import SelectorUsuario from "../usuarios/SelectorUsuario";
import { nombreCompletoUsuario } from "../../utils/usuariosListado";
import { PAGO_ANIO_MAXIMO, PAGO_ANIO_MINIMO, type ErroresCuota } from "../../utils/validacionesCuota";

interface Props {
  valores: CuotaFormState;
  errores: ErroresCuota;
  usuarios: UsuarioCuotaOpcion[];
  cargandoUsuarios: boolean;
  disabled: boolean;
  onChange: (campo: keyof CuotaFormState, valor: string) => void;
}

export default function CuotaCampos({ valores, errores, usuarios, cargandoUsuarios, disabled, onChange }: Props) {
  const opciones = usuarios.map(usuario => ({
    id_usuario: usuario.id_usuario,
    nombre: nombreCompletoUsuario(usuario),
    codigo: usuario.codUsuario?.trim() ?? "",
  })).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  return (
    <div className="usuario-form-grid">
      <SelectorUsuario id="cuota-id_usuario" valor={valores.id_usuario} usuarios={opciones}
        disabled={disabled || cargandoUsuarios} error={errores.id_usuario}
        etiqueta="Socio" placeholder="Buscar socio..."
        onChange={id => onChange("id_usuario", id)} />
      {cargandoUsuarios ? <p role="status">Cargando usuarios...</p> : null}
      <div className="usuario-form-field">
        <label htmlFor="cuota-pagoAnio">Año</label>
        <input
          id="cuota-pagoAnio"
          name="pagoAnio"
          type="number"
          inputMode="numeric"
          min={PAGO_ANIO_MINIMO}
          max={PAGO_ANIO_MAXIMO}
          step={1}
          value={valores.pagoAnio}
          disabled={disabled}
          aria-invalid={Boolean(errores.pagoAnio)}
          aria-describedby={errores.pagoAnio ? "cuota-pagoAnio-error" : undefined}
          onChange={(evento) => onChange("pagoAnio", evento.target.value)}
        />
        {errores.pagoAnio && <p id="cuota-pagoAnio-error" className="usuario-form-field-error" role="alert">{errores.pagoAnio}</p>}
      </div>
      <div className="usuario-form-field">
        <label htmlFor="cuota-fechaPago">Fecha de pago</label>
        <input
          id="cuota-fechaPago"
          name="fechaPago"
          type="date"
          value={valores.fechaPago}
          disabled={disabled}
          aria-invalid={Boolean(errores.fechaPago)}
          aria-describedby={errores.fechaPago ? "cuota-fechaPago-error" : undefined}
          onChange={(evento) => onChange("fechaPago", evento.target.value)}
        />
        {errores.fechaPago && <p id="cuota-fechaPago-error" className="usuario-form-field-error" role="alert">{errores.fechaPago}</p>}
      </div>
      <div className="usuario-form-field usuario-form-field-full">
        <label htmlFor="cuota-comentario">Comentario</label>
        <textarea
          id="cuota-comentario"
          name="comentario"
          maxLength={500}
          value={valores.comentario}
          disabled={disabled}
          aria-invalid={Boolean(errores.comentario)}
          aria-describedby={errores.comentario ? "cuota-comentario-error" : undefined}
          onChange={(evento) => onChange("comentario", evento.target.value)}
        />
        {errores.comentario && <p id="cuota-comentario-error" className="usuario-form-field-error" role="alert">{errores.comentario}</p>}
      </div>
    </div>
  );
}
