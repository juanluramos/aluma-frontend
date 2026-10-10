import { normalizarUsuario, validarUsuario, type ErroresUsuario } from "../../utils/validacionesUsuario";
import {
  useState,
  type FormEvent,
} from "react";

import Modal from "../modal/Modal";

import {
  createUsuario,
  type Usuario,
} from "../../services/usuarioService";

import "./UsuarioFormModal.css";

type UsuarioFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (usuario: Usuario) => void;
};

function UsuarioFormModal({
  isOpen,
  onClose,
  onCreated,
}: UsuarioFormModalProps) {
  const [codUsuario, setCodUsuario] =
    useState("");

  const [
    tipoDocumento,
    setTipoDocumento,
  ] = useState("");

  const [
    numeroDocumento,
    setNumeroDocumento,
  ] = useState("");

  const [nombre, setNombre] =
    useState("");

  const [apellido1, setApellido1] =
    useState("");

  const [apellido2, setApellido2] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [telefono, setTelefono] =
    useState("");

  const [rol, setRol] =
    useState("1");

  const [estado, setEstado] =
    useState("1");

  const [socio, setSocio] =
    useState(false);

  const [
    matriculaPagada,
    setMatriculaPagada,
  ] = useState(false);

  const [comentario, setComentario] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [errores, setErrores] = useState<ErroresUsuario>({});

  function resetForm() {
    setErrores({});
    setCodUsuario("");
    setTipoDocumento("");
    setNumeroDocumento("");

    setNombre("");
    setApellido1("");
    setApellido2("");

    setEmail("");
    setTelefono("");

    setRol("1");
    setEstado("1");

    setSocio(false);
    setMatriculaPagada(false);

    setComentario("");

    setPassword("");
    setConfirmPassword("");

    setError(null);
  }

  function handleClose() {
    if (submitting) {
      return;
    }

    resetForm();
    onClose();
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(null);

    if (submitting) return;
    const formulario = { codUsuario, tipoDocumento, numeroDocumento, nombre, apellido1, apellido2, email, telefono, comentario, password, confirmPassword };
    const erroresValidacion = validarUsuario(formulario);
    setErrores(erroresValidacion);
    if (Object.keys(erroresValidacion).length > 0) {
      setError("Revisa los campos indicados antes de guardar.");
      const primerCampo = Object.keys(erroresValidacion)[0];
      event.currentTarget.querySelector<HTMLElement>(`#${primerCampo}`)?.focus();
      return;
    }
    const datos = normalizarUsuario(formulario);

    try {
      setSubmitting(true);

      const usuarioCreado =
        await createUsuario({
          codUsuario: datos.codUsuario || undefined,
          id_tipo_documento: Number(datos.tipoDocumento),
          numeroDocumento: datos.numeroDocumento,
          nombre: datos.nombre,
          apellido1: datos.apellido1 || undefined,
          apellido2: datos.apellido2 || undefined,
          email: datos.email,
          telefono: datos.telefono || undefined,
          id_rol: Number(rol),
          socio,
          matriculaPagada,
          id_estado_usuario: Number(estado),
          comentario: datos.comentario || undefined,
          password: datos.password,
        });

      onCreated(usuarioCreado);

      resetForm();

      onClose();
    } catch (error) {
      console.error(
        "Error al crear usuario:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "No se ha podido crear el usuario.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      title="Nuevo usuario"
      onClose={handleClose}
    >
      <form
        className="usuario-form"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="usuario-form-grid">

          {/* CÓDIGO USUARIO */}

          <div className="usuario-form-field">
            <label htmlFor="codUsuario">
              Código de usuario
            </label>

            <input
              id="codUsuario"
              aria-invalid={Boolean(errores.codUsuario)}
              aria-describedby={errores.codUsuario ? "codUsuario-error" : undefined}
              type="text"
              value={codUsuario}
              onChange={(event) =>
                setCodUsuario(
                  event.target.value,
                )
              }
              placeholder="Ej. ALU001"
            />
            {errores.codUsuario && <p id="codUsuario-error" className="usuario-form-field-error">{errores.codUsuario}</p>}
          </div>

          {/* TIPO DOCUMENTO */}

          <div className="usuario-form-field">
            <label htmlFor="tipoDocumento">
              Tipo de documento
            </label>

            <select
              id="tipoDocumento"
              aria-invalid={Boolean(errores.tipoDocumento)}
              aria-describedby={errores.tipoDocumento ? "tipoDocumento-error" : undefined}
              value={tipoDocumento}
              onChange={(event) =>
                setTipoDocumento(
                  event.target.value,
                )
              }
              required
            >
              <option value="">
                Selecciona tipo
              </option>

              <option value="1">
                DNI
              </option>

              <option value="2">
                NIE
              </option>

              <option value="3">
                PASAPORTE
              </option>

              <option value="4">
                PERMISO DE TRABAJO
              </option>
            </select>
            {errores.tipoDocumento && <p id="tipoDocumento-error" className="usuario-form-field-error">{errores.tipoDocumento}</p>}
          </div>

          {/* NÚMERO DOCUMENTO */}

          <div className="usuario-form-field">
            <label htmlFor="numeroDocumento">
              Número de documento
            </label>

            <input
              id="numeroDocumento"
              aria-invalid={Boolean(errores.numeroDocumento)}
              aria-describedby={errores.numeroDocumento ? "numeroDocumento-error" : undefined}
              type="text"
              value={numeroDocumento}
              onChange={(event) =>
                setNumeroDocumento(
                  event.target.value,
                )
              }
              placeholder="Introduce documento"
              required
            />
            {errores.numeroDocumento && <p id="numeroDocumento-error" className="usuario-form-field-error">{errores.numeroDocumento}</p>}
          </div>

          {/* ROL */}

          <div className="usuario-form-field">
            <label htmlFor="rol">
              Rol
            </label>

            <select
              id="rol"
              value={rol}
              onChange={(event) =>
                setRol(
                  event.target.value,
                )
              }
            >
              <option value="1">
                Usuario
              </option>

              <option value="2">
                Operador
              </option>

              <option value="3">
                Administrador
              </option>
            </select>
          </div>

          {/* NOMBRE */}

          <div className="usuario-form-field">
            <label htmlFor="nombre">
              Nombre
            </label>

            <input
              id="nombre"
              aria-invalid={Boolean(errores.nombre)}
              aria-describedby={errores.nombre ? "nombre-error" : undefined}
              type="text"
              value={nombre}
              onChange={(event) =>
                setNombre(
                  event.target.value,
                )
              }
              placeholder="Introduce el nombre"
              required
            />
            {errores.nombre && <p id="nombre-error" className="usuario-form-field-error">{errores.nombre}</p>}
          </div>

          {/* PRIMER APELLIDO */}

          <div className="usuario-form-field">
            <label htmlFor="apellido1">
              Primer apellido
            </label>

            <input
              id="apellido1"
              aria-invalid={Boolean(errores.apellido1)}
              aria-describedby={errores.apellido1 ? "apellido1-error" : undefined}
              type="text"
              value={apellido1}
              onChange={(event) =>
                setApellido1(
                  event.target.value,
                )
              }
              placeholder="Primer apellido"
            />
            {errores.apellido1 && <p id="apellido1-error" className="usuario-form-field-error">{errores.apellido1}</p>}
          </div>

          {/* SEGUNDO APELLIDO */}

          <div className="usuario-form-field">
            <label htmlFor="apellido2">
              Segundo apellido
            </label>

            <input
              id="apellido2"
              aria-invalid={Boolean(errores.apellido2)}
              aria-describedby={errores.apellido2 ? "apellido2-error" : undefined}
              type="text"
              value={apellido2}
              onChange={(event) =>
                setApellido2(
                  event.target.value,
                )
              }
              placeholder="Segundo apellido"
            />
            {errores.apellido2 && <p id="apellido2-error" className="usuario-form-field-error">{errores.apellido2}</p>}
          </div>

          {/* TELÉFONO */}

          <div className="usuario-form-field">
            <label htmlFor="telefono">
              Teléfono
            </label>

            <input
              id="telefono"
              aria-invalid={Boolean(errores.telefono)}
              aria-describedby={errores.telefono ? "telefono-error" : undefined}
              type="tel"
              value={telefono}
              onChange={(event) =>
                setTelefono(
                  event.target.value,
                )
              }
              placeholder="Introduce teléfono"
            />
            {errores.telefono && <p id="telefono-error" className="usuario-form-field-error">{errores.telefono}</p>}
          </div>

          {/* EMAIL */}

          <div className="usuario-form-field usuario-form-field-full">
            <label htmlFor="email">
              Email
            </label>

            <input
              id="email"
              aria-invalid={Boolean(errores.email)}
              aria-describedby={errores.email ? "email-error" : undefined}
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value,
                )
              }
              placeholder="correo@ejemplo.com"
              required
            />
            {errores.email && <p id="email-error" className="usuario-form-field-error">{errores.email}</p>}
          </div>

          {/* CONTRASEÑA */}

          <div className="usuario-form-field">
            <label htmlFor="password">
              Contraseña
            </label>

            <input
              id="password"
              aria-invalid={Boolean(errores.password)}
              aria-describedby={errores.password ? "password-error" : undefined}
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value,
                )
              }
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              required
            />
            {errores.password && <p id="password-error" className="usuario-form-field-error">{errores.password}</p>}
          </div>

          {/* CONFIRMAR CONTRASEÑA */}

          <div className="usuario-form-field">
            <label htmlFor="confirmPassword">
              Confirmar contraseña
            </label>

            <input
              id="confirmPassword"
              aria-invalid={Boolean(errores.confirmPassword)}
              aria-describedby={errores.confirmPassword ? "confirmPassword-error" : undefined}
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value,
                )
              }
              placeholder="Repite la contraseña"
              autoComplete="new-password"
              required
            />
            {errores.confirmPassword && <p id="confirmPassword-error" className="usuario-form-field-error">{errores.confirmPassword}</p>}
          </div>

          {/* ESTADO */}

          <div className="usuario-form-field">
            <label htmlFor="estado">
              Estado
            </label>

            <select
              id="estado"
              value={estado}
              onChange={(event) =>
                setEstado(
                  event.target.value,
                )
              }
            >
              <option value="1">
                Activo
              </option>

              <option value="2">
                Inactivo
              </option>
            </select>
          </div>

          {/* SOCIO / MATRÍCULA */}

          <div className="usuario-form-options">
            <label className="usuario-form-check">
              <input
                type="checkbox"
                checked={socio}
                onChange={(event) =>
                  setSocio(
                    event.target.checked,
                  )
                }
              />

              <span>Socio</span>
            </label>

            <label className="usuario-form-check">
              <input
                type="checkbox"
                checked={
                  matriculaPagada
                }
                onChange={(event) =>
                  setMatriculaPagada(
                    event.target.checked,
                  )
                }
              />

              <span>
                Matrícula pagada
              </span>
            </label>
          </div>

          {/* COMENTARIOS */}

          <div className="usuario-form-field usuario-form-field-full">
            <label htmlFor="comentario">
              Comentarios
            </label>

            <textarea
              id="comentario"
              aria-invalid={Boolean(errores.comentario)}
              aria-describedby={errores.comentario ? "comentario-error" : undefined}
              value={comentario}
              onChange={(event) =>
                setComentario(
                  event.target.value,
                )
              }
              placeholder="Añade un comentario..."
              maxLength={500}
              rows={3}
            />
            {errores.comentario && <p id="comentario-error" className="usuario-form-field-error">{errores.comentario}</p>}
          </div>
        </div>

        {/* ERROR */}

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
          <button
            type="button"
            className="usuario-form-cancel"
            onClick={handleClose}
            disabled={submitting}
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="usuario-form-submit"
            disabled={submitting}
          >
            {submitting
              ? "Guardando..."
              : "Guardar usuario"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default UsuarioFormModal;