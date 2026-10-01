import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify';
import api from '../../../api/axios.jsx'
import { FaBox, FaMapMarkerAlt } from 'react-icons/fa'


function OrderSection() {
  const [orders, setOrder] = useState("");
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.get('/order/all');
        console.log(response.data);
        setOrder(response.data.data);

      } catch (err) {
        console.log(err);
        toast.error("Failed to load Orders")
      }
      finally {
        setLoading(false)
      }
    }
    fetchOrders();

  }, [])

  if (loading) {
    return <p>Loading Orders...</p>;
  }

  const formatDate = (isoString) => {
    if (!isoString) return "N/A";

    return new Date(isoString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // UPDATED: Add new statuses
  const getStatusClass = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";

      case "confirmed":
        return "bg-blue-100 text-blue-700";

      case "processing":
        return "bg-indigo-100 text-indigo-700";

      case "shipped":
        return "bg-purple-100 text-purple-700";

      case "out_for_delivery":
        return "bg-cyan-100 text-cyan-700";

      case "delivered":
        return "bg-green-100 text-green-700";

      case "cancelled":
        return "bg-red-100 text-red-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // NEW: Payment status styling
  const getPaymentStatusClass = (status) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-700";

      case "failed":
        return "bg-red-100 text-red-700";

      case "refunded":
        return "bg-orange-100 text-orange-700";

      case "partially_refunded":
        return "bg-yellow-100 text-yellow-700";

      case "processing":
        return "bg-blue-100 text-blue-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const updateGlobalPaymentStatus = async (
    orderId,
    paymentStatus
  ) => {
    try {
      const response = await api.patch(
        `/order/${orderId}/payment-status`,
        {
          paymentStatus,
        }
      );

      toast.success(response.data.message);

      setOrder((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId
            ? {
              ...order,
              payment: {
                ...order.payment,
                status: paymentStatus,
              },
            }
            : order
        )
      );
    } catch (err) {
      console.error(err);

      toast.error(
        err.response?.data?.message ||
        "Failed to update payment status"
      );
    }
  };

  const updateItemPaymentStatus = async (
    orderId,
    itemId,
    paymentStatus
  ) => {
    try {
      const response = await api.patch(
        `/order/${orderId}/item/${itemId}/payment-status`,
        {
          paymentStatus,
        }
      );

      toast.success(response.data.message);

      setOrder((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId
            ? {
              ...order,
              items: order.items.map((item) =>
                item._id === itemId
                  ? {
                    ...item,
                    paymentStatus,
                  }
                  : item
              ),
            }
            : order
        )
      );
    } catch (err) {
      console.error(err);

      toast.error(
        err.response?.data?.message ||
        "Failed to update item payment status"
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">

          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              All Orders
            </h1>

            <p className="text-gray-500 mt-1">
              Track and manage all orders
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
              No orders have been placed yet.
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
                        Order Number
                      </p>

                      {/* UPDATED: Show orderNumber */}
                      <p className="font-semibold text-gray-800">
                        {order.orderNumber}
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
                        Payment Method
                      </p>

                      {/* NEW: Show payment method */}
                      <p className="font-medium text-gray-800">
                        {order.payment?.method?.toUpperCase() || "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">
                        Payment Status
                      </p>

                      {/* UPDATED: Access nested payment.status */}
                      <select
                        value={order.payment?.status || "pending"}
                        onChange={(e) =>
                          updateGlobalPaymentStatus(
                            order._id,
                            e.target.value
                          )
                        }
                        disabled={order.payment?.method !== "cod"}
                        className="border rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="paid">Paid</option>
                        <option value="failed">Failed</option>
                        <option value="partially_refunded">
                          Partially Refunded
                        </option>
                        <option value="refunded">Refunded</option>
                      </select>
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
                              {item._id}
                            </h3>
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

                            {/* Order Status */}
                            <span
                              className={`inline-block mt-3 px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusClass(item.status)
                                }`}
                            >
                              {item.status}
                            </span>

                            {/* NEW: Item Payment Status */}
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 mb-1">Item Payment:</p>
                              <select
                                value={item.paymentStatus || "pending"}
                                onChange={(e) =>
                                  updateItemPaymentStatus(
                                    order._id,
                                    item._id,
                                    e.target.value
                                  )
                                }
                                disabled={order.payment?.method !== "cod"}
                                className="border rounded-lg px-3 py-2 text-sm"
                              >
                                <option value="pending">Pending</option>
                                <option value="paid">Paid</option>
                                <option value="failed">Failed</option>
                                <option value="partially_refunded">
                                  Partially Refunded
                                </option>
                                <option value="refunded">Refunded</option>
                              </select>
                            </div>

                            {item.status === "cancelled" && (
                              <div className="mt-3 text-sm text-red-600 border-t pt-2">
                                <p className="font-medium">Cancelled</p>

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
