import { formatStatus, STATUS_META } from "./returnRequestDisplay.js";

function ReturnRequestStatusBadge({ status }) {
  const meta = STATUS_META[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
        meta?.badge || "bg-slate-100 text-slate-600 ring-slate-500/20"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${meta?.dot || "bg-slate-400"}`}
      />
      {formatStatus(status)}
    </span>
  );
}

export default ReturnRequestStatusBadge;
