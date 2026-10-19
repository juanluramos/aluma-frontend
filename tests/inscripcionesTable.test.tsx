import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import InscripcionesTable from "../src/components/inscripciones/InscripcionesTable.tsx";
import InscripcionesPage from "../src/pages/InscripcionesPage.tsx";
import type { Inscripcion } from "../src/types/inscripcion.ts";

function inscripcion(parcial: Partial<Inscripcion> = {}): Inscripcion {
  return {
    id_inscripcion: 4,
    id_usuario: 9,
    id_actividad: 12,
    precioAplicado: "25.00",
    id_estado_pago: 1,
    id_estado_inscripcion: 1,
    id_metodo_pago: null,
    apuntadoFecha: "2026-10-01T00:00:00.000Z",
    fechaPago: null,
    comentario: null,
    createAt: "2026-10-01T10:00:00.000Z",
    updateAt: "2026-10-01T10:00:00.000Z",
    posicionEspera: null,
    plazasOcupadas: 0,
    plazasDisponibles: null,
    aforo: null,
    puedePromocionar: false,
    Usuario: {
      id_usuario: 9,
      nombre: "Ana",
      apellido1: "García",
      apellido2: "López",
    },
    Actividad: {
      id_actividad: 12,
      titulo: "Taller de cerámica",
    },
    ...parcial,
  };
}

function htmlTabla(filas: Inscripcion[]): string {
  return renderToStaticMarkup(
    createElement(InscripcionesTable, { inscripciones: filas }),
  );
}

test("La página muestra el estado de carga antes de resolver el listado", () => {
  const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(InscripcionesPage)));
  assert.match(html, /Cargando inscripciones\.\.\./);
  assert.match(html, /Mostrando 0 resultados/);
  assert.doesNotMatch(html, /No hay inscripciones registradas/);
});

test("Solo quien puede editar abre la fila", () => {
  const bloqueada = htmlTabla([inscripcion()]);
  assert.doesNotMatch(bloqueada, /Editar inscripción/);
  assert.doesNotMatch(bloqueada, /tabindex/i);

  const html = renderToStaticMarkup(createElement(InscripcionesTable, {
    inscripciones: [inscripcion()],
    puedeEditar: true,
    onEditar: () => undefined,
  }));
  assert.match(html, /Editar inscripción de Ana García López/);
  assert.match(html, /inscripciones-row-editable/);
  assert.match(html, /tabindex="0"/);
});

test("La tabla muestra ids, precio y fecha de inscripción", () => {
  const html = htmlTabla([inscripcion()]);
  assert.match(html, />4</);
  assert.match(html, /Ana García López/);
  assert.match(html, /Taller de cerámica/);
  assert.doesNotMatch(html, />9</);
  assert.doesNotMatch(html, />12</);
  assert.match(html, /25\.00 €/);
  assert.match(html, /1\/10\/2026/);
});

test("Sin relación muestra un texto alternativo", () => {
  const html = htmlTabla([
    inscripcion({ Usuario: null, Actividad: null }),
  ]);
  assert.match(html, /Usuario no disponible/);
  assert.match(html, /Actividad no disponible/);
});

test("Un precio nulo se muestra como sin precio", () => {
  const html = htmlTabla([inscripcion({ precioAplicado: null })]);
  assert.match(html, /Sin precio/);
});

test("Los estados de inscripción salen del catálogo y un id ajeno queda desconocido", () => {
  const html = renderToStaticMarkup(createElement(InscripcionesTable, {
    inscripciones: [
      inscripcion({ id_inscripcion: 1, id_estado_inscripcion: 15, id_estado_pago: 1 }),
      inscripcion({ id_inscripcion: 2, id_estado_inscripcion: 16, id_estado_pago: 2 }),
      inscripcion({ id_inscripcion: 3, id_estado_inscripcion: 99, id_estado_pago: 3 }),
      inscripcion({ id_inscripcion: 4, id_estado_inscripcion: 16, id_estado_pago: 4 }),
    ],
    estadosInscripcion: [
      { id_estado_inscripcion: 15, nombre: "Activa" },
      { id_estado_inscripcion: 16, nombre: "Cerrada" },
    ],
  }));

  assert.match(html, /Activa/);
  assert.match(html, /Cerrada/);
  assert.match(html, /inscripciones-estado-activa/);
  assert.match(html, /inscripciones-estado-cerrada/);
  assert.match(html, /Pendiente/);
  assert.match(html, /Pagado/);
  assert.match(html, /Devolución/);
  assert.match(html, /Cancelado/);
  assert.match(html, /Desconocido/);
});

test("Sin catálogo de inscripción no se muestra Activa por un id fijo", () => {
  const html = htmlTabla([inscripcion({ id_estado_inscripcion: 1 })]);
  assert.match(html, /Desconocido/);
  assert.doesNotMatch(html, /Activa/);
});
