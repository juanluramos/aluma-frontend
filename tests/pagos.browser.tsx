import { createRoot } from "react-dom/client";
import "../src/styles/variables.css";
import PagosPage from "../src/pages/PagosPage";
import { session } from "../src/services/authService";

await session.login("test@example.test", "test");
createRoot(document.getElementById("root")!).render(<PagosPage />);
