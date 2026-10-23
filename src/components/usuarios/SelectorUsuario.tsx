import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import buscarIcono from "../../assets/icons/navigation/buscar.webp";
import { buscarUsuariosInscripcion, type OpcionUsuario } from "../../utils/opcionesInscripcion";

interface Props {
  id: string;
  valor: string;
  usuarios: OpcionUsuario[];
  disabled: boolean;
  error?: string;
  etiqueta?: string;
  placeholder?: string;
  juntoAlNombre?: ReactNode;
  juntoAlCodigo?: ReactNode;
  onChange: (id: string) => void;
}

function usuarioSeleccionado(usuarios: OpcionUsuario[], id: string): OpcionUsuario | undefined {
  return usuarios.find((usuario) => String(usuario.id_usuario) === id);
}

export default function SelectorUsuario({
  id,
  valor,
  usuarios,
  disabled,
  error,
  etiqueta = "Usuario",
  placeholder = "Buscar usuario...",
  juntoAlNombre,
  juntoAlCodigo,
  onChange,
}: Props) {
  const seleccionado = usuarioSeleccionado(usuarios, valor);
  const [consultaNombre, setNombreBusqueda] = useState<string | null>(null);
  const [consultaCodigo, setCodigoBusqueda] = useState<string | null>(null);
  const nombreBusqueda = consultaNombre ?? seleccionado?.nombre ?? "";
  const codigoBusqueda = consultaCodigo ?? seleccionado?.codigo ?? "";
  const [abierto, setAbierto] = useState(false);
  const busquedaRef = useRef<HTMLDivElement>(null);
  const listaId = useId();
  const idUsuario = id;
  const idCodigo = `${id}-codigo`;
  const lista = buscarUsuariosInscripcion(usuarios, nombreBusqueda, codigoBusqueda);
  const mostrarResultados = abierto && !disabled && (nombreBusqueda.trim() !== "" || codigoBusqueda.trim() !== "");

  useEffect(() => {
    if (!mostrarResultados) return undefined;

    const cerrar = (event: PointerEvent) => {
      if (event.target instanceof Node && !busquedaRef.current?.contains(event.target)) setAbierto(false);
    };
    const cerrarEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAbierto(false);
    };
    document.addEventListener("pointerdown", cerrar);
    document.addEventListener("keydown", cerrarEscape);
    return () => {
      document.removeEventListener("pointerdown", cerrar);
      document.removeEventListener("keydown", cerrarEscape);
    };
  }, [mostrarResultados]);

  function cambiarNombre(valor: string) {
    const seleccionado = usuarioSeleccionado(usuarios, valor);
    setAbierto(true);
    setNombreBusqueda(valor);
    if (!valor) return;
    onChange("");
    if (seleccionado && codigoBusqueda === (seleccionado.codigo ?? "")) setCodigoBusqueda("");
  }

  function cambiarCodigo(valor: string) {
    const seleccionado = usuarioSeleccionado(usuarios, valor);
    setAbierto(true);
    setCodigoBusqueda(valor);
    if (!valor) return;
    onChange("");
    if (seleccionado && nombreBusqueda === seleccionado.nombre) setNombreBusqueda("");
  }

  function elegir(usuario: OpcionUsuario) {
    onChange(String(usuario.id_usuario));
    setNombreBusqueda(usuario.nombre);
    setCodigoBusqueda(usuario.codigo ?? "");
    setAbierto(false);
  }

  const camposJuntos = juntoAlNombre != null || juntoAlCodigo != null;

  const campoSocio = (
    <div className={camposJuntos ? "usuario-form-field cuotas-campo-socio" : "usuario-form-field"}>
      <label htmlFor={idUsuario}>{etiqueta}</label>
      <div className="inscripcion-buscar-usuario">
        <img src={buscarIcono} alt="" aria-hidden="true" />
        <input
          id={idUsuario}
          name="id_usuario"
          type="text"
          value={nombreBusqueda}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls={listaId}
          aria-expanded={mostrarResultados}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${idUsuario}-error` : undefined}
          onChange={(event) => cambiarNombre(event.target.value)}
          onFocus={() => setAbierto(true)}
        />
      </div>
      {error ? <p id={`${idUsuario}-error`} className="usuario-form-field-error" role="alert">{error}</p> : null}
    </div>
  );

  const campoCodigo = (
    <div className={camposJuntos ? "usuario-form-field cuotas-campo-codigo" : "usuario-form-field"}>
      <label htmlFor={idCodigo}>Código socio</label>
      <input
        id={idCodigo}
        name="codigo_socio"
        type="text"
        value={codigoBusqueda}
        disabled={disabled}
        placeholder="Buscar por código"
        autoComplete="off"
        aria-controls={listaId}
        aria-expanded={mostrarResultados}
        onChange={(event) => cambiarCodigo(event.target.value)}
        onFocus={() => setAbierto(true)}
      />
    </div>
  );

  const resultados = mostrarResultados ? (
    <ul id={listaId} className="inscripcion-usuario-resultados" role="listbox" aria-label="Usuarios encontrados">
      {lista.length === 0 ? (
        <li className="inscripcion-usuario-vacio">No se encontraron usuarios.</li>
      ) : lista.map((usuario) => (
        <li key={usuario.id_usuario}>
          <button type="button" role="option" onClick={() => elegir(usuario)}>
            <span>{usuario.nombre}</span>
            {usuario.codigo ? <span>{usuario.codigo}</span> : null}
          </button>
        </li>
      ))}
    </ul>
  ) : null;

  if (camposJuntos) {
    return (
      <div className="inscripcion-usuario-busqueda usuario-form-field-full cuotas-selector" ref={busquedaRef}>
        <div className="cuotas-linea-socio">
          {campoSocio}
          {juntoAlNombre}
        </div>
        <div className="cuotas-linea-pago">
          {campoCodigo}
          {juntoAlCodigo}
        </div>
        {resultados}
      </div>
    );
  }

  return (
    <div className="inscripcion-usuario-busqueda usuario-form-field-full" ref={busquedaRef}>
      <div className="usuario-form-grid inscripcion-busqueda-fila">
        {campoSocio}
        {campoCodigo}
        {resultados}
      </div>
    </div>
  );
}
