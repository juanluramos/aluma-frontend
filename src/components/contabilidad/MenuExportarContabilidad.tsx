import { useEffect, useId, useRef, useState } from "react";
import iconoExportar from "../../assets/icons/navigation/exportar.webp";

type MenuExportarContabilidadProps = {
  deshabilitado: boolean;
  onDescargar: () => void;
  onImprimir: () => void;
};

export default function MenuExportarContabilidad({
  deshabilitado,
  onDescargar,
  onImprimir,
}: MenuExportarContabilidadProps) {
  const [abierto, setAbierto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!abierto) return undefined;
    function cerrarSiSale(evento: MouseEvent) {
      if (!raiz.current?.contains(evento.target as Node)) setAbierto(false);
    }
    function cerrarConEscape(evento: KeyboardEvent) {
      if (evento.key === "Escape") setAbierto(false);
    }
    document.addEventListener("mousedown", cerrarSiSale);
    document.addEventListener("keydown", cerrarConEscape);
    return () => {
      document.removeEventListener("mousedown", cerrarSiSale);
      document.removeEventListener("keydown", cerrarConEscape);
    };
  }, [abierto]);

  function elegir(accion: () => void) {
    setAbierto(false);
    accion();
  }

  return (
    <div className="contabilidad-exportar" ref={raiz}>
      <button
        type="button"
        className="contabilidad-exportar-boton"
        aria-label="Exportar"
        title="Exportar"
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-controls={menuId}
        disabled={deshabilitado}
        onClick={() => setAbierto((valor) => !valor)}
      >
        <img src={iconoExportar} alt="" />
      </button>
      {abierto ? (
        <div className="contabilidad-exportar-menu" id={menuId} role="menu">
          <button type="button" role="menuitem" onClick={() => elegir(onDescargar)}>Descargar PDF</button>
          <button type="button" role="menuitem" onClick={() => elegir(onImprimir)}>Imprimir</button>
        </div>
      ) : null}
    </div>
  );
}
