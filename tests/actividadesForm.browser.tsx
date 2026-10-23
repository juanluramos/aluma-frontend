import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import '../src/styles/variables.css';
import ActividadesPage from '../src/pages/ActividadesPage';
import { session } from '../src/services/authService';

await session.login('test@example.test', 'test');
// El runner intercepta todas las peticiones: nunca se conecta con la API real.
createRoot(document.getElementById('root')!).render(
  <MemoryRouter>
    <ActividadesPage />
  </MemoryRouter>,
);
