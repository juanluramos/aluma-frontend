import { hasPermission } from '../../auth/permissions';
import { useRole } from '../../auth/useRole';
import { NavLink } from 'react-router-dom';
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

import pagosIcon from '../../assets/icons/navigation/pagos.webp';
import pagosRojoIcon from '../../assets/icons/navigation/pagos-rojo.webp';

import contabilidadIcon from '../../assets/icons/navigation/contabilidad-azul.webp';
import contabilidadRojoIcon from '../../assets/icons/navigation/contabilidad-rojo.webp';

import logoAluma from '../../assets/icons/logo/aluma.webp';


function Sidebar() {
  const role = useRole();
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
              <span>Usuarios</span>
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
              <span>Inscripciones</span>
            </NavLink>
          </li>)}

          <li className="sidebar-item">
            <NavLink to="/pagos">
              <img src={pagosIcon} alt="" className="sidebar-icon icon-normal" />
              <img src={pagosRojoIcon} alt="" className="sidebar-icon icon-hover" />
              <span>Pagos</span>
            </NavLink>
          </li>
          {hasPermission(role, "verContabilidad") && (<li className="sidebar-item">
            <NavLink to="/contabilidad">
              <img src={contabilidadIcon} alt="" className="sidebar-icon icon-normal" />
              <img src={contabilidadRojoIcon} alt="" className="sidebar-icon icon-hover" />
              <span>Contabilidad</span>
            </NavLink>
          </li>)}
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;
