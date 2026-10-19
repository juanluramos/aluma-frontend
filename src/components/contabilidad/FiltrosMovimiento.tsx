import { useEffect, useId, useRef, useState } from "react";
import { errorRangoFechas, type ConsultaContable } from "../../utils/filtrosContabilidad";

type TipoContable = ConsultaContable["tipo"];

type FiltrosMovimientoProps = {
  consulta: ConsultaContable;
  busqueda: string;
  onAplicar: (filtros: Pick<ConsultaContable, "desde" | "hasta" | "tipo">) => void;
  onBusqueda: (valor: string) => void;
};

const TIPOS: [Exclude<TipoContable, "Todos">, string][] = [
  ["Cobro", "Cobro"],
  ["Devolución", "Devolución"],
  ["Ajuste", "Ajuste"],
];

export default function FiltrosMovimiento({
  consulta,
  busqueda,
  onAplicar,
  onBusqueda,
}: FiltrosMovimientoProps) {
  const id = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [desde, setDesde] = useState(consulta.desde);
  const [hasta, setHasta] = useState(consulta.hasta);
  const [tipo, setTipo] = useState<TipoContable>(consulta.tipo);
  const errorFechas = errorRangoFechas(desde, hasta);

  function cerrar() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function abrir() {
    setDesde(consulta.desde);
    setHasta(consulta.hasta);
    setTipo(consulta.tipo);
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLInputElement>("input")?.focus();
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) setOpen(false);
    };
    const closeEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeEscape);
    };
  }, [open]);

  return (
    <div className="contabilidad-filtros">
      <label className="contabilidad-filtro contabilidad-filtro-buscar">
        Buscar
        <input
          type="search"
          value={busqueda}
          placeholder="Busca concepto o usuario "
          onChange={(evento) => onBusqueda(evento.target.value)}
        />
      </label>
      <div className="contabilidad-filtros-menu" ref={containerRef}>
        <button
          type="button"
          className="contabilidad-filtros-boton"
          ref={triggerRef}
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          onClick={() => (open ? cerrar() : abrir())}
        >
          Filtros
        </button>
        <div
          id={`${id}-panel`}
          ref={panelRef}
          className={`contabilidad-filtros-panel${open ? " is-open" : ""}`}
          role="group"
          aria-labelledby={`${id}-title`}
          aria-hidden={!open}
          inert={!open}
        >
          <div className="contabilidad-filtros-heading">
            <h2 id={`${id}-title`}>Filtros</h2>
            <button type="button" aria-label="Cerrar filtros" onClick={cerrar}>×</button>
          </div>
          <div className="contabilidad-filtros-options">
            <fieldset className="contabilidad-filtros-fechas">
              <legend>Fechas</legend>
              <label>
                Desde
                <input type="date" value={desde} onChange={(evento) => setDesde(evento.target.value)} />
              </label>
              <label>
                Hasta
                <input type="date" value={hasta} onChange={(evento) => setHasta(evento.target.value)} />
              </label>
              {errorFechas ? <p className="contabilidad-filtros-aviso" role="alert">{errorFechas}</p> : null}
            </fieldset>
            <fieldset>
              <legend>Tipo</legend>
              <label>
                <input
                  type="checkbox"
                  checked={tipo === "Todos"}
                  onChange={(evento) => {
                    if (evento.target.checked) setTipo("Todos");
                  }}
                />
                Todos
              </label>
              {TIPOS.map(([clave, etiqueta]) => (
                <label key={clave}>
                  <input
                    type="checkbox"
                    checked={tipo === "Todos" || tipo === clave}
                    onChange={(evento) => {
                      if (tipo === "Todos" || evento.target.checked) setTipo(clave);
                      else setTipo("Todos");
                    }}
                  />
                  {etiqueta}
                </label>
              ))}
            </fieldset>
          </div>
          <div className="contabilidad-filtros-actions">
            <button
              type="button"
              className="contabilidad-filtros-apply"
              onClick={() => {
                onAplicar({ desde, hasta, tipo });
                cerrar();
              }}
            >
              Aplicar filtros
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
