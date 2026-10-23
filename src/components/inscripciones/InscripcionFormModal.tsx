import InscripcionCancelacionCampos from "./InscripcionCancelacionCampos";
import { useEffect, useRef, useState, type SubmitEvent } from "react";
import { hasPermission } from "../../auth/permissions";
import Modal from "../modal/Modal";
import { cancelarInscripcion, activarInscripcion, createInscripcion, InscripcionApiError, registrarDevolucionInscripcion, registrarPagoInscripcion, updateInscripcion, type InscripcionCreada } from "../../services/inscripcionService";
import type { EstadoInscripcionCatalogo, EstadoPagoCatalogo, MetodoPagoCatalogo } from "../../types/catalogoPago";
import type { Inscripcion } from "../../types/inscripcion";
import { construirDatosInscripcion, construirEdicionInscripcion } from "../../utils/inscripcionFormPayload";
import { valoresDesdeInscripcion, valoresIniciales } from "../../utils/inscripcionFormState";
import { construirDevolucionInscripcion, construirPagoInscripcion } from "../../utils/pagoInscripcionPayload";
import {
  puedeCancelarInscripcion,
  fechaLocalHoy,
  idEstadoPorNombre,
  puedeRegistrarDevolucion,
  puedeRegistrarPago,
  textoImporte,
  validarPago,
} from "../../utils/pagoInscripcion";
import { nombreEstadoPagoCatalogo, nombreMetodoPago, textoFechaPago } from "../../utils/pagosListado";
import { estaEnEspera, puedeActivarInscripcion } from "../../utils/promocionInscripcion";
import {
  cargarActividadesInscripcion,
  cargarNombrePropio,
  cargarUsuariosInscripcion,
  type OpcionActividad,
  type OpcionUsuario,
} from "../../utils/opcionesInscripcion";
import { validarInscripcion, type ErroresInscripcion } from "../../utils/validacionesInscripcion";
import InscripcionActivacionCampos from "./InscripcionActivacionCampos";
import InscripcionCampos from "./InscripcionCampos";
import InscripcionCobroCampos from "./InscripcionCobroCampos";
import InscripcionDevolucionCampos from "./InscripcionDevolucionCampos";
import InscripcionEsperaCampos from "./InscripcionEsperaCampos";
import PagoResumen from "../pagos/PagoResumen";
import { useSesionInscripcion } from "./useSesionInscripcion";
import "../usuarios/UsuarioFormModal.css";

interface Props {
  inscripcion?: Inscripcion;
  metodos?: MetodoPagoCatalogo[];
  estados?: EstadoPagoCatalogo[];
  estadosInscripcion?: EstadoInscripcionCatalogo[];
  onClose: () => void;
  onCreada?: (creada: InscripcionCreada) => void;
  onEditada?: () => void;
  onCobrada?: () => void;
  onDevuelta?: () => void;
  onCancelada?: () => void;
  onActivada?: () => void;
  onConsultar?: () => void;
  variante?: "inscripcion" | "pago";
}

function nombreInscripcion(inscripcion: Inscripcion): string {
  const usuario = inscripcion.Usuario;
  if (!usuario) return "Usuario no disponible";
  const nombre = [usuario.nombre, usuario.apellido1, usuario.apellido2].filter(Boolean).join(" ");
  return nombre || "Usuario no disponible";
}

function tituloInscripcion(inscripcion: Inscripcion): string {
  return inscripcion.Actividad?.titulo.trim() || "Actividad no disponible";
}

export default function InscripcionFormModal({
  inscripcion,
  metodos = [],
  estados = [],
  estadosInscripcion = [],
  onClose,
  onCreada,
  onEditada,
  onCobrada,
  onDevuelta,
  onCancelada,
  onActivada,
  onConsultar,
  variante = "inscripcion",
}: Props) {
  const edicion = inscripcion !== undefined;
  const { rol, idUsuario } = useSesionInscripcion();
  const puedeCrear = hasPermission(rol, "verInscripciones");
  const puedeEditar = hasPermission(rol, "gestionarInscripciones");
  const puedeGuardar = edicion ? puedeEditar : puedeCrear;
  const [valores, setValores] = useState(() => (
    inscripcion ? valoresDesdeInscripcion(inscripcion) : valoresIniciales(idUsuario, !puedeEditar)
  ));
  const [errores, setErrores] = useState<ErroresInscripcion>({});
  const [error, setError] = useState("");
  const [errorCarga, setErrorCarga] = useState("");
  const [actividades, setActividades] = useState<OpcionActividad[]>(() => (
    inscripcion ? [{ id_actividad: inscripcion.id_actividad, titulo: tituloInscripcion(inscripcion) }] : []
  ));
  const [usuarios, setUsuarios] = useState<OpcionUsuario[]>(() => (
    inscripcion ? [{
      id_usuario: inscripcion.id_usuario,
      nombre: nombreInscripcion(inscripcion),
      codigo: "",
    }] : []
  ));
  const [nombrePropio, setNombrePropio] = useState(() => (
    inscripcion ? nombreInscripcion(inscripcion) : "Tu usuario"
  ));
  const [listo, setListo] = useState(edicion);
  const [cancelacion, setCancelacion] = useState(false);
  const [cobro, setCobro] = useState(false);
  const [devolucion, setDevolucion] = useState(false);
  const [activacion, setActivacion] = useState(false);
  const [metodoPago, setMetodoPago] = useState("");
  const [fechaPago, setFechaPago] = useState("");
  const [erroresPago, setErroresPago] = useState<{ metodo?: string; fecha?: string }>({});
  const [conflicto, setConflicto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editando, setEditando] = useState(false);
  const guardando = useRef(false);
  const elegirUsuario = puedeEditar && (!edicion || editando);
  const camposBloqueados = edicion && !editando;
  const puedeCancelar = edicion && puedeCancelarInscripcion(inscripcion, estados, estadosInscripcion, puedeEditar);
  const enCancelacion = cancelacion && puedeCancelar;
  const idEstadoInscripcion = inscripcion?.id_estado_inscripcion;
  const liberaPlaza = estadosInscripcion.find(
    (estado) => estado.id_estado_inscripcion === idEstadoInscripcion,
  )?.nombre === "Activa";
  const puedeCobrar = edicion && puedeRegistrarPago(inscripcion, estados, estadosInscripcion, puedeEditar);
  const puedeDevolver = edicion && puedeRegistrarDevolucion(inscripcion, estados, puedeEditar);
  const puedeActivar = edicion && puedeActivarInscripcion(inscripcion, estados, estadosInscripcion, puedeEditar);
  const muestraEspera = edicion && estaEnEspera(inscripcion, estadosInscripcion);

  useEffect(() => {
    if (edicion && !puedeEditar) return undefined;

    let activo = true;
    const tareas: Promise<unknown>[] = [
      cargarActividadesInscripcion().then((datos) => {
        if (activo) setActividades(datos);
      }),
    ];

    if (puedeEditar) {
      tareas.push(cargarUsuariosInscripcion().then((datos) => {
        if (activo) setUsuarios(datos);
      }));
    } else if (idUsuario !== null) {
      tareas.push(cargarNombrePropio(idUsuario).then((nombre) => {
        if (activo) setNombrePropio(nombre);
      }));
    }

    Promise.all(tareas)
      .catch((causa: unknown) => {
        if (!activo) return;
        setErrorCarga(causa instanceof Error ? causa.message : "No se pudieron cargar los datos del formulario.");
      })
      .finally(() => {
        if (activo) setListo(true);
      });

    return () => {
      activo = false;
    };
  }, [edicion, puedeEditar, idUsuario]);

  const enCobro = cobro && puedeCobrar;
  const enDevolucion = devolucion && puedeDevolver;
  const enActivacion = activacion && puedeActivar;

  function cerrar() {
    if (!guardando.current) onClose();
  }

  async function guardar(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (guardando.current || (edicion && !editando)) return;

    if (!puedeGuardar) {
      setError(edicion
        ? "No tienes permiso para editar inscripciones."
        : "No tienes permiso para crear inscripciones.");
      return;
    }

    const idEnvio = !edicion && rol === "Usuario" ? String(idUsuario ?? "") : valores.id_usuario;
    if (!edicion && rol === "Usuario" && idUsuario === null) {
      setError("No se ha identificado tu usuario.");
      return;
    }

    const validacion = validarInscripcion({ ...valores, id_usuario: idEnvio });
    setErrores(validacion);
    setError("");
    if (Object.keys(validacion).length > 0) return;

    guardando.current = true;
    setSubmitting(true);
    try {
      if (edicion) {
        await updateInscripcion(inscripcion.id_inscripcion, construirEdicionInscripcion(valores));
        onEditada?.();
      } else {
        const creada = await createInscripcion(construirDatosInscripcion(
          { ...valores, id_usuario: idEnvio },
          new Date().toISOString().slice(0, 10),
        ));
        onCreada?.(creada);
      }
    } catch (causa) {
      if (causa instanceof InscripcionApiError) setErrores(causa.errores);
      setError(causa instanceof Error
        ? causa.message
        : edicion ? "No se pudo guardar la inscripción." : "No se pudo crear la inscripción.");
    } finally {
      guardando.current = false;
      setSubmitting(false);
    }
  }

  function volverDeCancelacion() {
    if (guardando.current) return;
    setCancelacion(false);
    setError("");
    setConflicto(false);
  }

  function abrirCancelacion() {
    if (!puedeCancelar) return;
    setError("");
    setConflicto(false);
    setCancelacion(true);
  }

  async function confirmarCancelacion() {
    if (guardando.current || !inscripcion || !puedeCancelar || conflicto) return;
    const idCancelado = idEstadoPorNombre(estados, "Cancelado");
    if (idCancelado === null) return;
    setError("");
    guardando.current = true;
    setSubmitting(true);
    try {
      await cancelarInscripcion(inscripcion.id_inscripcion, idCancelado);
      onCancelada?.();
    } catch (causa) {
      if (causa instanceof InscripcionApiError) {
        setConflicto(causa.status === 409);
        setError(causa.message);
      } else {
        setConflicto(true);
        setError("No se pudo confirmar la cancelación. Consulta el listado antes de volver a intentarlo.");
      }
    } finally {
      guardando.current = false;
      setSubmitting(false);
    }
  }

  function abrirActivacion() {
    if (!puedeActivar) return;
    setError("");
    setConflicto(false);
    setCobro(false);
    setDevolucion(false);
    setActivacion(true);
  }

  function cancelarActivacion() {
    if (guardando.current) return;
    setActivacion(false);
    setError("");
    setConflicto(false);
  }

  async function confirmarActivacion() {
    if (guardando.current || !inscripcion) return;
    if (!puedeActivar) {
      setError("No tienes permiso para activar inscripciones.");
      return;
    }
    setError("");
    setConflicto(false);
    guardando.current = true;
    setSubmitting(true);
    try {
      await activarInscripcion(inscripcion.id_inscripcion);
      onActivada?.();
    } catch (causa) {
      if (causa instanceof InscripcionApiError) {
        setConflicto(causa.status === 409);
        setError(causa.message);
      } else {
        setConflicto(true);
        setError("No se pudo confirmar si la inscripción se activó. Consulta el listado antes de volver a intentarlo.");
      }
    } finally {
      guardando.current = false;
      setSubmitting(false);
    }
  }

  function abrirCobro() {
    if (!puedeCobrar) return;
    setFechaPago((actual) => actual || fechaLocalHoy());
    setErroresPago({});
    setError("");
    setConflicto(false);
    setDevolucion(false);
    setActivacion(false);
    setCobro(true);
  }

  function abrirDevolucion() {
    if (!puedeDevolver) return;
    setError("");
    setConflicto(false);
    setCobro(false);
    setActivacion(false);
    setDevolucion(true);
  }

  function cancelarDevolucion() {
    if (guardando.current) return;
    setDevolucion(false);
    setError("");
    setConflicto(false);
  }

  async function confirmarDevolucion() {
    if (guardando.current || !inscripcion) return;
    const idDevolucion = idEstadoPorNombre(estados, "Devolución");
    if (!puedeEditar || idDevolucion == null) {
      setError("No tienes permiso para registrar devoluciones.");
      return;
    }
    setError("");
    setConflicto(false);
    guardando.current = true;
    setSubmitting(true);
    try {
      await registrarDevolucionInscripcion(
        inscripcion.id_inscripcion,
        construirDevolucionInscripcion(idDevolucion),
      );
      onDevuelta?.();
    } catch (causa) {
      if (causa instanceof InscripcionApiError) {
        setConflicto(causa.status === 409);
        setError(causa.message);
      } else {
        setConflicto(true);
        setError("No se pudo confirmar si la devolución se registró. Consulta el listado antes de volver a intentarlo.");
      }
    } finally {
      guardando.current = false;
      setSubmitting(false);
    }
  }

  function cancelarCobro() {
    if (guardando.current) return;
    setCobro(false);
    setError("");
    setConflicto(false);
    setErroresPago({});
  }

  async function confirmarPago(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (guardando.current || !inscripcion) return;
    const idPagado = idEstadoPorNombre(estados, "Pagado");
    if (!puedeEditar || idPagado == null) {
      setError("No tienes permiso para registrar pagos.");
      return;
    }
    const validacion = validarPago(metodoPago, fechaPago);
    setErroresPago(validacion);
    setError("");
    setConflicto(false);
    if (Object.keys(validacion).length > 0) return;

    guardando.current = true;
    setSubmitting(true);
    try {
      await registrarPagoInscripcion(
        inscripcion.id_inscripcion,
        construirPagoInscripcion(idPagado, Number(metodoPago), fechaPago),
      );
      onCobrada?.();
    } catch (causa) {
      if (causa instanceof InscripcionApiError) {
        setConflicto(causa.status === 409);
        setError(causa.message);
      } else {
        setConflicto(true);
        setError("No se pudo confirmar si el cobro se registró. Consulta el listado antes de volver a intentarlo.");
      }
    } finally {
      guardando.current = false;
      setSubmitting(false);
    }
  }

  const titulo = enCancelacion ? "Cancelar inscripción" : enCobro
    ? "Registrar pago"
    : enDevolucion
      ? "Registrar devolución"
      : enActivacion
        ? "Activar inscripción"
        : variante === "pago" && edicion
          ? "Pago"
          : edicion
            ? "Inscripción"
            : "Nueva inscripción";

  return (
    <Modal
      isOpen
      title={titulo}
      onClose={enCancelacion ? volverDeCancelacion : enCobro ? cancelarCobro : enDevolucion ? cancelarDevolucion : enActivacion ? cancelarActivacion : cerrar}
    >
      {enCancelacion && inscripcion ? (
        <InscripcionCancelacionCampos
          usuario={nombreInscripcion(inscripcion)} actividad={tituloInscripcion(inscripcion)}
          liberaPlaza={liberaPlaza}
          error={error} conflicto={conflicto} submitting={submitting}
          onConfirmar={confirmarCancelacion} onCancelar={volverDeCancelacion} onConsultar={onConsultar}
        />
      ) : enActivacion && inscripcion ? (
        <InscripcionActivacionCampos
          usuario={nombreInscripcion(inscripcion)}
          actividad={tituloInscripcion(inscripcion)}
          error={error}
          conflicto={conflicto}
          submitting={submitting}
          onConfirmar={confirmarActivacion}
          onCancelar={cancelarActivacion}
          onConsultar={onConsultar}
        />
      ) : enDevolucion && inscripcion ? (
        <InscripcionDevolucionCampos
          usuario={nombreInscripcion(inscripcion)}
          actividad={tituloInscripcion(inscripcion)}
          importe={textoImporte(inscripcion.precioAplicado)}
          error={error}
          conflicto={conflicto}
          submitting={submitting}
          onConfirmar={confirmarDevolucion}
          onCancelar={cancelarDevolucion}
          onConsultar={onConsultar}
        />
      ) : enCobro && inscripcion ? (
        <form className="usuario-form" noValidate onSubmit={confirmarPago} aria-busy={submitting}>
          <InscripcionCobroCampos
            usuario={nombreInscripcion(inscripcion)}
            actividad={tituloInscripcion(inscripcion)}
            importe={textoImporte(inscripcion.precioAplicado)}
            metodos={metodos}
            metodo={metodoPago}
            fecha={fechaPago}
            errores={erroresPago}
            disabled={submitting}
            onMetodo={(valor) => {
              setMetodoPago(valor);
              setErroresPago((actual) => ({ ...actual, metodo: undefined }));
            }}
            onFecha={(valor) => {
              setFechaPago(valor);
              setErroresPago((actual) => ({ ...actual, fecha: undefined }));
            }}
          />
          {error ? <div className="usuario-form-error" role="alert">{error}</div> : null}
          {conflicto && onConsultar ? (
            <button type="button" className="usuario-form-cancel" onClick={onConsultar} disabled={submitting}>
              Volver a consultar
            </button>
          ) : null}
          <div className="usuario-form-actions">
            <button type="button" className="usuario-form-cancel" onClick={cancelarCobro} disabled={submitting}>
              Cancelar
            </button>
            <button type="submit" className="usuario-form-submit" disabled={submitting}>
              {submitting ? "Guardando..." : "Confirmar pago"}
            </button>
          </div>
        </form>
      ) : variante === "pago" && inscripcion ? (
        <div className="usuario-form">
          <PagoResumen
            usuario={nombreInscripcion(inscripcion)}
            actividad={tituloInscripcion(inscripcion)}
            importe={textoImporte(inscripcion.precioAplicado)}
            estado={nombreEstadoPagoCatalogo(inscripcion.id_estado_pago, estados)}
            metodo={nombreMetodoPago(inscripcion.id_metodo_pago, metodos)}
            fecha={textoFechaPago(inscripcion.fechaPago)}
          />
          {error ? <div className="usuario-form-error" role="alert">{error}</div> : null}
          <div className="usuario-form-actions">
            {puedeCobrar ? (
              <button type="button" className="usuario-form-eliminar" onClick={abrirCobro} disabled={submitting}>
                Registrar pago
              </button>
            ) : null}
            {puedeDevolver ? (
              <button type="button" className="usuario-form-eliminar" onClick={abrirDevolucion} disabled={submitting}>
                Registrar devolución
              </button>
            ) : null}
            <button type="button" className="usuario-form-cancel" onClick={cerrar} disabled={submitting}>
              Cerrar
            </button>
          </div>
        </div>
      ) : (
      <form className="usuario-form" noValidate onSubmit={guardar} aria-busy={submitting}>
        {!listo ? <p role="status">Cargando datos...</p> : null}
        <InscripcionCampos
          valores={valores}
          errores={errores}
          disabled={submitting || !puedeGuardar || camposBloqueados}
          elegirUsuario={elegirUsuario}
          referenciasBloqueadas={edicion && !editando}
          precio={edicion ? textoImporte(inscripcion.precioAplicado) : undefined}
          usuarios={usuarios}
          nombrePropio={nombrePropio}
          actividades={actividades}
          onChange={(campo, valor) => {
            setValores((actual) => ({ ...actual, [campo]: valor }));
            setErrores((actual) => ({ ...actual, [campo]: undefined }));
          }}
        />
        {muestraEspera ? <InscripcionEsperaCampos inscripcion={inscripcion} /> : null}
        {errorCarga ? <div className="usuario-form-error" role="alert">{errorCarga}</div> : null}
        {error ? <div className="usuario-form-error" role="alert">{error}</div> : null}
        <div className="usuario-form-actions">
          {puedeActivar ? (
            <button type="button" className="usuario-form-eliminar" onClick={abrirActivacion} disabled={submitting}>
              Activar inscripción
            </button>
          ) : null}
          {puedeCobrar ? (
            <button type="button" className="usuario-form-eliminar" onClick={abrirCobro} disabled={submitting}>
              Registrar pago
            </button>
          ) : null}
          {puedeDevolver ? (
            <button type="button" className="usuario-form-eliminar" onClick={abrirDevolucion} disabled={submitting}>
              Registrar devolución
            </button>
          ) : null}
          {puedeCancelar ? (
            <button type="button" className="usuario-form-cancel" onClick={abrirCancelacion} disabled={submitting}>
              Cancelar inscripción
            </button>
          ) : null}
          {!edicion ? (
            <button type="submit" className="usuario-form-submit" disabled={submitting || !listo || !puedeGuardar}>
              {submitting ? "Guardando..." : "Crear inscripción"}
            </button>
          ) : puedeEditar && camposBloqueados ? (
            <button
              key="editar"
              type="button"
              className="usuario-form-submit form-accion-principal"
              onClick={(event) => {
                event.preventDefault();
                setEditando(true);
              }}
            >
              Editar
            </button>
          ) : puedeEditar ? (
            <button key="guardar" type="submit" className="usuario-form-submit form-accion-principal" disabled={submitting || !listo}>
              {submitting ? "Guardando..." : "Guardar cambios"}
            </button>
          ) : null}
        </div>
      </form>
      )}
    </Modal>
  );
}
