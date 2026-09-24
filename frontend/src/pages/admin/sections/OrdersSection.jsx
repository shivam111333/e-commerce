import {useState,useEffect} from 'react';
import {useNavigate} from 'react-router-dom'
import { toast } from 'react-toastify';
import api from '../../../api/axios.jsx'
import {FaBox,FaMapMarkerAlt} from 'react-icons/fa'


function OrderSection() {
    const [orders,setOrder]=useState("");
    const [loading,setLoading]=useState(true)
    const navigate=useNavigate();

    useEffect(()=>{
        const fetchOrders=async()=>{
            try{
                  const response=await api.get('/order/all');
                   console.log(response.data);
                   setOrder(response.data.data);

            }catch(err)
            {
               console.log(err);
               toast.error("Failed to load Vendors")
            }
            finally{
                setLoading(false)
            }
        }
        fetchOrders();
        
    },[])
    if (loading) {
    return <p>Loading Vendor...</p>;
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
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-6xl mx-auto px-4">
    
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
        
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Orders
                </h1>
    
                <p className="text-gray-500 mt-1">
                  Track and manage your orders
                </p>
              </div>
            </div>
    
            {/* No orders */}
            {orders.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-10 text-center">
                <FaBox className="text-5xl text-gray-300 mx-auto mb-4" />
    
                <h2 className="text-xl font-semibold text-gray-700">
                  No orders yet
                </h2>
    
                <p className="text-gray-500 mt-2">
                  You haven't placed any orders yet.
                </p>
    
                <button
                  onClick={() => navigate("/")}
                  className="mt-6 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-6">
    
                {orders.map((order) => (
                  <div
                    key={order._id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                  >
    
                    {/* Order Header */}
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
    
                        <div>
                          <p className="text-sm text-gray-500">
                            Order ID
                          </p>
    
                          <p className="font-semibold text-gray-800">
                            #{order._id}
                          </p>
                        </div>
    
                        <div>
                          <p className="text-sm text-gray-500">
                            Ordered on
                          </p>
    
                          <p className="font-medium text-gray-800">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
    
                        <div>
                          <p className="text-sm text-gray-500">
                            Payment
                          </p>
    
                          <span
                            className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${
                              order.paymentStatus === "paid"
                                ? "bg-green-100 text-green-700"
                                : order.paymentStatus === "failed"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {order.paymentStatus}
                          </span>
                        </div>
    
                        <div>
                          <p className="text-sm text-gray-500">
                            Total
                          </p>
    
                          <p className="text-lg font-bold text-gray-800">
                            ₹{Number(order.totalAmount).toLocaleString("en-IN")}
                          </p>
                        </div>
    
                      </div>
                    </div>
    
                    {/* Order Items */}
                    <div className="p-6">
    
                      <h2 className="text-lg font-semibold text-gray-800 mb-4">
                        Items
                      </h2>
    
                      <div className="space-y-4">
    
                        {order.items?.map((item) => (
                          <div
                            key={item._id}
                            className="border border-gray-200 rounded-lg p-4"
                          >
    
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
    
                              {/* Product Info */}
                              <div className="flex-1">
    
                                <h3 className="font-semibold text-gray-800 text-lg">
                                  {item.name}
                                </h3>
    
                                {/* Attributes */}
                                {item.attributes &&
                                  Object.keys(item.attributes).length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                      {Object.entries(item.attributes).map(
                                        ([key, value]) => (
                                          <span
                                            key={key}
                                            className="text-sm bg-gray-100 px-3 py-1 rounded"
                                          >
                                            <span className="font-medium">
                                              {key}:
                                            </span>{" "}
                                            {value}
                                          </span>
                                        )
                                      )}
                                    </div>
                                  )}
    
                                <div className="mt-3 text-sm text-gray-500">
                                  Quantity: {item.quantity}
                                </div>
    
                                {/* <div className="text-sm text-gray-500">
                                  Vendor: {item.vendor}
                                </div> */}
    
                              </div>
    
                              {/* Price + Status */}
                              <div className="md:text-right">
    
                                <p className="text-lg font-bold text-gray-800">
                                  ₹
                                  {Number(item.price).toLocaleString("en-IN")}
                                </p>
    
                                <p className="text-sm text-gray-500">
                                  ₹
                                  {(
                                    Number(item.price) *
                                    Number(item.quantity)
                                  ).toLocaleString("en-IN")}{" "}
                                  total
                                </p>
    
                                <span
                                  className={`inline-block mt-3 px-3 py-1 rounded-full text-sm font-medium capitalize`}
                                >
                                  {item.status}
                                </span>
    
                                {item.status === "cancelled" && (
                                  <div className="mt-2 text-sm text-red-600">
                                    <p>
                                      Cancelled by: {item.cancelledBy}
                                    </p>
    
                                    {item.cancellationReason && (
                                      <p>
                                        Reason:{" "}
                                        {item.cancellationReason}
                                      </p>
                                    )}
                                  </div>
                                )}
    
                              </div>
    
                            </div>
                          </div>
                        ))}
    
                      </div>
    
                      {/* Shipping Address */}
                      <div className="mt-6 border-t pt-6">
    
                        <div className="flex items-center gap-2 mb-3">
                          <FaMapMarkerAlt className="text-gray-600" />
    
                          <h2 className="font-semibold text-gray-800">
                            Shipping Address
                          </h2>
                        </div>
    
                        <div className="text-sm text-gray-600 leading-6">
                          <p className="font-medium text-gray-800">
                            {order.shippingAddress?.name}
                          </p>
    
                          <p>
                            {order.shippingAddress?.address}
                          </p>
    
                          <p>
                            {order.shippingAddress?.city},{" "}
                            {order.shippingAddress?.state} -{" "}
                            {order.shippingAddress?.pincode}
                          </p>
    
                          <p>
                            Phone: {order.shippingAddress?.phone}
                          </p>
                        </div>
    
                      </div>
    
                    </div>
                  </div>
                ))}
    
              </div>
            )}
          </div>
        </div>
      );
}

export default OrderSection;