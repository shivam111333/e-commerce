import AdminDashboard from "../pages/admin/AdminDashboard.jsx";
import { Routes, Route } from "react-router-dom";

import Home from "../pages/Customer/Home.jsx";

import Login from "../pages/auth/Login.jsx";
import Register from "../pages/auth/Register.jsx";
import ProductDeatils from "../component/ProductDetails.jsx";
import Products from "../pages/Customer/Product.jsx";

import VendorDashboard from "../pages/vendor/VendorDashboard.jsx";
import VendorProducts from "../pages/vendor/VendorProducts.jsx";
import AddProduct from "../pages/vendor/AddProduct";
import AddVariant from "../pages/vendor/AddVariant.jsx";
import EditProduct from "../pages/vendor/EditProduct";
import VendorProductView from "../pages/vendor/VendorProductView.jsx";
import EditVariant from '../pages/vendor/EditVariant.jsx'

import ProtectedRoute from "./ProtectedRoute.jsx";
import Unauthorized from "../pages/Unauthorized.jsx";
import Cart from "../pages/Customer/Cart.jsx";
import Checkout from "../pages/Customer/Checkout.jsx";
import Order from '../pages/Customer/Orders.jsx';
import VendorOrders from "../pages/vendor/VendorOrders.jsx";


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
          <Route path="/products" element={<Products />} />
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
            <Route path='/vendor/products/:id/edit' element={<EditProduct/>}/>
            <Route path="/vendor/variants/:id/edit" element={<EditVariant />}/>
            <Route path="/vendor/orders" element={<VendorOrders/>}/>
        </Route>

        <Route
          element={
            <ProtectedRoute allowedRoles={["user", "vendor", "admin"]} />}>
          <Route path="/cart" element={<Cart />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["user"]} />}>
  <Route path="/checkout" element={<Checkout />} />
  <Route path="/orders" element={<Order/>}/>
</Route>
      </Routes>
    </>
  );
}
export default AppRoutes;
