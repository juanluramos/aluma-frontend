import { useRole } from "../../auth/useRole";
import { logout } from "../../services/authService";
import { useLocation } from "react-router-dom";
import "./Header.css";

function Header() {
  const role = useRole();
  const location = useLocation();

  const sections: Record<string, { title: string; subtitle: string }> = {
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
      title: "Inscripciones",
      subtitle: "Gestión de inscripciones",
    },
    "/pagos": {
      title: "Pagos",
      subtitle: "Gestión de pagos",
    },
    "/contabilidad": {
      title: "Contabilidad",
      subtitle: "Gestión contable",
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

      <div className="header-right">
        <div className="user-info">
          <div className="user-avatar">
            JL
          </div>
          <div className="user-data">
            <span className="user-name">Juan Luis Ramos</span>
            <span className="user-role">{role ?? "Sin rol"}</span>
          </div>

          <button type="button" onClick={() => { void logout().catch(() => {}); }}>Cerrar sesión</button>
          </div>
        </div>
        
    </header>
  );
}

export default Header;