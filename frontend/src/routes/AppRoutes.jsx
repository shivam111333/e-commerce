import AdminDashboard from "../pages/admin/AdminDashboard.jsx";
import { Routes, Route } from "react-router-dom";

import Home from "../pages/Customer/Home.jsx";

import Login from "../pages/auth/Login.jsx";
import Register from "../pages/auth/Register.jsx";
import ProductDeatils from "../component/ProductDetails.jsx";

import VendorDashboard from "../pages/vendor/VendorDashboard.jsx";
import VendorProducts from "../pages/vendor/VendorProducts.jsx";
import AddProduct from "../pages/vendor/AddProduct";
import AddVariant from "../pages/vendor/AddVariant.jsx";

import ProtectedRoute from "./ProtectedRoute.jsx";
import Unauthorized from "../pages/Unauthorized.jsx";
import Cart from "../pages/Customer/Cart.jsx";
import VendorProductView from "../pages/vendor/VendorProductView.jsx";

function AppRoutes() {
  return (
    <>
      <Routes>
        <Route>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/product/:id" element={<ProductDeatils />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin/dashboard/" element={<AdminDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["vendor"]} />}>
          <Route path="/vendor/dashboard/" element={<VendorDashboard />} />
          <Route path="/vendor/products" element={<VendorProducts />} />
          <Route path="/vendor/products/:id" element={<VendorProductView/>}/> 
            <Route path="/vendor/products/add" element={<AddProduct />}/>
            <Route path="/vendor/products/:id/add-variant" element={<AddVariant />}/>
        </Route>

        <Route
          element={
            <ProtectedRoute allowedRoles={["user", "vendor", "admin"]} />}>
          <Route path="/cart" element={<Cart />} />
        </Route>
      </Routes>
    </>
  );
}
export default AppRoutes;
