import { useDispatch } from "react-redux";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FaBoxOpen,
  FaChartLine,
  FaClipboardList,
  FaSignOutAlt,
  FaTimes,
} from "react-icons/fa";
import { logout } from "../redux/slices/authSlice.js";
import { clearCart } from "../redux/slices/cartSlice.js";

const navigationItems = [
  {
    label: "Overview",
    to: "/vendor/dashboard",
    icon: FaChartLine,
    isCurrent: (pathname) => pathname === "/vendor/dashboard",
  },
  {
    label: "Products",
    to: "/vendor/products",
    icon: FaBoxOpen,
    isCurrent: (pathname) =>
      pathname.startsWith("/vendor/products") &&
      pathname !== "/vendor/products/add",
  },
  {
    label: "Orders",
    to: "/vendor/orders",
    icon: FaClipboardList,
    isCurrent: (pathname) => pathname.startsWith("/vendor/orders"),
  },
];

function VendorSidebar({ mobileOpen, onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");
    dispatch(logout());
    dispatch(clearCart());
    onClose();
    navigate("/");
  };

  const renderNavigation = () => (
    <nav aria-label="Vendor navigation" className="space-y-1 px-3">
      {navigationItems.map(({ label, to, icon: Icon, isCurrent }) => {
        const selected = isCurrent(pathname);

        return (
          <NavLink
            key={to}
            to={to}
            end
            onClick={onClose}
            aria-current={selected ? "page" : undefined}
            className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
              selected
                ? "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-100"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Icon
              className={`shrink-0 ${
                selected
                  ? "text-blue-700"
                  : "text-slate-400 group-hover:text-slate-600"
              }`}
              aria-hidden="true"
            />
            <span>{label}</span>
          </NavLink>
        );
      })}
    </nav>
  );

  const sidebarContent = (
    <>
      <div className="flex h-[76px] items-center border-b border-slate-100 px-6">
        <NavLink
          to="/vendor/dashboard"
          onClick={onClose}
          aria-label="E-Shop vendor dashboard"
          className="text-3xl font-extrabold tracking-tight text-slate-900"
        >
          E-Shop<span className="text-amber-400">.</span>
        </NavLink>
      </div>

      <div className="mb-3 mt-8 px-6 text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
        Workspace
      </div>
      {renderNavigation()}

      <div className="mt-3 border-t border-slate-100 p-4">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600"
        >
          <FaSignOutAlt aria-hidden="true" />
          Log out
        </button>
      </div>
    </>
  );

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close vendor navigation"
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/40"
          />
          <aside className="relative flex h-full w-[min(18rem,85vw)] flex-col bg-white shadow-2xl">
            <div className="absolute right-3 top-5 z-10">
              <button
                type="button"
                onClick={onClose}
                aria-label="Close vendor navigation"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                <FaTimes aria-hidden="true" />
              </button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}

export default VendorSidebar;
