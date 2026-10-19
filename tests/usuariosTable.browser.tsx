// Abrir /tests/usuariosTable.browser.html con Vite. No conecta con la API.
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import UsuariosTable from '../src/components/usuarios/UsuariosTable';
import type { Usuario } from '../src/services/usuarioService';
import type { CampoOrden } from '../src/utils/usuariosListado';

const usuarioA: Usuario = {
  id_usuario: 1, codUsuario: 'ALU-A', id_tipo_documento: 1,
  numeroDocumento: '12345678Z', nombre: 'Ana', apellido1: 'García', apellido2: null,
  email: 'ana@example.test', telefono: null, socio: true, matriculaPagada: true,
  id_rol: 2, id_estado_usuario: 1, comentario: null, fechaInscripcion: '2026-01-15',
};

const usuarioB: Usuario = {
  ...usuarioA,
  id_usuario: 2, codUsuario: 'ALU-B', nombre: 'Bruno', apellido1: 'Martín',
  email: 'bruno@example.test', id_rol: 1, id_estado_usuario: 2, socio: false,
};

const root = createRoot(document.getElementById('root')!);

type Registro = {
  editar: Usuario[];
  orden: CampoOrden[];
};

const registro: Registro = { editar: [], orden: [] };

// Leer de nuevo evita conservar el estrechamiento anterior a limpiarRegistro().
function numeroEdiciones(): number {
  return registro.editar.length;
}

function limpiarRegistro(): void {
  registro.editar = [];
  registro.orden = [];
}

type PropsTabla = {
  usuarios?: Usuario[];
  loading?: boolean;
  puedeEditar?: boolean;
};

function montar(props: PropsTabla = {}): void {
  flushSync(() => {
    root.render(
      <UsuariosTable
        usuarios={props.usuarios ?? [usuarioA, usuarioB]}
        loading={props.loading ?? false}
        campoOrden="nombre"
        direccionOrden="asc"
        puedeEditar={props.puedeEditar ?? true}
        onCambiarOrden={(campo) => { registro.orden.push(campo); }}
        onEditar={(usuario) => { registro.editar.push(usuario); }}
      />,
    );
  });
}

function comprobar(condicion: unknown, mensaje: string): asserts condicion {
  if (!condicion) throw new Error(mensaje);
}

function filaDe(usuario: Usuario): HTMLTableRowElement {
  const filas = [...document.querySelectorAll('tbody tr.usuarios-table-row')] as HTMLTableRowElement[];
  const fila = filas.find(tr => tr.textContent?.includes(usuario.codUsuario ?? ''));
  comprobar(fila, `No se encontró la fila de ${usuario.codUsuario}`);
  return fila;
}

function celda(fila: HTMLTableRowElement, indice: number): HTMLTableCellElement {
  const td = fila.cells[indice];
  comprobar(td, `Falta la celda ${indice}`);
  return td;
}

function ejecutar(): void {
  // Loading y vacío
  montar({ loading: true, usuarios: [] });
  comprobar(document.body.textContent?.includes('Cargando usuarios...'), 'Debe mostrar carga');
  montar({ loading: false, usuarios: [] });
  comprobar(document.body.textContent?.includes('No se han encontrado usuarios.'), 'Debe mostrar vacío');

  // Fila editable → onEditar
  limpiarRegistro();
  montar({ puedeEditar: true });
  const filaA = filaDe(usuarioA);
  flushSync(() => celda(filaA, 1).click());
  comprobar(numeroEdiciones() === 1, 'Clic en fila debe llamar onEditar una vez');
  comprobar(registro.editar[0]?.id_usuario === usuarioA.id_usuario, 'onEditar recibe el usuario de la fila');

  // Rol: solo etiqueta, sin select
  comprobar(!document.querySelector('select.rol-select'), 'El rol no debe ser desplegable en la tabla');
  comprobar(document.querySelector('.rol-etiqueta'), 'El rol se muestra como etiqueta');

  // Activo: indicador de solo lectura
  comprobar(!document.querySelector('.estado-checkbox'), 'No debe haber checkbox de estado');
  comprobar(!document.querySelector('input[type="checkbox"]'), 'Activo no es editable en la tabla');
  comprobar(filaDe(usuarioA).querySelector('.estado-indicador-activo'), 'Ana muestra indicador activo');
  comprobar(
    filaDe(usuarioB).querySelector('.estado-indicador') &&
      !filaDe(usuarioB).querySelector('.estado-indicador-activo'),
    'Bruno muestra indicador inactivo',
  );

  // Clic en activo también abre edición (toda la fila)
  limpiarRegistro();
  flushSync(() => celda(filaDe(usuarioB), 7).click());
  comprobar(numeroEdiciones() === 1 && registro.editar[0]?.id_usuario === usuarioB.id_usuario, 'Clic en activo abre edición');

  // Clic en rol abre edición
  limpiarRegistro();
  flushSync(() => celda(filaDe(usuarioB), 6).click());
  comprobar(numeroEdiciones() === 1 && registro.editar[0]?.id_usuario === usuarioB.id_usuario, 'Clic en rol abre edición');

  // Sin columna Eliminar
  comprobar(!document.body.textContent?.includes('Eliminar'), 'La tabla no tiene columna Eliminar');
  comprobar(!document.querySelector('.usuarios-eliminar-button'), 'Sin botón Eliminar en la tabla');

  // Cabeceras de ordenación
  limpiarRegistro();
  montar();
  const botones = [...document.querySelectorAll('.usuarios-sort-button')] as HTMLButtonElement[];
  comprobar(botones.length === 3, 'Debe haber tres botones de ordenación');
  flushSync(() => botones[0]!.click());
  flushSync(() => botones[1]!.click());
  flushSync(() => botones[2]!.click());
  comprobar(registro.orden.length === 3, 'Cada cabecera debe llamar onCambiarOrden');
  comprobar(registro.orden[0] === 'fechaInscripcion' && registro.orden[1] === 'codigo' && registro.orden[2] === 'nombre', 'Orden correcto de campos');
  comprobar(numeroEdiciones() === 0, 'Ordenar no debe llamar onEditar');

  // Loading/vacío con 8 columnas
  montar({ loading: true, usuarios: [] });
  comprobar(document.querySelector('td[colspan="9"]'), 'Loading usa colSpan 9');
  montar({ loading: false, usuarios: [] });
  comprobar(document.querySelector('td[colspan="9"]'), 'Vacío usa colSpan 9');
}

try {
  ejecutar();
  document.getElementById('resultado')!.textContent =
    'PASS: onEditar, rol/activo solo lectura, sin Eliminar en tabla, ordenación, loading/vacío.';
} catch (error) {
  document.getElementById('resultado')!.textContent = `FAIL: ${String(error)}`;
} finally {
  root.unmount();
}
