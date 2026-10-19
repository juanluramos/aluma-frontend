import SelectorUsuario from "../usuarios/SelectorUsuario";
import { useEffect, useId, useRef, useState } from "react";
import buscarIcono from "../../assets/icons/navigation/buscar.webp";
import type { InscripcionFormState } from "../../utils/inscripcionFormState";
import { buscarActividadesInscripcion, type OpcionActividad, type OpcionUsuario } from "../../utils/opcionesInscripcion";
import type { ErroresInscripcion } from "../../utils/validacionesInscripcion";

interface Props {
  valores: InscripcionFormState;
  errores: ErroresInscripcion;
  disabled: boolean;
  elegirUsuario: boolean;
  usuarios: OpcionUsuario[];
  nombrePropio: string;
  actividades: OpcionActividad[];
  referenciasBloqueadas?: boolean;
  onChange: (campo: keyof InscripcionFormState, valor: string) => void;
}

function errorCampo(id: string, mensaje?: string) {
  if (!mensaje) return null;

  return (
    <p id={`${id}-error`} className="usuario-form-field-error" role="alert">
      {mensaje}
    </p>
  );
}

function actividadSeleccionada(actividades: OpcionActividad[], id: string): OpcionActividad | undefined {
  return actividades.find((actividad) => String(actividad.id_actividad) === id);
}

export default function InscripcionCampos({
  valores,
  errores,
  disabled,
  elegirUsuario,
  usuarios,
  nombrePropio,
  actividades,
  referenciasBloqueadas = false,
  onChange,
}: Props) {
  const actividadInicial = actividadSeleccionada(actividades, valores.id_actividad);
  const [tituloBusqueda, setTituloBusqueda] = useState(actividadInicial?.titulo ?? "");
  const [codigoActividadBusqueda, setCodigoActividadBusqueda] = useState(
    actividadInicial ? String(actividadInicial.id_actividad) : "",
  );
  const [actividadAbierta, setActividadAbierta] = useState(false);
  const actividadRef = useRef<HTMLDivElement>(null);
  const listaActividadId = useId();
  const idUsuario = "inscripcion-id_usuario";
  const idActividad = "inscripcion-id_actividad";
  const idCodigoActividad = "inscripcion-codigo-actividad";
  const idComentario = "inscripcion-comentario";
  const resultadosActividad = buscarActividadesInscripcion(actividades, tituloBusqueda, codigoActividadBusqueda);
  const mostrarResultadosActividad = !referenciasBloqueadas && actividadAbierta && !disabled
    && (tituloBusqueda.trim() !== "" || codigoActividadBusqueda.trim() !== "");

  useEffect(() => {
    if (!mostrarResultadosActividad) return undefined;

    const cerrar = (event: PointerEvent) => {
      if (event.target instanceof Node && !actividadRef.current?.contains(event.target)) setActividadAbierta(false);
    };
    const cerrarEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActividadAbierta(false);
    };
    document.addEventListener("pointerdown", cerrar);
    document.addEventListener("keydown", cerrarEscape);
    return () => {
      document.removeEventListener("pointerdown", cerrar);
      document.removeEventListener("keydown", cerrarEscape);
    };
  }, [mostrarResultadosActividad]);

  function cambiarTitulo(valor: string) {
    const seleccionada = actividadSeleccionada(actividades, valores.id_actividad);
    setActividadAbierta(true);
    setTituloBusqueda(valor);
    if (!valores.id_actividad) return;
    onChange("id_actividad", "");
    if (seleccionada && codigoActividadBusqueda === String(seleccionada.id_actividad)) setCodigoActividadBusqueda("");
  }

  function cambiarCodigoActividad(valor: string) {
    const seleccionada = actividadSeleccionada(actividades, valores.id_actividad);
    setActividadAbierta(true);
    setCodigoActividadBusqueda(valor);
    if (!valores.id_actividad) return;
    onChange("id_actividad", "");
    if (seleccionada && tituloBusqueda === seleccionada.titulo) setTituloBusqueda("");
  }

  function elegirActividad(actividad: OpcionActividad) {
    onChange("id_actividad", String(actividad.id_actividad));
    setTituloBusqueda(actividad.titulo);
    setCodigoActividadBusqueda(String(actividad.id_actividad));
    setActividadAbierta(false);
  }

  return (
    <div className="usuario-form-grid">
      {elegirUsuario ? (
        <SelectorUsuario id={idUsuario} valor={valores.id_usuario} usuarios={usuarios}
          disabled={disabled} error={errores.id_usuario} onChange={id => onChange("id_usuario", id)} />
      ) : (
        <div className="usuario-form-field">
          <label htmlFor={idUsuario}>Usuario</label>
          <input id={idUsuario} name="id_usuario" value={nombrePropio} readOnly disabled />
        </div>
      )}

      {referenciasBloqueadas ? (
        <div className="usuario-form-field">
          <label htmlFor={idActividad}>Actividad</label>
          <input
            id={idActividad}
            name="id_actividad"
            value={actividadSeleccionada(actividades, valores.id_actividad)?.titulo ?? ""}
            readOnly
            disabled
          />
        </div>
      ) : (
        <div className="inscripcion-usuario-busqueda usuario-form-field-full" ref={actividadRef}>
          <div className="usuario-form-grid inscripcion-busqueda-fila">
            <div className="usuario-form-field">
              <label htmlFor={idActividad}>Actividad</label>
              <div className="inscripcion-buscar-usuario">
                <img src={buscarIcono} alt="" aria-hidden="true" />
                <input
                  id={idActividad}
                  name="id_actividad"
                  type="text"
                  value={tituloBusqueda}
                  disabled={disabled}
                  placeholder="Buscar actividad..."
                  autoComplete="off"
                  aria-autocomplete="list"
                  aria-controls={listaActividadId}
                  aria-expanded={mostrarResultadosActividad}
                  aria-invalid={Boolean(errores.id_actividad)}
                  aria-describedby={errores.id_actividad ? `${idActividad}-error` : undefined}
                  onChange={(event) => cambiarTitulo(event.target.value)}
                  onFocus={() => setActividadAbierta(true)}
                />
              </div>
              {errorCampo(idActividad, errores.id_actividad)}
            </div>

            <div className="usuario-form-field">
              <label htmlFor={idCodigoActividad}>Código actividad</label>
              <input
                id={idCodigoActividad}
                name="codigo_actividad"
                type="text"
                value={codigoActividadBusqueda}
                disabled={disabled}
                placeholder="Buscar por código"
                autoComplete="off"
                aria-controls={listaActividadId}
                aria-expanded={mostrarResultadosActividad}
                onChange={(event) => cambiarCodigoActividad(event.target.value)}
                onFocus={() => setActividadAbierta(true)}
              />
            </div>

            {mostrarResultadosActividad ? (
              <ul id={listaActividadId} className="inscripcion-usuario-resultados" role="listbox" aria-label="Actividades encontradas">
                {resultadosActividad.length === 0 ? (
                  <li className="inscripcion-usuario-vacio">No se encontraron actividades.</li>
                ) : resultadosActividad.map((actividad) => (
                  <li key={actividad.id_actividad}>
                    <button type="button" role="option" onClick={() => elegirActividad(actividad)}>
                      <span>{actividad.titulo}</span>
                      <span>{actividad.id_actividad}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      )}

      <div className="usuario-form-field usuario-form-field-full">
        <label htmlFor={idComentario}>Comentarios</label>
        <textarea
          id={idComentario}
          name="comentario"
          value={valores.comentario}
          disabled={disabled}
          aria-invalid={Boolean(errores.comentario)}
          aria-describedby={errores.comentario ? `${idComentario}-error` : undefined}
          onChange={(event) => onChange("comentario", event.target.value)}
        />
        {errorCampo(idComentario, errores.comentario)}
      </div>
    </div>
  );
}
