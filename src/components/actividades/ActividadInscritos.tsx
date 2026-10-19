import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getEstadosInscripcion, getEstadosPago } from "../../services/catalogoPagoService";
import { getInscripciones } from "../../services/inscripcionService";
import type { EstadoPagoCatalogo } from "../../types/catalogoPago";
import type { Inscripcion } from "../../types/inscripcion";
import { nombreEstadoPago } from "../../utils/estadoPagoInscripcion";
import { listasDeActividad, nombreInscrito } from "../../utils/inscritosActividad";
import "./ActividadInscritos.css";

interface ListaProps {
  inscripciones: Inscripcion[];
  espera: Inscripcion[];
  estadosPago: readonly EstadoPagoCatalogo[];
  onSeleccionar?: (inscripcion: Inscripcion) => void;
}

function textoTotal(total: number): string {
  return total === 1 ? "1 inscrito" : `${total} inscritos`;
}

function textoEspera(total: number): string {
  return total === 1 ? "1 en espera" : `${total} en espera`;
}

function textoPosicionEspera(inscripcion: Inscripcion): string {
  return inscripcion.posicionEspera == null ? "En espera" : `En espera · ${inscripcion.posicionEspera}`;
}

function FilaInscrito({
  inscripcion,
  detalle,
  detalleEspera = false,
  onSeleccionar,
}: {
  inscripcion: Inscripcion;
  detalle: string;
  detalleEspera?: boolean;
  onSeleccionar?: (inscripcion: Inscripcion) => void;
}) {
  const nombre = nombreInscrito(inscripcion.Usuario);
  const contenido = (
    <>
      <span>{nombre}</span>
      <span className={detalleEspera ? "actividad-inscritos-espera" : undefined}>{detalle}</span>
    </>
  );
  if (!onSeleccionar) return <li>{contenido}</li>;
  return (
    <li>
      <button
        type="button"
        className="actividad-inscritos-enlace"
        aria-label={`Ver inscripción de ${nombre}`}
        onClick={() => onSeleccionar(inscripcion)}
      >
        {contenido}
      </button>
    </li>
  );
}

export function ListaInscritos({ inscripciones, espera, estadosPago, onSeleccionar }: ListaProps) {
  return (
    <div className="actividad-inscritos-bloque">
      <div className="actividad-inscritos-scroll">
        <p className="actividad-inscritos-total">{textoTotal(inscripciones.length)}</p>
        {inscripciones.length === 0 ? (
          <p className="actividad-inscritos-mensaje">No hay usuarios inscritos.</p>
        ) : (
          <ul className="actividad-inscritos">
            {inscripciones.map((inscripcion) => (
              <FilaInscrito
                key={inscripcion.id_inscripcion}
                inscripcion={inscripcion}
                detalle={nombreEstadoPago(inscripcion.id_estado_pago, estadosPago)}
                onSeleccionar={onSeleccionar}
              />
            ))}
          </ul>
        )}
        <p className="actividad-inscritos-total actividad-inscritos-espera-titulo">Lista de espera</p>
        <p className="actividad-inscritos-total">{textoEspera(espera.length)}</p>
        {espera.length === 0 ? (
          <p className="actividad-inscritos-mensaje">No hay usuarios en lista de espera.</p>
        ) : (
          <ul className="actividad-inscritos" aria-label="Lista de espera">
            {espera.map((inscripcion) => (
              <FilaInscrito
                key={inscripcion.id_inscripcion}
                inscripcion={inscripcion}
                detalle={textoPosicionEspera(inscripcion)}
                detalleEspera
                onSeleccionar={onSeleccionar}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function ActividadInscritos({ idActividad }: { idActividad: number }) {
  const navigate = useNavigate();
  const [listas, setListas] = useState<{ inscritos: Inscripcion[]; espera: Inscripcion[] } | null>(null);
  const [estadosPago, setEstadosPago] = useState<EstadoPagoCatalogo[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    Promise.all([
      getInscripciones(),
      getEstadosPago().catch(() => [] as EstadoPagoCatalogo[]),
      getEstadosInscripcion().catch(() => []),
    ])
      .then(([lista, catalogo, estadosInscripcion]) => {
        if (!activo) return;
        const idEspera = estadosInscripcion.find((estado) => estado.nombre === "En espera")?.id_estado_inscripcion ?? null;
        setListas(listasDeActividad(lista, idActividad, catalogo, idEspera));
        setEstadosPago(catalogo);
      })
      .catch((causa) => {
        if (activo) setError(causa instanceof Error ? causa.message : "No se pudieron cargar los inscritos.");
      });
    return () => {
      activo = false;
    };
  }, [idActividad]);

  if (error) return <p className="actividad-inscritos-error" role="alert">{error}</p>;
  if (!listas) return <p className="actividad-inscritos-mensaje">Cargando inscritos...</p>;
  return (
    <ListaInscritos
      inscripciones={listas.inscritos}
      espera={listas.espera}
      estadosPago={estadosPago}
      onSeleccionar={(inscripcion) => {
        navigate("/inscripciones", { state: { abrirInscripcion: inscripcion.id_inscripcion } });
      }}
    />
  );
}
