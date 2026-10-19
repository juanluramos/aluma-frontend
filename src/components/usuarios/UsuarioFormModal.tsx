import { construirDatosCreacionUsuario, construirDatosEdicionUsuario } from "../../utils/usuarioFormPayload";
import { obtenerValoresIniciales } from "../../utils/usuarioFormState";
import {
  normalizarUsuario,
  normalizarDocumento,
  validarDocumentoUsuario,
  validarUsuario,
  type ErroresUsuario,
} from "../../utils/validacionesUsuario";

import {
  useState,
  type SubmitEvent,
} from "react";

import Modal from "../modal/Modal";
import { hasPermission } from "../../auth/permissions";
import { useRole } from "../../auth/useRole";

import UsuarioDatosPersonales from "./UsuarioDatosPersonales";
import UsuarioAcceso from "./UsuarioAcceso";
import UsuarioEstadoSocio from "./UsuarioEstadoSocio";

import {
  createUsuario,
  updateUsuario,
  type Usuario,
} from "../../services/usuarioService";

import "./UsuarioFormModal.css";

type UsuarioFormModalProps = {
  isOpen: boolean;

  mode: "create" | "edit";

  usuario?: Usuario;

  onClose: () => void;

  onCreated?: (usuario: Usuario) => void;

  onUpdated?: (usuario: Usuario) => void;

  /** Solo en edición: muestra Eliminar y dispara la confirmación en la página. */
  onSolicitarEliminar?: () => void;
};

function UsuarioFormModal({
  isOpen,
  mode,
  usuario,
  onClose,
  onCreated,
  onUpdated,
  onSolicitarEliminar,
}: UsuarioFormModalProps) {
  const isEdit = mode === "edit";
  const role = useRole();
  const puedeCambiarRol = hasPermission(role, "cambiarRolUsuario");
  const puedeCambiarEstado = hasPermission(role, "cambiarEstadoUsuario");
  const puedeMarcarChecks = role === "Operador" || role === "Administrador";
  const mostrarEliminar = isEdit && typeof onSolicitarEliminar === "function";

  const valoresIniciales = obtenerValoresIniciales(mode, usuario);

  /*
   * DATOS PERSONALES
   */

  const [fechaInscripcion, setFechaInscripcion] = useState(
    valoresIniciales.fechaInscripcion,
  );

  const [codUsuario, setCodUsuario] = useState(
    valoresIniciales.codUsuario,
  );

  const [
    tipoDocumento,
    setTipoDocumento,
  ] = useState(
    valoresIniciales.tipoDocumento,
  );

  const [
    numeroDocumento,
    setNumeroDocumento,
  ] = useState(
    valoresIniciales.numeroDocumento,
  );

  const [nombre, setNombre] = useState(
    valoresIniciales.nombre,
  );

  const [apellido1, setApellido1] = useState(
    valoresIniciales.apellido1,
  );

  const [apellido2, setApellido2] = useState(
    valoresIniciales.apellido2,
  );

  const [email, setEmail] = useState(
    valoresIniciales.email,
  );

  const [telefono, setTelefono] = useState(
    valoresIniciales.telefono,
  );

  /*
   * ACCESO
   */

  const [rol, setRol] = useState(
    valoresIniciales.rol,
  );

  const [password, setPassword] =
    useState(valoresIniciales.password);

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState(valoresIniciales.confirmPassword);

  /*
   * ESTADO / SOCIO
   */

  const [estado, setEstado] = useState(
    valoresIniciales.estado,
  );

  const [socio, setSocio] = useState(
    valoresIniciales.socio,
  );

  const [
    matriculaPagada,
    setMatriculaPagada,
  ] = useState(
    valoresIniciales.matriculaPagada,
  );

  const [comentario, setComentario] = useState(
    valoresIniciales.comentario,
  );

  /*
   * ESTADO DEL FORMULARIO
   */

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [errores, setErrores] =
    useState<ErroresUsuario>({});

  /*
   * REINICIAR FORMULARIO
   */

  function resetForm() {
    const valores = obtenerValoresIniciales(mode, usuario);

    setFechaInscripcion(valores.fechaInscripcion);
    setCodUsuario(valores.codUsuario);
    setTipoDocumento(valores.tipoDocumento);
    setNumeroDocumento(valores.numeroDocumento);

    setNombre(valores.nombre);
    setApellido1(valores.apellido1);
    setApellido2(valores.apellido2);

    setEmail(valores.email);
    setTelefono(valores.telefono);

    setRol(valores.rol);

    setEstado(valores.estado);

    setSocio(valores.socio);
    setMatriculaPagada(valores.matriculaPagada);

    setComentario(valores.comentario);

    setPassword(valores.password);
    setConfirmPassword(valores.confirmPassword);

    setErrores({});
    setError(null);
  }

  /*
   * CERRAR MODAL
   */

  function handleClose() {
    if (submitting) {
      return;
    }

    resetForm();

    onClose();
  }

  /*
   * GUARDAR
   */

  // Conservar documentos heredados al editar otros campos, sin reenviarlos.
  function esDocumentoOriginal(tipo: string, numero: string): boolean {
    if (!isEdit || usuario === undefined) return false;
    const tipoOriginal = usuario.id_tipo_documento == null ? '' : String(usuario.id_tipo_documento);
    const numeroOriginal = usuario.numeroDocumento ?? '';
    return tipo === tipoOriginal
      && normalizarDocumento(numero) === normalizarDocumento(numeroOriginal);
  }
  const documentoSinCambios = esDocumentoOriginal(tipoDocumento, numeroDocumento);

  function actualizarDocumento(tipo: string, numero: string): void {
    setTipoDocumento(tipo);
    setNumeroDocumento(numero);
    setErrores(previos => ({
      ...previos,
      tipoDocumento: undefined,
      numeroDocumento: undefined,
      ...(esDocumentoOriginal(tipo, numero) ? {} : validarDocumentoUsuario(tipo, numero)),
    }));
  }

  async function handleSubmit(
    event: SubmitEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(null);

    if (submitting) {
      return;
    }

    /*
     * Construimos los datos que se
     * validarán y normalizarán.
     */

    const formulario = {
      codUsuario,
      tipoDocumento,
      numeroDocumento,
      nombre,
      apellido1,
      apellido2,
      email,
      telefono,
      comentario,
      fechaInscripcion,
      password,
      confirmPassword,
    };

    const requierePassword =
      mode === "create" &&
      role === "Administrador" &&
      (Number(rol) === 2 || Number(rol) === 3);
    const erroresValidacion = validarUsuario(formulario, mode, {
      exigePassword: requierePassword,
      exigeEmail: Number(rol) === 2 || Number(rol) === 3,
    });
    if (documentoSinCambios) {
      delete erroresValidacion.tipoDocumento;
      delete erroresValidacion.numeroDocumento;
    }

    setErrores(
      erroresValidacion,
    );

    if (
      Object.keys(
        erroresValidacion,
      ).length > 0
    ) {
      setError(
        "Revisa los campos indicados antes de guardar.",
      );

      const primerCampo =
        Object.keys(
          erroresValidacion,
        )[0];

      event.currentTarget
        .querySelector<HTMLElement>(
          `#${primerCampo}`,
        )
        ?.focus();

      return;
    }

    /*
     * NORMALIZACIÓN
     */

    const datos =
      normalizarUsuario(
        formulario,
      );

    try {
      setSubmitting(true);

      /*
       * =========================
       * EDITAR USUARIO
       * =========================
       */

      if (
        isEdit &&
        usuario
      ) {
        const usuarioActualizado =
          await updateUsuario(
            usuario.id_usuario,
            construirDatosEdicionUsuario(
              datos,
              { rol, estado, socio, matriculaPagada },
              {
                documentoSinCambios,
                puedeCambiarRol,
                puedeCambiarEstado: puedeMarcarChecks,
                puedeCambiarSocio: puedeMarcarChecks,
              },
            ),
          );

        onUpdated?.(
          usuarioActualizado,
        );

        onClose();

        return;
      }

      /*
       * =========================
       * CREAR USUARIO
       * =========================
       */

      const usuarioCreado =
        await createUsuario(
          construirDatosCreacionUsuario(
            datos,
            { rol, estado, socio, matriculaPagada },
            {
              puedeCambiarRol,
              puedeCambiarEstado: puedeCambiarEstado || puedeMarcarChecks,
              puedeCambiarSocio: puedeMarcarChecks,
            },
          ),
        );

      onCreated?.(
        usuarioCreado,
      );

      resetForm();

      onClose();
    } catch (error) {
      console.error(
        isEdit
          ? "Error al actualizar usuario:"
          : "Error al crear usuario:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : isEdit
            ? "No se ha podido actualizar el usuario."
            : "No se ha podido crear el usuario.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  /*
   * INTERFAZ
   */

  return (
    <Modal
      isOpen={isOpen}
      title={
        isEdit
          ? "Editar usuario"
          : role === "Operador"
            ? "Nuevo socio"
            : "Nuevo usuario"
      }
      onClose={
        handleClose
      }
    >
      <form
        className="usuario-form"
        onSubmit={
          handleSubmit
        }
        noValidate
      >
        <div className="usuario-form-grid">

          {/* DATOS PERSONALES */}

          <UsuarioDatosPersonales
            fechaInscripcion={
              fechaInscripcion
            }
            codUsuario={
              codUsuario
            }
            tipoDocumento={
              tipoDocumento
            }
            numeroDocumento={
              numeroDocumento
            }
            nombre={
              nombre
            }
            apellido1={
              apellido1
            }
            apellido2={
              apellido2
            }
            telefono={
              telefono
            }
            email={
              email
            }
            emailObligatorio={
              Number(rol) === 2 || Number(rol) === 3
            }
            errores={
              errores
            }
            onFechaInscripcionChange={
              setFechaInscripcion
            }
            onCodUsuarioChange={
              setCodUsuario
            }
            onTipoDocumentoChange={tipo => actualizarDocumento(tipo, numeroDocumento)}
            onNumeroDocumentoChange={numero => actualizarDocumento(tipoDocumento, numero)}
            onNombreChange={
              setNombre
            }
            onApellido1Change={
              setApellido1
            }
            onApellido2Change={
              setApellido2
            }
            onTelefonoChange={
              setTelefono
            }
            onEmailChange={
              setEmail
            }
          />

          {/* ACCESO */}

          <UsuarioAcceso
            puedeCambiarRol={puedeCambiarRol}
            rol={
              rol
            }
            password={
              password
            }
            confirmPassword={
              confirmPassword
            }
            errores={
              errores
            }
            isEdit={
              isEdit
            }
            currentUserRole={
              role
            }
            onRolChange={
              setRol
            }
            onPasswordChange={
              setPassword
            }
            onConfirmPasswordChange={
              setConfirmPassword
            }
          />

          {/* ESTADO / SOCIO */}

          <UsuarioEstadoSocio
            puedeCambiarEstado={puedeCambiarEstado}
            puedeCambiarSocio={puedeMarcarChecks}
            puedeMarcarActivo={puedeMarcarChecks}
            estado={
              estado
            }
            socio={
              socio
            }
            matriculaPagada={
              matriculaPagada
            }
            comentario={
              comentario
            }
            mostrarActivo
            errores={
              errores
            }
            onEstadoChange={
              setEstado
            }
            onSocioChange={
              setSocio
            }
            onMatriculaPagadaChange={
              setMatriculaPagada
            }
            onComentarioChange={
              setComentario
            }
          />
        </div>

        {/* ERROR GENERAL */}

        {error && (
          <div
            className="usuario-form-error"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* BOTONES */}

        <div className="usuario-form-actions">
          {mostrarEliminar ? (
            <button
              type="button"
              className="usuario-form-eliminar"
              onClick={onSolicitarEliminar}
              disabled={submitting}
            >
              Eliminar
            </button>
          ) : null}

          <button
            type="button"
            className="usuario-form-cancel"
            onClick={
              handleClose
            }
            disabled={
              submitting
            }
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="usuario-form-submit"
            disabled={
              submitting
            }
          >
            {submitting
              ? "Guardando..."
              : isEdit
                ? "Guardar cambios"
                : "Guardar usuario"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default UsuarioFormModal;
