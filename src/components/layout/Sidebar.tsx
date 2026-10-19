import { useEffect, useRef, useState } from 'react';
import { hasPermission } from '../../auth/permissions';
import { useRole } from '../../auth/useRole';
import { NavLink } from 'react-router-dom';
import EnlaceCuotaAnual from '../configuracion/EnlaceCuotaAnual';
import './Sidebar.css';
import '../../styles/variables.css';

import dashboardIcon from '../../assets/icons/navigation/inicio.webp';
import dasboardRojoIcon from '../../assets/icons/navigation/inicio-rojo.webp';

import usuariosIcon from '../../assets/icons/navigation/usuarios.webp';
import usuariosRojoIcon from '../../assets/icons/navigation/usuarios-rojo.webp';

import actividadesIcon from '../../assets/icons/navigation/actividades.webp';
import actividadesRojoIcon from '../../assets/icons/navigation/actividades-rojo.webp';

import inscripcionIcon from '../../assets/icons/navigation/inscripcion-azul.webp';
import inscripcionRojoIcon from '../../assets/icons/navigation/inscripcion-rojo.webp';


import cuotasIcon from '../../assets/icons/navigation/cuotas-azul.webp';
import cuotasRojoIcon from '../../assets/icons/navigation/cuotas-rojol.webp';

import contabilidadIcon from '../../assets/icons/navigation/contabilidad-azul.webp';
import contabilidadRojoIcon from '../../assets/icons/navigation/contabilidad-rojo.webp';

import configuracionIcon from '../../assets/icons/navigation/configuracion.webp';
import configuracionRojoIcon from '../../assets/icons/navigation/configuracion-rojo.webp';
import ayudaIcon from '../../assets/icons/navigation/ayuda.webp';
import ayudaRojoIcon from '../../assets/icons/navigation/ayuda-rojo.webp';

import logoAluma from '../../assets/icons/logo/aluma.webp';


function Sidebar() {
  const role = useRole();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<'day' | 'night'>(() => {
    try { return localStorage.getItem('aluma.theme') === 'night' ? 'night' : 'day'; }
    catch { return 'day'; }
  });
  const footerRef = useRef<HTMLElement>(null);
  const settingsRef = useRef<HTMLButtonElement>(null);
  const dayRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('aluma.theme', theme); } catch { /* Optional storage. */ }
  }, [theme]);

  useEffect(() => {
    if (!settingsOpen) return;
    dayRef.current?.focus();
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !footerRef.current?.contains(event.target)) setSettingsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSettingsOpen(false);
        settingsRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [settingsOpen]);

  function selectTheme(value: 'day' | 'night') {
    setTheme(value);
    setSettingsOpen(false);
    settingsRef.current?.focus();
  }
  return (

    <aside className="sidebar">
        <img src={logoAluma} alt='' className='header-logo' />
      <nav>
        <ul className="sidebar-menu">
          {hasPermission(role, "verDashboard") && (<li className="sidebar-item">
            <NavLink to="/dashboard">
              <img src={dashboardIcon} alt="" className="sidebar-icon icon-normal" />
              <img src={dasboardRojoIcon} alt="" className="sidebar-icon icon-hover" />
              <span>Dashboard</span>
            </NavLink>
          </li>)}

          {hasPermission(role, "verUsuarios") && (<li className="sidebar-item">
            <NavLink to="/usuarios">
              <img src={usuariosIcon} alt="" className="sidebar-icon icon-normal" />
              <img src={usuariosRojoIcon} alt="" className="sidebar-icon icon-hover" />
              <span>{role === "Operador" ? "Socios" : "Usuarios"}</span>
            </NavLink>
          </li>)}

          {hasPermission(role, "verCuotas") && (<li className="sidebar-item">
            <NavLink to="/cuotas">
              <img src={cuotasIcon} alt="" className="sidebar-icon icon-normal" />
              <img src={cuotasRojoIcon} alt="" className="sidebar-icon icon-hover" />
              <span>Cuotas</span>
            </NavLink>
          </li>)}

          {hasPermission(role, "verActividades") && (<li className="sidebar-item">
            <NavLink to="/actividades">
              <img src={actividadesIcon} alt="" className="sidebar-icon icon-normal" />
              <img src={actividadesRojoIcon} alt="" className="sidebar-icon icon-hover" />
              <span>Actividades</span>
            </NavLink>
          </li>)}

          {hasPermission(role, "verInscripciones") && (<li className="sidebar-item">
            <NavLink to="/inscripciones">
              <img src={inscripcionIcon} alt="" className="sidebar-icon icon-normal" />
              <img src={inscripcionRojoIcon} alt="" className="sidebar-icon icon-hover" />
              <span>Caja</span>
            </NavLink>
          </li>)}

          {hasPermission(role, "verContabilidad") && (<li className="sidebar-item">
            <NavLink to="/contabilidad">
              <img src={contabilidadIcon} alt="" className="sidebar-icon icon-normal" />
              <img src={contabilidadRojoIcon} alt="" className="sidebar-icon icon-hover" />
              <span>Contabilidad</span>
            </NavLink>
          </li>)}
        </ul>
      </nav>
      <nav className="sidebar-footer" aria-label="Configuración y ayuda" ref={footerRef}
        onBlur={event => {
          if (!event.currentTarget.contains(event.relatedTarget)) setSettingsOpen(false);
        }}>
          <div id="appearance-options" className={`sidebar-appearance${settingsOpen ? ' is-open' : ''}`}
            role="group" aria-label="Apariencia" aria-hidden={!settingsOpen} inert={!settingsOpen}>
            <p>Apariencia</p>
            <button ref={dayRef} type="button" aria-pressed={theme === 'day'} onClick={() => selectTheme('day')}>
              <span aria-hidden="true">☀</span> Día
            </button>
            <button type="button" aria-pressed={theme === 'night'} onClick={() => selectTheme('night')}>
              <span aria-hidden="true">☾</span> Noche
            </button>
            <EnlaceCuotaAnual rol={role} onNavigate={() => setSettingsOpen(false)} />
          </div>
        <ul className="sidebar-menu">
          <li className="sidebar-item">
            <button type="button" ref={settingsRef} aria-expanded={settingsOpen}
              aria-controls="appearance-options"
              onClick={() => setSettingsOpen(open => !open)}>
              <img src={configuracionIcon} alt="" className="sidebar-icon icon-normal" />
              <img src={configuracionRojoIcon} alt="" className="sidebar-icon icon-hover" />
              <span>Configuración</span>
            </button>
          </li>
          <li className="sidebar-item">
            <button type="button">
              <img src={ayudaIcon} alt="" className="sidebar-icon icon-normal" />
              <img src={ayudaRojoIcon} alt="" className="sidebar-icon icon-hover" />
              <span>Ayuda</span>
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;
