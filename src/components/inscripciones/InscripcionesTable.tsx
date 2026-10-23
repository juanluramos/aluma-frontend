import { textoFechaInscripcion } from "../../utils/fechaCalendario";
import { nombreMetodoPago, textoFechaPago } from "../../utils/pagosListado";
import type { CampoOrdenInscripcion } from "../../utils/inscripcionesListado";
import { nombreEstadoPago } from "../../utils/estadoPagoInscripcion";
import type { EstadoInscripcionCatalogo, EstadoPagoCatalogo, MetodoPagoCatalogo } from "../../types/catalogoPago";
import type { Inscripcion } from "../../types/inscripcion";

interface InscripcionesTableProps {
  inscripciones: Inscripcion[];
  campoOrden?: CampoOrdenInscripcion | null;
  direccionOrden?: 'asc' | 'desc';
  onCambiarOrden?: (campo: CampoOrdenInscripcion) => void;
  estadosInscripcion?: EstadoInscripcionCatalogo[];
  estadosPago?: EstadoPagoCatalogo[];
  metodosPago?: MetodoPagoCatalogo[];
  puedeEditar?: boolean;
  onEditar?: (inscripcion: Inscripcion) => void;
}

function nombreEstadoInscripcion(id: number, estados: EstadoInscripcionCatalogo[]): string {
  return estados.find((estado) => estado.id_estado_inscripcion === id)?.nombre ?? "Desconocido";
}

function claseEstadoInscripcion(nombre: string): string {
  if (nombre === "Activa") return "inscripciones-estado-activa";
  if (nombre === "Cerrada") return "inscripciones-estado-cerrada";
  if (nombre === "En espera") return "inscripciones-estado-pendiente";
  return "inscripciones-estado-desconocido";
}

function claseEstadoPago(nombre: string): string {
  switch (nombre) {
    case "Pendiente":
      return "inscripciones-estado-pendiente";
    case "Pagado":
      return "inscripciones-estado-pagado";
    case "Devolución":
      return "inscripciones-estado-devolucion";
    case "Cancelado":
      return "inscripciones-estado-cancelado";
    default:
      return "inscripciones-estado-desconocido";
  }
}

function FechaPagoCaja({ valor }: { valor: string | null }) {
  if (!valor) return "Sin fecha";
  const texto = textoFechaInscripcion(valor);
  const partes = /^(\d{2}\/\d{2}\/)(\d{2})(\d{2})$/.exec(texto);
  if (!partes) return textoFechaPago(valor);
  return (
    <>
      {partes[1]}
      <span className="caja-fecha-siglo">{partes[2]}</span>
      {partes[3]}
    </>
  );
}

function formatearFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString("es-ES", { timeZone: "UTC" });
}

function formatearPrecio(precio: string | null): string {
  return precio == null ? "Sin precio" : `${precio} €`;
}

function nombreUsuario(usuario: Inscripcion["Usuario"]): string {
  if (!usuario) return "Usuario no disponible";
  const nombre = [usuario.nombre, usuario.apellido1, usuario.apellido2]
    .filter(Boolean)
    .join(" ");
  return nombre || "Usuario no disponible";
}

function tituloActividad(actividad: Inscripcion["Actividad"]): string {
  const titulo = actividad?.titulo.trim();
  return titulo || "Actividad no disponible";
}

export default function InscripcionesTable({
  inscripciones,
  campoOrden = null,
  direccionOrden = 'asc',
  onCambiarOrden,
  estadosInscripcion = [],
  estadosPago = [],
  metodosPago = [],
  puedeEditar = false,
  onEditar,
}: InscripcionesTableProps) {
  function cabeceraOrden(campo: CampoOrdenInscripcion, etiqueta: string) {
    const activo = campoOrden === campo;
    return <th aria-sort={activo ? (direccionOrden === 'asc' ? 'ascending' : 'descending') : 'none'}>
      {onCambiarOrden ? <button type="button" className="inscripciones-sort-button" onClick={() => onCambiarOrden(campo)}>
        {etiqueta}
        <span className={`inscripciones-sort-icon${activo ? ' active' : ''}`} aria-hidden="true">
          {activo && direccionOrden === 'desc' ? '▼' : '▲'}
        </span>
      </button> : etiqueta}
    </th>;
  }

  return (
    <table className="inscripciones-tabla inscripciones-pagos-tabla">
      <thead>
        <tr>
          {cabeceraOrden("codigo", "Código")}
          {cabeceraOrden("usuario", "Usuario")}
          {cabeceraOrden("actividad", "Actividad")}
          <th>Precio aplicado</th>
          <th>Estado inscripción</th>
          <th>Estado pago</th>
          {cabeceraOrden("fecha", "Fecha inscripción")}
          <th>Método de pago</th>
          {cabeceraOrden("fechaPago", "Fecha pago")}
        </tr>
      </thead>
      <tbody>
        {inscripciones.map((inscripcion) => (
          <tr
            key={inscripcion.id_inscripcion}
            className={onEditar ? "inscripciones-row-editable" : undefined}
            tabIndex={onEditar ? 0 : undefined}
            aria-label={onEditar ? `${puedeEditar ? "Editar inscripción" : "Ver pago"} de ${nombreUsuario(inscripcion.Usuario)}` : undefined}
            onClick={onEditar ? () => onEditar(inscripcion) : undefined}
            onKeyDown={onEditar ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onEditar(inscripcion);
              }
            } : undefined}
          >
            <td>{inscripcion.id_inscripcion}</td>
            <td>{nombreUsuario(inscripcion.Usuario)}</td>
            <td>{tituloActividad(inscripcion.Actividad)}</td>
            <td>{formatearPrecio(inscripcion.precioAplicado)}</td>
            <td>
              <span
                className={`inscripciones-estado ${claseEstadoInscripcion(nombreEstadoInscripcion(inscripcion.id_estado_inscripcion, estadosInscripcion))}`}
              >
                {nombreEstadoInscripcion(inscripcion.id_estado_inscripcion, estadosInscripcion)}
              </span>
            </td>
            <td>
              <span
                className={`inscripciones-estado ${claseEstadoPago(nombreEstadoPago(inscripcion.id_estado_pago, estadosPago))}`}
              >
                {nombreEstadoPago(inscripcion.id_estado_pago, estadosPago)}
              </span>
            </td>
            <td>{formatearFecha(inscripcion.apuntadoFecha)}</td>
            <td>{nombreMetodoPago(inscripcion.id_metodo_pago, metodosPago)}</td>
            <td><FechaPagoCaja valor={inscripcion.fechaPago} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
