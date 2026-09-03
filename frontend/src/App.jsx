/**
 * @module App
 * @description Componente raíz. Envuelve la app en el AuthProvider
 *              y delega el routing a AppRouter.
 */
import { AuthProvider } from './context/AuthContext';
import AppRouter from './routes/AppRouter';

const App = () => (
  <AuthProvider>
    <AppRouter />
  </AuthProvider>
);

export default App;
