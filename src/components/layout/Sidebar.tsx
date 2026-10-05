import { NavLink } from "react-router-dom";

function Sidebar() {
  return (
    <aside>
      <nav>
        <ul>
          <li>
            <NavLink to="/dashboard">Dashboard</NavLink>
          </li>

          <li>
            <NavLink to="/usuarios">Usuarios</NavLink>
          </li>

          <li>
            <NavLink to="/actividades">Actividades</NavLink>
          </li>

          <li>
            <NavLink to="/inscripciones">Inscripciones</NavLink>
          </li>

          <li>
            <NavLink to="/pagos">Pagos</NavLink>
          </li>

          <li>
            <NavLink to="/contabilidad">Contabilidad</NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;
