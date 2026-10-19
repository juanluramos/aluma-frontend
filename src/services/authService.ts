import { limpiarPreferenciasSesion } from "../utils/preferenciasSesion";
import { SessionClient } from './sessionClient';

export const API_URL = (import.meta.env?.VITE_API_URL ?? 'http://localhost:3000/api').replace(/\/$/, '');
const ACTIVITY_KEY = 'aluma.lastActivity';
const LOGOUT_KEY = 'aluma.logout';
let tracking = false;
let remoteLogout = false;

export const session = new SessionClient({
  baseUrl: API_URL,
  fetch: (...args) => fetch(...args),
  onActivity: at => {
    try { localStorage.setItem(ACTIVITY_KEY, String(at)); } catch { /* Storage may be disabled. */ }
  },
  onExpired: () => {
    limpiarPreferenciasSesion();
    try {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      localStorage.removeItem(ACTIVITY_KEY);
      if (!remoteLogout) localStorage.setItem(LOGOUT_KEY, String(Date.now()));
    } catch { /* Credentials are held in memory only. */ }
    window.dispatchEvent(new Event('aluma:session-expired'));
    // Best effort cookie removal/revocation; server deadlines remain binding offline.
    if (!remoteLogout) void fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include', headers: { 'X-Aluma-Session': '1' } }).catch(() => {});
  },
});

export type RegistroLogin = {
  nombre: string;
  apellido1?: string;
  email: string;
  password: string;
  id_tipo_documento: number;
  numeroDocumento: string;
};

export async function registrarDesdeLogin(datos: RegistroLogin): Promise<string> {
  const response = await fetch(`${API_URL}/auth/registro`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof body.message === "string" ? body.message : "No se ha podido crear la cuenta",
    );
  }
  return typeof body.message === "string"
    ? body.message
    : "Tu cuenta queda pendiente de revisión. Todavía no puedes iniciar sesión.";
}

export type LoginResponse = { token: string };
export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const respuesta = await session.login(email, password);
  limpiarPreferenciasSesion();
  return respuesta;
};
export const getRole = session.getRole;
export const getToken = () => session.getToken();
export const authenticatedFetch = (path: string, init?: RequestInit) => session.authenticatedFetch(path, init);
export const restoreSession = () => session.restore();
export async function logout() {
  try { localStorage.setItem(LOGOUT_KEY, String(Date.now())); } catch { /* Optional cross-tab signal. */ }
  return session.logout();
}

export function startActivityTracking() {
  if (tracking) return;
  tracking = true;
  // Old one-hour JWTs have no server session and must not be reused.
  try { localStorage.removeItem('token'); sessionStorage.removeItem('token'); } catch { /* Optional storage. */ }
  try {
    const previous = Number(localStorage.getItem(ACTIVITY_KEY));
    if (previous > 0) session.shareActivity(previous);
    else if (localStorage.getItem(LOGOUT_KEY)) session.expire();
  } catch { /* Server expiry remains authoritative. */ }
  const activity = (event: Event) => {
    if (event.isTrusted && document.visibilityState === 'visible') {
      session.activity();
      void session.syncActivity().catch(() => {});
    }
  };
  for (const name of ['pointerdown', 'pointermove', 'keydown', 'scroll', 'touchstart']) {
    window.addEventListener(name, activity, { passive: true });
  }
  const flush = () => { void session.syncActivity(true).catch(() => {}); };
  document.addEventListener('visibilitychange', () => {
    session.checkIdle();
    if (document.visibilityState === 'hidden') flush();
  });
  window.addEventListener('pagehide', flush);
  window.addEventListener('focus', () => { session.checkIdle(); });
  window.addEventListener('storage', event => {
    if (event.key === LOGOUT_KEY && event.newValue) {
      remoteLogout = true;
      session.expire();
      remoteLogout = false;
    }
    if (event.key === ACTIVITY_KEY && event.newValue) session.shareActivity(Number(event.newValue));
  });
  // Only pending real activity is sent; timers and background requests never
  // create activity. This also flushes the last interaction in a burst.
  window.setInterval(() => { void session.syncActivity().catch(() => {}); }, 1000);
}
