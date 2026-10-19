import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ActividadInscritos from "../src/components/actividades/ActividadInscritos";
import InscripcionesPage from "../src/pages/InscripcionesPage";
import { API_URL, session } from "../src/services/authService";
import "../src/styles/variables.css";

function token(): string {
  const payload = { rol: "Operador", id_usuario: 3, exp: Math.floor(Date.now() / 1000) + 3600 };
  return `header.${btoa(JSON.stringify(payload))}.signature`;
}

const inscripcion = {
  id_inscripcion: 8,
  id_usuario: 9,
  id_actividad: 12,
  precioAplicado: "8.00",
  id_estado_pago: 11,
  id_estado_inscripcion: 15,
  id_metodo_pago: null,
  apuntadoFecha: "2026-10-18T00:00:00.000Z",
  fechaPago: null,
  comentario: null,
  createAt: "2026-10-18T10:00:00.000Z",
  updateAt: "2026-10-18T10:00:00.000Z",
  posicionEspera: null,
  plazasOcupadas: 1,
  plazasDisponibles: 1,
  aforo: 2,
  puedePromocionar: false,
  Usuario: { id_usuario: 9, nombre: "Ana", apellido1: "García", apellido2: "López" },
  Actividad: { id_actividad: 12, titulo: "Taller de cerámica" },
};

function comprobar(condicion: unknown, mensaje: string): asserts condicion {
  if (!condicion) throw new Error(mensaje);
}

function esperar(ms = 30): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function esperarTexto(texto: string): Promise<void> {
  for (let i = 0; i < 40; i += 1) {
    if (document.body.textContent?.includes(texto)) return;
    await esperar();
  }
  throw new Error(`No apareció: ${texto}`);
}

sessionStorage.clear();
globalThis.fetch = (async (input: RequestInfo | URL) => {
  const url = String(input);
  const ruta = url.startsWith(API_URL) ? url.slice(API_URL.length) : url;
  const json = (datos: unknown, status = 200) => Response.json(datos, { status });
  if (ruta === "/auth/login" || ruta === "/auth/refresh") return json({ token: token() });
  if (ruta === "/estados-inscripcion") {
    return json([
      { id_estado_inscripcion: 15, nombre: "Activa" },
      { id_estado_inscripcion: 16, nombre: "Cerrada" },
      { id_estado_inscripcion: 17, nombre: "En espera" },
    ]);
  }
  if (ruta === "/estados-pago") return json([{ id_estado_pago: 11, nombre_estado: "Pendiente" }]);
  if (ruta === "/metodos-pago") return json([]);
  if (ruta === "/inscripciones") return json([inscripcion]);
  return json([]);
}) as typeof fetch;

await session.login("operador@example.test", "clave");
createRoot(document.getElementById("root")!).render(
  <MemoryRouter initialEntries={["/actividades"]}>
    <Routes>
      <Route path="/actividades" element={<ActividadInscritos idActividad={12} />} />
      <Route path="/inscripciones" element={<InscripcionesPage />} />
    </Routes>
  </MemoryRouter>,
);

try {
  await esperarTexto("Ana García López");
  const boton = document.querySelector('[aria-label="Ver inscripción de Ana García López"]') as HTMLButtonElement | null;
  comprobar(boton, "El usuario no es pulsable");
  flushSync(() => boton.click());
  await esperarTexto("Editar inscripción");
  const usuario = document.querySelector('[role="dialog"] input[name="id_usuario"]') as HTMLInputElement | null;
  comprobar(usuario?.value === "Ana García López", "La inscripción abierta es la de Ana");
  comprobar(!document.querySelector(".actividad-inscritos"), "Se sale del listado de inscritos");
  document.getElementById("resultado")!.textContent = "PASS: pulsar un inscrito abre su inscripción.";
} catch (error) {
  document.getElementById("resultado")!.textContent = `FAIL: ${error instanceof Error ? error.message : String(error)}`;
}
