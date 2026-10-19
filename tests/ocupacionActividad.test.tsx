import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ActividadesTable from "../src/components/actividades/ActividadesTable.tsx";
import type { Actividad } from "../src/types/actividad.ts";
import { lineasPlazas } from "../src/utils/ocupacionActividad.ts";

function actividad(parcial: Partial<Actividad> = {}): Actividad {
  return {
    id_actividad: 1,
    titulo: "Taller",
    fecha: "2026-10-14T00:00:00.000Z",
    aforo: 20,
    plazasOcupadas: 0,
    plazasDisponibles: 20,
    personasEnEspera: 0,
    importeSocio: "0.00",
    importeNoSocio: "12.50",
    id_estado_actividad: 1,
    ...parcial,
  };
}

test("el listado muestra las plazas que devuelve el backend", () => {
  const sinInscripciones = lineasPlazas(actividad());
  assert.equal(sinInscripciones.ocupadas, "0/20");
  assert.equal(sinInscripciones.disponibles, "20");
  assert.equal(sinInscripciones.espera, "0");
  assert.equal(sinInscripciones.completa, false);

  const ilimitada = lineasPlazas(actividad({
    aforo: null,
    plazasOcupadas: 18,
    plazasDisponibles: null,
  }));
  assert.equal(ilimitada.ocupadas, "18 / Sin límite");
  assert.equal(ilimitada.disponibles, "Sin límite");
  assert.equal(ilimitada.espera, "0");
  assert.equal(ilimitada.completa, false);

  const libre = lineasPlazas(actividad({ plazasOcupadas: 18, plazasDisponibles: 2 }));
  assert.equal(libre.ocupadas, "18/20");
  assert.equal(libre.disponibles, "2");

  const completa = lineasPlazas(actividad({ plazasOcupadas: 20, plazasDisponibles: 0 }));
  assert.equal(completa.ocupadas, "20/20");
  assert.equal(completa.completa, true);

  const espera = lineasPlazas(actividad({ personasEnEspera: 4, plazasDisponibles: 20 }));
  assert.equal(espera.espera, "4");
  assert.equal(espera.hayEspera, true);

  const historico = lineasPlazas(actividad({ plazasOcupadas: 25, plazasDisponibles: 0, personasEnEspera: 1 }));
  assert.equal(historico.ocupadas, "25/20");
  assert.equal(historico.disponibles, "0");
  assert.equal(historico.completa, true);
  assert.equal(historico.espera, "1");
});

test("la tabla destaca el aforo completo y la lista de espera", () => {
  const html = renderToStaticMarkup(createElement(ActividadesTable, {
    actividades: [
      actividad({ id_actividad: 1, titulo: "Vacía", plazasOcupadas: 0, plazasDisponibles: 20 }),
      actividad({ id_actividad: 2, titulo: "Libre", plazasOcupadas: 18, plazasDisponibles: 2 }),
      actividad({ id_actividad: 3, titulo: "Llena", plazasOcupadas: 20, plazasDisponibles: 0, personasEnEspera: 4 }),
      actividad({ id_actividad: 4, titulo: "Abierta", aforo: null, plazasOcupadas: 18, plazasDisponibles: null }),
      actividad({ id_actividad: 5, titulo: "Histórica", plazasOcupadas: 25, plazasDisponibles: 0 }),
    ],
    campoOrden: "titulo",
    direccionOrden: "asc",
    puedeEditar: true,
    onEditar: () => undefined,
    onCambiarOrden: () => undefined,
  }));

  assert.match(html, />Ocupadas</);
  assert.match(html, />Disponibles</);
  assert.match(html, />En espera</);
  assert.match(html, />0\/20</);
  assert.match(html, />18\/20</);
  assert.match(html, />2</);
  assert.match(html, />20\/20</);
  assert.match(html, />4</);
  assert.match(html, />18 \/ Sin límite</);
  assert.match(html, />Sin límite</);
  assert.match(html, />0</);
  assert.match(html, />25\/20</);
  assert.match(html, /actividades-plazas-completas/);
  assert.match(html, /actividades-plazas-con-espera/);
  assert.match(html, /actividades-sort-button">Actividad/);
  assert.match(html, /actividades-sort-button">Fecha/);
  assert.match(html, /Editar Vacía/);
});
