import api from '../../api/axios.jsx'
import { useNavigate } from 'react-router-dom';
import { useSelector ,useDispatch} from 'react-redux'
import { logout } from '../../redux/slices/authSlice.js'
import { HiOutlineSquares2X2 } from "react-icons/hi2";

function AdminDashboard()
{
  const dispatch=useDispatch();
  const navigate=useNavigate();
   const user=useSelector((state)=>state.auth.user)

   const handleLogout=()=>{
    dispatch(logout());
   }
  return (<>
   <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Top Welcome Section */}
        <div className="flex items-center justify-between bg-white rounded-xl shadow-sm px-6 py-5 mb-6">
          <div>
            
            <h1 className="text-2xl font-bold text-gray-800">
              Welcome, {user.name}
            </h1>
          </div>
           
          <button
            onClick={handleLogout}
            className="px-5 py-2.5 bg-red-500 text-white font-medium rounded-lg
                       hover:bg-red-600 transition duration-200"
          >
            Logout
          </button>
        </div>

       
        

        {/* Navigation Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Products Button */}
          <button
            onClick={() => navigate("/admin/category")}
            className="group bg-white rounded-xl shadow-sm border border-gray-100
                       p-8 text-left hover:shadow-md hover:border-blue-200
                       transition duration-200"
          >
            <div className="flex items-center justify-between">

              <div>
                <div className="text-4xl mb-4">
                <HiOutlineSquares2X2 />
                </div>

                <h2 className="text-xl font-semibold text-gray-800">
                 Category
                </h2>

                <p className="text-gray-500 mt-2">
                  View and manage your products
                </p>
              </div>

              <span className="text-2xl text-gray-400 group-hover:text-blue-500 transition">
                →
              </span>

            </div>
          </button>

           <button
            onClick={() => navigate("/vendor/products")}
            className="group bg-white rounded-xl shadow-sm border border-gray-100
                       p-8 text-left hover:shadow-md hover:border-blue-200
                       transition duration-200"
          >
            <div className="flex items-center justify-between">

              <div>
                <div className="text-4xl mb-4">
                  📦
                </div>

                <h2 className="text-xl font-semibold text-gray-800">
                  Products
                </h2>

                <p className="text-gray-500 mt-2">
                  View and manage your products
                </p>
              </div>

              <span className="text-2xl text-gray-400 group-hover:text-blue-500 transition">
                →
              </span>

            </div>
          </button>

          {/* Orders Button */}
          <button
            onClick={() => navigate("/vendor/orders")}
            className="group bg-white rounded-xl shadow-sm border border-gray-100
                       p-8 text-left hover:shadow-md hover:border-green-200
                       transition duration-200"
          >
            <div className="flex items-center justify-between">

              <div>
                <div className="text-4xl mb-4">
                  🛒
                </div>

                <h2 className="text-xl font-semibold text-gray-800">
                  Orders
                </h2>

                <p className="text-gray-500 mt-2">
                  View and track received orders
                </p>
              </div>

              <span className="text-2xl text-gray-400 group-hover:text-green-500 transition">
                →
              </span>

            </div>
          </button>

        </div>

      </div>
    </div>
    </>)
  
}
export default AdminDashboard