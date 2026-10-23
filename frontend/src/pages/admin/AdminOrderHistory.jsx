import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { FaBox, FaMapMarkerAlt } from "react-icons/fa";
import api from "../../api/axios.jsx";

export default function AdminOrderHistory({ type }) {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const isVendor = type === "vendor";

  // showLoader = false lets us refresh the data quietly after an update
  const load = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) setLoading(true);
        const res = await api.get(`/admin/${type}/${id}`);
        setOrders(res.data.data || []);
      } catch (err) {
        console.log(err);
        toast.error(err.response?.data?.message || "Failed to load orders");
      } finally {
        if (showLoader) setLoading(false);
      }
    },
    [type, id]
  );

  useEffect(() => {
    load();
    
  }, [load]);

  const formatDate = (isoString) => {
    if (!isoString) return "N/A";
    return new Date(isoString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "confirmed":
        return "bg-blue-100 text-blue-700";
      case "shipped":
        return "bg-purple-100 text-purple-700";
      case "delivered":
        return "bg-green-100 text-green-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const updateGlobalPaymentStatus = async (orderId, paymentStatus) => {
    try {
      const response = await api.patch(`/order/${orderId}/payment-status`, {
        paymentStatus,
      });

      toast.success(response.data.message);

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId
            ? { ...order, payment: { ...order.payment, status: paymentStatus } }
            : order
        )
      );

      // the backend may also update item statuses, so sync quietly
      load(false);
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message || "Failed to update payment status"
      );
    }
  };

  const updateItemPaymentStatus = async (orderId, itemId, paymentStatus) => {
    try {
      const response = await api.patch(
        `/order/${orderId}/item/${itemId}/payment-status`,
        { paymentStatus }
      );

      toast.success(response.data.message);

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId
            ? {
                ...order,
                items: order.items.map((item) =>
                  item._id === itemId ? { ...item, paymentStatus } : item
                ),
              }
            : order
        )
      );

      // the backend may recalculate the order-level payment status
      load(false);
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message || "Failed to update item payment status"
      );
    }
  };

  if (loading) {
    return <p>Loading Orders...</p>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="mx-auto w-full max-w-6xl px-3 sm:px-1">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 text-sm font-medium text-blue-600 hover:underline"
        >
          ← Back
        </button>

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">
            {isVendor ? "Vendor" : "Customer"} Orders
            {state?.name ? `: ${state.name}` : ""}
          </h1>
          <p className="mt-1 text-gray-500">
            {isVendor
              ? "Orders containing this vendor's products"
              : "All orders placed by this customer"}
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-xl bg-white p-6 text-center shadow-sm sm:p-10">
            <FaBox className="mx-auto mb-4 text-5xl text-gray-300" />
            <h2 className="text-xl font-semibold text-gray-700">
              No orders yet
            </h2>
            <p className="mt-2 text-gray-500">
              {isVendor
                ? "No orders found for this vendor."
                : "This customer hasn't placed any orders."}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const itemsTotal = (order.items || []).reduce(
                (sum, it) => sum + Number(it.price) * Number(it.quantity),
                0
              );
              const displayTotal = isVendor ? itemsTotal : order.totalAmount;
              const isCod = order.payment?.method === "cod";

              return (
                <div
                  key={order._id}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
                >
                  {/* Order Header */}
                  <div className="border-b border-gray-200 bg-gray-50 px-4 py-4 sm:px-6">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Order Number</p>
                        <p className="font-semibold text-gray-800">
                          {order.orderNumber || order._id}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500">Ordered on</p>
                        <p className="font-medium text-gray-800">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>

                      {isVendor && (
                        <div>
                          <p className="text-sm text-gray-500">Customer</p>
                          <p className="font-medium text-gray-800">
                            {order.user?.name || "N/A"}
                          </p>
                        </div>
                      )}

                      <div>
                        <p className="text-sm text-gray-500">Payment Method</p>
                        <p className="font-medium text-gray-800">
                          {order.payment?.method?.toUpperCase() || "N/A"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500">Payment Status</p>
                        <select
                          value={order.payment?.status || "pending"}
                          onChange={(e) =>
                            updateGlobalPaymentStatus(order._id, e.target.value)
                          }
                          disabled={isVendor || !isCod}
                          className="w-full max-w-full rounded-lg border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-gray-100 sm:w-auto"
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          {/* <option value="failed">Failed</option>
                          <option value="partially_refunded">
                            Partially Refunded
                          </option>
                          <option value="refunded">Refunded</option> */}
                        </select>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500">
                          {isVendor ? "Vendor Total" : "Total"}
                        </p>
                        <p className="text-lg font-bold text-gray-800">
                          ₹{Number(displayTotal || 0).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="p-4 sm:p-6">
                    <h2 className="mb-4 text-lg font-semibold text-gray-800">
                      Items
                    </h2>

                    <div className="space-y-4">
                      {order.items?.map((item) => (
                        <div
                          key={item._id}
                          className="rounded-lg border border-gray-200 p-3 sm:p-4"
                        >
                          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-800">
                                {item.name}
                              </h3>

                              {item.attributes &&
                                Object.keys(item.attributes).length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {Object.entries(item.attributes).map(
                                      ([key, value]) => (
                                        <span
                                          key={key}
                                          className="rounded bg-gray-100 px-3 py-1 text-sm"
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

                            <div className="md:text-right">
                              <p className="text-lg font-bold text-gray-800">
                                ₹{Number(item.price).toLocaleString("en-IN")}
                              </p>
                              <p className="text-sm text-gray-500">
                                ₹
                                {(
                                  Number(item.price) * Number(item.quantity)
                                ).toLocaleString("en-IN")}{" "}
                                total
                              </p>

                              <span
                                className={`mt-3 inline-block rounded-full px-3 py-1 text-sm font-medium capitalize ${getStatusClass(
                                  item.status
                                )}`}
                              >
                                {item.status}
                              </span>

                              <div className="mt-2">
                                <p className="mb-1 text-xs text-gray-500">
                                  Item Payment:
                                </p>
                                <select
                                  value={item.paymentStatus || "pending"}
                                  onChange={(e) =>
                                    updateItemPaymentStatus(
                                      order._id,
                                      item._id,
                                      e.target.value
                                    )
                                  }
                                  disabled={!isCod}
                                  className="w-full max-w-full rounded-lg border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-gray-100 sm:w-auto"
                                >
                                  <option value="pending">Pending</option>
                                  <option value="paid">Paid</option>
                                  {/* <option value="failed">Failed</option>
                                  <option value="partially_refunded">
                                    Partially Refunded
                                  </option>
                                  <option value="refunded">Refunded</option> */}
                                </select>
                              </div>

                              {item.status === "cancelled" && (
                                <div className="mt-3 border-t pt-2 text-sm text-red-600">
                                  <p className="font-medium">Cancelled</p>
                                  {item.cancellationReason && (
                                    <p>Reason: {item.cancellationReason}</p>
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
                      <div className="mb-3 flex items-center gap-2">
                        <FaMapMarkerAlt className="text-gray-600" />
                        <h2 className="font-semibold text-gray-800">
                          Shipping Address
                        </h2>
                      </div>

                      <div className="text-sm leading-6 text-gray-600">
                        <p className="font-medium text-gray-800">
                          {order.shippingAddress?.name}
                        </p>
                        <p>{order.shippingAddress?.address}</p>
                        <p>
                          {order.shippingAddress?.city},{" "}
                          {order.shippingAddress?.state} -{" "}
                          {order.shippingAddress?.pincode}
                        </p>
                        <p>Phone: {order.shippingAddress?.phone}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}