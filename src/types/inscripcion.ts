export interface InscripcionUsuario {
  id_usuario: number;
  nombre: string;
  apellido1: string | null;
  apellido2: string | null;
}

export interface InscripcionActividad {
  id_actividad: number;
  titulo: string;
}

export interface Inscripcion {
  id_inscripcion: number;
  id_usuario: number;
  id_actividad: number;
  precioAplicado: string | null;
  id_estado_pago: number;
  id_estado_inscripcion: number;
  id_metodo_pago: number | null;
  apuntadoFecha: string;
  fechaPago: string | null;
  comentario: string | null;
  createAt: string;
  updateAt: string;
  posicionEspera: number | null;
  plazasOcupadas: number;
  plazasDisponibles: number | null;
  aforo: number | null;
  puedePromocionar: boolean;
  Usuario: InscripcionUsuario | null;
  Actividad: InscripcionActividad | null;
}
