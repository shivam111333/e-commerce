
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../redux/slices/authSlice";
import { clearCart } from "../redux/slices/cartSlice";

import {
  FaShoppingCart,
  FaUser,
  FaSearch,
  FaChevronDown,
} from "react-icons/fa";

function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const cartItems = useSelector((state) => state.cart.items);


  const [searchQuery, setSearchQuery] = useState("");
  const cartCount = cartItems.length;

  const handleSearchSubmit = (e) => {
    e.preventDefault();

    const query = searchQuery.trim();

    if (!query) return;

    navigate(`/products?search=${encodeURIComponent(query)}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    dispatch(logout());
    dispatch(clearCart());
    navigate("/");
  };
 
  

 return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ================= DESKTOP / MAIN NAVBAR ================= */}
        <div className="h-[72px] flex items-center gap-5">

          {/* ================= LOGO ================= */}
          <Link
            to="/"
            className="text-2xl font-extrabold tracking-tight text-slate-900 whitespace-nowrap"
          >
            E-Shop<span className="text-amber-400">.</span>
          </Link>

          {/* ================= SEARCH ================= */}
          <div className="flex-1 flex justify-center">
            <form
              onSubmit={handleSearchSubmit}
              className="hidden lg:flex relative w-full max-w-2xl"
            >
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="
                  w-full
                  h-11
                  pl-4
                  pr-11
                  rounded-xl
                  border
                  border-slate-200
                  bg-slate-50
                  text-sm
                  outline-none
                  transition
                  focus:border-blue-500
                  focus:ring-4
                  focus:ring-blue-100
                "
              />

              <button
                type="submit"
                className="
                  absolute
                  right-3
                  top-1/2
                  -translate-y-1/2
                  text-gray-400
                  hover:text-blue-600
                  transition
                "
              >
                <FaSearch size={14} />
              </button>
            </form>
          </div>

          {/* ================= RIGHT SIDE ================= */}
          <div className="flex items-center gap-5">

            {/* ================= CART ================= */}
          {user?.role === "user"   && <button type="button" aria-label="Open cart" className="relative rounded-lg p-2 text-slate-700 hover:bg-slate-100" onClick={()=>{
    navigate('/cart')
  }}>
  <FaShoppingCart className="text-xl" />

  {cartCount > 0 && (
    <span className="absolute -right-1 -top-1 min-w-5 h-5 rounded-full bg-amber-400 px-1 text-xs font-bold text-slate-900 flex items-center justify-center">
      {cartCount}
    </span>
  )}
</button>}

            {/* ================= AUTH ================= */}
            {!isAuthenticated ? (
              <div className="flex items-center gap-4">

                {/* Login */}
                <Link
                  to="/login"
                  className="
                    text-sm
                    font-medium
                    text-gray-700
                    hover:text-blue-600
                    transition
                    whitespace-nowrap
                  "
                >
                  Login
                </Link>

                {/* Register */}
                <Link
                  to="/register"
                  className="
                    bg-blue-600
                    text-white
                    px-4
                    py-2
                    rounded-lg
                    text-sm
                    font-medium
                    hover:bg-blue-700
                    transition
                    whitespace-nowrap
                  "
                >
                  Register
                </Link>
              </div>
            ) : (

              /* ================= ACCOUNT DROPDOWN ================= */
              <div className="relative group">

                <button
                  type="button"
                  className="
                    flex
                    items-center
                    gap-2
                    py-2
                    text-gray-700
                    hover:text-blue-600
                    transition
                  "
                >
                  <FaUser size={14} />

                  <span className="font-medium text-sm max-w-28 truncate">
                    {user?.name}
                  </span>

                  <FaChevronDown size={10} />
                </button>

                {/* Dropdown */}
                <div
                  className="
                    absolute
                    right-0
                    top-full
                    pt-2
                    invisible
                    opacity-0
                    translate-y-1
                    group-hover:visible
                    group-hover:opacity-100
                    group-hover:translate-y-0
                    transition-all
                    duration-200
                  "
                >
                  <div
                    className="
                      w-52
                      bg-white
                      border
                      border-gray-200
                      rounded-lg
                      shadow-lg
                      py-1
                      text-sm
                    "
                  >

                    

                    {/* Orders */}
                {user?.role === "user" && (  <Link
                      to="/orders"
                      className="
                        block
                        px-4
                        py-2.5
                        text-gray-700
                        hover:bg-gray-50
                        hover:text-blue-600
                        transition
                      "
                    >
                      My Orders
                    </Link>)}

                    {/* Vendor Dashboard */}
                    {user?.role === "vendor" && (
                      <Link
                        to="/vendor/dashboard"
                        className="
                          block
                          px-4
                          py-2.5
                          text-gray-700
                          hover:bg-gray-50
                          hover:text-blue-600
                          transition
                        "
                      >
                        Vendor Dashboard
                      </Link>
                    )}

                    {/* Admin Dashboard */}
                    {user?.role === "admin" && (
                      <Link
                        to="/admin/dashboard"
                        className="
                          block
                          px-4
                          py-2.5
                          text-gray-700
                          hover:bg-gray-50
                          hover:text-blue-600
                          transition
                        "
                      >
                        Admin Dashboard
                      </Link>
                    )}

                    <hr className="my-1 border-gray-100" />

                    {/* Logout */}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="
                        w-full
                        text-left
                        px-4
                        py-2.5
                        text-red-600
                        hover:bg-red-50
                        transition
                      "
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ================= MOBILE SEARCH ================= */}
        <div className="lg:hidden pb-3">
          <form
            onSubmit={handleSearchSubmit}
            className="relative"
          >
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="
                w-full
                h-10
                pl-4
                pr-11
                rounded-lg
                border
                border-gray-300
                text-sm
                outline-none
                focus:border-blue-500
                focus:ring-2
                focus:ring-blue-100
              "
            />

            <button
              type="submit"
              className="
                absolute
                right-3
                top-1/2
                -translate-y-1/2
                text-gray-400
                hover:text-blue-600
              "
            >
              <FaSearch size={14} />
            </button>
          </form>
        </div>

        <div className="hidden h-10 items-center gap-7 border-t border-slate-100 text-sm font-medium text-slate-600 md:flex">
          <Link to="/" className="hover:text-blue-700">Home</Link>
          <Link to="/products" className="hover:text-blue-700">All Products</Link>
          {user?.role === "user" && (
            <Link to="/orders" className="hover:text-blue-700">My Orders</Link>
          )}
          <span className="ml-auto text-xs font-normal text-slate-400">Everyday essentials, delivered with care</span>
        </div>

      </div>
    </nav>
  );
}


export default Navbar;
