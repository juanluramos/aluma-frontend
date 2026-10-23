import { Suspense, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import './Layout.css';
import Header from "./Header";
import Sidebar from "./Sidebar";

const CONSULTA_MOVIL = "(max-width: 700px)";

function Layout() {
  const location = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [movil, setMovil] = useState(() => window.matchMedia(CONSULTA_MOVIL).matches);

  useEffect(() => {
    const media = window.matchMedia(CONSULTA_MOVIL);
    const actualizar = () => setMovil(media.matches);
    actualizar();
    media.addEventListener("change", actualizar);
    return () => media.removeEventListener("change", actualizar);
  }, []);

  useEffect(() => {
    setMenuAbierto(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuAbierto) return;
    const cerrar = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuAbierto(false);
    };
    document.addEventListener("keydown", cerrar);
    return () => document.removeEventListener("keydown", cerrar);
  }, [menuAbierto]);

  return (
    <div className={`layout${menuAbierto ? " menu-abierto" : ""}`}>
      <button
        type="button"
        className="menu-overlay"
        aria-label="Cerrar menú"
        tabIndex={menuAbierto && movil ? 0 : -1}
        onClick={() => setMenuAbierto(false)}
      />
      <Sidebar oculto={movil && !menuAbierto} onCerrar={() => setMenuAbierto(false)} />

      <div className="layout-content">
        <Header menuAbierto={menuAbierto} onMenu={() => setMenuAbierto(abierto => !abierto)} />

        <main>
          <Suspense fallback={<p role="status">Cargando página…</p>}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default Layout;