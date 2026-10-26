import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import api from "../../../api/axios.jsx";
import ReturnRequestDetails from "../components/ReturnRequestDetails.jsx";
import ReturnRequestStatusBadge from "../components/ReturnRequestStatusBadge.jsx";
import {
  formatDate,
  formatMoney,
  formatStatus,
  STATUS_OPTIONS,
} from "../components/returnRequestDisplay.js";

/* ================================================================== */
/* Main page                                                           */
/* ================================================================== */

function ReturnsRefundsSection() {
  // ---- List state ----
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0); // change it to reload the list
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  // ---- Details state ----
  const [selectedId, setSelectedId] = useState(null);
  const [details, setDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Remembers the most recently clicked request, so a slow old response
  // can never replace the details of a newer click.
  const latestId = useRef(null);

  // ---- Lock the page scroll while the details window is open ----
  // (so scrolling inside the window never scrolls the page behind it)
  useEffect(() => {
    if (!selectedId) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedId]);

  // ---- Load the list (runs on first render and when reloadKey changes) ----
  useEffect(() => {
    const loadRequests = async () => {
      try {
        setLoading(true);
        setLoadError("");
        const response = await api.get("/admin/return-requests");
        setRequests(response.data.data || []);
      } catch (error) {
        console.error(error);
        const message =
          error.response?.data?.message || "Failed to load return requests";
        setLoadError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, [reloadKey]);

  // ---- Open a request ----
  const openDetails = async (requestId) => {
    latestId.current = requestId;
    setSelectedId(requestId);
    setDetails(null);
    setLoadingDetails(true);

    try {
      const response = await api.get(`/admin/return-requests/${requestId}`);
      if (latestId.current !== requestId) return; // user clicked another one
      setDetails(response.data.data);
    } catch (error) {
      console.error(error);
      if (latestId.current !== requestId) return;
      toast.error(
        error.response?.data?.message || "Failed to load return request"
      );
      setSelectedId(null);
    } finally {
      if (latestId.current === requestId) setLoadingDetails(false);
    }
  };

  // ---- Close the details window ----
  const closeDetails = () => {
    latestId.current = null;
    setSelectedId(null);
    setDetails(null);
    setLoadingDetails(false);
  };

  // ---- Change the status of the open request ----
  // Returns true if it worked, false if it failed.
  const updateStatus = async (status, bankTransferReference = "") => {
    if (!details || updating) return false;

    try {
      setUpdating(true);
      const response = await api.patch(`/admin/return-requests/${details._id}`, {
        status,
        ...(status === "refunded" ? { bankTransferReference } : {}),
      });

      const newStatus = response.data.data?.status || status;

      // Update only the fields that changed. (Copying the whole response
      // could replace order / item / customer objects with plain ids.)
      setDetails((current) => ({
        ...current,
        status: newStatus,
        ...(status === "refunded" ? { bankTransferReference } : {}),
      }));

      // Update the same request in the list
      setRequests((current) =>
        current.map((request) =>
          request._id === details._id
            ? { ...request, status: newStatus }
            : request
        )
      );

      toast.success(response.data.message || "Return request updated");
      return true;
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message || "Failed to update return request"
      );
      return false;
    } finally {
      setUpdating(false);
    }
  };

  // ---- Work out what to show in the list ----
  const countFor = (status) =>
    status === "all"
      ? requests.length
      : requests.filter((request) => request.status === status).length;

  const searchText = search.trim().toLowerCase();

  const visibleRequests = requests
    .filter((request) => filter === "all" || request.status === filter)
    .filter((request) => {
      if (!searchText) return true;
      const words = [
        request.item?.name,
        request.order?.orderNumber,
        request.customer?.name,
        request.customer?.email,
      ];
      return words.some((word) =>
        String(word || "").toLowerCase().includes(searchText)
      );
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // ---- Content of the details window ----
  let panelContent;
  if (loadingDetails || !details) {
    panelContent = (
      <div className="animate-pulse space-y-3 p-6">
        <div className="h-5 w-2/3 rounded bg-slate-100" />
        <div className="h-4 w-1/3 rounded bg-slate-100" />
        <div className="h-24 rounded bg-slate-100" />
        <div className="h-32 rounded bg-slate-100" />
      </div>
    );
  } else {
    panelContent = (
      <ReturnRequestDetails
        key={selectedId}
        details={details}
        updating={updating}
        onClose={closeDetails}
        onUpdate={updateStatus}
      />
    );
  }

  return (
    <section className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Returns &amp; Refunds</h1>
        <p className="mt-1 text-sm text-slate-600">
          Review return requests and record bank transfer completion.
        </p>
      </div>

      {/* Search and status filter */}
      <div className="space-y-3">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by product, order number, customer name or email"
          aria-label="Search return requests"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {["all", ...STATUS_OPTIONS].map((status) => {
            const isActive = filter === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setFilter(status)}
                aria-pressed={isActive}
                className={`min-w-[100px] shrink-0 rounded-full px-5 py-1.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50"
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <span>{status === "all" ? "All" : formatStatus(status)}</span>
                  <span
                    className={`text-xs ${
                      isActive ? "text-slate-300" : "text-slate-400"
                    }`}
                  >
                    {countFor(status)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------- List of requests (full width) ---------- */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="divide-y divide-slate-100">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="animate-pulse space-y-2 p-4">
                <div className="h-4 w-1/3 rounded bg-slate-100" />
                <div className="h-3 w-1/2 rounded bg-slate-100" />
                <div className="h-3 w-1/4 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        ) : loadError ? (
          <div className="p-8 text-center">
            <p className="text-sm font-medium text-red-600">{loadError}</p>
            <button
              type="button"
              onClick={() => setReloadKey(reloadKey + 1)}
              className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Try again
            </button>
          </div>
        ) : visibleRequests.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-semibold text-slate-800">No return requests found</p>
            <p className="mt-1 text-sm text-slate-500">
              {search || filter !== "all"
                ? "Try clearing the search or status filter."
                : "New requests will appear here."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {visibleRequests.map((request) => {
              const isSelected = selectedId === request._id;
              return (
                <li key={request._id}>
                  <button
                    type="button"
                    onClick={() => openDetails(request._id)}
                    aria-current={isSelected ? "true" : undefined}
                    className={`block w-full border-l-4 p-4 text-left transition hover:bg-slate-50 ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/60"
                        : "border-transparent"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">
                          {request.item?.name || "Order item"}
                        </p>
                        <p className="mt-0.5 truncate text-sm text-slate-600">
                          {request.order?.orderNumber || "Order"} ·{" "}
                          {request.customer?.name || "Customer"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {request.requestedQuantity} unit(s) ·{" "}
                          {formatDate(request.createdAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <ReturnRequestStatusBadge status={request.status} />
                        <p className="font-bold text-slate-900">
                          {formatMoney(request.refundAmount)}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ---------- Details window (opens when a request is clicked) ---------- */}
      {selectedId && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-3 sm:p-6"
          onClick={closeDetails}
        >
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Return request details"
            className="h-[90vh] max-h-[900px] w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {panelContent}
          </aside>
        </div>
      )}
    </section>
  );
}

export default ReturnsRefundsSection;