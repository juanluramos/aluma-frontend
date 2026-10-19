import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { hasPermission } from "../../auth/permissions";
import { useRole } from "../../auth/useRole";
import { authenticatedFetch, logout, session } from "../../services/authService";
import type { Usuario } from "../../services/usuarioService";
import { nombreCompletoUsuario } from "../../utils/usuariosListado";
import { Link, useLocation } from "react-router-dom";
import "./Header.css";

function Header() {
  const role = useRole();
  const userId = useSyncExternalStore(session.subscribe, session.getUserId);
  const [usuario, setUsuario] = useState<Pick<Usuario, 'id_usuario' | 'nombre' | 'apellido1' | 'apellido2'> | null>(null);
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userId === null) return;
    let active = true;
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await authenticatedFetch(`/usuarios/${userId}`, { signal: controller.signal });
        if (!response.ok) throw new Error('No se pudo cargar el usuario.');
        const data: Usuario = await response.json();
        if (active && data.id_usuario === userId) setUsuario(data);
      } catch {
        if (active) setUsuario(null);
      }
    })();
    return () => {
      active = false;
      controller.abort();
    };
  }, [userId, location.pathname]);

  const usuarioActual = usuario?.id_usuario === userId ? usuario : null;
  const nombre = usuarioActual ? nombreCompletoUsuario(usuarioActual) : '';
  const iniciales = nombre.split(/\s+/).filter(Boolean).slice(0, 2).map(parte => parte[0]).join('').toLocaleUpperCase('es');

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>('a, button')?.focus();
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) setOpen(false);
    };
    const closeEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeEscape);
    };
  }, [open]);

  function closeMenu() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  const sections: Record<string, { title: string; subtitle: string }> = {
    "/perfil": { title: "Mi perfil", subtitle: "Datos personales" },
    "/dashboard": {
      title: "Dashboard",
      subtitle: "Resumen general",
    },
    "/usuarios": {
      title: "Usuarios",
      subtitle: "Gestión de usuarios",
    },
    "/actividades": {
      title: "Actividades",
      subtitle: "Gestión de actividades",
    },
    "/inscripciones": {
      title: "Caja",
      subtitle: "Gestión de inscripciones y pagos",
    },
    "/pagos": {
      title: "Pagos",
      subtitle: hasPermission(role, "gestionarInscripciones") ? "Gestión de pagos" : "Tus pagos",
    },
    "/contabilidad": {
      title: "Contabilidad",
      subtitle: "Gestión contable",
    },
    "/cuotas": {
      title: "Cuotas",
      subtitle: "Gestión de cuotas",
    },
    "/configuracion": {
      title: "Configuración",
      subtitle: "Cuota anual",
    },
  };

  const section = sections[location.pathname] ?? {
    title: "ALUMA",
    subtitle: "",
  };

  return (
    <header className="header">
      <div className="header-left">
        <h1>{section.title}</h1>
        <p>{section.subtitle}</p>
      </div>

      <div className="header-right" ref={containerRef}
        onBlur={event => {
          if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
        }}>
        <button type="button" className="user-info user-menu-trigger" ref={triggerRef}
          aria-label="Opciones de usuario" aria-expanded={open} aria-controls="user-options"
          onClick={() => setOpen(value => !value)}>
          <span className="user-avatar" aria-hidden="true">{iniciales || '?'}</span>
          <span className="user-data">
            <span className="user-name">{nombre || 'Mi cuenta'}</span>
            <span className="user-role">{role ?? "Sin rol"}</span>
          </span>
        </button>
        <div id="user-options" ref={panelRef} className={`user-options${open ? ' is-open' : ''}`}
          role="group" aria-label="Opciones de usuario" aria-hidden={!open} inert={!open}>
          {hasPermission(role, "editarPerfil") && <Link to="/perfil" onClick={closeMenu}>Mi perfil</Link>}
          <button type="button" onClick={() => {
            closeMenu();
            void logout().catch(() => {});
          }}>Cerrar sesión</button>
        </div>
      </div>
    </header>
  );
}

export default Header;
