import { lazy } from "react";
import PermissionRoute from "./components/auth/PermissionRoute";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./components/auth/ProtectedRoute";

import Layout from "./components/layout/Layout";

import LoginPage from "./pages/LoginPage";

const PerfilPage = lazy(() => import("./pages/PerfilPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const UsuariosPage = lazy(() => import("./pages/UsuariosPage"));
const ActividadesPage = lazy(() => import("./pages/ActividadesPage"));
const InscripcionesPage = lazy(() => import("./pages/InscripcionesPage"));
const ContabilidadPage = lazy(() => import("./pages/ContabilidadPage"));
const CuotasPage = lazy(() => import("./pages/CuotasPage"));
const ConfiguracionPage = lazy(() => import("./pages/ConfiguracionPage"));

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route element={<PermissionRoute permission="editarPerfil" />}>
            <Route path="/perfil" element={<PerfilPage />} />
          </Route>
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
          <Route path="/pagos" element={<Navigate to="/inscripciones" replace />} />
          <Route element={<PermissionRoute permission="verContabilidad" />}>
          <Route path="/contabilidad" element={<ContabilidadPage />} />
          </Route>
          <Route element={<PermissionRoute permission="verCuotas" />}>
          <Route path="/cuotas" element={<CuotasPage />} />
          </Route>
          <Route element={<PermissionRoute permission="gestionarConfiguracionCuota" />}>
          <Route path="/configuracion" element={<ConfiguracionPage />} />
          </Route>
        </Route>
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;
        