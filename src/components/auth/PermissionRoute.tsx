import { Outlet } from 'react-router-dom';
import { hasPermission, type Permission } from '../../auth/permissions';
import { useRole } from '../../auth/useRole';

export default function PermissionRoute({ permission }: { permission: Permission }) {
  const role = useRole();
  return hasPermission(role, permission) ? <Outlet /> : <p role="alert">No tienes permisos para acceder a esta sección.</p>;
}
