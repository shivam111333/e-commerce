import { Routes, Route } from "react-router-dom";

// Layouts
import AdminLayout from "../Layouts/AdminLayout.jsx"
import VendorLayout from "../Layouts/VendorLayout.jsx";
import CustomerLayout from "../Layouts/CustomerLayout.jsx";

// Customer
import Home from "../pages/Customer/Home.jsx";
import Products from "../pages/Customer/Product.jsx";
import ProductDeatils from "../component/ProductDetails.jsx";
import Cart from "../pages/Customer/Cart.jsx";
import Checkout from "../pages/Customer/Checkout.jsx";
import Order from "../pages/Customer/Orders.jsx";

// Auth
import Login from "../pages/auth/Login.jsx";
import Register from "../pages/auth/Register.jsx";

// Admin
import AdminDashboard from "../pages/admin/AdminDashboard.jsx";

// Vendor
import VendorDashboard from "../pages/vendor/VendorDashboard.jsx";
import VendorProducts from "../pages/vendor/VendorProducts.jsx";
import AddProduct from "../pages/vendor/AddProduct";
import AddVariant from "../pages/vendor/AddVariant.jsx";
import EditProduct from "../pages/vendor/EditProduct";
import VendorProductView from "../pages/vendor/VendorProductView.jsx";
import EditVariant from "../pages/vendor/EditVariant.jsx";
import VendorOrders from "../pages/vendor/VendorOrders.jsx";

// Other
import ProtectedRoute from "./ProtectedRoute.jsx";
import Unauthorized from "../pages/Unauthorized.jsx";


function AppRoutes() {
  return (
    <Routes>

      {/* ================= CUSTOMER ================= */}

      <Route element={<CustomerLayout />}>

        <Route path="/" element={<Home />} />

        <Route
          path="/products"
          element={<Products />}
        />

        <Route
          path="/product/:id"
          element={<ProductDeatils />}
        />

        <Route
          path="/cart"
          element={<Cart />}
        />

        <Route
          path="/checkout"
          element={<Checkout />}
        />

        <Route
          path="/orders"
          element={<Order />}
        />

      </Route>


      {/* ================= AUTH ================= */}

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      <Route
        path="/unauthorized"
        element={<Unauthorized />}
      />


      {/* ================= ADMIN ================= */}

      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>

        <Route element={<AdminLayout />}>

          <Route
            path="/admin/dashboard"
            element={<AdminDashboard />}
          />

        </Route>

      </Route>


      {/* ================= VENDOR ================= */}

      <Route element={<ProtectedRoute allowedRoles={["vendor"]} />}>

        <Route element={<VendorLayout />}>

          <Route
            path="/vendor/dashboard"
            element={<VendorDashboard />}
          />

          <Route
            path="/vendor/products"
            element={<VendorProducts />}
          />

          <Route
            path="/vendor/products/:id"
            element={<VendorProductView />}
          />

          <Route
            path="/vendor/products/add"
            element={<AddProduct />}
          />

          <Route
            path="/vendor/products/:id/add-variant"
            element={<AddVariant />}
          />

          <Route
            path="/vendor/products/:id/edit"
            element={<EditProduct />}
          />

          <Route
            path="/vendor/variants/:id/edit"
            element={<EditVariant />}
          />

          <Route
            path="/vendor/orders"
            element={<VendorOrders />}
          />

        </Route>

      </Route>

    </Routes>
  );
}

export default AppRoutes;