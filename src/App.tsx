import PermissionRoute from "./components/auth/PermissionRoute";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import ProtectedRoute from "./components/auth/ProtectedRoute";

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

        <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route element={<PermissionRoute permission="verDashboard" />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          </Route>
          <Route element={<PermissionRoute permission="verUsuarios" />}>
          <Route path="/usuarios" element={<UsuariosPage />} />
          </Route>
          <Route element={<PermissionRoute permission="verActividades" />}>
          <Route path="/actividades" element={<ActividadesPage />} />
          </Route>
          <Route element={<PermissionRoute permission="verInscripciones" />}>
          <Route path="/inscripciones" element={<InscripcionesPage />} />
          </Route>
          <Route path="/pagos" element={<PagosPage />} />
          <Route element={<PermissionRoute permission="verContabilidad" />}>
          <Route path="/contabilidad" element={<ContabilidadPage />} />
          </Route>
        </Route>
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;
        