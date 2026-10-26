import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import api from "../../../api/axios.jsx";
import { FaBox, FaMapMarkerAlt, FaUndoAlt } from "react-icons/fa";

// Statuses the admin can set manually
const PAYMENT_OPTIONS = ["pending", "paid"];

const optionsFor = (current) =>
  !current || PAYMENT_OPTIONS.includes(current)
    ? PAYMENT_OPTIONS
    : [...PAYMENT_OPTIONS, current];

const formatLabel = (value) =>
  String(value || "")
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());

const formatDate = (isoString) => {
  if (!isoString) return "N/A";
  return new Date(isoString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatMoney = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

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

/* ---------- order logic helpers ---------- */

const isCancelledItem = (item) => item.status === "cancelled";

const getActiveItems = (order) =>
  (order.items || []).filter((item) => !isCancelledItem(item));

// "none" | "partial" | "cancelled"
const getCancelState = (order) => {
  const items = order.items || [];
  const cancelled = items.filter(isCancelledItem).length;
  if (items.length > 0 && cancelled === items.length) return "cancelled";
  if (cancelled > 0) return "partial";
  return "none";
};

// For COD orders the order-level status follows the active (non-cancelled)
// items: all paid -> paid, otherwise pending. Other methods use the stored value.
const getDerivedPaymentStatus = (order) => {
  const stored = order.payment?.status || "pending";

  if (order.payment?.method !== "cod") return stored;
  if (!PAYMENT_OPTIONS.includes(stored)) return stored;

  const active = getActiveItems(order);
  if (active.length === 0) return stored;

  return active.every((item) => (item.paymentStatus || "pending") === "paid")
    ? "paid"
    : "pending";
};

const sumItems = (items) =>
  items.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );

function OrderSection() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [cancelFilter, setCancelFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [busy, setBusy] = useState({});

  // showLoader = false refreshes quietly (used after updates)
  const loadOrders = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setError(false);

      const response = await api.get("/order/all");
      setOrders(response.data.data || []);
    } catch (err) {
      console.error(err);
      if (showLoader) {
        setError(true);
        toast.error("Failed to load Orders");
      }
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const query = search.trim().toLowerCase();

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        !query ||
        (order.orderNumber || "").toLowerCase().includes(query) ||
        String(order._id).toLowerCase().includes(query);

      const cancelState = getCancelState(order);
      const matchesCancel =
        cancelFilter === "all" ||
        (cancelFilter === "active" && cancelState === "none") ||
        (cancelFilter === "partial" && cancelState === "partial") ||
        (cancelFilter === "cancelled" && cancelState === "cancelled");

      const matchesMethod =
        methodFilter === "all" || order.payment?.method === methodFilter;

      return matchesSearch && matchesCancel && matchesMethod;
    });
  }, [orders, query, cancelFilter, methodFilter]);

  const withBusy = async (key, fn) => {
    if (busy[key]) return;
    setBusy((prev) => ({ ...prev, [key]: true }));
    try {
      await fn();
    } finally {
      setBusy((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const updateGlobalPaymentStatus = (orderId, paymentStatus) =>
    withBusy(orderId, async () => {
      try {
        const response = await api.patch(`/order/${orderId}/payment-status`, {
          paymentStatus,
        });

        toast.success(response.data.message);

        // Order status applies to every active (non-cancelled) item
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order._id === orderId
              ? {
                  ...order,
                  payment: { ...order.payment, status: paymentStatus },
                  items: order.items.map((item) =>
                    isCancelledItem(item) ? item : { ...item, paymentStatus }
                  ),
                }
              : order
          )
        );

        loadOrders(false);
      } catch (err) {
        console.error(err);
        toast.error(
          err.response?.data?.message || "Failed to update payment status"
        );
      }
    });

  const updateItemPaymentStatus = (orderId, itemId, paymentStatus) =>
    withBusy(`${orderId}:${itemId}`, async () => {
      try {
        const response = await api.patch(
          `/order/${orderId}/item/${itemId}/payment-status`,
          { paymentStatus }
        );

        toast.success(response.data.message);

        // The order-level status is derived from items, so it updates itself
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

        loadOrders(false);
      } catch (err) {
        console.error(err);
        toast.error(
          err.response?.data?.message || "Failed to update item payment status"
        );
      }
    });

  if (loading) {
    return <p>Loading Orders...</p>;
  }

  const hasFilters = search || cancelFilter !== "all" || methodFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setCancelFilter("all");
    setMethodFilter("all");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="mx-auto w-full max-w-6xl px-0 sm:px-1">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">
            All Orders
          </h1>
          <p className="mt-1 text-gray-500">Track and manage all orders</p>
        </div>

        {/* Search + filters */}
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order number or ID..."
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:max-w-md"
          />

          <select
            value={cancelFilter}
            onChange={(e) => setCancelFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm"
          >
            <option value="all">All orders</option>
            <option value="active">No cancellations</option>
            <option value="partial">Partially cancelled</option>
            <option value="cancelled">Fully cancelled</option>
          </select>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm"
          >
            <option value="all">All payment methods</option>
            <option value="cod">COD</option>
            <option value="online">ONLINE</option>
          </select>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Clear
            </button>
          )}
        </div>

        {error ? (
          <div className="rounded-xl bg-white p-6 text-center shadow-sm sm:p-10">
            <FaBox className="mx-auto mb-4 text-5xl text-gray-300" />
            <h2 className="text-xl font-semibold text-gray-700">
              Couldn't load orders
            </h2>
            <p className="mt-2 text-gray-500">
              Something went wrong while fetching the orders.
            </p>
            <button
              onClick={() => loadOrders()}
              className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Retry
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-xl bg-white p-6 text-center shadow-sm sm:p-10">
            <FaBox className="mx-auto mb-4 text-5xl text-gray-300" />
            <h2 className="text-xl font-semibold text-gray-700">
              No orders yet
            </h2>
            <p className="mt-2 text-gray-500">
              No orders have been placed yet.
            </p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-xl bg-white p-6 text-center shadow-sm sm:p-10">
            <FaBox className="mx-auto mb-4 text-5xl text-gray-300" />
            <h2 className="text-xl font-semibold text-gray-700">
              No matching orders
            </h2>
            <p className="mt-2 text-gray-500">
              No orders match your search or filters.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => {
              const isCod = order.payment?.method === "cod";
              const cancelState = getCancelState(order);
              const allCancelled = cancelState === "cancelled";
              const orderStatus = getDerivedPaymentStatus(order);

              const activeItems = getActiveItems(order);
              const activeTotal = sumItems(activeItems);
              const cancelledTotal = sumItems(
                (order.items || []).filter(isCancelledItem)
              );
              const returnItems = (order.items || []).filter(
                (item) => item.returnRequest
              );
              const requestedRefundTotal = returnItems
                .filter((item) => item.returnRequest.status === "requested")
                .reduce(
                  (sum, item) =>
                    sum + Number(item.returnRequest.refundAmount || 0),
                  0
                );
              const pendingRefundTotal = returnItems
                .filter((item) =>
                  ["approved", "received", "refund_pending"].includes(
                    item.returnRequest.status
                  )
                )
                .reduce(
                  (sum, item) =>
                    sum + Number(item.returnRequest.refundAmount || 0),
                  0
                );
              const completedRefundTotal = returnItems
                .filter((item) => item.returnRequest.status === "refunded")
                .reduce(
                  (sum, item) =>
                    sum + Number(item.returnRequest.refundAmount || 0),
                  0
                );

              // Used by the summary header and the progress bar
              const returnTotal =
                requestedRefundTotal +
                pendingRefundTotal +
                completedRefundTotal;
              const percent = (value) =>
                returnTotal > 0 ? (value / returnTotal) * 100 : 0;

              const orderBusy = !!busy[order._id];

              return (
                <div
                  key={order._id}
                  className={`overflow-hidden rounded-xl border bg-white shadow-sm ${
                    allCancelled ? "border-red-200" : "border-gray-200"
                  }`}
                >
                  {/* Order Header */}
                  <div className="border-b border-gray-200 bg-gray-50 px-4 py-4 sm:px-6">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Order Number</p>
                        <p className="font-semibold text-gray-800">
                          {order.orderNumber || order._id}
                        </p>
                        {cancelState !== "none" && (
                          <span className="mt-1 inline-block rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                            {allCancelled ? "Cancelled" : "Partially cancelled"}
                          </span>
                        )}
                      </div>

                      {order.user?.name && (
                        <div>
                          <p className="text-sm text-gray-500">Customer</p>
                          <p className="font-medium text-gray-800">
                            {order.user.name}
                          </p>
                        </div>
                      )}

                      <div>
                        <p className="text-sm text-gray-500">Ordered on</p>
                        <p className="font-medium text-gray-800">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500">Payment Method</p>
                        <p className="font-medium text-gray-800">
                          {order.payment?.method?.toUpperCase() || "N/A"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500">Payment Status</p>
                        <select
                          value={orderStatus}
                          onChange={(e) =>
                            updateGlobalPaymentStatus(order._id, e.target.value)
                          }
                          disabled={
                            !isCod ||
                            allCancelled ||
                            returnItems.length > 0 ||
                            orderBusy
                          }
                          className="w-full max-w-full rounded-lg border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-gray-100 sm:w-auto"
                        >
                          {optionsFor(orderStatus).map((s) => (
                            <option key={s} value={s}>
                              {formatLabel(s)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500">Total</p>
                        <p
                          className={`text-lg font-bold ${
                            allCancelled
                              ? "text-gray-400 line-through"
                              : "text-gray-800"
                          }`}
                        >
                          {formatMoney(order.totalAmount)}
                        </p>
                        {cancelState === "partial" && (
                          <p className="text-xs text-gray-500">
                            {formatMoney(activeTotal)} active items
                            <br />
                            {formatMoney(cancelledTotal)} cancelled
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="p-4 sm:p-6">
                    <h2 className="mb-4 text-lg font-semibold text-gray-800">
                      Items
                    </h2>

                    {/* Returns & refunds summary for the whole order */}
                    {returnItems.length > 0 && (
                      <div className="-mx-4 mb-5 border-y border-orange-200 bg-orange-50 px-4 py-5 sm:-mx-6 sm:px-6">
                        {/* Header */}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                              <FaUndoAlt />
                            </span>
                            <div>
                              <h3 className="font-semibold text-gray-800">
                                Returns &amp; refunds
                              </h3>
                              <p className="text-xs text-gray-500">
                                {returnItems.length} item
                                {returnItems.length > 1 ? "s" : ""} with a
                                return request
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-xs text-gray-500">
                              Total return value
                            </p>
                            <p className="text-lg font-bold text-gray-800">
                              {formatMoney(returnTotal)}
                            </p>
                          </div>
                        </div>

                        {/* Progress bar: how the money is split */}
                        {returnTotal > 0 && (
                          <div
                            className="mt-4 flex h-2 overflow-hidden rounded-full bg-white ring-1 ring-orange-100"
                            aria-hidden="true"
                          >
                            <div
                              className="bg-blue-500"
                              style={{ width: `${percent(requestedRefundTotal)}%` }}
                            />
                            <div
                              className="bg-amber-500"
                              style={{ width: `${percent(pendingRefundTotal)}%` }}
                            />
                            <div
                              className="bg-green-500"
                              style={{ width: `${percent(completedRefundTotal)}%` }}
                            />
                          </div>
                        )}

                        {/* Stat tiles */}
                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <div className="rounded-lg border border-blue-100 bg-white p-3 shadow-sm">
                            <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                              <span className="h-2 w-2 rounded-full bg-blue-500" />
                              Requested
                            </div>
                            <p className="mt-1 text-xl font-bold text-gray-800">
                              {formatMoney(requestedRefundTotal)}
                            </p>
                            <p className="text-xs text-gray-400">
                              Waiting for review
                            </p>
                          </div>

                          <div className="rounded-lg border border-amber-200 bg-white p-3 shadow-sm">
                            <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                              <span className="h-2 w-2 rounded-full bg-amber-500" />
                              Pending refund
                            </div>
                            <p className="mt-1 text-xl font-bold text-amber-700">
                              {formatMoney(pendingRefundTotal)}
                            </p>
                            <p className="text-xs text-gray-400">
                              Approved, not yet paid back
                            </p>
                          </div>

                          <div className="rounded-lg border border-green-200 bg-white p-3 shadow-sm">
                            <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                              <span className="h-2 w-2 rounded-full bg-green-500" />
                              Refunded
                            </div>
                            <p className="mt-1 text-xl font-bold text-green-700">
                              {formatMoney(completedRefundTotal)}
                            </p>
                            <p className="text-xs text-gray-400">
                              Money returned
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      {order.items?.map((item) => {
                        const itemStatus = item.paymentStatus || "pending";
                        const isCancelled = isCancelledItem(item);
                        const itemBusy = !!busy[`${order._id}:${item._id}`];
                        const itemTotal =
                          Number(item.price) * Number(item.quantity);

                        // paid online, then cancelled -> money must go back
                        const needsRefund =
                          isCancelled &&
                          !isCod &&
                          order.payment?.status === "paid";

                        return (
                          <div
                            key={item._id}
                            className={`rounded-lg border p-3 sm:p-4 ${
                              isCancelled
                                ? "border-red-200 bg-red-50/40"
                                : "border-gray-200"
                            }`}
                          >
                            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                              {/* Product Info */}
                              <div
                                className={`flex-1 ${
                                  isCancelled ? "opacity-60" : ""
                                }`}
                              >
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

                              {/* Price + Status */}
                              <div className="md:text-right">
                                <p className="text-lg font-bold text-gray-800">
                                  {formatMoney(item.price)}
                                </p>

                                <p className="text-sm text-gray-500">
                                  {formatMoney(itemTotal)} total
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
                                    value={itemStatus}
                                    onChange={(e) =>
                                      updateItemPaymentStatus(
                                        order._id,
                                        item._id,
                                        e.target.value
                                      )
                                    }
                                    disabled={
                                      !isCod ||
                                      isCancelled ||
                                      !!item.returnRequest ||
                                      itemBusy
                                    }
                                    className="w-full max-w-full rounded-lg border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-gray-100 sm:w-auto"
                                  >
                                    {optionsFor(itemStatus).map((s) => (
                                      <option key={s} value={s}>
                                        {formatLabel(s)}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                {isCancelled && (
                                  <div className="mt-3 border-t border-red-200 pt-2 text-sm text-red-600">
                                    <p className="font-medium">
                                      Cancelled
                                      {item.cancelledBy
                                        ? ` by ${item.cancelledBy}`
                                        : ""}
                                    </p>

                                    {item.cancellationReason && (
                                      <p>Reason: {item.cancellationReason}</p>
                                    )}

                                    {needsRefund && (
                                      <p className="mt-1 font-medium text-orange-700">
                                        Paid online: refund of{" "}
                                        {formatMoney(itemTotal)} needs to be
                                        processed.
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Return summary: full width under the item,
                                outside the narrow right-hand column */}
                            {item.returnRequest && (
                              <div className="mt-4 w-full rounded-lg border border-blue-200 bg-blue-50 p-3 text-left text-sm text-blue-900 sm:p-4">
                                <p className="font-semibold">
                                  Return:{" "}
                                  {formatLabel(item.returnRequest.status)}
                                </p>

                                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-6">
                                  <div>
                                    <p className="text-xs text-blue-800/80">
                                      Quantity
                                    </p>
                                    <p className="font-medium">
                                      {item.returnRequest.requestedQuantity}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-blue-800/80">
                                      Refund amount
                                    </p>
                                    <p className="font-medium">
                                      {formatMoney(
                                        item.returnRequest.refundAmount
                                      )}
                                    </p>
                                  </div>
                                  {item.returnRequest.refundProcessedAt && (
                                    <div>
                                      <p className="text-xs text-blue-800/80">
                                        Refunded on
                                      </p>
                                      <p className="font-medium">
                                        {formatDate(
                                          item.returnRequest.refundProcessedAt
                                        )}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
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

export default OrderSection;