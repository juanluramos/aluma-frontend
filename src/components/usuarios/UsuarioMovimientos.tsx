import { useEffect, useState } from "react";
import Paginacion, { useRegistrosPorPagina } from "../Paginacion";
import { getActividades } from "../../services/actividadService";
import { getCuotas } from "../../services/cuotaService";
import { getInscripciones } from "../../services/inscripcionService";
import { movimientosDeUsuario, type MovimientoUsuario } from "../../utils/movimientosUsuario";

export default function UsuarioMovimientos({ idUsuario }: { idUsuario: number }) {
  const registrosPorPagina = useRegistrosPorPagina();
  const [movimientos, setMovimientos] = useState<MovimientoUsuario[] | null>(null);
  const [pagina, setPagina] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    void (async () => {
      try {
        const [inscripciones, actividades, cuotas] = await Promise.all([
          getInscripciones(),
          getActividades(),
          getCuotas(),
        ]);
        if (!activo) return;
        setPagina(1);
        setMovimientos(movimientosDeUsuario(idUsuario, inscripciones, actividades, cuotas));
      } catch (causa) {
        if (activo) setError(causa instanceof Error ? causa.message : "No se pudieron cargar los movimientos.");
      }
    })();
    return () => { activo = false; };
  }, [idUsuario]);

  if (error) return <p className="usuario-form-error" role="alert">{error}</p>;
  if (!movimientos) return <p role="status">Cargando movimientos…</p>;
  if (movimientos.length === 0) return <p>Este usuario no tiene movimientos.</p>;

  const totalPaginas = Math.max(1, Math.ceil(movimientos.length / registrosPorPagina));
  const paginaActual = Math.min(pagina, totalPaginas);
  const visibles = movimientos.slice(
    (paginaActual - 1) * registrosPorPagina,
    paginaActual * registrosPorPagina,
  );

  return <>
    <div className="usuario-movimientos">
      <table>
        <thead>
          <tr>
            <th scope="col">Fecha</th>
            <th scope="col">Descripción</th>
          </tr>
        </thead>
        <tbody>
          {visibles.map((movimiento, indice) => <tr key={`${movimiento.fecha}-${movimiento.descripcion}-${indice}`}>
            <td>{movimiento.textoFecha}</td>
            <td>{movimiento.descripcion}</td>
          </tr>)}
        </tbody>
      </table>
    </div>
    <Paginacion pagina={paginaActual} totalPaginas={totalPaginas} onCambiar={setPagina} />
  </>;
}
