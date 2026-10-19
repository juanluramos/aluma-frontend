import { ESTADOS_ACTIVIDAD, type ActividadFormState } from "../../utils/actividadFormState";
import type { ErroresActividad } from "../../utils/validacionesActividad";

interface Props {
  valores: ActividadFormState;
  errores: ErroresActividad;
  disabled: boolean;
  soloLectura?: boolean;
  onChange: (campo: keyof ActividadFormState, valor: string) => void;
}

const campos = [
  { campo: "titulo", etiqueta: "Título", tipo: "text", maxLength: 100 },
  { campo: "fecha", etiqueta: "Fecha", tipo: "date" },
  { campo: "aforo", etiqueta: "Aforo", tipo: "number", min: 1, max: 2147483647, step: 1 },
  { campo: "importeSocio", etiqueta: "Precio socio", tipo: "number", min: 0, max: 99999999.99, step: 0.01 },
  { campo: "importeNoSocio", etiqueta: "Precio no socio", tipo: "number", min: 0, max: 99999999.99, step: 0.01 },
  { campo: "id_estado_actividad", etiqueta: "Estado", tipo: "select" },
  { campo: "comentario", etiqueta: "Comentarios", tipo: "textarea" },
] as const;

export default function ActividadCampos({ valores, errores, disabled, soloLectura = false, onChange }: Props) {
  return <div className="usuario-form-grid">
    {campos.map(({ campo, etiqueta, tipo, ...restricciones }) => {
      const id = `actividad-${campo}`;
      const props = {
        id, name: campo, value: valores[campo], disabled: disabled || (soloLectura && tipo === "select"),
        readOnly: soloLectura && tipo !== "select",
        "aria-invalid": Boolean(errores[campo]),
        "aria-describedby": errores[campo] ? `${id}-error` : undefined,
        onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => onChange(campo, event.target.value),
      };
      return <div key={campo} className={`usuario-form-field${campo === "titulo" || campo === "comentario" ? " usuario-form-field-full" : ""}`}>
        <label htmlFor={id}>{etiqueta}</label>
        {tipo === "select" ? <select {...props} required>
          <option value="">Selecciona un estado</option>
          {ESTADOS_ACTIVIDAD.map(estado => <option key={estado.id} value={estado.id}>{estado.nombre}</option>)}
        </select> : tipo === "textarea" ? <textarea {...props} />
          : <input {...props} {...restricciones} type={tipo} required={campo === "titulo"} />}
        {errores[campo] && <p id={`${id}-error`} className="usuario-form-field-error" role="alert">{errores[campo]}</p>}
      </div>;
    })}
  </div>;
}
