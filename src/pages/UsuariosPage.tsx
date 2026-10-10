import { hasPermission } from '../auth/permissions';
import { useRole } from '../auth/useRole';
import { useEffect, useState } from 'react';
import './UsuariosPage.css';
import UsuarioFormModal from "../components/usuarios/UsuarioFormModal";
import usuariosIcono from '../assets/icons/navigation/usuarios_icono.webp';
import activosIcono from '../assets/icons/navigation/activos_icono.webp';
import pendientesIcono from '../assets/icons/navigation/pendientes_icono.webp';
import buscarIcono from '../assets/icons/navigation/buscar.webp';
import exportarIcono from '../assets/icons/navigation/exportar.webp';
import listaSociosIcono from '../assets/icons/navigation/usuarios-rojo.webp';


import {
  getUsuarios,
  updateUsuarioEstado,
  updateUsuarioRol,
  type Usuario,
} from '../services/usuarioService';

type CampoOrden = 'codigo' | 'nombre';
type DireccionOrden = 'asc' | 'desc';

function normalizarBusqueda(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .trim();
}

function UsuariosPage() {
  const role = useRole();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('activo');
  const [socioFiltro, setSocioFiltro] = useState('');
  const [nuevoUsuarioOpen, setNuevoUsuarioOpen] = useState(false);
  
  const [campoOrden, setCampoOrden] = useState<CampoOrden>('nombre');

  const [direccionOrden, setDireccionOrden] = useState<DireccionOrden>('asc');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUsuarios = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await getUsuarios();

        setUsuarios(data);
      } catch (error) {
        console.error('Error al cargar usuarios:', error);

        setError('No se han podido cargar los usuarios.');
      } finally {
        setLoading(false);
      }
    };

    loadUsuarios();
  }, []);

  function cambiarOrden(campo: CampoOrden) {
    if (campoOrden === campo) {
      setDireccionOrden((direccion) => (direccion === 'asc' ? 'desc' : 'asc'));

      return;
    }

    setCampoOrden(campo);
    setDireccionOrden('asc');
  }

  const handleEstadoChange = async (usuario: Usuario) => {
    if (!hasPermission(role, 'cambiarEstadoUsuario')) {
      return;
    }

    const nuevoEstado = usuario.id_estado_usuario === 1 ? 2 : 1;

    try {
      await updateUsuarioEstado(usuario.id_usuario, nuevoEstado);

      setUsuarios((prevUsuarios) =>
        prevUsuarios.map((item) =>
          item.id_usuario === usuario.id_usuario
            ? {
                ...item,
                id_estado_usuario: nuevoEstado,
              }
            : item,
        ),
      );
    } catch (error) {
      console.error('Error al cambiar el estado del usuario:', error);
    }
  };

  const handleRolChange = async (usuario: Usuario, nuevoRol: number) => {
    if (!hasPermission(role, 'editarUsuarios')) {
      return;
    }

    try {
      await updateUsuarioRol(usuario.id_usuario, nuevoRol);

      setUsuarios((prevUsuarios) =>
        prevUsuarios.map((item) =>
          item.id_usuario === usuario.id_usuario
            ? {
                ...item,
                id_rol: nuevoRol,
              }
            : item,
        ),
      );
    } catch (error) {
      console.error('Error al cambiar el rol del usuario:', error);
    }
  };

  if (loading) {
    return (
      <div className="usuarios-page">
        <p>Cargando usuarios...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="usuarios-page">
        <p>{error}</p>
      </div>
    );
  }

  const nombreCompleto = (usuario: Usuario) =>
    [usuario.nombre, usuario.apellido1, usuario.apellido2].filter(Boolean).join(' ');

  const prefijo = normalizarBusqueda(busqueda);

  const usuariosFiltrados = usuarios
    .filter((usuario) => socioFiltro === '' || usuario.socio === (socioFiltro === 'socio'))
    .filter(
      (usuario) =>
        estadoFiltro === '' || usuario.id_estado_usuario === (estadoFiltro === 'activo' ? 1 : 2),
    )
    .filter((usuario) => {
      if (prefijo === '') {
        return true;
      }

      const nombre = normalizarBusqueda(nombreCompleto(usuario));

      const codigo = normalizarBusqueda(usuario.codUsuario ?? '');

      return nombre.startsWith(prefijo) || codigo.startsWith(prefijo);
    })
    .sort((a, b) => {
      let valorA = '';
      let valorB = '';

      if (campoOrden === 'codigo') {
        valorA = a.codUsuario ?? '';
        valorB = b.codUsuario ?? '';
      }

      if (campoOrden === 'nombre') {
        valorA = nombreCompleto(a);
        valorB = nombreCompleto(b);
      }

      const resultado = valorA.localeCompare(valorB, 'es', {
        sensitivity: 'base',
        numeric: true,
      });

      return direccionOrden === 'asc' ? resultado : -resultado;
    });

  const totalUsuarios = usuarios.length;

  const totalActivos = usuarios.filter((usuario) => usuario.id_estado_usuario === 1).length;

  const totalPendientes = usuarios.filter((usuario) => !usuario.matriculaPagada).length;

  return (
    <div className="usuarios-page">
      {/* RESUMEN */}

      <section className="usuarios-stats">
        <div className="usuarios-stat">
          <div className="usuarios-stat-icon usuarios-stat-icon-red">
            <img src={usuariosIcono} alt="" aria-hidden="true" />
          </div>

          <div>
            <span className="usuarios-stat-label">Usuarios</span>

            <strong className="usuarios-stat-value">{totalUsuarios}</strong>
          </div>
        </div>

        <div className="usuarios-stat">
          <div className="usuarios-stat-icon usuarios-stat-icon-green">
            <img src={activosIcono} alt="" aria-hidden="true" />
          </div>

          <div>
            <span className="usuarios-stat-label">Activos</span>

            <strong className="usuarios-stat-value">{totalActivos}</strong>
          </div>
        </div>

        <div className="usuarios-stat">
          <div className="usuarios-stat-icon usuarios-stat-icon-yellow">
            <img src={pendientesIcono} alt="" aria-hidden="true" />
          </div>

          <div>
            <span className="usuarios-stat-label">Pendientes</span>

            <strong className="usuarios-stat-value">{totalPendientes}</strong>
          </div>
        </div>
      </section>

      {/* CABECERA DE LISTA */}

      <section className="usuarios-list-toolbar">
        <div className="usuarios-list-title">
          <div className="usuarios-list-title-icon">
            <img src={listaSociosIcono} alt="" aria-hidden="true" />
          </div>

          <div>
            <strong>Lista de socios</strong>

            <span>Mostrando {usuariosFiltrados.length} resultados</span>
          </div>
        </div>

        <div className="usuarios-list-actions">
          <div className="usuarios-search-wrapper">
            <img src={buscarIcono} alt="" aria-hidden="true" className="usuarios-search-icon" />

            <input
              type="text"
              aria-label="Buscar usuario"
              placeholder="Buscar usuario..."
              className="usuarios-search"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
            />
          </div>

          <select
            aria-label="Filtrar por estado"
            className="usuarios-filter"
            value={estadoFiltro}
            onChange={(event) => setEstadoFiltro(event.target.value)}
          >
            <option value="">Todos los estados</option>

            <option value="activo">Activo</option>

            <option value="inactivo">Inactivo</option>
          </select>

          <select
            aria-label="Filtrar por socio"
            className="usuarios-filter"
            value={socioFiltro}
            onChange={(event) => setSocioFiltro(event.target.value)}
          >
            <option value="">Todos</option>

            <option value="socio">Socios</option>

            <option value="no-socio">No socios</option>
          </select>

          <button type="button" className="usuarios-export-button">
            <img src={exportarIcono} alt="" aria-hidden="true" />
            Exportar
          </button>

          {hasPermission(role, 'crearUsuarios') && (
            <button
              type="button"
              className="usuarios-new-button"
              onClick={() => setNuevoUsuarioOpen(true)}
            >
              + Nuevo usuario
            </button>
          )}
        </div>
      </section>

      {/* TABLA */}

      <div className="usuarios-table-container">
        <table className="usuarios-table">
          <thead>
            <tr>
              <th
                aria-sort={
                  campoOrden === 'codigo'
                    ? direccionOrden === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                }
              >
                <button
                  type="button"
                  className="usuarios-sort-button"
                  onClick={() => cambiarOrden('codigo')}
                >
                  Código
                  <span
                    className={campoOrden === 'codigo' ? 'sort-icon active' : 'sort-icon'}
                    aria-hidden="true"
                  >
                    {campoOrden === 'codigo' && direccionOrden === 'desc' ? '▼' : '▲'}
                  </span>
                </button>
              </th>

              <th
                aria-sort={
                  campoOrden === 'nombre'
                    ? direccionOrden === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                }
              >
                <button
                  type="button"
                  className="usuarios-sort-button"
                  onClick={() => cambiarOrden('nombre')}
                >
                  Nombre
                  <span
                    className={campoOrden === 'nombre' ? 'sort-icon active' : 'sort-icon'}
                    aria-hidden="true"
                  >
                    {campoOrden === 'nombre' && direccionOrden === 'desc' ? '▼' : '▲'}
                  </span>
                </button>
              </th>

              <th>Email</th>
              <th>Teléfono</th>
              <th>Socio</th>
              <th>Matrícula</th>
              <th>Rol</th>
              <th>Estado</th>
            </tr>
          </thead>

          <tbody>
            {usuariosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  {usuarios.length === 0
                    ? 'No hay usuarios registrados.'
                    : 'No hay usuarios que coincidan con los filtros.'}
                </td>
              </tr>
            ) : (
              usuariosFiltrados.map((usuario) => (
                <tr key={usuario.id_usuario}>
                  <td>{usuario.codUsuario ?? '-'}</td>

                  <td>{nombreCompleto(usuario)}</td>

                  <td>{usuario.email}</td>

                  <td>{usuario.telefono ?? '-'}</td>

                  <td>{usuario.socio ? 'Sí' : 'No'}</td>

                  <td>{usuario.matriculaPagada ? 'Pagada' : 'Pendiente'}</td>

                  <td>
                    <select
                      className={`rol-select ${
                        usuario.id_rol === 3
                          ? 'rol-admin'
                          : usuario.id_rol === 2
                            ? 'rol-operador'
                            : 'rol-usuario'
                      }`}
                      value={usuario.id_rol}
                      onChange={(event) => handleRolChange(usuario, Number(event.target.value))}
                    >
                      <option value={1}>Usuario</option>

                      <option value={2}>Operador</option>

                      <option value={3}>Administrador</option>
                    </select>
                  </td>

                  <td>
                    {hasPermission(role, 'cambiarEstadoUsuario') ? (
                      <label className="estado-checkbox">
                        <input
                          type="checkbox"
                          checked={usuario.id_estado_usuario === 1}
                          onChange={() => handleEstadoChange(usuario)}
                        />

                        <span className="checkmark" />
                      </label>
                    ) : (
                      <span>{usuario.id_estado_usuario === 1 ? 'Activo' : 'Inactivo'}</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* MODAL NUEVO USUARIO */}

      <UsuarioFormModal
  isOpen={nuevoUsuarioOpen}
  onClose={() =>
    setNuevoUsuarioOpen(false)
  }
  onCreated={(usuarioCreado) => {
    setUsuarios((usuariosActuales) => [
      usuarioCreado,
      ...usuariosActuales,
    ]);
  }}
/>
    </div>
  );
}

export default UsuariosPage;
