import {useState,useEffect} from 'react';
import {useNavigate} from 'react-router-dom'
import { toast } from 'react-toastify';
import api from '../../../api/axios.jsx'


function VendorsSection() {
    const [vendors,setVendor]=useState([]);
    const [loading,setLoading]=useState(true);
    const [status,setStatus]=useState([])
    const navigate=useNavigate();

    useEffect(()=>{
        const fetchVendor=async()=>{
            try{
                  const response=await api.get('/admin/vendor');
                   console.log(response.data);
                   setVendor(response.data.data);

            }catch(err)
            {
               console.log(err);
               toast.error("Failed to load Vendors")
            }
            finally{
                setLoading(false)
            }
        }
        fetchVendor();
        
    },[])
    if (loading) {
    return <p>Loading Vendor...</p>;
  }
 const handleStatusChange =async (userId, newStatus) => {
        try{
         if(!userId || !newStatus)
        {
         toast.info("User id and status is required");
         return 
        }
        const response=await api.patch('/admin',{userId,newStatus});
        setStatus(response.data)
        
         
     
      setVendor((prevUsers) =>
         prevUsers.map((user) =>
           user._id === userId
             ? { ...user, status: newStatus }
             : user
         )
       );
 
        }catch(err)
        {
         console.log(err)
          toast.err("Unable to update the status")
        }
 }

  const formatDate = (isoString) => {
  if (!isoString) return "N/A";
  
  return new Date(isoString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};


    return (
        <>
        
        
        
  <h1 className="text-2xl mb-5 font-bold text-gray-900 whitespace-nowrap">
    Vendors Records
  </h1>
 <div className="sm:flex-auto flex flex-row items-center justify-between gap-4 bg-white rounded-lg shadow p-5 mb-5">
  <p className="m-0 text-gray-700">
    Manage the Vendor
  </p>
  
  <button className="bg-black text-white px-4 py-2 rounded whitespace-nowrap" onClick={()=>navigate('/register')}>
   + Add Vendor
  </button>
</div>




        <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 rounded-lg">
         <table className="min-w-full divide-y divide-gray-300 bg-white ">

          <thead className="bg-gray-50 ">
            <tr>
              <th className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Name</th>
              <th className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Email</th>
              <th className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Phone</th>
               <th className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">status</th>
     <th className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Created At</th>
      
            </tr>
          </thead>
              <tbody className="divide-y divide-gray-200">
                 {vendors.map((vendor)=>
                  <tr key={vendor._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900">{vendor.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{vendor.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{vendor.phone}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                <select
                  value={vendor.status}
                  onChange={(e) => handleStatusChange(vendor._id, e.target.value)}
                  className={`block w-32 rounded-md border-0 py-1.5 pl-3 pr-8 text-xs font-semibold ring-1 ring-inset focus:ring-2 focus:ring-indigo-600 cursor-pointer ${
                    vendor.status === 'active'
                      ? 'bg-green-50 text-green-700 ring-green-600/20'
                      : 'bg-red-50 text-red-700 ring-red-600/20'
                  }`}
                >
                  <option value="active" className="bg-white text-gray-900">Active</option>
                  <option value="blocked" className="bg-white text-gray-900">Blocked</option>
                </select>
              </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{formatDate(vendor.createdAt)}</td>

                  </tr>
                  
                )}



              </tbody>


         </table>



        </div>
   
      </>
    );
}

export default VendorsSection;