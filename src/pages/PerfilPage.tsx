import { useEffect, useState, useSyncExternalStore, type SubmitEvent } from 'react';
import { authenticatedFetch, session } from '../services/authService';
import { updateUsuario, type Usuario } from '../services/usuarioService';
import '../components/usuarios/UsuarioFormModal.css';

type Perfil = Pick<Usuario, 'nombre' | 'apellido1' | 'apellido2' | 'telefono' | 'email'>;
const campos = [
  ['nombre', 'Nombre'], ['apellido1', 'Primer apellido'], ['apellido2', 'Segundo apellido'],
  ['telefono', 'Teléfono'], ['email', 'Email'],
] as const;

export default function PerfilPage() {
  const id = useSyncExternalStore(session.subscribe, session.getUserId);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [error, setError] = useState('');
  const [guardado, setGuardado] = useState(false);
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
    setGuardando(true); setError(''); setGuardado(false);
    try {
      // Lista explícita: nunca enviar campos administrativos recibidos del GET.
      const updated = await updateUsuario(id, {
        nombre: perfil.nombre, apellido1: perfil.apellido1 ?? '', apellido2: perfil.apellido2 ?? '',
        telefono: perfil.telefono ?? '', email: perfil.email,
      });
      setPerfil(updated); setGuardado(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar tu perfil.');
    } finally { setGuardando(false); }
  }

  return <section>
    <h1>Mi perfil</h1>
    {error && <p role="alert">{error}</p>}
    {guardado && <p role="status">Perfil actualizado.</p>}
    {!perfil ? <p>Cargando perfil…</p> : <form onSubmit={guardar}>
      {campos.map(([campo, label]) => <div className="usuario-form-field" key={campo}>
        <label htmlFor={`perfil-${campo}`}>{label}</label>
        <input id={`perfil-${campo}`} name={campo} value={perfil[campo] ?? ''}
          type={campo === 'email' ? 'email' : campo === 'telefono' ? 'tel' : 'text'}
          required={campo === 'nombre' || campo === 'email'}
          maxLength={campo === 'email' ? 254 : campo === 'telefono' ? 30 : 50}
          disabled={guardando}
          onChange={event => { setPerfil({ ...perfil, [campo]: event.target.value }); setGuardado(false); }} />
      </div>)}
      <button type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar perfil'}</button>
    </form>}
  </section>;
}
