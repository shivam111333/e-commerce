
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBox,
  FaUser,
  FaMapMarkerAlt,
  FaArrowLeft,
} from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../../api/axios";

function VendorOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected delivery status for each item
  const [selectedStatus, setSelectedStatus] = useState({});

  // Cancellation reason for each item
  const [selectedReason, setSelectedReason] = useState({});

  // Currently updating item
  const [updatingItem, setUpdatingItem] = useState(null);

  const navigate = useNavigate();

  const cancellationReasons = [
    "Product unavailable",
    "Out of stock",
    "Unable to fulfill order",
    "Pricing issue",
    "Other",
  ];

  // -----------------------------------------
  // GET VENDOR ORDERS
  // -----------------------------------------

  const fetchOrders = async (showError = true) => {
    try {
      setLoading(true);

      const response = await api.get("/order");

      const data = response.data.data || [];

      console.log("Vendor Orders:", data);

      setOrders(data);

      // Set selected status based on current status
      // of every order item
      const statusState = {};

      data.forEach((order) => {
        order.items?.forEach((item) => {
          statusState[item._id] = item.status;
        });
      });

      setSelectedStatus(statusState);
    } catch (error) {
      if (error.response?.status === 404) {
        setOrders([]);
      } else if (showError) {
        toast.error(
          error.response?.data?.message ||
            "Failed to load orders"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // -----------------------------------------
  // STATUS CHANGE
  // -----------------------------------------

  const handleStatusChange = (itemId, status) => {
    setSelectedStatus((prev) => ({
      ...prev,
      [itemId]: status,
    }));

    // Remove old cancellation reason if
    // vendor changes away from cancellation
    if (status !== "cancelled") {
      setSelectedReason((prev) => {
        const updated = { ...prev };

        delete updated[itemId];

        return updated;
      });
    }
  };

  // -----------------------------------------
  // REASON CHANGE
  // -----------------------------------------

  const handleReasonChange = (itemId, reason) => {
    setSelectedReason((prev) => ({
      ...prev,
      [itemId]: reason,
    }));
  };

  // -----------------------------------------
  // UPDATE ITEM STATUS
  // -----------------------------------------

  const handleUpdateStatus = async (orderId, itemId) => {
    const status = selectedStatus[itemId];

    if (!status) {
      toast.error("Please select a status");
      return;
    }

    const cancellationReason = selectedReason[itemId];

    // Cancellation requires a reason
    if (status === "cancelled" && !cancellationReason) {
      toast.error("Please select a cancellation reason");
      return;
    }

    try {
      setUpdatingItem(itemId);

      // IMPORTANT:
      // Vendor is only allowed to update delivery status.
      // Do NOT send paymentStatus from the vendor frontend.
      await api.patch(
        `/order/${orderId}/item/${itemId}/status`,
        {
          status,

          cancellationReason:
            status === "cancelled"
              ? cancellationReason
              : undefined,
        }
      );

      // Show ONLY ONE success toast
      toast.success(
        status === "cancelled"
          ? "Order item cancelled successfully"
          : "Order status updated successfully"
      );

      // Refresh orders silently.
      // If this request fails, it will NOT show another toast.
      await fetchOrders(false);
    } catch (error) {
      // Only the actual update request shows this error toast
      toast.error(
        error.response?.data?.message ||
          "Failed to update order"
      );
    } finally {
      setUpdatingItem(null);
    }
  };

  // -----------------------------------------
  // STATUS LABEL
  // -----------------------------------------

  const getStatusLabel = (status) => {
    switch (status) {
      case "pending":
        return "Pending";

      case "confirmed":
        return "Confirmed";

      
      case "shipped":
        return "Shipped";


      case "delivered":
        return "Delivered";

      case "cancelled":
        return "Cancelled";

      default:
        return status;
    }
  };

  // -----------------------------------------
  // STATUS COLOR CLASS
  // -----------------------------------------

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
        return "bg-orange-100 text-orange-700";

      case "delivered":
        return "bg-green-100 text-green-700";

      case "cancelled":
        return "bg-red-100 text-red-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // -----------------------------------------
  // PAYMENT STATUS COLOR CLASS
  // -----------------------------------------

  const getPaymentStatusClass = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";

      case "paid":
        return "bg-green-100 text-green-700";

      case "failed":
        return "bg-red-100 text-red-700";

      case "refunded":
        return "bg-orange-100 text-orange-700";

      case "partially_refunded":
        return "bg-amber-100 text-amber-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // -----------------------------------------
  // LOADING
  // -----------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">
          Loading orders...
        </p>
      </div>
    );
  }

  // -----------------------------------------
  // NO ORDERS
  // -----------------------------------------

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-10 text-center">
            <FaBox className="mx-auto text-5xl text-gray-300 mb-4" />

            <h2 className="text-2xl font-semibold text-gray-800">
              No Orders Yet
            </h2>

            <p className="text-gray-500 mt-2">
              You don't have any orders for your
              products yet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------------------
  // PAGE
  // -----------------------------------------

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-6xl mx-auto">

        {/* PAGE TITLE */}

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Customer Orders
          </h1>

          <p className="text-gray-500 mt-1">
            Manage orders containing your products.
          </p>
        </div>

        {/* BACK BUTTON */}

        <button
          onClick={() => navigate("/vendor/dashboard")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 w-fit mb-6"
        >
          <FaArrowLeft />
          Back to Dashboard
        </button>

        {/* ORDERS */}

        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >

              {/* ORDER HEADER */}

              <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

                  <div>
                    <p className="text-sm text-gray-500">
                      Order Number
                    </p>

                    <p className="font-semibold text-gray-800 break-all">
                      {order.orderNumber || order._id}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Payment Method
                    </p>

                    <p className="font-medium text-gray-800">
                      {order.payment?.method?.toUpperCase() ||
                        "N/A"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Payment Status
                    </p>

                    <span
                      className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusClass(
                        order.payment?.status
                      )}`}
                    >
                      {order.payment?.status || "N/A"}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Your Total
                    </p>

                    <p className="font-bold text-gray-800">
                      ₹
                      {order.vendorTotal?.toFixed(2)}
                    </p>
                  </div>

                </div>
              </div>

              {/* CUSTOMER INFORMATION */}

              <div className="px-6 py-5 border-b border-gray-200">

                <div className="flex items-center gap-2 mb-3">
                  <FaUser className="text-gray-500" />

                  <h3 className="font-semibold text-gray-800">
                    Customer Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">

                  <div>
                    <span className="text-gray-500">
                      Name
                    </span>

                    <p className="font-medium text-gray-800">
                      {order.user?.name || "N/A"}
                    </p>
                  </div>

                  <div>
                    <span className="text-gray-500">
                      Email
                    </span>

                    <p className="font-medium text-gray-800">
                      {order.user?.email || "N/A"}
                    </p>
                  </div>

                  <div>
                    <span className="text-gray-500">
                      Phone
                    </span>

                    <p className="font-medium text-gray-800">
                      {order.user?.phone || "N/A"}
                    </p>
                  </div>

                </div>
              </div>

              {/* SHIPPING ADDRESS */}

              <div className="px-6 py-5 border-b border-gray-200">

                <div className="flex items-center gap-2 mb-3">
                  <FaMapMarkerAlt className="text-gray-500" />

                  <h3 className="font-semibold text-gray-800">
                    Shipping Address
                  </h3>
                </div>

                <div className="text-sm text-gray-600 space-y-1">

                  <p>
                    <span className="font-medium text-gray-800">
                      {order.shippingAddress?.name}
                    </span>
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
                    Phone:{" "}
                    {order.shippingAddress?.phone}
                  </p>

                </div>
              </div>

              {/* PRODUCTS */}

              <div className="px-6 py-5">

                <h3 className="font-semibold text-gray-800 mb-4">
                  Your Products
                </h3>

                <div className="space-y-5">

                  {order.items?.map((item) => {

                    const currentStatus =
                      item.status;

                    const currentPaymentStatus =
                      item.paymentStatus;

                    const selected =
                      selectedStatus[item._id] ||
                      currentStatus;

                    const isUpdating =
                      updatingItem === item._id;

                    const isLocked =
                      currentStatus === "delivered" ||
                      currentStatus === "cancelled";

                    const showCancellation =
                      selected === "cancelled";

                    const statusChanged =
                      selected !== currentStatus;

                    return (
                      <div
                        key={item._id}
                        className="border border-gray-200 rounded-lg p-5"
                      >

                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">

                          {/* PRODUCT INFO */}

                          <div className="flex-1">

                            {/* UNIQUE ORDER ITEM ID */}

                            <p className="text-xs text-gray-400 mb-1 break-all">
                              Item ID: {item._id}
                            </p>

                            <h4 className="text-lg font-semibold text-gray-800">
                              {item.name}
                            </h4>

                            <div className="mt-2 space-y-1 text-sm text-gray-600">

                              <p>
                                Price: ₹
                                {item.price?.toFixed(2)}
                              </p>

                              <p>
                                Quantity:{" "}
                                {item.quantity}
                              </p>

                              <p>
                                Total: ₹
                                {(
                                  item.price *
                                  item.quantity
                                ).toFixed(2)}
                              </p>

                            </div>

                            {/* ATTRIBUTES */}

                            {item.attributes &&
                              Object.keys(
                                item.attributes
                              ).length > 0 && (
                                <div className="mt-3">

                                  <p className="text-sm font-medium text-gray-700 mb-1">
                                    Variant
                                  </p>

                                  <div className="flex flex-wrap gap-2">

                                    {Object.entries(
                                      item.attributes
                                    ).map(
                                      ([key, value]) => (
                                        <span
                                          key={key}
                                          className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700"
                                        >
                                          {key}:{" "}
                                          {value}
                                        </span>
                                      )
                                    )}

                                  </div>
                                </div>
                              )}

                            {/* CURRENT STATUS */}

                            <div className="mt-4">

                              <span className="text-sm text-gray-500">
                                Current Status:
                              </span>

                              <span
                                className={`ml-2 inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusClass(
                                  currentStatus
                                )}`}
                              >
                                {getStatusLabel(
                                  currentStatus
                                )}
                              </span>

                            </div>

                            {/* CURRENT PAYMENT STATUS */}

                            <div className="mt-3">

                              <span className="text-sm text-gray-500">
                                Item Payment Status:
                              </span>

                              <span
                                className={`ml-2 inline-block px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusClass(
                                  currentPaymentStatus
                                )}`}
                              >
                                {currentPaymentStatus}
                              </span>

                            </div>

                            {/* CANCELLATION INFO */}

                            {currentStatus ===
                              "cancelled" && (
                              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">

                                <p className="text-sm text-red-700">
                                  <span className="font-semibold">
                                    Reason:
                                  </span>{" "}
                                  {item.cancellationReason ||
                                    "N/A"}
                                </p>

                                {item.cancelledAt && (
                                  <p className="text-sm text-red-700 mt-1">
                                    <span className="font-semibold">
                                      Cancelled at:
                                    </span>{" "}
                                    {new Date(
                                      item.cancelledAt
                                    ).toLocaleString()}
                                  </p>
                                )}

                              </div>
                            )}

                          </div>

                          {/* STATUS MANAGEMENT */}

                          <div className="w-full lg:w-80 space-y-4">

                            {/* ORDER STATUS SELECTOR */}

                            <div>

                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Update Status
                              </label>

                              <select
                                value={selected}
                                disabled={
                                  isLocked ||
                                  isUpdating
                                }
                                onChange={(e) =>
                                  handleStatusChange(
                                    item._id,
                                    e.target.value
                                  )
                                }
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                              >

                                <option value="pending">
                                  Pending
                                </option>

                                <option value="confirmed">
                                  Confirmed
                                </option>

                             

                                <option value="shipped">
                                  Shipped
                                </option>

                          
                                <option value="delivered">
                                  Delivered
                                </option>

                                <option value="cancelled">
                                  Cancel Order
                                </option>

                              </select>

                            </div>

                            {/* CANCELLATION REASON */}

                            {showCancellation &&
                              !isLocked && (
                                <div>

                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Cancellation
                                    Reason
                                  </label>

                                  <select
                                    value={
                                      selectedReason[
                                        item._id
                                      ] || ""
                                    }
                                    disabled={
                                      isUpdating
                                    }
                                    onChange={(e) =>
                                      handleReasonChange(
                                        item._id,
                                        e.target.value
                                      )
                                    }
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100"
                                  >

                                    <option value="">
                                      Select reason
                                    </option>

                                    {cancellationReasons.map(
                                      (reason) => (
                                        <option
                                          key={reason}
                                          value={reason}
                                        >
                                          {reason}
                                        </option>
                                      )
                                    )}

                                  </select>

                                </div>
                              )}

                            {/* UPDATE BUTTON */}

                            {!isLocked &&
                              statusChanged && (
                                <button
                                  type="button"
                                  disabled={isUpdating}
                                  onClick={() =>
                                    handleUpdateStatus(
                                      order._id,
                                      item._id
                                    )
                                  }
                                  className="w-full bg-black text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {isUpdating
                                    ? "Updating..."
                                    : "Update Status"}
                                </button>
                              )}

                          </div>

                        </div>

                      </div>
                    );
                  })}

                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

export default VendorOrders;
