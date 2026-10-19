import type { ErroresUsuario } from "../../utils/validacionesUsuario";

type UsuarioAccesoProps = {
  rol: string;
  password: string;
  confirmPassword: string;

  errores: ErroresUsuario;

  isEdit: boolean;
  puedeCambiarRol?: boolean;
  currentUserRole?: string | null;

  onRolChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
};

function UsuarioAcceso({
  rol,
  password,
  confirmPassword,
  errores,
  isEdit,
  puedeCambiarRol = true,
  currentUserRole = null,
  onRolChange,
  onPasswordChange,
  onConfirmPasswordChange,
}: UsuarioAccesoProps) {
  const esAltaDeAdministrador = !isEdit && currentUserRole === "Administrador";
  const requierePassword = esAltaDeAdministrador && (Number(rol) === 2 || Number(rol) === 3);

  return (
    <>
      {/* ROL */}

      {puedeCambiarRol && <div className="usuario-form-field">
        <label htmlFor="rol">
          Rol
        </label>

        <select
          id="rol"
          value={rol}
          onChange={(event) =>
            onRolChange(event.target.value)
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
      </div>}

      {/* El administrador ve la contraseña al crear. El operador no. Obligatoria solo en rol 2 o 3. */}

      {(esAltaDeAdministrador || isEdit) && <>
      <div className="usuario-form-field">
        <label htmlFor="password">
          Contraseña
        </label>

        <input
  id="password"
  aria-invalid={Boolean(errores.password)}
  aria-describedby={
    errores.password
      ? "password-error"
      : undefined
  }
  type="password"
  value={password}
  onChange={(event) =>
    onPasswordChange(event.target.value)
  }
  placeholder={
    isEdit
      ? "Dejar vacío para mantenerla"
      : "Mínimo 8 caracteres"
  }
  autoComplete="new-password"
  required={requierePassword}
/>

        {errores.password && (
          <p
            id="password-error"
            className="usuario-form-field-error"
          >
            {errores.password}
          </p>
        )}
      </div>

      {/* CONFIRMAR CONTRASEÑA */}

      <div className="usuario-form-field">
        <label htmlFor="confirmPassword">
          Confirmar contraseña
        </label>

        <input
  id="confirmPassword"
  aria-invalid={Boolean(
    errores.confirmPassword,
  )}
  aria-describedby={
    errores.confirmPassword
      ? "confirmPassword-error"
      : undefined
  }
  type="password"
  value={confirmPassword}
  onChange={(event) =>
    onConfirmPasswordChange(
      event.target.value,
    )
  }
  placeholder={
    isEdit
      ? "Repite solo si cambias la contraseña"
      : "Repite la contraseña"
  }
  autoComplete="new-password"
  required={requierePassword}
/>

        {errores.confirmPassword && (
          <p
            id="confirmPassword-error"
            className="usuario-form-field-error"
          >
            {errores.confirmPassword}
          </p>
        )}
      </div>
      </>}
    </>
  );
}

export default UsuarioAcceso;