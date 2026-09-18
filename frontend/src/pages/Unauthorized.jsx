// src/pages/Unauthorized.jsx
import { useNavigate } from "react-router-dom";

function Unauthorized() {
  const navigate = useNavigate();
  

  

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-3">403</h1>
      <p className="text-gray-600 mb-6">
        You don't have permission to access this page.
      </p>
      <button
        onClick={()=>{navigate('/')}}
        className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
      >
        Go to Home
      </button>
    </div>
  );
}

export default Unauthorized;