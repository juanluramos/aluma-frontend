import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { session, getToken, restoreSession, startActivityTracking } from '../../services/authService';

export default function ProtectedRoute() {
  const [state, setState] = useState<'loading' | 'ready' | 'expired' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    startActivityTracking();
    const expired = () => { if (active) setState('expired'); };
    window.addEventListener('aluma:session-expired', expired);
    void restoreSession().then(() => {
      if (active) setState('ready');
    }).catch(() => {
      if (active) setState(previous => previous === 'expired' || session.isExpired() ? 'expired' : 'error');
    });
    return () => { active = false; window.removeEventListener('aluma:session-expired', expired); };
  }, [attempt]);
  if (state === 'expired') return <Navigate to="/login" replace />;
  if (state === 'error') return <div role="alert">No se pudo comprobar la sesión. <button onClick={() => setAttempt(value => value + 1)}>Reintentar</button></div>;
  if (state !== 'ready' || !getToken()) return <p>Comprobando sesión…</p>;
  return <Outlet />;
}
