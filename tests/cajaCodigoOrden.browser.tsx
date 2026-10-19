/* eslint-disable react-refresh/only-export-components */
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import InscripcionesTable from "../src/components/inscripciones/InscripcionesTable";
import type { Inscripcion } from "../src/types/inscripcion";
import { direccionAlOrdenar, ordenarInscripciones, type CampoOrdenInscripcion } from "../src/utils/inscripcionesListado";
import "../src/styles/variables.css";
import "../src/pages/InscripcionesPage.css";

function fila(id: number, nombre: string): Inscripcion {
  return {
    id_inscripcion: id,
    id_usuario: id,
    id_actividad: 1,
    precioAplicado: "8.00",
    id_estado_pago: 11,
    id_estado_inscripcion: 15,
    id_metodo_pago: null,
    apuntadoFecha: "2026-10-18T00:00:00.000Z",
    fechaPago: null,
    comentario: null,
    createAt: "2026-10-18T00:00:00.000Z",
    updateAt: "2026-10-18T00:00:00.000Z",
    posicionEspera: null,
    plazasOcupadas: 0,
    plazasDisponibles: null,
    aforo: null,
    puedePromocionar: false,
    Usuario: { id_usuario: id, nombre, apellido1: null, apellido2: null },
    Actividad: { id_actividad: 1, titulo: "Taller" },
  };
}

const lista = [fila(4, "Ana"), fila(18, "Bruno"), fila(2, "Nuria")];

function comprobar(condicion: unknown, mensaje: string): asserts condicion {
  if (!condicion) throw new Error(mensaje);
}

function Pagina() {
  const [campo, setCampo] = useState<CampoOrdenInscripcion>("fecha");
  const [direccion, setDireccion] = useState<"asc" | "desc">("desc");
  const ordenadas = ordenarInscripciones(lista, campo, direccion);
  return (
    <InscripcionesTable
      inscripciones={ordenadas}
      campoOrden={campo}
      direccionOrden={direccion}
      onCambiarOrden={(siguiente) => {
        setDireccion(direccionAlOrdenar(siguiente, campo, direccion));
        setCampo(siguiente);
      }}
      estadosInscripcion={[{ id_estado_inscripcion: 15, nombre: "Activa" }]}
      estadosPago={[{ id_estado_pago: 11, nombre_estado: "Pendiente" }]}
    />
  );
}

const root = createRoot(document.getElementById("root")!);
flushSync(() => root.render(<Pagina />));

try {
  const boton = [...document.querySelectorAll("th button")].find((item) => item.textContent?.includes("Código")) as HTMLButtonElement;
  comprobar(boton, "Falta el botón de Código");
  comprobar(boton.textContent?.includes("▲") || boton.textContent?.includes("▼"), "Código muestra el triángulo");
  flushSync(() => boton.click());
  const codigos = [...document.querySelectorAll("tbody tr td:first-child")].map((celda) => celda.textContent?.trim());
  comprobar(codigos.join(",") === "18,4,2", `El código queda de mayor a menor: ${codigos.join(",")}`);
  const activo = [...document.querySelectorAll("th button")].find((item) => item.textContent?.includes("Código"));
  comprobar(activo?.textContent?.includes("▼"), "El triángulo apunta hacia abajo");
  document.getElementById("resultado")!.textContent = "PASS: Código en caja ordena de mayor a menor.";
} catch (error) {
  document.getElementById("resultado")!.textContent = `FAIL: ${error instanceof Error ? error.message : String(error)}`;
}
