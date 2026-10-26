import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  FaBars,
  FaList,
  FaMoneyBillWave,
  FaShoppingBag,
  FaStore,
  FaTachometerAlt,
  FaTimes,
  FaUser,
} from "react-icons/fa";
import { logout } from "../redux/slices/authSlice.js";
import { clearCart } from "../redux/slices/cartSlice.js";

const menuItems = [
  { name: "Dashboard", icon: FaTachometerAlt },
  { name: "Vendors", icon: FaStore },
  { name: "Customer", icon: FaUser },
  { name: "Categories", icon: FaList },
  { name: "Orders", icon: FaShoppingBag },
  { name: "Returns & Refunds", icon: FaMoneyBillWave },
];

function AdminSidebar({ activeSection, setActiveSection, mobileOpen, onClose }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogout = () => {
    localStorage.removeItem("token");
    dispatch(logout());
    dispatch(clearCart());
    onClose();
    navigate("/");
  };

  const navigation = (
    <>
      <nav aria-label="Admin navigation" className="space-y-1 px-3 py-5">
        {menuItems.map(({ name, icon: Icon }) => (
          <button
            key={name}
            type="button"
            onClick={() => {
              setActiveSection(name);
              onClose();
            }}
            aria-current={activeSection === name ? "page" : undefined}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
              activeSection === name
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Icon aria-hidden="true" className="shrink-0" />
            {name}
          </button>
        ))}
      </nav>
      <div className="mt-auto border-t border-slate-700 p-4">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-red-300 transition hover:bg-red-500/10 hover:text-red-200"
        >
          Log out
        </button>
      </div>
    </>
  );

  const sidebarHeader = (
    <div className="flex h-[76px] items-center justify-between border-b border-slate-700 px-6">
      <div>
        <div className="text-3xl font-extrabold tracking-tight text-white">
          E-Shop<span className="text-amber-400">.</span>
        </div>
        <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          Admin Panel
        </p>
      </div>
      {mobileOpen && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close admin navigation"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white lg:hidden"
        >
          <FaTimes aria-hidden="true" />
        </button>
      )}
    </div>
  );

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-slate-900 text-white lg:flex">
        {sidebarHeader}
        {navigation}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close admin navigation"
            className="absolute inset-0 bg-slate-950/50"
          />
          <aside className="relative flex h-full w-[min(18rem,85vw)] flex-col bg-slate-900 text-white shadow-2xl">
            {sidebarHeader}
            {navigation}
          </aside>
        </div>
      )}
    </>
  );
}

export function AdminMobileMenuButton({ onClick, expanded }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open admin navigation"
      aria-expanded={expanded}
      className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 lg:hidden"
    >
      <FaBars aria-hidden="true" />
    </button>
  );
}

export default AdminSidebar;
