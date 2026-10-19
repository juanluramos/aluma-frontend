import test from "node:test";
import assert from "node:assert/strict";
import { API_URL, session } from "../src/services/authService.ts";
import {
  buscarActividadesInscripcion,
  buscarUsuariosInscripcion,
  cargarActividadesInscripcion,
  cargarNombrePropio,
  cargarUsuariosInscripcion,
} from "../src/utils/opcionesInscripcion.ts";

function token(rol: string, id: number): string {
  const payload = { rol, id_usuario: id, exp: Math.floor(Date.now() / 1000) + 60 * 60 };
  return `header.${Buffer.from(JSON.stringify(payload)).toString("base64")}.signature`;
}

const actividad = {
  id_actividad: 12,
  titulo: " Taller de cerámica ",
  fecha: null,
  aforo: null,
  importeSocio: "10.00",
  importeNoSocio: "15.00",
  id_estado_actividad: 1,
};

const usuario = {
  id_usuario: 9,
  codUsuario: null,
  id_tipo_documento: 1,
  numeroDocumento: "12345678Z",
  nombre: "Ana",
  apellido1: "García",
  apellido2: "López",
  email: "ana@example.test",
  telefono: null,
  socio: true,
  matriculaPagada: false,
  id_rol: 1,
  id_estado_usuario: 1,
  comentario: null,
  fechaInscripcion: '2026-01-15',
};

async function conFetch(
  rol: string,
  id: number,
  responder: (ruta: string) => Response,
): Promise<string[]> {
  const rutas: string[] = [];
  globalThis.fetch = (async (input) => {
    const url = String(input);
    const ruta = url.startsWith(API_URL) ? url.slice(API_URL.length) : url;
    if (ruta === "/auth/login" || ruta === "/auth/refresh") {
      return Response.json({ token: token(rol, id) });
    }
    rutas.push(ruta);
    return responder(ruta);
  }) as typeof fetch;
  await session.login(`${rol}@example.test`, "clave");
  return rutas;
}

test("Operador y administrador obtienen usuarios y actividades por nombre", async () => {
  for (const rol of ["Operador", "Administrador"]) {
    const rutas = await conFetch(rol, 3, (ruta) => {
      if (ruta === "/actividades") return Response.json([actividad, { ...actividad, id_actividad: 4, titulo: "Ajedrez" }]);
      if (ruta === "/usuarios") return Response.json([usuario, { ...usuario, id_usuario: 2, nombre: "Bruno", apellido1: "Martín", apellido2: null }]);
      return Response.json({ message: "No encontrado" }, { status: 404 });
    });

    const actividades = await cargarActividadesInscripcion();
    const usuarios = await cargarUsuariosInscripcion();

    assert.deepEqual(rutas, ["/actividades", "/usuarios"]);
    assert.deepEqual(actividades.map((item) => item.titulo), ["Ajedrez", "Taller de cerámica"]);
    assert.deepEqual(usuarios.map((item) => item.nombre), ["Ana García López", "Bruno Martín"]);
    assert.deepEqual(usuarios.map((item) => item.codigo), ["", ""]);
  }
});

test("La búsqueda de actividad localiza por título o por código", () => {
  const lista = [
    { id_actividad: 12, titulo: "Taller de cerámica" },
    { id_actividad: 4, titulo: "Ajedrez" },
  ];

  assert.deepEqual(buscarActividadesInscripcion(lista, "", "").map((item) => item.id_actividad), []);
  assert.deepEqual(buscarActividadesInscripcion(lista, "ceramica", "").map((item) => item.id_actividad), [12]);
  assert.deepEqual(buscarActividadesInscripcion(lista, "", "4").map((item) => item.id_actividad), [4]);
  assert.deepEqual(buscarActividadesInscripcion(lista, "taller", "12").map((item) => item.id_actividad), [12]);
  assert.deepEqual(buscarActividadesInscripcion(lista, "taller", "4").map((item) => item.id_actividad), []);
});

test("La búsqueda de inscripción localiza por nombre y apellidos o por código socio", () => {
  const lista = [
    { id_usuario: 9, nombre: "Ana García López", codigo: "ALU-9" },
    { id_usuario: 2, nombre: "Bruno Martín", codigo: "SOC-2" },
    { id_usuario: 4, nombre: "Lucía Sanz", codigo: "" },
  ];

  assert.deepEqual(buscarUsuariosInscripcion(lista, "", "").map((item) => item.id_usuario), []);
  assert.deepEqual(buscarUsuariosInscripcion(lista, "garcia", "").map((item) => item.id_usuario), [9]);
  assert.deepEqual(buscarUsuariosInscripcion(lista, "López", "").map((item) => item.id_usuario), [9]);
  assert.deepEqual(buscarUsuariosInscripcion(lista, "", "soc").map((item) => item.id_usuario), [2]);
  assert.deepEqual(buscarUsuariosInscripcion(lista, "ana", "alu-9").map((item) => item.id_usuario), [9]);
  assert.deepEqual(buscarUsuariosInscripcion(lista, "ana", "soc").map((item) => item.id_usuario), []);
  assert.deepEqual(buscarUsuariosInscripcion(lista, "", "ALU").map((item) => item.id_usuario), [9]);
});

test("El rol Usuario no solicita el listado de usuarios y usa su propio nombre", async () => {
  const rutas = await conFetch("Usuario", 7, (ruta) => {
    if (ruta === "/actividades") return Response.json([actividad]);
    if (ruta === "/usuarios/7") {
      return Response.json({ nombre: "Lucía", apellido1: "Sanz", apellido2: null });
    }
    if (ruta === "/usuarios") return Response.json({ message: "Prohibido" }, { status: 403 });
    return Response.json({ message: "No encontrado" }, { status: 404 });
  });

  const actividades = await cargarActividadesInscripcion();
  const nombre = await cargarNombrePropio(7);

  assert.deepEqual(actividades, [{ id_actividad: 12, titulo: "Taller de cerámica" }]);
  assert.equal(nombre, "Lucía Sanz");
  assert.deepEqual(rutas, ["/actividades", "/usuarios/7"]);
});

test("Si el perfil propio falla, el formulario conserva un texto alternativo", async () => {
  await conFetch("Usuario", 7, () => new Response("fallo", { status: 500 }));
  assert.equal(await cargarNombrePropio(7), "Tu usuario");
});
