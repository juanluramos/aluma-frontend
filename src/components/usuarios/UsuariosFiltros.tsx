import { useEffect, useRef, useState } from 'react';

interface Props {
  estado: string;
  socio: string;
  onEstado: (valor: string) => void;
  onSocio: (valor: string) => void;
}

export default function UsuariosFiltros({ estado, socio, onEstado, onSocio }: Props) {
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
  const [estadoTemporal, setEstadoTemporal] = useState(estado);
  const [socioTemporal, setSocioTemporal] = useState(socio);

  function abrir() {
    setEstadoTemporal(estado);
    setSocioTemporal(socio);
    setOpen(true);
  }

  function grupo(titulo: string, valor: string, opciones: [string, string][], cambiar: (valor: string) => void) {
    return <fieldset>
      <legend>{titulo}</legend>
      <label><input type="checkbox" checked={valor === ''}
        onChange={event => cambiar(event.target.checked ? '' : 'ninguno')} />Todos</label>
      {opciones.map(([clave, etiqueta]) => <label key={clave}>
        <input type="checkbox" checked={valor === '' || valor === clave}
          onChange={event => {
            const otra = opciones.find(([item]) => item !== clave)![0];
            cambiar(event.target.checked ? (valor === otra ? '' : clave) : (valor === '' ? otra : 'ninguno'));
          }} />{etiqueta}
      </label>)}
    </fieldset>;
  }

  return <div className="usuarios-filtros" ref={containerRef}>
    <button type="button" className="list-filter" ref={triggerRef}
      aria-expanded={open} aria-controls="usuarios-filtros-panel" onClick={() => open ? cerrar() : abrir()}>
      Filtrar
    </button>
    <div id="usuarios-filtros-panel" ref={panelRef}
      className={`usuarios-filtros-panel${open ? ' is-open' : ''}`}
      role="group" aria-labelledby="usuarios-filtros-title" aria-hidden={!open} inert={!open}>
        <div className="usuarios-filtros-heading">
          <h2 id="usuarios-filtros-title">Filtrar usuarios</h2>
          <button type="button" aria-label="Cerrar filtros" onClick={cerrar}>×</button>
        </div>
        <div className="usuarios-filtros-options">
          {grupo('Estado', estadoTemporal, [['activo', 'Activos'], ['pendiente', 'Pendiente'], ['inactivo', 'Inactivos']], setEstadoTemporal)}
          {grupo('Tipo de usuario', socioTemporal, [['socio', 'Socios'], ['no-socio', 'No socios']], setSocioTemporal)}
        </div>
        <div className="usuarios-filtros-actions">
          <button type="button" className="usuarios-filtros-apply" onClick={() => {
            onEstado(estadoTemporal);
            onSocio(socioTemporal);
            cerrar();
          }}>Aplicar filtros</button>
        </div>
    </div>
  </div>;
}
