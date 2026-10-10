import type { Rol } from "./permissions";

type JwtPayload = {
  id_usuario: number;
  rol: Rol;
  exp: number;
  iat: number;
};

export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const payload = token.split(".")[1];

    if (!payload) {
      return null;
    }

    const decoded = JSON.parse(
      atob(
        payload
          .replace(/-/g, "+")
          .replace(/_/g, "/")
      )
    );

    return decoded as JwtPayload;
  } catch {
    return null;
  }
}