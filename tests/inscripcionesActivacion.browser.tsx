import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import InscripcionesPage from "../src/pages/InscripcionesPage";
import { session } from "../src/services/authService";

await session.login("test@example.test", "test");
createRoot(document.getElementById("root")!).render(<MemoryRouter><InscripcionesPage /></MemoryRouter>);
