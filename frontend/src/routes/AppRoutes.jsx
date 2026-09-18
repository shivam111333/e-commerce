import AdminDashboard from "../pages/admin/AdminDashboard";
import { Routes, Route } from "react-router-dom";

import Home from "../pages/Customer/Home.jsx";

import Login from "../pages/auth/Login.jsx";
import Register from "../pages/auth/Register.jsx";
import ProductDeatils from "../component/ProductDetails.jsx";

import VendorDashboard from "../pages/vendor/VendorDashboard";

import ProtectedRoute from "./ProtectedRoute.jsx";
import Unauthorized from "../pages/Unauthorized.jsx";

function AppRoutes() {
  return (
    <>
      <Routes>
        <Route>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/product/:id" element={<ProductDeatils />} />
          <Route path='/unauthorized' element={<Unauthorized/>}/>
          
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin/dashboard/" element={<AdminDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["vendor"]} />}>
          <Route path="/vendor/dashboard/" element={<VendorDashboard />} />
        </Route>
      </Routes>
    </>
  );
}
export default AppRoutes;
