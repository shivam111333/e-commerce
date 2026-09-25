import {
    FaTachometerAlt,
    FaStore,
    FaList,
    FaShoppingBag,
    FaUser 
} from "react-icons/fa";
import  {useNavigate} from 'react-router-dom';
import { useDispatch } from "react-redux";
import { logout } from "../redux/slices/authSlice";

function AdminSidebar({ activeSection, setActiveSection }) {
    const navigate=useNavigate();
    const dispatch=useDispatch()

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

     const handleLogout = () => {
        localStorage.removeItem("token");
        dispatch(logout());
        navigate("/");
      };

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
               <button
                      type="button"
                       onClick={()=>handleLogout()}
                      className="
                        w-full
                        text-left
                        px-4
                        py-2.5
                        text-red-500
                        hover:bg-red-400 text-red-800
                        transition
                      "
                    >
                      Logout
                    </button>

            </div>

        </div>
    );
}

export default AdminSidebar;