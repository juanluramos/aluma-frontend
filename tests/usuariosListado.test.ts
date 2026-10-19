import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calcularEstadisticasUsuarios,
  eliminarUsuarioDeLista,
  filtrarUsuarios,
  nombreCompletoUsuario,
  normalizarBusqueda,
  ordenarUsuarios,
  reemplazarUsuarioEnLista,
} from '../src/utils/usuariosListado.ts';
import type { Usuario } from '../src/services/usuarioService.ts';

const base: Usuario = {
  id_usuario: 1,
  codUsuario: 'ALU01',
  id_tipo_documento: 1,
  numeroDocumento: '12345678Z',
  nombre: 'Ana',
  apellido1: 'García',
  apellido2: 'López',
  email: 'ana@example.test',
  telefono: null,
  socio: true,
  matriculaPagada: true,
  id_rol: 1,
  id_estado_usuario: 1,
  comentario: null,
  fechaInscripcion: '2026-01-15',
};

const usuarios: Usuario[] = [
  base,
  {
    ...base,
    id_usuario: 2,
    codUsuario: 'BRU02',
    nombre: 'Bruno',
    apellido1: 'Martín',
    apellido2: null,
    socio: false,
    id_estado_usuario: 2,
  },
  {
    ...base,
    id_usuario: 3,
    codUsuario: 'CAR03',
    nombre: 'Carla',
    apellido1: 'Nuñez',
    apellido2: '',
    socio: true,
    id_estado_usuario: 1,
  },
];

const criteriosVacios = { busqueda: '', estado: '', socio: '' };

test('Normalización de mayúsculas', () => {
  assert.equal(normalizarBusqueda('ANA'), 'ana');
  assert.equal(normalizarBusqueda('AluMa'), 'aluma');
});

test('Eliminación de tildes', () => {
  assert.equal(normalizarBusqueda('García'), 'garcia');
  assert.equal(normalizarBusqueda('MUÑOZ'), 'munoz');
  assert.equal(normalizarBusqueda('José María'), 'jose maria');
});

test('Eliminación de espacios exteriores', () => {
  assert.equal(normalizarBusqueda('  ana  '), 'ana');
  assert.equal(normalizarBusqueda('\tBruno\n'), 'bruno');
});

test('Conservación de espacios interiores', () => {
  assert.equal(normalizarBusqueda('Ana  María'), 'ana  maria');
  assert.equal(normalizarBusqueda('  Juan Luis  '), 'juan luis');
});

test('Cadena vacía', () => {
  assert.equal(normalizarBusqueda(''), '');
  assert.equal(normalizarBusqueda('   '), '');
});

test('nombreCompletoUsuario une nombre y apellidos omitiendo vacíos', () => {
  assert.equal(nombreCompletoUsuario(usuarios[0]!), 'Ana García López');
  assert.equal(nombreCompletoUsuario(usuarios[1]!), 'Bruno Martín');
  assert.equal(nombreCompletoUsuario(usuarios[2]!), 'Carla Nuñez');
  assert.equal(nombreCompletoUsuario({ ...usuarios[0]!, nombre: 'ANA', apellido1: 'garcía', apellido2: 'LÓPEZ' }), 'Ana García López');
});

test('Búsqueda por nombre y código', () => {
  const porNombre = filtrarUsuarios(usuarios, { ...criteriosVacios, busqueda: 'bru' });
  assert.deepEqual(porNombre.map(u => u.id_usuario), [2]);

  const porCodigo = filtrarUsuarios(usuarios, { ...criteriosVacios, busqueda: 'car03' });
  assert.deepEqual(porCodigo.map(u => u.id_usuario), [3]);
});

test('Búsqueda sin tildes', () => {
  const conTildes = filtrarUsuarios(usuarios, { ...criteriosVacios, busqueda: 'ANA GARCÍA' });
  const sinTildes = filtrarUsuarios(usuarios, { ...criteriosVacios, busqueda: 'ana garcia' });
  assert.deepEqual(conTildes.map(u => u.id_usuario), [1]);
  assert.deepEqual(sinTildes.map(u => u.id_usuario), [1]);
});

test('Busca por nombre, primer apellido, segundo apellido y fragmentos sin tildes', () => {
  for (const busqueda of ['ana', 'garcia', 'LÓPEZ', 'rcia', '  lopez  ']) {
    assert.deepEqual(filtrarUsuarios(usuarios, { ...criteriosVacios, busqueda }).map(u => u.id_usuario), [1]);
  }
  assert.deepEqual(filtrarUsuarios(usuarios, { ...criteriosVacios, busqueda: 'martin' }).map(u => u.id_usuario), [2]);
  assert.deepEqual(filtrarUsuarios(usuarios, { ...criteriosVacios, busqueda: 'inexistente' }), []);
  assert.deepEqual(filtrarUsuarios(usuarios, { ...criteriosVacios, busqueda: 'LU0' }), []);
});

test('Filtros activo, pendiente, inactivo y todos', () => {
  assert.deepEqual(
    filtrarUsuarios(usuarios, { ...criteriosVacios, estado: 'activo' }).map(u => u.id_usuario),
    [1, 3],
  );
  assert.deepEqual(
    filtrarUsuarios(usuarios, { ...criteriosVacios, estado: 'inactivo' }).map(u => u.id_usuario),
    [2],
  );
  assert.deepEqual(
    filtrarUsuarios(
      [...usuarios, { ...base, id_usuario: 4, id_estado_usuario: 3 }],
      { ...criteriosVacios, estado: 'pendiente' },
    ).map(u => u.id_usuario),
    [4],
  );
  assert.deepEqual(
    filtrarUsuarios(usuarios, { ...criteriosVacios, estado: '' }).map(u => u.id_usuario),
    [1, 2, 3],
  );
});

test('Filtros socio, no socio y todos', () => {
  assert.deepEqual(
    filtrarUsuarios(usuarios, { ...criteriosVacios, socio: 'socio' }).map(u => u.id_usuario),
    [1, 3],
  );
  assert.deepEqual(
    filtrarUsuarios(usuarios, { ...criteriosVacios, socio: 'no-socio' }).map(u => u.id_usuario),
    [2],
  );
  assert.deepEqual(
    filtrarUsuarios(usuarios, { ...criteriosVacios, socio: '' }).map(u => u.id_usuario),
    [1, 2, 3],
  );
});

test('Combinaciones de filtros', () => {
  const resultado = filtrarUsuarios(usuarios, {
    busqueda: 'c',
    estado: 'activo',
    socio: 'socio',
  });
  assert.deepEqual(resultado.map(u => u.id_usuario), [1, 3]);

  const ninguno = filtrarUsuarios(usuarios, {
    busqueda: 'bru',
    estado: 'activo',
    socio: 'socio',
  });
  assert.deepEqual(ninguno, []);
});

test('Búsqueda vacía no restringe el listado', () => {
  const resultado = filtrarUsuarios(usuarios, { ...criteriosVacios, busqueda: '   ' });
  assert.deepEqual(resultado.map(u => u.id_usuario), [1, 2, 3]);
});

test('filtrarUsuarios no muta los datos originales', () => {
  const copia = structuredClone(usuarios);
  const resultado = filtrarUsuarios(usuarios, { busqueda: 'ana', estado: 'activo', socio: 'socio' });

  assert.deepEqual(usuarios, copia);
  assert.notEqual(resultado, usuarios);
  assert.equal(resultado.length, 1);
});

const paraOrden: Usuario[] = [
  { ...base, id_usuario: 10, codUsuario: 'A10', nombre: 'Óscar', apellido1: 'Pérez', apellido2: null },
  { ...base, id_usuario: 11, codUsuario: 'A2', nombre: 'Ángela', apellido1: 'Álvarez', apellido2: null },
  { ...base, id_usuario: 12, codUsuario: null, nombre: 'Bruno', apellido1: 'Martín', apellido2: null },
  { ...base, id_usuario: 13, codUsuario: 'B1', nombre: 'Carla', apellido1: 'Nuñez', apellido2: null },
];

test('Ordenación por nombre ascendente y descendente', () => {
  assert.deepEqual(
    ordenarUsuarios(paraOrden, 'nombre', 'asc').map(u => u.id_usuario),
    [11, 12, 13, 10],
  );
  assert.deepEqual(
    ordenarUsuarios(paraOrden, 'nombre', 'desc').map(u => u.id_usuario),
    [10, 13, 12, 11],
  );
});

test('Ordenación por fecha de inscripción compara el día, no el texto dd/mm/yyyy', () => {
  const porFecha: Usuario[] = [
    { ...base, id_usuario: 1, fechaInscripcion: '2026-02-01' },
    { ...base, id_usuario: 2, fechaInscripcion: '2026-01-15' },
    { ...base, id_usuario: 3, fechaInscripcion: '2025-12-31' },
  ];
  assert.deepEqual(ordenarUsuarios(porFecha, 'fechaInscripcion', 'asc').map(u => u.id_usuario), [3, 2, 1]);
  assert.deepEqual(ordenarUsuarios(porFecha, 'fechaInscripcion', 'desc').map(u => u.id_usuario), [1, 2, 3]);
});

test('Ordenación por código ascendente y descendente', () => {
  assert.deepEqual(
    ordenarUsuarios(paraOrden, 'codigo', 'asc').map(u => u.codUsuario),
    [null, 'A2', 'A10', 'B1'],
  );
  assert.deepEqual(
    ordenarUsuarios(paraOrden, 'codigo', 'desc').map(u => u.codUsuario),
    ['B1', 'A10', 'A2', null],
  );
});

test('Códigos con números: A2 antes que A10 con numeric: true', () => {
  const codigos = [
    { ...base, id_usuario: 1, codUsuario: 'A10' },
    { ...base, id_usuario: 2, codUsuario: 'A2' },
  ];
  assert.deepEqual(
    ordenarUsuarios(codigos, 'codigo', 'asc').map(u => u.codUsuario),
    ['A2', 'A10'],
  );
});

test('Nombres con tildes respetan sensitivity base', () => {
  const conTildes = [
    { ...base, id_usuario: 1, nombre: 'Óscar', apellido1: null, apellido2: null },
    { ...base, id_usuario: 2, nombre: 'Angela', apellido1: null, apellido2: null },
    { ...base, id_usuario: 3, nombre: 'Ángela', apellido1: null, apellido2: null },
  ];
  const ordenados = ordenarUsuarios(conTildes, 'nombre', 'asc').map(u => u.nombre);
  assert.deepEqual(ordenados.slice(0, 2).sort(), ['Angela', 'Ángela'].sort());
  assert.equal(ordenados.at(-1), 'Óscar');
});

test('Códigos nulos se tratan como cadena vacía y quedan primero en asc', () => {
  const conNulos = [
    { ...base, id_usuario: 1, codUsuario: 'Z9' },
    { ...base, id_usuario: 2, codUsuario: null },
    { ...base, id_usuario: 3, codUsuario: 'A1' },
  ];
  assert.deepEqual(
    ordenarUsuarios(conNulos, 'codigo', 'asc').map(u => u.id_usuario),
    [2, 3, 1],
  );
});

test('ordenarUsuarios no muta el array original', () => {
  const original = [...paraOrden];
  const copia = structuredClone(paraOrden);
  const resultado = ordenarUsuarios(paraOrden, 'nombre', 'desc');

  assert.deepEqual(paraOrden, copia);
  assert.notEqual(resultado, paraOrden);
  assert.deepEqual(paraOrden.map(u => u.id_usuario), original.map(u => u.id_usuario));
});

const paraEstadisticas: Usuario[] = [
  { ...base, id_usuario: 1, id_estado_usuario: 1, matriculaPagada: true },
  { ...base, id_usuario: 2, id_estado_usuario: 1, matriculaPagada: false },
  { ...base, id_usuario: 3, id_estado_usuario: 2, matriculaPagada: true },
  { ...base, id_usuario: 4, id_estado_usuario: 2, matriculaPagada: false },
];

test('Estadísticas con array vacío', () => {
  assert.deepEqual(calcularEstadisticasUsuarios([]), {
    total: 0,
    activos: 0,
    pendientes: 0,
  });
});

test('Estadísticas: total, activos e inactivos, pagadas y pendientes', () => {
  assert.deepEqual(calcularEstadisticasUsuarios(paraEstadisticas), {
    total: 4,
    activos: 2,
    pendientes: 2,
  });
});

test('Un usuario inactivo también puede tener matrícula pendiente', () => {
  const soloInactivoPendiente = paraEstadisticas.filter(
    u => u.id_estado_usuario === 2 && !u.matriculaPagada,
  );
  assert.equal(soloInactivoPendiente.length, 1);
  assert.deepEqual(calcularEstadisticasUsuarios(soloInactivoPendiente), {
    total: 1,
    activos: 0,
    pendientes: 1,
  });
});

test('Las estadísticas no dependen de los filtros aplicados', () => {
  const filtrados = filtrarUsuarios(paraEstadisticas, {
    busqueda: '',
    estado: 'activo',
    socio: '',
  });
  assert.equal(filtrados.length, 2);
  assert.deepEqual(calcularEstadisticasUsuarios(paraEstadisticas), {
    total: 4,
    activos: 2,
    pendientes: 2,
  });
  assert.notDeepEqual(
    calcularEstadisticasUsuarios(filtrados),
    calcularEstadisticasUsuarios(paraEstadisticas),
  );
});

test('calcularEstadisticasUsuarios no muta el array original', () => {
  const copia = structuredClone(paraEstadisticas);
  calcularEstadisticasUsuarios(paraEstadisticas);
  assert.deepEqual(paraEstadisticas, copia);
});

test('reemplazarUsuarioEnLista sustituye el usuario correcto y conserva el orden', () => {
  const lista = [
    { ...base, id_usuario: 1, nombre: 'Uno' },
    { ...base, id_usuario: 2, nombre: 'Dos' },
    { ...base, id_usuario: 3, nombre: 'Tres' },
  ];
  const actualizado = { ...lista[1]!, nombre: 'Dos Actualizado', id_rol: 3 };

  const resultado = reemplazarUsuarioEnLista(lista, actualizado);

  assert.deepEqual(resultado.map(u => u.id_usuario), [1, 2, 3]);
  assert.equal(resultado[1]?.nombre, 'Dos Actualizado');
  assert.equal(resultado[1]?.id_rol, 3);
  assert.equal(resultado[0]?.nombre, 'Uno');
  assert.equal(resultado[2]?.nombre, 'Tres');
});

test('reemplazarUsuarioEnLista con ID inexistente no inserta usuarios', () => {
  const lista = [
    { ...base, id_usuario: 1 },
    { ...base, id_usuario: 2 },
  ];
  const fantasma = { ...base, id_usuario: 99, nombre: 'Fantasma' };

  const resultado = reemplazarUsuarioEnLista(lista, fantasma);

  assert.equal(resultado.length, 2);
  assert.deepEqual(resultado.map(u => u.id_usuario), [1, 2]);
  assert.equal(resultado.some(u => u.id_usuario === 99), false);
});

test('reemplazarUsuarioEnLista no muta el array y conserva referencias no tocadas', () => {
  const lista = [
    { ...base, id_usuario: 1, nombre: 'Uno' },
    { ...base, id_usuario: 2, nombre: 'Dos' },
    { ...base, id_usuario: 3, nombre: 'Tres' },
  ];
  const copia = structuredClone(lista);
  const actualizado = { ...lista[1]!, nombre: 'Nuevo' };

  const resultado = reemplazarUsuarioEnLista(lista, actualizado);

  assert.deepEqual(lista, copia);
  assert.notEqual(resultado, lista);
  assert.equal(resultado[0], lista[0]);
  assert.equal(resultado[2], lista[2]);
  assert.notEqual(resultado[1], lista[1]);
  assert.equal(resultado[1], actualizado);
});

test('reemplazarUsuarioEnLista usa el objeto actualizado completo, sin fusionar', () => {
  const original = {
    ...base,
    id_usuario: 5,
    nombre: 'Original',
    email: 'original@example.test',
    socio: true,
    comentario: 'viejo',
  };
  const actualizado: Usuario = {
    ...base,
    id_usuario: 5,
    nombre: 'Nuevo',
    email: 'nuevo@example.test',
    socio: false,
    comentario: null,
    apellido1: null,
  };

  const [resultado] = reemplazarUsuarioEnLista([original], actualizado);

  assert.equal(resultado, actualizado);
  assert.equal(resultado?.comentario, null);
  assert.equal(resultado?.socio, false);
  assert.notEqual(resultado?.email, original.email);
});

test('eliminarUsuarioDeLista elimina el usuario correcto y conserva el orden', () => {
  const lista = [
    { ...base, id_usuario: 1, nombre: 'Uno' },
    { ...base, id_usuario: 2, nombre: 'Dos' },
    { ...base, id_usuario: 3, nombre: 'Tres' },
  ];

  const resultado = eliminarUsuarioDeLista(lista, 2);

  assert.deepEqual(resultado.map(u => u.id_usuario), [1, 3]);
  assert.equal(resultado[0]?.nombre, 'Uno');
  assert.equal(resultado[1]?.nombre, 'Tres');
});

test('eliminarUsuarioDeLista con ID inexistente conserva los mismos elementos', () => {
  const lista = [
    { ...base, id_usuario: 1 },
    { ...base, id_usuario: 2 },
  ];

  const resultado = eliminarUsuarioDeLista(lista, 99);

  assert.equal(resultado.length, 2);
  assert.deepEqual(resultado.map(u => u.id_usuario), [1, 2]);
  assert.notEqual(resultado, lista);
});

test('eliminarUsuarioDeLista con array vacío', () => {
  const resultado = eliminarUsuarioDeLista([], 1);
  assert.deepEqual(resultado, []);
});

test('eliminarUsuarioDeLista no muta el array y conserva referencias restantes', () => {
  const lista = [
    { ...base, id_usuario: 1, nombre: 'Uno' },
    { ...base, id_usuario: 2, nombre: 'Dos' },
    { ...base, id_usuario: 3, nombre: 'Tres' },
  ];
  const copia = structuredClone(lista);

  const resultado = eliminarUsuarioDeLista(lista, 2);

  assert.deepEqual(lista, copia);
  assert.notEqual(resultado, lista);
  assert.equal(resultado[0], lista[0]);
  assert.equal(resultado[1], lista[2]);
  assert.equal(resultado.some(u => u === lista[1]), false);
});
