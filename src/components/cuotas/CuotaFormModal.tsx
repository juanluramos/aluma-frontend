import { useEffect, useRef, useState, type SubmitEvent } from "react";
import Modal from "../modal/Modal";
import { getUsuarios } from "../../services/usuarioService";
import { createCuota, CuotaApiError, deleteCuota, updateCuota, type Cuota } from "../../services/cuotaService";
import { decidirBorradoCuota } from "../../utils/cuotasListado";
import ConfirmarEliminarCuota from "./ConfirmarEliminarCuota";
import {
  resultadoGuardadoCuota,
  valoresDesdeCuota,
  valoresInicialesCuota,
  type CuotaFormState,
  type UsuarioCuotaOpcion,
} from "../../utils/cuotaFormState";
import { construirActualizacionCuota, construirDatosCuota } from "../../utils/cuotaFormPayload";
import { validarCuota, type ErroresCuota } from "../../utils/validacionesCuota";
import CuotaCampos from "./CuotaCampos";
import "../usuarios/UsuarioFormModal.css";

interface Props {
  isOpen: boolean;
  mode: "create" | "edit";
  cuota?: Cuota;
  onClose: () => void;
  onCreada?: (cuota: Cuota) => void;
  onActualizada?: (cuota: Cuota) => void;
  onEliminada?: (idCuota: number) => void;
}

function usuarioDeCuota(cuota: Cuota): UsuarioCuotaOpcion {
  return {
    id_usuario: cuota.id_usuario,
    codUsuario: cuota.Usuario.codUsuario,
    nombre: cuota.Usuario.nombre,
    apellido1: cuota.Usuario.apellido1,
    apellido2: cuota.Usuario.apellido2,
  };
}

export default function CuotaFormModal({ isOpen, mode, cuota, onClose, onCreada, onActualizada, onEliminada }: Props) {
  const cuotaEdicion = mode === "edit" ? cuota : undefined;
  const [valores, setValores] = useState<CuotaFormState>(() => cuotaEdicion ? valoresDesdeCuota(cuotaEdicion) : valoresInicialesCuota());
  const [usuarios, setUsuarios] = useState<UsuarioCuotaOpcion[]>(() => cuotaEdicion ? [usuarioDeCuota(cuotaEdicion)] : []);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(true);
  const [errores, setErrores] = useState<ErroresCuota>({});
  const [errorUsuarios, setErrorUsuarios] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [errorBorrado, setErrorBorrado] = useState("");
  const envio = useRef(false);
  const borrando = useRef(false);

  useEffect(() => {
    let activo = true;
    getUsuarios()
      .then((datos) => {
        if (!activo) return;
        setUsuarios((previos) => {
          const conservados = previos.filter((usuario) => !datos.some((dato) => dato.id_usuario === usuario.id_usuario));
          return [...conservados, ...datos];
        });
      })
      .catch((causa: unknown) => {
        if (activo) {
          setErrorUsuarios(causa instanceof Error ? causa.message : "No se pudieron cargar los usuarios.");
        }
      })
      .finally(() => {
        if (activo) setCargandoUsuarios(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  function cerrar() {
    if (!envio.current && !borrando.current && !confirmando) onClose();
  }

  function pedirBorrado() {
    if (envio.current || borrando.current || !cuotaEdicion) return;
    setErrorBorrado("");
    setConfirmando(decidirBorradoCuota("abrir").confirmacion);
  }

  function cancelarBorrado() {
    if (borrando.current) return;
    const decision = decidirBorradoCuota("cancelar");
    setConfirmando(decision.confirmacion);
    setErrorBorrado("");
  }

  async function confirmarBorrado() {
    if (!cuotaEdicion || borrando.current) return;
    borrando.current = true;
    setEliminando(true);
    setErrorBorrado("");
    try {
      await deleteCuota(cuotaEdicion.id_cuota);
      const decision = decidirBorradoCuota("confirmar");
      setConfirmando(decision.confirmacion);
      if (decision.quitarDelListado) onEliminada?.(cuotaEdicion.id_cuota);
    } catch (causa) {
      const decision = decidirBorradoCuota("error");
      setConfirmando(decision.confirmacion);
      setErrorBorrado(causa instanceof Error ? causa.message : "No se pudo eliminar la cuota.");
    } finally {
      borrando.current = false;
      setEliminando(false);
    }
  }

  function cambiar(campo: keyof CuotaFormState, valor: string) {
    setValores((actual) => ({ ...actual, [campo]: valor }));
    setErrores((actual) => ({ ...actual, [campo]: undefined }));
  }

  async function guardar(evento: SubmitEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (envio.current || borrando.current || confirmando) return;
    const validacion = validarCuota(valores);
    setErrores(validacion);
    if (Object.keys(validacion).length) {
      setError("");
      return;
    }
    envio.current = true;
    setGuardando(true);
    setError("");
    try {
      const guardada = cuotaEdicion
        ? await updateCuota(cuotaEdicion.id_cuota, construirActualizacionCuota(valores))
        : await createCuota(construirDatosCuota(valores));
      const resultado = resultadoGuardadoCuota(valores, null);
      if (resultado.cerrar) {
        if (cuotaEdicion) onActualizada?.(guardada);
        else onCreada?.(guardada);
      }
    } catch (causa) {
      if (causa instanceof CuotaApiError && Object.keys(causa.errores).length) {
        setErrores(causa.errores);
      }
      const mensaje = causa instanceof Error ? causa.message : "No se pudo guardar la cuota.";
      setError(resultadoGuardadoCuota(valores, mensaje).mensaje);
    } finally {
      envio.current = false;
      setGuardando(false);
    }
  }

  const ocupado = guardando || eliminando;

  return (
    <>
      <Modal isOpen={isOpen} title={cuotaEdicion ? "Editar cuota" : "Nueva cuota"} onClose={cerrar}>
        <form className="usuario-form" noValidate onSubmit={guardar} aria-busy={ocupado}>
          <CuotaCampos
            valores={valores}
            errores={errores}
            usuarios={usuarios}
            cargandoUsuarios={cargandoUsuarios}
            disabled={ocupado}
            onChange={cambiar}
          />
          {errorUsuarios && <div className="usuario-form-error" role="alert">{errorUsuarios}</div>}
          {error && <div className="usuario-form-error" role="alert">{error}</div>}
          <div className="usuario-form-actions">
            {cuotaEdicion ? (
              <button type="button" className="usuario-form-eliminar" onClick={pedirBorrado} disabled={ocupado}>
                Eliminar cuota
              </button>
            ) : null}
            <button type="button" className="usuario-form-cancel" onClick={cerrar} disabled={ocupado}>
              Cancelar
            </button>
            <button type="submit" className="usuario-form-submit" disabled={ocupado || cargandoUsuarios || usuarios.length === 0}>
              {guardando ? "Guardando..." : cuotaEdicion ? "Guardar cambios" : "Guardar cuota"}
            </button>
          </div>
        </form>
      </Modal>
      {cuotaEdicion ? (
        <ConfirmarEliminarCuota
          cuota={cuotaEdicion}
          isOpen={confirmando}
          submitting={eliminando}
          error={errorBorrado}
          onCancel={cancelarBorrado}
          onConfirm={() => { void confirmarBorrado(); }}
        />
      ) : null}
    </>
  );
}
