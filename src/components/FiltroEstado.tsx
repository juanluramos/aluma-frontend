import { useEffect, useId, useRef, useState } from 'react';
import './FiltroEstado.css';

interface Props {
  titulo: string;
  etiqueta?: string;
  mostrarCancelar?: boolean;
  opciones: [string, string][];
  seleccion: string[];
  onAplicar: (valores: string[], secundarios?: string[], terciarios?: string[]) => void;
  grupoSecundario?: {
    titulo: string;
    opciones: [string, string][];
    seleccion: string[];
  };
  grupoTerciario?: {
    titulo: string;
    opciones: [string, string][];
    seleccion: string[];
  };
}

export default function FiltroEstado({ titulo, etiqueta = "Filtrar", mostrarCancelar = false, opciones, seleccion, onAplicar, grupoSecundario, grupoTerciario }: Props) {
  const id = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  function cerrar() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLInputElement>('input')?.focus();
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) setOpen(false);
    };
    const closeEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeEscape);
    };
  }, [open]);
  const [temporal, setTemporal] = useState(seleccion);
  const [secundarioTemporal, setSecundarioTemporal] = useState(grupoSecundario?.seleccion ?? []);
  const [terciarioTemporal, setTerciarioTemporal] = useState(grupoTerciario?.seleccion ?? []);

  function abrir() {
    setTemporal(seleccion);
    setSecundarioTemporal(grupoSecundario?.seleccion ?? []);
    setTerciarioTemporal(grupoTerciario?.seleccion ?? []);
    setOpen(true);
  }

  return <div className="estado-filtros" ref={containerRef}>
    <button type="button" className="list-filter" ref={triggerRef}
      aria-expanded={open} aria-controls={`${id}-panel`} onClick={() => open ? cerrar() : abrir()}>
      {etiqueta}
    </button>
    <div id={`${id}-panel`} ref={panelRef}
      className={`estado-filtros-panel${open ? ' is-open' : ''}${grupoTerciario ? ' estado-filtros-panel-ancho' : ''}`}
      role="group" aria-labelledby={`${id}-title`} aria-hidden={!open} inert={!open}>
        <div className="estado-filtros-heading">
          <h2 id={`${id}-title`}>{titulo}</h2>
          <button type="button" aria-label="Cerrar filtros" onClick={cerrar}>×</button>
        </div>
        <div className={`estado-filtros-options${grupoTerciario ? " estado-filtros-options-triple" : grupoSecundario ? " estado-filtros-options-doble" : ""}`}>
          <fieldset>
            <legend>Estado</legend>
            <label><input type="checkbox" checked={opciones.every(([valor]) => temporal.includes(valor))}
              onChange={event => setTemporal(event.target.checked ? opciones.map(([valor]) => valor) : [])} />Todos</label>
            {opciones.map(([valor, etiqueta]) => <label key={valor}>
              <input type="checkbox" checked={temporal.includes(valor)} onChange={event => {
                setTemporal(actual => event.target.checked ? [...actual, valor] : actual.filter(item => item !== valor));
              }} />{etiqueta}
            </label>)}
          </fieldset>
          {grupoSecundario ? <fieldset>
            <legend>{grupoSecundario.titulo}</legend>
            <label><input type="checkbox"
              checked={grupoSecundario.opciones.every(([valor]) => secundarioTemporal.includes(valor))}
              onChange={event => setSecundarioTemporal(event.target.checked ? grupoSecundario.opciones.map(([valor]) => valor) : [])} />Todos</label>
            {grupoSecundario.opciones.map(([valor, etiqueta]) => <label key={valor}>
              <input type="checkbox" checked={secundarioTemporal.includes(valor)} onChange={event => {
                setSecundarioTemporal(actual => event.target.checked ? [...actual, valor] : actual.filter(item => item !== valor));
              }} />{etiqueta}
            </label>)}
          </fieldset> : null}
          {grupoTerciario ? <fieldset>
            <legend>{grupoTerciario.titulo}</legend>
            <label><input type="checkbox"
              checked={grupoTerciario.opciones.every(([valor]) => terciarioTemporal.includes(valor))}
              onChange={event => setTerciarioTemporal(event.target.checked ? grupoTerciario.opciones.map(([valor]) => valor) : [])} />Todos</label>
            {grupoTerciario.opciones.map(([valor, etiquetaOpcion]) => <label key={valor}>
              <input type="checkbox" checked={terciarioTemporal.includes(valor)} onChange={event => {
                setTerciarioTemporal(actual => event.target.checked ? [...actual, valor] : actual.filter(item => item !== valor));
              }} />{etiquetaOpcion}
            </label>)}
          </fieldset> : null}
        </div>
        <div className="estado-filtros-actions">
          {mostrarCancelar ? <button type="button" onClick={cerrar}>Cancelar</button> : null}
          <button type="button" className="estado-filtros-apply" onClick={() => {
            onAplicar(temporal, grupoSecundario ? secundarioTemporal : undefined, grupoTerciario ? terciarioTemporal : undefined);
            cerrar();
          }}>Aplicar filtros</button>
        </div>
    </div>
  </div>;
}
