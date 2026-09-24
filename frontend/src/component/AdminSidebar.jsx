import {
    FaTachometerAlt,
    FaStore,
    FaList,
    FaShoppingBag,
    FaUser 
} from "react-icons/fa";

function AdminSidebar({ activeSection, setActiveSection }) {

    const menuItems = [
        {
            name: "Dashboard",
            icon: <FaTachometerAlt />,
        },
        {
            name: "Vendors",
            icon: <FaStore />,
        },
        {
            name: "Customer",
            icon: <FaUser />,
        },
        {
            name: "Categories",
            icon: <FaList />,
        },
       
        {
            name: "Orders",
            icon: <FaShoppingBag />,
        },
    
        
    ];

    return (
        <div className="w-64 bg-gray-900 text-white min-h-screen">

            <div className="p-6">
                <h1 className="text-2xl font-bold">
                    Admin Panel
                </h1>
            </div>

            <div className="px-3">

                {menuItems.map((item) => (

                    <button
                        key={item.name}
                        onClick={() => setActiveSection(item.name)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 text-left transition
                            
                            ${
                                activeSection === item.name
                                    ? "bg-white text-black"
                                    : "hover:bg-gray-800"
                            }
                        `}
                    >
                        {item.icon}

                        <span>
                            {item.name}
                        </span>

                    </button>

                ))}

            </div>

        </div>
    );
}

export default AdminSidebar;