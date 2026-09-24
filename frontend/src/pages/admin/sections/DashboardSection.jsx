import api from '../../../api/axios.jsx'
import { useState,useEffect } from 'react';
import { toast } from 'react-toastify';
function DashboardSection() {
    const [userCount,setUserCount]=useState(0)
    const [vendorCount,setVendorCount]=useState(0);
    const[orderCount,setOrderCount]=useState(0);
    const[categoryCount,setCategoryCount]=useState(0);
    const[productCount,setProductCount]=useState(0);

      const fetchUserCount=async()=>{
           try{
               const user=await api.get('/admin/user/');
              setUserCount(user.data.data.length);
           }catch(err)
           {
               console.log(err)
               toast.error("Failed to fetch userCount");
           }
      }
      const fetchVendorCount=async()=>{
           try{
               const vendor=await api.get('/admin/vendor/');
              setVendorCount(vendor.data.data.length);
              console.log("vendor:",vendor.data.data.length)
           }catch(err)
           {
               console.log(err)
               toast.error("Failed to fetch userCount");
           }
      }
      const fetchOrderCount=async()=>{
         try{
               const order=await api.get('/order/all');
              setOrderCount(order.data.data.length);
              console.log("order",order.data.data.length)
           }catch(err)
           {
               console.log(err)
               toast.error("Failed to fetch userCount");
           }
      }
      const fetchProductCount=async()=>{
         try{
               const product=await api.get('/product');
              setProductCount(product.data.data.length);
              console.log("product",product.data.data.length)
           }catch(err)
           {
               console.log(err)
               toast.error("Failed to fetch userCount");
           }
      }
      const fetchCategoriesCount=async()=>{
         try{
               const categories=await api.get('/category');
             setCategoryCount(categories.data.data.length);
              console.log("categories",categories.data.data.length)
           }catch(err)
           {
               console.log(err)
               toast.error("Failed to fetch userCount");
           }
      }
      useEffect(()=>{
        const loading=()=>{

             fetchUserCount()
             fetchVendorCount()
             fetchOrderCount()
             fetchProductCount()
             fetchCategoriesCount()
        }
       loading()
      },[])
    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">
                Dashboard
            </h2>

            <div className="grid grid-cols-4 gap-5">

                <div className="bg-white p-5 rounded-lg shadow">
                    <h3 className="text-gray-500">Vendors</h3>
                    <p className="text-3xl font-bold mt-2">{vendorCount}</p>
                </div>

                <div className="bg-white p-5 rounded-lg shadow">
                    <h3 className="text-gray-500">Products</h3>
                    <p className="text-3xl font-bold mt-2">{productCount}</p>
                </div>

                <div className="bg-white p-5 rounded-lg shadow">
                    <h3 className="text-gray-500">Orders</h3>
                    <p className="text-3xl font-bold mt-2">{orderCount}</p>
                </div>

                <div className="bg-white p-5 rounded-lg shadow">
                    <h3 className="text-gray-500">Customers</h3>
                    <p className="text-3xl font-bold mt-2">{userCount}</p>
                </div>
                
               
                
               
                <div className="bg-white p-5 rounded-lg shadow">
                    <h3 className="text-gray-500">Categories</h3>
                    <p className="text-3xl font-bold mt-2">{categoryCount}</p>
                </div>
                
                

            </div>
        </div>
    );
}

export default DashboardSection;