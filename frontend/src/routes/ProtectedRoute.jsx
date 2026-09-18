import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, user } = useSelector((state) =>state.auth);

  if (!isAuthenticated) {
    <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    <Navigate to="/unauthorized" />;
  }
  return <Outlet />;
};
export default ProtectedRoute;
