import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import "../src/styles/variables.css";
import "../src/components/layout/Header.css";
import Header from "../src/components/layout/Header";
import PagosPage from "../src/pages/PagosPage";
import { session } from "../src/services/authService";

await session.login("test@example.test", "test");
createRoot(document.getElementById("root")!).render(
  <MemoryRouter initialEntries={["/pagos"]}>
    <Header />
    <PagosPage />
  </MemoryRouter>,
);
