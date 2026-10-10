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
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;