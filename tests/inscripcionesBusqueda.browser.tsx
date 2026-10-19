/* eslint-disable react-refresh/only-export-components */
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import InscripcionCampos from "../src/components/inscripciones/InscripcionCampos";
import type { InscripcionFormState } from "../src/utils/inscripcionFormState";
import "../src/styles/variables.css";
import "../src/components/usuarios/UsuarioFormModal.css";

const usuarios = [
  { id_usuario: 9, nombre: "Ana García López", codigo: "ALU-9" },
  { id_usuario: 2, nombre: "Bruno Martín", codigo: "SOC-2" },
];

const actividades = [
  { id_actividad: 12, titulo: "Taller de cerámica" },
  { id_actividad: 4, titulo: "Ajedrez" },
];

function comprobar(condicion: unknown, mensaje: string): asserts condicion {
  if (!condicion) throw new Error(mensaje);
}

function escribir(id: string, valor: string): void {
  const campo = document.getElementById(id) as HTMLInputElement;
  comprobar(campo, `Falta ${id}`);
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(campo, valor);
  flushSync(() => campo.dispatchEvent(new Event("input", { bubbles: true })));
}

function nombresVisibles(): string[] {
  return [...document.querySelectorAll('[aria-label="Usuarios encontrados"] button')].map((boton) => boton.textContent ?? "");
}

function actividadesVisibles(): string[] {
  return [...document.querySelectorAll('[aria-label="Actividades encontradas"] button')].map((boton) => boton.textContent ?? "");
}

function Pagina() {
  const [valores, setValores] = useState<InscripcionFormState>({
    id_usuario: "",
    id_actividad: "",
    comentario: "",
  });
  return (
    <form className="usuario-form">
      <p id="elegido">{valores.id_usuario}</p>
      <p id="actividad">{valores.id_actividad}</p>
      <InscripcionCampos
        valores={valores}
        errores={{}}
        disabled={false}
        elegirUsuario
        usuarios={usuarios}
        nombrePropio=""
        actividades={actividades}
        onChange={(campo, valor) => setValores((actual) => ({ ...actual, [campo]: valor }))}
      />
    </form>
  );
}

const root = createRoot(document.getElementById("root")!);
flushSync(() => root.render(<Pagina />));

try {
  comprobar(!document.querySelector("select#inscripcion-id_usuario"), "Usuario no es un desplegable");
  comprobar(document.getElementById("inscripcion-codigo-socio"), "Falta el código socio");
  comprobar(!document.querySelector(".inscripcion-usuario-resultados"), "Sin texto no hay resultados");

  escribir("inscripcion-id_usuario", "garcia");
  comprobar(nombresVisibles().length === 1 && nombresVisibles()[0]?.includes("Ana García López"), "El apellido encuentra a Ana");
  comprobar(nombresVisibles()[0]?.includes("ALU-9"), "El resultado muestra el código socio");

  escribir("inscripcion-id_usuario", "");
  escribir("inscripcion-codigo-socio", "soc-2");
  comprobar(nombresVisibles().length === 1 && nombresVisibles()[0]?.includes("Bruno Martín"), "El código socio encuentra a Bruno");

  flushSync(() => (document.querySelector(".inscripcion-usuario-resultados button") as HTMLButtonElement).click());
  comprobar(document.getElementById("elegido")?.textContent === "2", "Elegir un resultado guarda el usuario");
  comprobar((document.getElementById("inscripcion-id_usuario") as HTMLInputElement).value === "Bruno Martín", "El nombre elegido queda en la búsqueda");
  comprobar((document.getElementById("inscripcion-codigo-socio") as HTMLInputElement).value === "SOC-2", "El código elegido queda en el campo");
  comprobar(!document.querySelector('[aria-label="Usuarios encontrados"]'), "La lista se cierra al elegir");

  comprobar(!document.querySelector("select#inscripcion-id_actividad"), "Actividad no es un desplegable");
  comprobar(document.getElementById("inscripcion-codigo-actividad"), "Falta el código de actividad");
  comprobar(!document.querySelector('[aria-label="Actividades encontradas"]'), "Sin texto no hay actividades");

  escribir("inscripcion-id_actividad", "ceramica");
  comprobar(actividadesVisibles().length === 1 && actividadesVisibles()[0]?.includes("Taller de cerámica"), "El título encuentra el taller");
  comprobar(actividadesVisibles()[0]?.includes("12"), "El resultado muestra el código de actividad");

  escribir("inscripcion-id_actividad", "");
  escribir("inscripcion-codigo-actividad", "4");
  comprobar(actividadesVisibles().length === 1 && actividadesVisibles()[0]?.includes("Ajedrez"), "El código encuentra Ajedrez");

  flushSync(() => (document.querySelector('[aria-label="Actividades encontradas"] button') as HTMLButtonElement).click());
  comprobar(document.getElementById("actividad")?.textContent === "4", "Elegir un resultado guarda la actividad");
  comprobar((document.getElementById("inscripcion-id_actividad") as HTMLInputElement).value === "Ajedrez", "El título elegido queda en la búsqueda");
  comprobar((document.getElementById("inscripcion-codigo-actividad") as HTMLInputElement).value === "4", "El código elegido queda en el campo");
  comprobar(!document.querySelector('[aria-label="Actividades encontradas"]'), "La lista de actividades se cierra al elegir");

  document.getElementById("resultado")!.textContent = "PASS: búsqueda de usuario y de actividad por nombre y por código.";
} catch (error) {
  document.getElementById("resultado")!.textContent = `FAIL: ${String(error)}`;
}
