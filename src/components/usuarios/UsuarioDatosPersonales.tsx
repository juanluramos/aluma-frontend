import type { ErroresUsuario } from "../../utils/validacionesUsuario";

type UsuarioDatosPersonalesProps = {
  fechaInscripcion: string;
  codUsuario: string;
  tipoDocumento: string;
  numeroDocumento: string;
  nombre: string;
  apellido1: string;
  apellido2: string;
  telefono: string;
  email: string;
  emailObligatorio?: boolean;

  errores: ErroresUsuario;

  onFechaInscripcionChange: (value: string) => void;
  onCodUsuarioChange: (value: string) => void;
  onTipoDocumentoChange: (value: string) => void;
  onNumeroDocumentoChange: (value: string) => void;
  onNombreChange: (value: string) => void;
  onApellido1Change: (value: string) => void;
  onApellido2Change: (value: string) => void;
  onTelefonoChange: (value: string) => void;
  onEmailChange: (value: string) => void;
};

function UsuarioDatosPersonales({
  fechaInscripcion,
  codUsuario,
  tipoDocumento,
  numeroDocumento,
  nombre,
  apellido1,
  apellido2,
  telefono,
  email,
  emailObligatorio = false,

  errores,

  onFechaInscripcionChange,
  onCodUsuarioChange,
  onTipoDocumentoChange,
  onNumeroDocumentoChange,
  onNombreChange,
  onApellido1Change,
  onApellido2Change,
  onTelefonoChange,
  onEmailChange,
}: UsuarioDatosPersonalesProps) {
  return (
    <>
      <div className="usuario-form-field">
        <label htmlFor="fechaInscripcion">
          Fecha de inscripción
        </label>

        <input
          id="fechaInscripcion"
          aria-invalid={Boolean(errores.fechaInscripcion)}
          aria-describedby={
            errores.fechaInscripcion
              ? "fechaInscripcion-error"
              : undefined
          }
          type="date"
          value={fechaInscripcion}
          onChange={(event) =>
            onFechaInscripcionChange(event.target.value)
          }
          required
        />

        {errores.fechaInscripcion && (
          <p
            id="fechaInscripcion-error"
            className="usuario-form-field-error"
          >
            {errores.fechaInscripcion}
          </p>
        )}
      </div>

      {/* CÓDIGO USUARIO */}

      <div className="usuario-form-field">
        <label htmlFor="codUsuario">
          Código de usuario
        </label>

        <input
          id="codUsuario"
          aria-invalid={Boolean(errores.codUsuario)}
          aria-describedby={
            errores.codUsuario
              ? "codUsuario-error"
              : undefined
          }
          type="text"
          value={codUsuario}
          onChange={(event) =>
            onCodUsuarioChange(event.target.value)
          }
          placeholder="Ej. ALU001"
        />

        {errores.codUsuario && (
          <p
            id="codUsuario-error"
            className="usuario-form-field-error"
          >
            {errores.codUsuario}
          </p>
        )}
      </div>

      {/* TIPO DOCUMENTO */}

      <div className="usuario-form-field">
        <label htmlFor="tipoDocumento">
          Tipo de documento
        </label>

        <select
          id="tipoDocumento"
          aria-invalid={Boolean(
            errores.tipoDocumento,
          )}
          aria-describedby={
            errores.tipoDocumento
              ? "tipoDocumento-error"
              : undefined
          }
          value={tipoDocumento}
          onChange={(event) =>
            onTipoDocumentoChange(
              event.target.value,
            )
          }
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

        {errores.tipoDocumento && (
          <p
            id="tipoDocumento-error"
            className="usuario-form-field-error"
          >
            {errores.tipoDocumento}
          </p>
        )}
      </div>

      {/* NÚMERO DOCUMENTO */}

      <div className="usuario-form-field">
        <label htmlFor="numeroDocumento">
          Número de documento
        </label>

        <input
          id="numeroDocumento"
          aria-invalid={Boolean(
            errores.numeroDocumento,
          )}
          aria-describedby={
            errores.numeroDocumento
              ? "numeroDocumento-error"
              : undefined
          }
          type="text"
          value={numeroDocumento}
          onChange={(event) =>
            onNumeroDocumentoChange(
              event.target.value,
            )
          }
          placeholder="Introduce documento"
        />

        {errores.numeroDocumento && (
          <p
            id="numeroDocumento-error"
            className="usuario-form-field-error"
          >
            {errores.numeroDocumento}
          </p>
        )}
      </div>

      {/* NOMBRE */}

      <div className="usuario-form-field">
        <label htmlFor="nombre">
          Nombre
        </label>

        <input
          id="nombre"
          aria-invalid={Boolean(errores.nombre)}
          aria-describedby={
            errores.nombre
              ? "nombre-error"
              : undefined
          }
          type="text"
          value={nombre}
          onChange={(event) =>
            onNombreChange(event.target.value)
          }
          placeholder="Introduce el nombre"
          required
        />

        {errores.nombre && (
          <p
            id="nombre-error"
            className="usuario-form-field-error"
          >
            {errores.nombre}
          </p>
        )}
      </div>

      {/* PRIMER APELLIDO */}

      <div className="usuario-form-field">
        <label htmlFor="apellido1">
          Primer apellido
        </label>

        <input
          id="apellido1"
          aria-invalid={Boolean(
            errores.apellido1,
          )}
          aria-describedby={
            errores.apellido1
              ? "apellido1-error"
              : undefined
          }
          type="text"
          value={apellido1}
          onChange={(event) =>
            onApellido1Change(event.target.value)
          }
          placeholder="Primer apellido"
        />

        {errores.apellido1 && (
          <p
            id="apellido1-error"
            className="usuario-form-field-error"
          >
            {errores.apellido1}
          </p>
        )}
      </div>

      {/* SEGUNDO APELLIDO */}

      <div className="usuario-form-field">
        <label htmlFor="apellido2">
          Segundo apellido
        </label>

        <input
          id="apellido2"
          aria-invalid={Boolean(
            errores.apellido2,
          )}
          aria-describedby={
            errores.apellido2
              ? "apellido2-error"
              : undefined
          }
          type="text"
          value={apellido2}
          onChange={(event) =>
            onApellido2Change(event.target.value)
          }
          placeholder="Segundo apellido"
        />

        {errores.apellido2 && (
          <p
            id="apellido2-error"
            className="usuario-form-field-error"
          >
            {errores.apellido2}
          </p>
        )}
      </div>

      {/* TELÉFONO */}

      <div className="usuario-form-field">
        <label htmlFor="telefono">
          Teléfono
        </label>

        <input
          id="telefono"
          aria-invalid={Boolean(errores.telefono)}
          aria-describedby={
            errores.telefono
              ? "telefono-error"
              : undefined
          }
          type="tel"
          value={telefono}
          onChange={(event) =>
            onTelefonoChange(event.target.value)
          }
          placeholder="Introduce teléfono"
        />

        {errores.telefono && (
          <p
            id="telefono-error"
            className="usuario-form-field-error"
          >
            {errores.telefono}
          </p>
        )}
      </div>

      {/* EMAIL */}

      <div className="usuario-form-field usuario-form-field-full">
        <label htmlFor="email">
          Email
        </label>

        <input
          id="email"
          aria-invalid={Boolean(errores.email)}
          aria-describedby={
            errores.email
              ? "email-error"
              : undefined
          }
          type="email"
          value={email}
          onChange={(event) =>
            onEmailChange(event.target.value)
          }
          placeholder="correo@ejemplo.com"
          required={emailObligatorio}
        />

        {errores.email && (
          <p
            id="email-error"
            className="usuario-form-field-error"
          >
            {errores.email}
          </p>
        )}
      </div>
    </>
  );
}

export default UsuarioDatosPersonales;