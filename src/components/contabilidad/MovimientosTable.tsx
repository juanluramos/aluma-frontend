import type { MovimientoContable } from "../../services/contabilidadService";
import { textoDia } from "../../utils/filtrosContabilidad";
import { formatoEuro } from "../../utils/formatoEuro";

type MovimientosTableProps = {
  movimientos: MovimientoContable[];
  orden: "asc" | "desc";
  onOrdenar: () => void;
};

function texto(valor: string | null): string {
  return valor?.trim() ? valor : "—";
}

export default function MovimientosTable({ movimientos, orden, onOrdenar }: MovimientosTableProps) {
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
          {movimientos.map((movimiento) => (
            <tr key={movimiento.id}>
              <td>{textoDia(movimiento.fecha)}</td>
              <td>{movimiento.tipo}</td>
              <td>{movimiento.concepto}</td>
              <td>{texto(movimiento.usuario)}</td>
              <td>{texto(movimiento.actividad)}</td>
              <td>{texto(movimiento.metodoPago)}</td>
              <td className={movimiento.importe.startsWith("-") ? "contabilidad-importe-negativo" : undefined}>
                {formatoEuro(movimiento.importe)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
