import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import './Layout.css';
import Header from "./Header";
import Sidebar from "./Sidebar";

function Layout() {

    
  return (
    <div className="layout">
      <Sidebar />

      <div className="layout-content">
        <Header />

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