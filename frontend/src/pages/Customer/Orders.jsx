import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  FaBox,
  FaMapMarkerAlt,
  FaArrowLeft,
} from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../../api/axios.jsx";

// Shown to the customer with the refund notice. Change it to match what your
// payment provider / bank actually takes.
const REFUND_TIME_NOTE =
  "It usually takes 5–7 business days to show in your account once processed.";

// Customers can cancel an item only this long after placing the order,
// and only while it has not been shipped. Keep in sync with the backend.
const CANCEL_WINDOW_HOURS = 24;
const CANCELLABLE_STATUSES = ["pending", "confirmed"];

const CANCEL_REASONS = [
  "Ordered by mistake",
  "Found a better price",
  "Delivery is taking too long",
  "Want to change size / colour",
  "Other",
];

function Orders() {
  const navigate = useNavigate();

  const { isAuthenticated } = useSelector((state) => state.auth);

  const [orders, setOrders] = useState([]);
  const [returnRequests, setReturnRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cancel dialog
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    const fetchOrders = async () => {
      try {
        setLoading(true);

        const response = await api.get("/order/my-orders");

        if (response.data.success) {
          setOrders(response.data.data || []);
        }

        const returnsResponse = await api.get("/order/returns/my");
        setReturnRequests(returnsResponse.data.data || []);
      } catch (error) {
        if (error.response?.status === 404) {
          setOrders([]);
        } else {
          toast.error(
            error.response?.data?.message || "Failed to fetch orders"
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isAuthenticated, navigate]);

  // Can the customer still cancel this item? Also returns the time left.
  const getCancelInfo = (order, item) => {
    const placedAt = new Date(order.createdAt).getTime();
    const msLeft = placedAt + CANCEL_WINDOW_HOURS * 60 * 60 * 1000 - Date.now();

    const statusOk = CANCELLABLE_STATUSES.includes(item.status);
    const paymentOk =
      order.payment?.method === "cod" ||
      ["paid", "partially_refunded"].includes(order.payment?.status);

    const hours = Math.floor(msLeft / (60 * 60 * 1000));
    const minutes = Math.floor((msLeft % (60 * 60 * 1000)) / (60 * 1000));

    return {
      canCancel: Number.isFinite(placedAt) && statusOk && paymentOk && msLeft > 0,
      timeLeft: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
    };
  };

  const openCancel = (order, item, paidOnline) => {
    setCancelReason("");
    setCancelTarget({
      orderId: order._id,
      itemId: item._id,
      name: item.name,
      paidOnline,
      amount: Number(item.price) * Number(item.quantity),
    });
  };

  const closeCancel = () => {
    setCancelTarget(null);
    setCancelReason("");
  };

  const confirmCancel = async () => {
    if (!cancelTarget || cancelling) return;

    if (!cancelReason) {
      toast.error("Please select a reason");
      return;
    }

    try {
      setCancelling(true);

      const response = await api.patch(
        `/order/${cancelTarget.orderId}/item/${cancelTarget.itemId}/cancel`,
        { cancellationReason: cancelReason }
      );

      toast.success(response.data?.message || "Item cancelled");

      // Update only the cancelled item on screen
      setOrders((current) =>
        current.map((order) =>
          order._id === cancelTarget.orderId
            ? {
                ...order,
                items: order.items.map((item) =>
                  item._id === cancelTarget.itemId
                    ? {
                        ...item,
                        status: "cancelled",
                        paymentStatus: "cancelled",
                        cancellationReason: cancelReason,
                        cancelledAt: new Date().toISOString(),
                      }
                    : item
                ),
              }
            : order
        )
      );

      closeCancel();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to cancel item");
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // UPDATED: Add new statuses
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

  // NEW: Payment status styling
  const getPaymentStatusClass = (status) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-700";

      case "failed":
      case "cancelled":
        return "bg-red-100 text-red-700";

      case "refunded":
        return "bg-orange-100 text-orange-700";

      case "partially_refunded":
        return "bg-yellow-100 text-yellow-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600 text-lg">
          Loading your orders...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate("/")}
            className="p-2 rounded-full hover:bg-gray-200"
          >
            <FaArrowLeft />
          </button>

          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              My Orders
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
                        Order Number
                      </p>

                      {/* UPDATED: Show orderNumber instead of _id */}
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
                      <span
                        className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusClass(order.payment?.status)
                          }`}
                      >
                        {order.payment?.status || "N/A"}
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

                    {order.items?.map((item) => {
                      const existingReturn = returnRequests.find(
                        (request) =>
                          String(request.order) === String(order._id) &&
                          String(request.item) === String(item._id)
                      );
                      const deliveredAt = item.deliveredAt
                        ? new Date(item.deliveredAt).getTime()
                        : NaN;
                      const withinReturnWindow =
                        Number.isFinite(deliveredAt) &&
                        deliveredAt <= Date.now() &&
                        Date.now() - deliveredAt <= 7 * 24 * 60 * 60 * 1000;
                      const canRequestReturn =
                        ["online", "cod"].includes(order.payment?.method) &&
                        item.status === "delivered" &&
                        item.paymentStatus === "paid" &&
                        withinReturnWindow &&
                        !existingReturn;

                      // Cancelled after the customer already paid online:
                      // the money has to go back to them.
                      const isCancelled = item.status === "cancelled";
                      const paidOnline =
                        order.payment?.method === "online" &&
                        ["paid", "partially_refunded", "refunded"].includes(
                          order.payment?.status
                        );
                      const showRefundNotice = isCancelled && paidOnline;
                      const refundDone = item.paymentStatus === "refunded";
                      const cancelRefundAmount =
                        Number(item.price) * Number(item.quantity);
                      const cancelInfo = getCancelInfo(order, item);

                      return (
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
                            <p className="text-xs text-gray-500 mb-1">Dilvery Status:</p>
                            <span
                              className={`inline-block mt-3 px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusClass(
                                item.status
                              )}`}
                            >
                              {item.status}
                            </span>

                            {/* NEW: Item Payment Status */}
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 mb-1">Item Payment:</p>
                              <span
                                className={`inline-block px-2 py-1 rounded text-xs font-medium capitalize ${getPaymentStatusClass(item.paymentStatus)
                                  }`}
                              >
                                {item.paymentStatus?.replace(/_/g, " ")}
                              </span>
                            </div>

                            {canRequestReturn && (
                              <button
                                type="button"
                                onClick={() =>
                                  navigate(
                                    `/orders/${order._id}/items/${item._id}/return`
                                  )
                                }
                                className="mt-3 rounded-lg border border-blue-600 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                              >
                                Request return
                              </button>
                            )}

                            {cancelInfo.canCancel && (
                              <div className="mt-3">
                                <button
                                  type="button"
                                  onClick={() =>
                                    openCancel(
                                      order,
                                      item,
                                      order.payment?.method === "online"
                                    )
                                  }
                                  className="rounded-lg border border-red-500 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                                >
                                  Cancel item
                                </button>
                                <p className="mt-1 text-xs text-gray-500">
                                  Free cancellation: {cancelInfo.timeLeft} left
                                </p>
                              </div>
                            )}

                            {isCancelled && (
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

                        {/* Refund notice: cancelled item that was paid online */}
                        {showRefundNotice && (
                          <div
                            className={`mt-4 w-full rounded-lg border p-3 text-left text-sm sm:p-4 ${
                              refundDone
                                ? "border-green-200 bg-green-50 text-green-800"
                                : "border-blue-200 bg-blue-50 text-blue-900"
                            }`}
                          >
                            <p className="font-semibold">
                              {refundDone
                                ? "Refund completed"
                                : "Your refund will be provided"}
                            </p>

                            <p className="mt-1">
                              {refundDone
                                ? `₹${cancelRefundAmount.toLocaleString(
                                    "en-IN"
                                  )} has been refunded to your original payment method.`
                                : `This item was cancelled and you had already paid online, so ₹${cancelRefundAmount.toLocaleString(
                                    "en-IN"
                                  )} will be refunded to your original payment method. ${REFUND_TIME_NOTE}`}
                            </p>
                          </div>
                        )}

{existingReturn && (
  <div className="mt-4 w-full max-w-[650px] rounded-xl border border-blue-200 bg-blue-50/60 p-4 text-left text-sm text-slate-700">
    <p className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
        ↩
      </span>
      Return & refund summary
    </p>

    <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
      <div className="grid grid-cols-[125px_minmax(0,1fr)] items-start gap-2">
        <dt className="text-slate-500">Status</dt>
        <dd className="break-words font-semibold capitalize text-slate-800">
          {existingReturn.status.replace(/_/g, " ")}
        </dd>
      </div>

      <div className="grid grid-cols-[125px_minmax(0,1fr)] items-start gap-2">
        <dt className="text-slate-500">Return quantity</dt>
        <dd className="font-medium text-slate-800">
          {existingReturn.requestedQuantity}
        </dd>
      </div>

      <div className="grid grid-cols-[125px_minmax(0,1fr)] items-start gap-2">
        <dt className="text-slate-500">Refund amount</dt>
        <dd className="font-semibold text-slate-900">
          ₹{Number(existingReturn.refundAmount || 0).toLocaleString("en-IN")}
        </dd>
      </div>

      {existingReturn.status === "refunded" && (
        <>
          <div className="grid grid-cols-[125px_minmax(0,1fr)] items-start gap-2">
            <dt className="text-slate-500">Transfer reference</dt>
            <dd className="break-all font-medium text-slate-800">
              {existingReturn.bankTransferReference || "Not provided"}
            </dd>
          </div>

          {existingReturn.refundProcessedAt && (
            <div className="grid grid-cols-[125px_minmax(0,1fr)] items-start gap-2">
              <dt className="text-slate-500">Refunded on</dt>
              <dd className="font-medium text-slate-800">
                {formatDate(existingReturn.refundProcessedAt)}
              </dd>
            </div>
          )}
        </>
      )}
    </dl>
  </div>
)}

                      </div>
                      );
                    })}

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

      {/* Cancel dialog */}
      {cancelTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !cancelling && closeCancel()}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-800">
              Cancel this item?
            </h3>
            <p className="mt-1 text-sm text-gray-600">{cancelTarget.name}</p>

            {cancelTarget.paidOnline && (
              <p className="mt-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
                You paid online, so ₹
                {cancelTarget.amount.toLocaleString("en-IN")} will be refunded
                to your original payment method. {REFUND_TIME_NOTE}
              </p>
            )}

            <label
              htmlFor="cancel-reason"
              className="mt-4 block text-sm font-medium text-gray-700"
            >
              Reason for cancelling
            </label>
            <select
              id="cancel-reason"
              value={cancelReason}
              disabled={cancelling}
              onChange={(event) => setCancelReason(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Select a reason</option>
              {CANCEL_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={cancelling}
                onClick={closeCancel}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Keep item
              </button>
              <button
                type="button"
                disabled={cancelling || !cancelReason}
                onClick={confirmCancel}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cancelling ? "Cancelling..." : "Yes, cancel item"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Orders;