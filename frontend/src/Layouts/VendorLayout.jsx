import { useState } from "react";
import { Outlet } from "react-router-dom";
import { FaBars, FaStore } from "react-icons/fa";
import VendorSidebar from "../component/VendorSidebar.jsx";

function VendorLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <VendorSidebar
        mobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
         
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Open vendor navigation"
            aria-expanded={mobileSidebarOpen}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <FaBars aria-hidden="true" />
          </button>

          <div className="flex items-center gap-2">
            <FaStore className="text-blue-700" aria-hidden="true" />
            <span className="font-semibold text-slate-900">Vendor workspace</span>
          </div>
        </header>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default VendorLayout;
