interface Props {
  usuario: string;
  actividad: string;
  importe: string;
  estado: string;
  metodo: string;
  fecha: string;
}

export default function PagoResumen({ usuario, actividad, importe, estado, metodo, fecha }: Props) {
  const campos = [
    ["pago-usuario", "Usuario", usuario],
    ["pago-actividad", "Actividad", actividad],
    ["pago-importe", "Importe aplicado", importe],
    ["pago-estado", "Estado de pago", estado],
    ["pago-metodo", "Método de pago", metodo],
    ["pago-fecha", "Fecha de pago", fecha],
  ] as const;

  return (
    <div className="usuario-form-grid">
      {campos.map(([id, etiqueta, valor]) => (
        <div className="usuario-form-field" key={id}>
          <label htmlFor={id}>{etiqueta}</label>
          <input id={id} value={valor} readOnly />
        </div>
      ))}
    </div>
  );
}
