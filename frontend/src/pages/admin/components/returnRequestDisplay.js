export const STATUS_META = {
  requested: {
    label: "Requested",
    badge: "bg-amber-50 text-amber-700 ring-amber-600/20",
    dot: "bg-amber-500",
  },
  approved: {
    label: "Approved",
    badge: "bg-blue-50 text-blue-700 ring-blue-600/20",
    dot: "bg-blue-500",
  },
  rejected: {
    label: "Rejected",
    badge: "bg-red-50 text-red-700 ring-red-600/20",
    dot: "bg-red-500",
  },
  received: {
    label: "Received",
    badge: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
    dot: "bg-indigo-500",
  },
  refund_pending: {
    label: "Refund pending",
    badge: "bg-orange-50 text-orange-700 ring-orange-600/20",
    dot: "bg-orange-500",
  },
  refunded: {
    label: "Refunded",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    dot: "bg-emerald-500",
  },
  cancelled: {
    label: "Cancelled",
    badge: "bg-slate-100 text-slate-600 ring-slate-500/20",
    dot: "bg-slate-400",
  },
};

export const STATUS_OPTIONS = Object.keys(STATUS_META);

export const formatStatus = (status) =>
  STATUS_META[status]?.label || "Unknown";

export const formatMoney = (amount) =>
  `₹${(Number(amount) || 0).toLocaleString("en-IN")}`;

export const formatDate = (date) =>
  date
    ? new Date(date).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";
