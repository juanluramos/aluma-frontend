import { decodeJwtPayload } from "../auth/getCurrentUser.ts";
import type { Rol } from "../auth/permissions.ts";

export const IDLE_MS = 60 * 60 * 1000;
export const ACTIVITY_SYNC_MS = 30 * 1000;

type Options = {
  baseUrl: string;
  fetch: typeof fetch;
  now?: () => number;
  onExpired?: () => void;
  onActivity?: (at: number) => void;
};

export class SessionClient {
  private role: Rol | null = null;
  private listeners = new Set<() => void>();
  getRole = () => this.role;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };
  private setToken(token: string | null) {
    this.token = token;
    const role = token ? decodeJwtPayload(token)?.rol : null;
    this.role = role === "Usuario" || role === "Operador" || role === "Administrador" ? role : null;
    this.listeners.forEach(listener => listener());
  }
  private token: string | null = null;
  private lastActivity: number | null = null;
  private reportedActivity: number | null = null;
  private lastReportAttempt = 0;
  private generation = 0;
  private pending: Promise<string> | null = null;
  private stopped = false;
  private readonly now: () => number;
  private readonly options: Options;

  constructor(options: Options) {
    this.options = options;
    this.now = options.now ?? Date.now;
  }
  getToken() { return this.token; }
  isExpired() { return this.stopped; }
  private clear() {
    this.generation++;
    this.setToken(null);
    this.lastActivity = null;
    this.reportedActivity = null;
    this.stopped = true;
  }
  expire() {
    if (this.stopped) return;
    this.clear();
    this.options.onExpired?.();
  }
  checkIdle() {
    if (this.lastActivity !== null && this.now() - this.lastActivity >= IDLE_MS) {
      this.expire();
      return false;
    }
    return !this.stopped;
  }
  // A shared timestamp contains no credentials. A different tab can report
  // real interaction, but must never resurrect an already expired session.
  shareActivity(at: number) {
    if (!this.stopped && at <= this.now() && at > (this.lastActivity ?? 0)) this.lastActivity = at;
  }
  activity() {
    if (!this.token || !this.checkIdle()) return;
    this.lastActivity = this.now();
    this.options.onActivity?.(this.lastActivity);
  }
  async syncActivity(flush = false) {
    if (!this.checkIdle() || !this.token || this.lastActivity === this.reportedActivity) return;
    if (!flush && this.now() - this.lastReportAttempt < ACTIVITY_SYNC_MS) return;
    await this.refresh(true);
  }
  private tokenValid() {
    if (!this.token) return false;
    try {
      const part = this.token.split('.')[1]!;
      const payload = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')));
      return payload.exp * 1000 > this.now() + 30_000;
    } catch { return false; }
  }
  async login(email: string, password: string) {
    // Complete any old refresh before a new login can replace the cookie.
    await this.pending?.catch(() => {});
    const generation = ++this.generation;
    const response = await this.options.fetch(`${this.options.baseUrl}/auth/login`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.message ?? 'Error al iniciar sesión');
    if (generation !== this.generation) throw new Error('Sesión cancelada');
    this.stopped = false;
    this.setToken(body.token);
    this.lastActivity = this.now();
    this.reportedActivity = this.lastActivity;
    this.lastReportAttempt = this.now();
    this.options.onActivity?.(this.lastActivity);
    return { token: body.token as string };
  }
  async restore() {
    if (!this.checkIdle()) throw new Error('Sesión caducada');
    if (this.token) return this.token;
    // Loading a protected page is user activity. The server still checks the
    // previous deadline BEFORE extending it; expired cookies cannot log in.
    if (!this.pending) this.lastActivity = this.now();
    return this.refresh(true);
  }
  refresh(activity = false): Promise<string> {
    if (!this.checkIdle()) return Promise.reject(new Error('Sesión caducada'));
    if (this.pending) return this.pending;
    const generation = this.generation;
    const reported = this.lastActivity ?? this.now();
    if (activity) this.lastReportAttempt = this.now();
    this.pending = (async () => {
      const response = await this.options.fetch(`${this.options.baseUrl}/auth/refresh`, {
        method: 'POST', credentials: 'include', keepalive: true,
        headers: { 'X-Aluma-Session': '1', 'X-Aluma-Activity': activity ? '1' : '0', 'X-Aluma-Activity-Age': String(Math.max(0, this.now() - reported)) },
      });
      if (generation !== this.generation) throw new Error('Sesión cancelada');
      if (response.status === 401 || response.status === 403) {
        this.expire();
        throw new Error('Sesión caducada');
      }
      if (!response.ok) throw new Error('No se pudo renovar la sesión');
      const body = await response.json();
      if (generation !== this.generation || !this.checkIdle()) throw new Error('Sesión cancelada');
      this.setToken(body.token);
      if (activity) {
        this.options.onActivity?.(this.lastActivity ?? reported);
        this.reportedActivity = reported;
        if (this.lastActivity === null) {
          this.lastActivity = reported;
          this.options.onActivity?.(reported);
        }
      }
      return body.token as string;
    })().finally(() => { this.pending = null; });
    return this.pending;
  }
  async authenticatedFetch(path: string, init: RequestInit = {}) {
    if (!this.checkIdle()) throw new Error('Sesión caducada');
    if (!this.tokenValid()) await this.refresh(false);
    const send = () => {
      const headers = new Headers(init.headers);
      headers.set('Authorization', `Bearer ${this.token}`);
      return this.options.fetch(`${this.options.baseUrl}${path}`, { ...init, headers, credentials: 'include' });
    };
    const sentToken = this.token;
    let response = await send();
    if (response.status === 401) {
      // Requests arriving after another request renewed reuse that token.
      if (sentToken === this.token) await this.refresh(false);
      response = await send();
      if (response.status === 401) this.expire();
    }
    if (response.status === 403) {
      const body = await response.clone().json().catch(() => null);
      if (body?.code === 'LOGIN_NOT_ALLOWED') this.expire();
    }
    return response;
  }
  async logout() {
    this.expire();
    await this.pending?.catch(() => {});
    const response = await this.options.fetch(`${this.options.baseUrl}/auth/logout`, {
      method: 'POST', credentials: 'include', headers: { 'X-Aluma-Session': '1' },
    });
    if (!response.ok) throw new Error('No se pudo cerrar la sesión en el servidor');
  }
}
