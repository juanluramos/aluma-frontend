// Abrir /tests/confirmarEliminarUsuario.browser.html con Vite.
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import ConfirmarEliminarUsuario from '../src/components/usuarios/ConfirmarEliminarUsuario';
import type { Usuario } from '../src/services/usuarioService';

const usuario: Usuario = {
  id_usuario: 7,
  codUsuario: 'ALU07',
  id_tipo_documento: 1,
  numeroDocumento: '12345678Z',
  nombre: 'Ana',
  apellido1: 'García',
  apellido2: 'López',
  email: 'ana@example.test',
  telefono: null,
  socio: true,
  matriculaPagada: true,
  id_rol: 2,
  id_estado_usuario: 1,
  comentario: null,
  fechaInscripcion: '2026-01-15',
};

const root = createRoot(document.getElementById('root')!);

type Registro = { cancel: number; confirm: number };

const registro: Registro = { cancel: 0, confirm: 0 };

function comprobar(condicion: unknown, mensaje: string): asserts condicion {
  if (!condicion) throw new Error(mensaje);
}

function montar(props: {
  isOpen?: boolean;
  submitting?: boolean;
  error?: string | null;
  usuario?: Usuario | null;
}): void {
  flushSync(() => {
    root.render(
      <ConfirmarEliminarUsuario
        usuario={props.usuario === undefined ? usuario : props.usuario}
        isOpen={props.isOpen ?? true}
        submitting={props.submitting ?? false}
        error={props.error ?? null}
        onCancel={() => { registro.cancel += 1; }}
        onConfirm={() => { registro.confirm += 1; }}
      />,
    );
  });
}

function esperarEfectos(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function boton(texto: string): HTMLButtonElement {
  const encontrado = [...document.querySelectorAll('button')].find(
    (el) => el.textContent?.trim() === texto,
  );
  comprobar(encontrado, `No se encontró el botón "${texto}"`);
  return encontrado as HTMLButtonElement;
}

async function ejecutar(): Promise<void> {
  // Callbacks de botones
  registro.cancel = 0;
  registro.confirm = 0;
  montar({});
  boton('Cancelar').click();
  comprobar(registro.cancel === 1, 'Cancelar debe llamar onCancel');
  boton('Eliminar definitivamente').click();
  comprobar(registro.confirm === 1, 'Confirmar debe llamar onConfirm');

  // Submitting: botones deshabilitados y texto
  registro.cancel = 0;
  registro.confirm = 0;
  montar({ submitting: true });
  await esperarEfectos();
  const cancelar = boton('Cancelar');
  const eliminando = boton('Eliminando...');
  comprobar(cancelar.disabled, 'Cancelar debe estar disabled');
  comprobar(eliminando.disabled, 'Confirmar debe estar disabled');
  cancelar.click();
  eliminando.click();
  comprobar(registro.cancel === 0, 'Cancelar no debe disparar durante submitting');
  comprobar(registro.confirm === 0, 'Confirmar no debe disparar durante submitting');

  // Cierre por overlay bloqueado
  registro.cancel = 0;
  const overlay = document.querySelector('.modal-overlay');
  comprobar(overlay, 'Debe existir overlay');
  overlay.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  comprobar(registro.cancel === 0, 'Overlay no cierra durante submitting');

  // Cierre por Escape bloqueado
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  comprobar(registro.cancel === 0, 'Escape no cierra durante submitting');

  // Cierre por botón × bloqueado
  const cerrar = document.querySelector('.modal-close') as HTMLButtonElement | null;
  comprobar(cerrar, 'Debe existir botón de cierre');
  cerrar.click();
  comprobar(registro.cancel === 0, 'El aspa no cierra durante submitting');

  // Sin submitting, Escape sí cancela
  montar({ submitting: false });
  await esperarEfectos();
  registro.cancel = 0;
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  comprobar(registro.cancel === 1, 'Escape debe cancelar sin submitting');

  // Error visible
  montar({ error: 'Usuario no encontrado' });
  const alerta = document.querySelector('[role="alert"]');
  comprobar(alerta?.textContent?.includes('Usuario no encontrado'), 'Debe mostrar el error');
}

try {
  await ejecutar();
  document.getElementById('resultado')!.textContent =
    'PASS: ConfirmarEliminarUsuario callbacks, submitting y cierre bloqueado.';
} catch (error) {
  document.getElementById('resultado')!.textContent = `FAIL: ${String(error)}`;
}
