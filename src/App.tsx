import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/layout/Layout";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import UsuariosPage from "./pages/UsuariosPage";
import ActividadesPage from "./pages/ActividadesPage";
import InscripcionesPage from "./pages/InscripcionesPage";
import PagosPage from "./pages/PagosPage";
import ContabilidadPage from "./pages/ContabilidadPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/login" element={<LoginPage />} />

        <Route element={<Layout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/usuarios" element={<UsuariosPage />} />
          <Route path="/actividades" element={<ActividadesPage />} />
          <Route path="/inscripciones" element={<InscripcionesPage />} />
          <Route path="/pagos" element={<PagosPage />} />
          <Route path="/contabilidad" element={<ContabilidadPage />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;
        