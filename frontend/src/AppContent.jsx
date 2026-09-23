import {useLocation} from 'react-router-dom'
import Navbar from './component/Navbar';
import AppRoutes from './routes/AppRoutes';

function AppContent() {
  const location = useLocation();

  const hideNavbar =
    location.pathname === "/login" ||
    location.pathname === "/register" ||
     location.pathname.startsWith('/vendor') ||
     location.pathname.startsWith('/admin')

  return (
    <>
      {!hideNavbar && <Navbar />}

      <AppRoutes />
    </>
  );
}
export default AppContent