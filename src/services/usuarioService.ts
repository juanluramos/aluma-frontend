import { authenticatedFetch } from "./authService";

export type Usuario = {
  id_usuario: number;
  codUsuario: string | null;
  numeroDocumento: string;
  nombre: string;
  apellido1: string | null;
  apellido2: string | null;
  email: string;
  telefono: string | null;
  socio: boolean;
  matriculaPagada: boolean;
  id_rol: number;
  id_estado_usuario: number;
};

export async function getUsuarios(): Promise<Usuario[]> {
  const response = await authenticatedFetch(
    "/usuarios",
    {
      headers: {},
    },
  );

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => null);

    throw new Error(
      errorData?.message ??
        "Error al obtener los usuarios",
    );
  }

  return response.json();
}

export async function updateUsuarioEstado(
  id: number,
  id_estado_usuario: number,
): Promise<Usuario> {
  const response = await authenticatedFetch(
    `/usuarios/${id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id_estado_usuario,
      }),
    },
  );

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => null);

    throw new Error(
      errorData?.message ??
        "Error al actualizar el estado del usuario",
    );
  }

  return response.json();
}

export async function updateUsuarioRol(
  idUsuario: number,
  idRol: number,
): Promise<Usuario> {
  const response = await authenticatedFetch(
    `/usuarios/${idUsuario}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id_rol: idRol,
      }),
    },
  );

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => null);

    throw new Error(
      errorData?.message ??
        "Error al actualizar el rol del usuario",
    );
  }

  return response.json();
}

export type CreateUsuarioData = {
  codUsuario?: string;
  id_tipo_documento: number;
  numeroDocumento: string;
  nombre: string;
  apellido1?: string;
  apellido2?: string;
  email: string;
  telefono?: string;
  id_rol: number;
  socio: boolean;
  matriculaPagada: boolean;
  id_estado_usuario: number;
  comentario?: string;

  password: string;
};

export async function createUsuario(
  data: CreateUsuarioData,
): Promise<Usuario> {
  const response = await authenticatedFetch(
    "/usuarios",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => null);

    throw new Error(
      errorData?.message ??
        "Error al crear el usuario",
    );
  }

  return response.json();
}