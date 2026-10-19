import { useSyncExternalStore } from "react";
import { session } from "../../services/authService";

export function useSesionInscripcion() {
  const rol = useSyncExternalStore(session.subscribe, session.getRole, session.getRole);
  const idUsuario = useSyncExternalStore(session.subscribe, session.getUserId, session.getUserId);

  return { rol, idUsuario };
}
