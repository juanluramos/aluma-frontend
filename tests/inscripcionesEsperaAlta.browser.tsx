import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { MemoryRouter } from "react-router-dom";
import { API_URL, session } from "../src/services/authService";
import InscripcionesPage from "../src/pages/InscripcionesPage";
import "../src/styles/variables.css";

function token(): string {
  const payload = { rol: "Operador", id_usuario: 3, exp: Math.floor(Date.now() / 1000) + 3600 };
  return `header.${btoa(JSON.stringify(payload))}.signature`;
}

const usuario = {
  id_usuario: 9,
  codUsuario: "ALU-9",
  id_tipo_documento: 1,
  numeroDocumento: "12345678Z",
  nombre: "Ana",
  apellido1: "García",
  apellido2: "López",
  email: "ana@example.test",
  telefono: null,
  socio: true,
  id_rol: 1,
  id_estado_usuario: 1,
  matriculaPagada: true,
  comentario: null,
  fechaInscripcion: "2026-01-15",
};

const actividad = {
  id_actividad: 12,
  titulo: "Taller de cerámica",
  fecha: "2026-10-20",
  aforo: 2,
  plazasOcupadas: 2,
  plazasDisponibles: 0,
  personasEnEspera: 0,
  importeSocio: "8.00",
  importeNoSocio: "10.00",
  id_estado_actividad: 1,
};

const inscripcion = {
  id_inscripcion: 8,
  id_usuario: 9,
  id_actividad: 12,
  precioAplicado: "8.00",
  id_estado_pago: 11,
  id_estado_inscripcion: 17,
  id_metodo_pago: null,
  apuntadoFecha: "2026-10-18T00:00:00.000Z",
  fechaPago: null,
  comentario: null,
  createAt: "2026-10-18T10:00:00.000Z",
  updateAt: "2026-10-18T10:00:00.000Z",
  posicionEspera: 1,
  plazasOcupadas: 2,
  plazasDisponibles: 0,
  aforo: 2,
  puedePromocionar: false,
  Usuario: { id_usuario: 9, nombre: "Ana", apellido1: "García", apellido2: "López" },
  Actividad: { id_actividad: 12, titulo: "Taller de cerámica" },
};

let creada = false;

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

async function esperarBoton(selector: string): Promise<HTMLButtonElement> {
  for (let i = 0; i < 40; i += 1) {
    const boton = document.querySelector(selector) as HTMLButtonElement | null;
    if (boton) return boton;
    await esperar();
  }
  throw new Error(`No apareció el botón ${selector}`);
}

function escribir(id: string, valor: string): void {
  const campo = document.getElementById(id) as HTMLInputElement;
  comprobar(campo, `Falta ${id}`);
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(campo, valor);
  flushSync(() => campo.dispatchEvent(new Event("input", { bubbles: true })));
}

sessionStorage.clear();
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input);
  const method = (init?.method ?? "GET").toUpperCase();
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
  if (ruta === "/usuarios") return json([usuario]);
  if (ruta === "/actividades") return json([actividad]);
  if (ruta === "/inscripciones" && method === "POST") {
    creada = true;
    return json({ ...inscripcion }, 201);
  }
  if (ruta === "/inscripciones") return json(creada ? [inscripcion] : []);
  return json({});
}) as typeof fetch;

await session.login("operador@example.test", "clave");
createRoot(document.getElementById("root")!).render(<MemoryRouter><InscripcionesPage /></MemoryRouter>);

try {
  await esperarTexto("Nueva caja");
  comprobar(!document.body.textContent?.includes("El socio se ha añadido a la lista de espera."), "El aviso no aparece antes del alta");
  flushSync(() => (document.querySelector(".inscripciones-new-button") as HTMLButtonElement).click());
  await esperarTexto("Código socio");

  escribir("inscripcion-id_usuario", "ana");
  const usuarioElegido = await esperarBoton('[aria-label="Usuarios encontrados"] button');
  flushSync(() => usuarioElegido.click());
  escribir("inscripcion-id_actividad", "ceramica");
  const actividadElegida = await esperarBoton('[aria-label="Actividades encontradas"] button');
  flushSync(() => actividadElegida.click());
  flushSync(() => document.querySelector("form.usuario-form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));

  await esperarTexto("El socio se ha añadido a la lista de espera.");
  await esperarTexto("Ana García López");
  const fila = [...document.querySelectorAll("tbody tr")].find((tr) => tr.textContent?.includes("Ana García López"));
  comprobar(document.querySelector(".inscripciones-aviso")?.textContent === "El socio se ha añadido a la lista de espera.", "El aviso está en la página");
  await esperar(4100);
  comprobar(!document.querySelector(".inscripciones-aviso"), "El aviso desaparece a los 4 segundos");
  comprobar(!document.querySelector('[role="dialog"]'), "El alta se cierra");
  comprobar(fila?.textContent?.includes("En espera"), "La inscripción de Ana queda en espera");

  document.getElementById("resultado")!.textContent = "PASS: el alta con aforo completo avisa de la lista de espera.";
} catch (error) {
  document.getElementById("resultado")!.textContent = `FAIL: ${error instanceof Error ? error.message : String(error)}`;
}
