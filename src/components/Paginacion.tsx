import { useEffect, useState } from "react";
import "./Paginacion.css";

export const REGISTROS_POR_PAGINA = 23;
const REGISTROS_POR_PAGINA_MOVIL = 20;
const CONSULTA_LISTADO_MOVIL = "(max-width: 700px)";

function esListadoMovil(): boolean {
  return typeof window !== "undefined"
    && typeof window.matchMedia === "function"
    && window.matchMedia(CONSULTA_LISTADO_MOVIL).matches;
}

export function useRegistrosPorPagina(): number {
  const [movil, setMovil] = useState(esListadoMovil);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return undefined;
    const media = window.matchMedia(CONSULTA_LISTADO_MOVIL);
    const actualizar = () => setMovil(media.matches);
    actualizar();
    media.addEventListener("change", actualizar);
    return () => media.removeEventListener("change", actualizar);
  }, []);

  return movil ? REGISTROS_POR_PAGINA_MOVIL : REGISTROS_POR_PAGINA;
}

type PaginacionProps = {
  pagina: number;
  totalPaginas: number;
  onCambiar: (pagina: number) => void;
};

export default function Paginacion({
  pagina,
  totalPaginas,
  onCambiar,
}: PaginacionProps) {
  return (
    <nav className="paginacion" aria-label="Paginación">
      <button
        type="button"
        className="paginacion-boton"
        onClick={() => onCambiar(pagina - 1)}
        disabled={pagina <= 1}
      >
        Anterior
      </button>

      <span className="paginacion-estado">
        Página {pagina} de {totalPaginas}
      </span>

      <button
        type="button"
        className="paginacion-boton"
        onClick={() => onCambiar(pagina + 1)}
        disabled={pagina >= totalPaginas}
      >
        Siguiente
      </button>
    </nav>
  );
}
