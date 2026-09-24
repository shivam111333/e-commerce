import { useState } from "react";

import AdminSidebar from "../../component/AdminSidebar.jsx";

import DashboardSection from "./sections/DashboardSection.jsx";
import VendorsSection from "./sections/VendorsSection.jsx";
import CategoriesSection from "./sections/CategoriesSection.jsx";
import OrdersSection from "./sections/OrdersSection.jsx";
import UsersSection from './sections/UsersSection.jsx'


function AdminDashboard() {

    const [activeSection, setActiveSection] = useState("Dashboard");

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
        <div className="flex min-h-screen bg-gray-100">

            {/* Sidebar */}

            <AdminSidebar
                activeSection={activeSection}
                setActiveSection={setActiveSection}
            />

            {/* Main Content */}

            <main className="flex-1 p-8">

                {renderSection()}

            </main>

        </div>
    );
}

export default AdminDashboard;