import { useState } from "react";

import AdminSidebar, {
    AdminMobileMenuButton,
} from "../../component/AdminSidebar.jsx";

import DashboardSection from "./sections/DashboardSection.jsx";
import VendorsSection from "./sections/VendorsSection.jsx";
import CategoriesSection from "./sections/CategoriesSection.jsx";
import OrdersSection from "./sections/OrdersSection.jsx";
import UsersSection from './sections/UsersSection.jsx'


function AdminDashboard() {

    const [activeSection, setActiveSection] = useState("Dashboard");
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    const renderSection = () => {

        switch (activeSection) {

            case "Dashboard":
                return <DashboardSection />;

            case "Vendors":
                return <VendorsSection />;

            case "Categories":
                return <CategoriesSection />;

            case "Orders":
                return <OrdersSection />;

            case "Customer":
                return <UsersSection/>;
      
                         

            default:
                return <DashboardSection />;
        }
    };

    return (
        <div className="flex min-h-screen min-w-0 bg-slate-100">

            {/* Sidebar */}

            <AdminSidebar
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                mobileOpen={mobileSidebarOpen}
                onClose={() => setMobileSidebarOpen(false)}
            />

            {/* Main Content */}

            <main className="min-w-0 flex-1">
                <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:hidden">
                    <AdminMobileMenuButton
                        onClick={() => setMobileSidebarOpen(true)}
                        expanded={mobileSidebarOpen}
                    />
                    <div>
                        <p className="font-semibold text-slate-900">E-Shop Admin</p>
                        <p className="text-xs text-slate-500">{activeSection}</p>
                    </div>
                </header>
                <div className="min-w-0 p-4 sm:p-6 lg:p-8">
                    {renderSection()}
                </div>
            </main>

        </div>
    );
}

export default AdminDashboard;