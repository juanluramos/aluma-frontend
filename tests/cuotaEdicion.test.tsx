import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import CuotaFormModal from "../src/components/cuotas/CuotaFormModal.tsx";
import type { Cuota } from "../src/services/cuotaService.ts";

function cuota(comentario: string | null): Cuota {
  return {
    id_cuota: 8,
    id_usuario: 15,
    pagoAnio: 2025,
    fechaPago: "2026-10-19",
    importePagado: "30.00",
    comentario,
    createAt: "2026-10-19T10:00:00.000Z",
    updateAt: "2026-10-19T10:00:00.000Z",
    Usuario: { id_usuario: 15, codUsuario: "ALU15", nombre: "Ana", apellido1: "García", apellido2: null },
  };
}

function modal(mode: "create" | "edit", actual?: Cuota): string {
  return renderToStaticMarkup(createElement(CuotaFormModal, {
    isOpen: true,
    mode,
    cuota: actual,
    onClose: () => undefined,
    onCreada: () => undefined,
    onActualizada: () => undefined,
  }));
}

test("el modal de edición precarga la cuota y el alta usa el mismo formulario", () => {
  const edicion = modal("edit", cuota("Nota inicial"));
  assert.match(edicion, /Cuotas/);
  assert.match(edicion, />Editar</);
  assert.doesNotMatch(edicion, /Guardar cambios/);
  assert.doesNotMatch(edicion, />Cancelar</);
  assert.match(edicion, /Socio/);
  assert.match(edicion, /Buscar socio\.\.\./);
  assert.match(edicion, /value="2025"/);
  assert.match(edicion, /value="2026-10-19"/);
  assert.match(edicion, /Ana García/);
  assert.match(edicion, /Nota inicial/);
  assert.match(edicion, />Eliminar cuota</);
  assert.doesNotMatch(edicion, /¿Eliminar la cuota/);
  assert.doesNotMatch(edicion, />Nueva cuota</);
  assert.doesNotMatch(edicion, /Guardar cuota/);

  const alta = modal("create");
  assert.match(alta, /Nueva cuota/);
  assert.match(alta, /Guardar cuota/);
  assert.doesNotMatch(alta, />Cancelar</);
  assert.doesNotMatch(alta, /Eliminar cuota/);
  assert.match(alta, /Socio/);
  assert.match(alta, /Buscar socio\.\.\./);
  assert.match(alta, /Selecciona un usuario|Cargando usuarios/);
  assert.doesNotMatch(alta, />Cuotas</);
  assert.doesNotMatch(alta, /Guardar cambios/);

  const sinComentario = modal("edit", cuota(null));
  assert.match(sinComentario, /Cuotas/);
  assert.doesNotMatch(sinComentario, /Nota inicial/);
  assert.match(sinComentario, /<textarea[^>]*><\/textarea>/);
});
