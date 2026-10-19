import { useState } from "react";
import { useNavigate } from "react-router-dom";

import fondoAlhambra from "../assets/icons/login/alhambra_entre_nieblas_pastel.webp";
import logoGoogle from "../assets/icons/login/google-logo.webp";
import logoAluma from "../assets/icons/logo/logo2.webp";
import iconoBienestar from "../assets/icons/navigation/bienestar.webp";
import iconoComunidad from "../assets/icons/navigation/comunidad.webp";
import iconoFormacion from "../assets/icons/navigation/formacion.webp";
import { login, registrarDesdeLogin } from "../services/authService";
import "./LoginPage.css";

function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verContrasena, setVerContrasena] = useState(false);
  const [vista, setVista] = useState<"acceso" | "registro" | "pendiente">("acceso");
  const [aviso, setAviso] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [apellido1, setApellido1] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState("1");
  const [numeroDocumento, setNumeroDocumento] = useState("");

  function abrirRegistro() {
    setVista("registro");
    setError(null);
    setAviso(null);
  }

  function volverAlAcceso() {
    setVista("acceso");
    setError(null);
    setPassword("");
  }

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError(null);

      await login(email, password);

      navigate("/dashboard");
    } catch (error) {
      console.error("Error al iniciar sesión:", error);

      setError(
        error instanceof Error
          ? error.message
          : "No se ha podido iniciar sesión"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegistro = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError(null);
      const mensaje = await registrarDesdeLogin({
        nombre,
        apellido1: apellido1.trim() || undefined,
        email,
        password,
        id_tipo_documento: Number(tipoDocumento),
        numeroDocumento,
      });
      setAviso(mensaje);
      setVista("pendiente");
      setPassword("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "No se ha podido crear la cuenta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <section className="login-panel" style={{ backgroundImage: `url(${fondoAlhambra})` }}>
        <img
          className="login-logo"
          src={logoAluma}
          alt="ALUMA. Asociación de Alumnos/as del Aula Permanente de Formación Abierta. Universidad de Granada. Desde 1996."
        />
        <div className="login-panel-texto">
          <h1>
            Aprender
            <span>no tiene edad</span>
          </h1>
          <p>Formación, cultura y comunidad para seguir creciendo juntos.</p>
          <ul className="login-pilares">
            <li>
              <img src={iconoFormacion} alt="" />
              <span>
                <strong>Formación</strong>
                Cursos y talleres
              </span>
            </li>
            <li>
              <img src={iconoComunidad} alt="" />
              <span>
                <strong>Comunidad</strong>
                Actividades y eventos
              </span>
            </li>
            <li>
              <img src={iconoBienestar} alt="" />
              <span>
                <strong>Bienestar</strong>
                Siempre activos
              </span>
            </li>
          </ul>
          <blockquote>“Ilusión por aprender, hoy y siempre.”</blockquote>
        </div>
      </section>

      <section className="login-acceso">
        <h2>{vista === "acceso" ? "Bienvenido/a" : "Crear cuenta"}</h2>
        <p className="login-subtitulo">
          {vista === "acceso"
            ? "Accede a tu cuenta para continuar"
            : "La cuenta queda pendiente hasta que la asociación la revise"}
        </p>

        {vista === "acceso" && <div className="login-pestanas" aria-hidden="true" />}

        {vista === "pendiente" && (
          <div className="login-pendiente">
            <p>{aviso}</p>
            <button type="button" className="login-enviar" onClick={volverAlAcceso}>
              Volver a iniciar sesión
            </button>
          </div>
        )}

        {vista === "registro" && (
          <form onSubmit={handleRegistro}>
            <div className="login-campo login-campo-plano">
              <label className="login-sr" htmlFor="nombre">Nombre</label>
              <input
                id="nombre"
                value={nombre}
                placeholder="Nombre"
                autoComplete="given-name"
                onChange={(event) => setNombre(event.target.value)}
                required
              />
            </div>
            <div className="login-campo login-campo-plano">
              <label className="login-sr" htmlFor="apellido1">Primer apellido</label>
              <input
                id="apellido1"
                value={apellido1}
                placeholder="Primer apellido"
                autoComplete="family-name"
                onChange={(event) => setApellido1(event.target.value)}
              />
            </div>
            <div className="login-campo login-campo-plano">
              <label className="login-sr" htmlFor="tipoDocumento">Tipo de documento</label>
              <select
                id="tipoDocumento"
                value={tipoDocumento}
                onChange={(event) => setTipoDocumento(event.target.value)}
              >
                <option value="1">DNI</option>
                <option value="2">NIE</option>
                <option value="3">Pasaporte</option>
                <option value="4">Permiso de trabajo</option>
              </select>
            </div>
            <div className="login-campo login-campo-plano">
              <label className="login-sr" htmlFor="numeroDocumento">Número de documento</label>
              <input
                id="numeroDocumento"
                value={numeroDocumento}
                placeholder="Número de documento"
                autoComplete="off"
                onChange={(event) => setNumeroDocumento(event.target.value)}
                required
              />
            </div>
            <div className="login-campo login-campo-plano">
              <label className="login-sr" htmlFor="email-registro">Correo electrónico</label>
              <input
                id="email-registro"
                type="email"
                value={email}
                placeholder="Correo electrónico"
                autoComplete="email"
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="login-campo login-campo-plano">
              <label className="login-sr" htmlFor="password-registro">Contraseña</label>
              <input
                id="password-registro"
                type={verContrasena ? "text" : "password"}
                value={password}
                placeholder="Contraseña"
                autoComplete="new-password"
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                type="button"
                className="login-ver"
                aria-label={verContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}
                onClick={() => setVerContrasena((valor) => !valor)}
              >
                <Ojo tachado={!verContrasena} />
              </button>
            </div>
            <p className="login-requisito">Mínimo 8 caracteres, con mayúscula, minúscula y número.</p>
            {error && <p className="login-error">{error}</p>}
            <button type="submit" className="login-enviar" disabled={loading}>
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>
            <p className="login-alta">
              ¿Ya tienes cuenta? <button type="button" onClick={volverAlAcceso}>Iniciar sesión</button>
            </p>
          </form>
        )}

        {vista === "acceso" && <form onSubmit={handleSubmit}>
          <div className="login-campo">
            <label className="login-sr" htmlFor="email">Correo electrónico</label>
            <Correo />
            <input
              id="email"
              type="email"
              value={email}
              placeholder="Correo electrónico"
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="login-campo">
            <label className="login-sr" htmlFor="password">Contraseña</label>
            <Candado />
            <input
              id="password"
              type={verContrasena ? "text" : "password"}
              value={password}
              placeholder="Contraseña"
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button
              type="button"
              className="login-ver"
              aria-label={verContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}
              onClick={() => setVerContrasena((valor) => !valor)}
            >
              <Ojo tachado={!verContrasena} />
            </button>
          </div>

          <div className="login-opciones">
            <label className="login-recordar">
              <input type="checkbox" />
              Recordarme
            </label>
            <button type="button" className="login-enlace">¿Has olvidado tu contraseña?</button>
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-enviar" disabled={loading}>
            {loading ? "Entrando..." : "Iniciar sesión →"}
          </button>
        </form>}

        {vista === "acceso" && <div className="login-separador"><span>o continúa con</span></div>}

        {vista === "acceso" && <div className="login-social">
          <button type="button" aria-label="Google">
            <img src={logoGoogle} alt="" />
          </button>
        </div>}

        {vista === "acceso" && (
          <p className="login-alta">
            ¿No tienes cuenta? <button type="button" onClick={abrirRegistro}>Regístrate</button>
          </p>
        )}
        <p className="login-pie">
          Aluma - Aula Permanentemente de Formación Abierta
          <br />
          Universidad de Granada
        </p>
      </section>
    </div>
  );
}

function Correo() {
  return (
    <svg className="login-icono" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 7l8 6 8-6" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function Candado() {
  return (
    <svg className="login-icono" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 10V8a4 4 0 0 1 8 0v2" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function Ojo({ tachado }: { tachado: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      {tachado ? <path d="M5 19L19 5" stroke="currentColor" strokeWidth="1.6" /> : null}
    </svg>
  );
}

export default LoginPage;
