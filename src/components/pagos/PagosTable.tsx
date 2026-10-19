import type { EstadoPagoCatalogo, MetodoPagoCatalogo } from "../../types/catalogoPago";
import type { Inscripcion } from "../../types/inscripcion";
import { textoImporte } from "../../utils/pagoInscripcion";
import {
  nombreEstadoPagoCatalogo,
  nombreMetodoPago,
  textoFechaPago,
  type DireccionOrdenPago,
} from "../../utils/pagosListado";

interface Props {
  pagos: Inscripcion[];
  estados: EstadoPagoCatalogo[];
  metodos: MetodoPagoCatalogo[];
  direccionOrden: DireccionOrdenPago;
  onCambiarOrden: () => void;
  onSeleccionar: (pago: Inscripcion) => void;
}

function nombreUsuario(inscripcion: Inscripcion): string {
  const usuario = inscripcion.Usuario;
  if (!usuario) return "Usuario no disponible";
  return [usuario.nombre, usuario.apellido1, usuario.apellido2].filter(Boolean).join(" ") || "Usuario no disponible";
}

export default function PagosTable({
  pagos,
  estados,
  metodos,
  direccionOrden,
  onCambiarOrden,
  onSeleccionar,
}: Props) {
  return (
    <table className="inscripciones-tabla pagos-tabla">
      <thead>
        <tr>
          <th>Socio</th>
          <th>Actividad</th>
          <th>Importe aplicado</th>
          <th>Estado de pago</th>
          <th>Método de pago</th>
          <th aria-sort={direccionOrden === "asc" ? "ascending" : "descending"}>
            <button type="button" className="inscripciones-sort-button" onClick={onCambiarOrden}>
              Fecha de pago
              <span className="inscripciones-sort-icon active" aria-hidden="true">
                {direccionOrden === "desc" ? "▼" : "▲"}
              </span>
            </button>
          </th>
        </tr>
      </thead>
      <tbody>
        {pagos.map((pago) => {
          const usuario = nombreUsuario(pago);
          const estado = nombreEstadoPagoCatalogo(pago.id_estado_pago, estados);
          return (
            <tr
              key={pago.id_inscripcion}
              className="inscripciones-row-editable"
              tabIndex={0}
              aria-label={`Ver pago de ${usuario}`}
              onClick={() => onSeleccionar(pago)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSeleccionar(pago);
                }
              }}
            >
              <td>{usuario}</td>
              <td>{pago.Actividad?.titulo.trim() || "Actividad no disponible"}</td>
              <td>{textoImporte(pago.precioAplicado)}</td>
              <td>
                <span className={`inscripciones-estado inscripciones-estado-${claseEstado(estado)}`}>{estado}</span>
              </td>
              <td>{nombreMetodoPago(pago.id_metodo_pago, metodos)}</td>
              <td>{textoFechaPago(pago.fechaPago)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function claseEstado(nombre: string): string {
  switch (nombre) {
    case "Pendiente":
      return "pendiente";
    case "Pagado":
      return "pagado";
    case "Devolución":
      return "devolucion";
    case "Cancelado":
      return "cancelado";
    default:
      return "desconocido";
  }
}
