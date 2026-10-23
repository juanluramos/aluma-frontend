import type { MovimientoContable } from "../../services/contabilidadService";
import { textoDia } from "../../utils/filtrosContabilidad";
import { formatoEuro } from "../../utils/formatoEuro";

type MovimientosTableProps = {
  movimientos: MovimientoContable[];
  orden: "asc" | "desc";
  onOrdenar: () => void;
  onSeleccionar?: (movimiento: MovimientoContable) => void;
};

function texto(valor: string | null): string {
  return valor?.trim() ? valor : "—";
}

function FechaMovimiento({ valor }: { valor: string }) {
  const textoFecha = textoDia(valor);
  const partes = /^(\d{2}\/\d{2}\/)(\d{2})(\d{2})$/.exec(textoFecha);
  if (!partes) return textoFecha;
  return (
    <>
      {partes[1]}
      <span className="contabilidad-fecha-siglo">{partes[2]}</span>
      {partes[3]}
    </>
  );
}

export default function MovimientosTable({ movimientos, orden, onOrdenar, onSeleccionar }: MovimientosTableProps) {
  return (
    <div className="contabilidad-tabla-contenedor">
      <table className="contabilidad-tabla">
        <thead>
          <tr>
            <th aria-sort={orden === "asc" ? "ascending" : "descending"}>
              <button type="button" className="contabilidad-orden" onClick={onOrdenar}>
                Fecha
                <span className="contabilidad-orden-icono" aria-hidden="true">{orden === "desc" ? "▼" : "▲"}</span>
              </button>
            </th>
            <th>Tipo</th>
            <th>Concepto</th>
            <th>Usuario</th>
            <th>Actividad</th>
            <th>Método</th>
            <th>Importe</th>
          </tr>
        </thead>
        <tbody>
          {movimientos.map((movimiento) => {
            const negativo = movimiento.tipo === "Devolución" || movimiento.importe.startsWith("-");
            const clases = [
              negativo ? "contabilidad-linea-negativa" : "",
              onSeleccionar ? "contabilidad-fila" : "",
            ].filter(Boolean).join(" ");
            return (
              <tr
                key={movimiento.id}
                className={clases || undefined}
                tabIndex={onSeleccionar ? 0 : undefined}
                aria-label={onSeleccionar ? `Ver movimiento ${movimiento.concepto}` : undefined}
                onClick={onSeleccionar ? () => onSeleccionar(movimiento) : undefined}
                onKeyDown={onSeleccionar ? (evento) => {
                  if (evento.key !== "Enter" && evento.key !== " ") return;
                  evento.preventDefault();
                  onSeleccionar(movimiento);
                } : undefined}
              >
                <td><FechaMovimiento valor={movimiento.fecha} /></td>
                <td>{movimiento.tipo}</td>
                <td>{movimiento.concepto}</td>
                <td>{texto(movimiento.usuario)}</td>
                <td>{texto(movimiento.actividad)}</td>
                <td>{texto(movimiento.metodoPago)}</td>
                <td>{formatoEuro(movimiento.importe)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
