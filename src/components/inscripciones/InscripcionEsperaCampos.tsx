import type { Inscripcion } from "../../types/inscripcion";
import { textoAforo, textoPosicion } from "../../utils/promocionInscripcion";

interface Props {
  inscripcion: Inscripcion;
}

export default function InscripcionEsperaCampos({ inscripcion }: Props) {
  return (
    <div className="usuario-form-grid">
      <div className="usuario-form-field">
        <label htmlFor="inscripcion-espera-estado">Estado</label>
        <input id="inscripcion-espera-estado" value="En espera" readOnly />
      </div>
      <div className="usuario-form-field">
        <label htmlFor="inscripcion-espera-posicion">Posición en la lista</label>
        <input id="inscripcion-espera-posicion" value={textoPosicion(inscripcion.posicionEspera)} readOnly />
      </div>
      <div className="usuario-form-field">
        <label htmlFor="inscripcion-espera-ocupadas">Plazas ocupadas</label>
        <input id="inscripcion-espera-ocupadas" value={String(inscripcion.plazasOcupadas)} readOnly />
      </div>
      <div className="usuario-form-field">
        <label htmlFor="inscripcion-espera-aforo">Aforo</label>
        <input id="inscripcion-espera-aforo" value={textoAforo(inscripcion.aforo)} readOnly />
      </div>
    </div>
  );
}
