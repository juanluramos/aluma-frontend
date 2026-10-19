import { useEffect, useState, useSyncExternalStore, type SubmitEvent } from 'react';
import { authenticatedFetch, session } from '../services/authService';
import { updateUsuario, type Usuario } from '../services/usuarioService';
import { datosPerfil, type PerfilEditable } from '../utils/perfilForm';
import { validarCambioPassword } from '../utils/validacionesUsuario';
import einsteinPerfil from '../assets/icons/perfil/Einstein en un perfil digital.webp';
import '../components/usuarios/UsuarioFormModal.css';
import './PerfilPage.css';

const campos = [
  ['nombre', 'Nombre'], ['apellido1', 'Primer apellido'], ['apellido2', 'Segundo apellido'],
  ['telefono', 'Teléfono'], ['email', 'Email'],
] as const;

export default function PerfilPage() {
  const id = useSyncExternalStore(session.subscribe, session.getUserId);
  const [perfil, setPerfil] = useState<PerfilEditable | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [erroresPassword, setErroresPassword] = useState<{ password?: string; confirmPassword?: string }>({});
  const [error, setError] = useState('');
  const [guardado, setGuardado] = useState('');
  const [guardando, setGuardando] = useState(false);
  useEffect(() => {
    let active = true;
    if (id === null) return;
    void (async () => {
      try {
        const response = await authenticatedFetch(`/usuarios/${id}`);
        if (!response.ok) throw new Error('No se pudo cargar tu perfil.');
        const data: Usuario = await response.json();
        if (active) setPerfil(data);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'No se pudo cargar tu perfil.');
      }
    })();
    return () => { active = false; };
  }, [id]);

  async function guardar(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!perfil || id === null || guardando) return;
    const errores = validarCambioPassword(password, confirmPassword);
    setErroresPassword(errores);
    if (errores.password || errores.confirmPassword) {
      setGuardado('');
      return;
    }
    const cambiaPassword = password.trim() !== '';
    setGuardando(true); setError(''); setGuardado('');
    try {
      const updated = await updateUsuario(id, datosPerfil(perfil, cambiaPassword ? password : ''));
      setPerfil(updated);
      setPassword('');
      setConfirmPassword('');
      setGuardado(cambiaPassword ? 'Perfil y contraseña actualizados.' : 'Perfil actualizado.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar tu perfil.');
    } finally { setGuardando(false); }
  }

  return <section className="perfil-page">
    <div className="perfil-layout">
    <div className="perfil-panel">
    <h1>Mi perfil</h1>
    {error && <p role="alert">{error}</p>}
    {guardado && <p role="status">{guardado}</p>}
    {!perfil ? <p>Cargando perfil…</p> : <form onSubmit={guardar}>
      {campos.map(([campo, label]) => <div className="usuario-form-field" key={campo}>
        <label htmlFor={`perfil-${campo}`}>{label}</label>
        <input id={`perfil-${campo}`} name={campo} value={perfil[campo] ?? ''}
          type={campo === 'email' ? 'email' : campo === 'telefono' ? 'tel' : 'text'}
          required={campo === 'nombre' || campo === 'email'}
          maxLength={campo === 'email' ? 254 : campo === 'telefono' ? 30 : 50}
          disabled={guardando}
          onChange={event => { setPerfil({ ...perfil, [campo]: event.target.value }); setGuardado(''); }} />
      </div>)}
      <h2>Contraseña</h2>
        <div className="usuario-form-field">
          <label htmlFor="perfil-password">Nueva contraseña</label>
          <input id="perfil-password" name="password" type="password" value={password}
            autoComplete="new-password" maxLength={72} disabled={guardando}
            aria-invalid={Boolean(erroresPassword.password)}
            aria-describedby={erroresPassword.password ? 'perfil-password-error' : undefined}
            placeholder="Déjala vacía para no cambiarla"
            onChange={event => { setPassword(event.target.value); setErroresPassword({}); setGuardado(''); }} />
          {erroresPassword.password && <p className="usuario-form-field-error" id="perfil-password-error" role="alert">{erroresPassword.password}</p>}
        </div>
        <div className="usuario-form-field">
          <label htmlFor="perfil-confirm-password">Confirmar contraseña</label>
          <input id="perfil-confirm-password" name="confirmPassword" type="password" value={confirmPassword}
            autoComplete="new-password" maxLength={72} disabled={guardando}
            aria-invalid={Boolean(erroresPassword.confirmPassword)}
            aria-describedby={erroresPassword.confirmPassword ? 'perfil-confirm-password-error' : undefined}
            placeholder="Repite solo si cambias la contraseña"
            onChange={event => { setConfirmPassword(event.target.value); setErroresPassword({}); setGuardado(''); }} />
          {erroresPassword.confirmPassword && <p className="usuario-form-field-error" id="perfil-confirm-password-error" role="alert">{erroresPassword.confirmPassword}</p>}
        </div>
      <button type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar perfil'}</button>
    </form>}
    </div>
    <div className="perfil-image">
      <img src={einsteinPerfil} alt="Einstein en un perfil digital" />
    </div>
    </div>
  </section>;
}
