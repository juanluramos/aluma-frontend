import "./Paginacion.css";

export const REGISTROS_POR_PAGINA = 23;

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
