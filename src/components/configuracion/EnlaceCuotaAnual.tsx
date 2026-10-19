import { NavLink } from "react-router-dom";
import { hasPermission, type Rol } from "../../auth/permissions";

interface Props {
  rol: Rol | null;
  onNavigate?: () => void;
}

export default function EnlaceCuotaAnual({ rol, onNavigate }: Props) {
  if (!hasPermission(rol, "gestionarConfiguracionCuota")) return null;
  return (
    <NavLink to="/configuracion" className="sidebar-cuota-anual" onClick={onNavigate}>
      Cuota anual
    </NavLink>
  );
}
