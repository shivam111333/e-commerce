import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  formatDate,
  formatMoney,
  formatStatus,
} from "./returnRequestDisplay.js";
import ReturnRequestStatusBadge from "./ReturnRequestStatusBadge.jsx";

const FLOW = ["requested", "approved", "received", "refund_pending", "refunded"];

const maskAccount = (number) =>
  number ? `•••• •••• ${String(number).slice(-4)}` : "—";

const copyText = async (text, label) => {
  try {
    await navigator.clipboard.writeText(String(text));
    toast.success(`${label} copied`);
  } catch {
    toast.error("Couldn't copy to clipboard");
  }
};

function Timeline({ status }) {
  if (status === "rejected" || status === "cancelled") {
    return (
      <div
        className={`rounded-xl px-4 py-3 text-sm font-medium ${status === "rejected"
            ? "bg-red-50 text-red-700"
            : "bg-slate-100 text-slate-600"
          }`}
      >
        This request was {formatStatus(status).toLowerCase()}. No further
        action is needed.
      </div>
    );
  }

  const currentIndex = FLOW.indexOf(status);

  return (
    <ol>
      {FLOW.map((step, index) => {
        const isDone = index < currentIndex || status === "refunded";
        const isActive = index === currentIndex && status !== "refunded";
        const isLast = index === FLOW.length - 1;

        let circleClass = "border-2 border-slate-200 bg-white text-slate-300";
        if (isDone) circleClass = "bg-emerald-500 text-white";
        if (isActive) circleClass = "bg-blue-600 text-white ring-4 ring-blue-100";

        let textClass = "text-slate-400";
        if (isDone) textClass = "text-slate-700";
        if (isActive) textClass = "font-semibold text-slate-900";

        return (
          <li key={step} className="relative flex gap-3 pb-4 last:pb-0">
            {!isLast && (
              <span
                className={`absolute left-[9px] top-5 h-full w-0.5 ${isDone ? "bg-emerald-400" : "bg-slate-200"
                  }`}
              />
            )}
            <span
              className={`relative z-10 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${circleClass}`}
            >
              {isDone ? "✓" : ""}
            </span>
            <span className={`text-sm ${textClass}`}>{formatStatus(step)}</span>
          </li>
        );
      })}
    </ol>
  );
}

function ConfirmDialog({ dialog, busy, onConfirm, onCancel }) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [busy, onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={() => !busy && onCancel()}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-slate-900">{dialog.title}</h3>
        <div className="mt-2 space-y-2 text-sm text-slate-600">
          {dialog.description}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Go back
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${dialog.color}`}
          >
            {busy ? "Saving…" : dialog.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function ActionButton({ label, color, disabled, onClick, fullWidth }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${fullWidth ? "w-full" : "flex-1"
        } ${color}`}
    >
      {label}
    </button>
  );
}

function BankRow({ label, value, copyLabel }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-amber-800/80">{label}</dt>
      <dd className="flex items-center gap-2 font-mono font-medium text-amber-950">
        {value}
        {copyLabel && (
          <button
            type="button"
            onClick={() => copyText(copyLabel.text, copyLabel.name)}
            className="rounded bg-amber-100 px-1.5 py-0.5 font-sans text-xs font-semibold text-amber-800 hover:bg-amber-200"
          >
            Copy
          </button>
        )}
      </dd>
    </div>
  );
}

function ReturnRequestDetails({ details, updating, onClose, onUpdate }) {
  const [reference, setReference] = useState("");
  const [showAccount, setShowAccount] = useState(false);
  const [dialog, setDialog] = useState(null);

  const bank = details.refundBankAccount || {};
  const itemName =
    details.item && typeof details.item === "object" ? details.item.name : "";
  const status = details.status;

  const askToReject = () => {
    setDialog({
      status: "rejected",
      title: "Reject this return request?",
      description: (
        <p>
          The customer's request will be closed and no refund will be issued.
          This can't be undone.
        </p>
      ),
      confirmLabel: "Reject request",
      color: "bg-red-600 hover:bg-red-700",
    });
  };

  const askToRefund = () => {
    if (!reference.trim()) {
      toast.error("Enter the bank transfer reference first");
      return;
    }
    setDialog({
      status: "refunded",
      title: "Confirm refund transfer",
      description: (
        <>
          <p>
            You are marking <b>{formatMoney(details.refundAmount)}</b> as
            refunded to <b>{bank.accountHolderName || "the customer"}</b> (
            {maskAccount(bank.accountNumber)}).
          </p>
          <p>
            Reference: <b>{reference.trim()}</b>
          </p>
          <p className="text-xs text-slate-500">
            Only confirm once the bank transfer has actually been made.
          </p>
        </>
      ),
      confirmLabel: "Yes, mark refunded",
      color: "bg-emerald-600 hover:bg-emerald-700",
    });
  };

  const handleConfirm = async () => {
    const success = await onUpdate(dialog.status, reference.trim());
    if (success) {
      setDialog(null);
      setReference("");
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="z-10 flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 bg-white p-5">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Return request
          </p>
          <h2 className="mt-1 truncate text-lg font-bold text-slate-900">
            {itemName || "Order item"}
          </h2>
          <p className="mt-0.5 text-sm text-slate-600">
            {details.order?.orderNumber || "Order"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ReturnRequestStatusBadge status={status} />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="return-request-details-scroll min-h-0 flex-1 space-y-5 overflow-y-scroll overscroll-contain p-5">
        <div className="rounded-xl bg-slate-900 p-4 text-white">
          <p className="text-xs uppercase tracking-wide text-slate-300">
            Refund amount
          </p>
          <p className="mt-1 text-3xl font-bold">
            {formatMoney(details.refundAmount)}
          </p>
          <p className="mt-1 text-xs text-slate-300">
            {details.requestedQuantity} unit(s) ·{" "}
            <span className="uppercase">
              {details.order?.payment?.method || "—"}
            </span>
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-800">Progress</h3>
          <Timeline status={status} />
        </div>

        <dl className="space-y-2 rounded-xl border border-slate-100 p-4 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">Customer</dt>
            <dd className="text-right font-medium text-slate-900">
              {details.customer?.name || "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">Email</dt>
            <dd className="break-all text-right font-medium text-slate-900">
              {details.customer?.email || "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">Submitted</dt>
            <dd className="text-right font-medium text-slate-900">
              {formatDate(details.createdAt)}
            </dd>
          </div>
        </dl>

        <div>
          <h3 className="text-sm font-semibold text-slate-800">Customer reason</h3>
          <p className="mt-1 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
            {details.reason || "No reason provided."}
          </p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-amber-900">Refund bank details</h3>
            <button
              type="button"
              onClick={() => setShowAccount(!showAccount)}
              className="text-xs font-semibold text-amber-800 underline"
            >
              {showAccount ? "Hide" : "Reveal"} account no.
            </button>
          </div>
          <dl className="mt-3 space-y-2">
            <BankRow label="Holder" value={bank.accountHolderName || "—"} />
            <BankRow
              label="Account"
              value={
                showAccount
                  ? bank.accountNumber || "—"
                  : maskAccount(bank.accountNumber)
              }
              copyLabel={
                bank.accountNumber
                  ? { text: bank.accountNumber, name: "Account number" }
                  : null
              }
            />
            <BankRow
              label="IFSC"
              value={bank.ifscCode || "—"}
              copyLabel={
                bank.ifscCode ? { text: bank.ifscCode, name: "IFSC" } : null
              }
            />
          </dl>
        </div>

        {details.bankTransferReference && (
          <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
            Transfer reference:{" "}
            <span className="font-mono font-semibold">
              {details.bankTransferReference}
            </span>
          </div>
        )}

        <div className="space-y-3 border-t border-slate-100 pt-4 empty:hidden">
          {status === "requested" && (
            <div className="flex gap-2">
              <ActionButton
                label="Approve"
                color="bg-emerald-600 hover:bg-emerald-700"
                disabled={updating}
                onClick={() => onUpdate("approved")}
              />
              <ActionButton
                label="Reject"
                color="bg-red-600 hover:bg-red-700"
                disabled={updating}
                onClick={askToReject}
              />
            </div>
          )}



          {status === "approved" && (
            <div className="flex gap-2">
              <ActionButton
                label="Mark received"
                color="bg-blue-600 hover:bg-blue-700"
                disabled={updating}
                onClick={() => onUpdate("received")}
              />

              <ActionButton
                label="Reject"
                color="bg-red-600 hover:bg-red-700"
                disabled={updating}
                onClick={askToReject}
              />
            </div>
          )}

          {status === "received" && (
            <div className="flex gap-2">
              <ActionButton
                label="Mark refund pending"
                color="bg-orange-600 hover:bg-orange-700"
                disabled={updating}
                onClick={() => onUpdate("refund_pending")}
              />

              <ActionButton
                label="Reject"
                color="bg-red-600 hover:bg-red-700"
                disabled={updating}
                onClick={askToReject}
              />
            </div>
          )}
          {status === "refund_pending" && (
            <>
              <label className="block text-sm font-medium text-slate-700">
                Bank transfer reference (UTR)
                <input
                  type="text"
                  maxLength={100}
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                  placeholder="e.g. UTR / IMPS / NEFT reference"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>
              <ActionButton
                fullWidth
                label="Confirm transfer & mark refunded"
                color="bg-emerald-600 hover:bg-emerald-700"
                disabled={updating || !reference.trim()}
                onClick={askToRefund}
              />
            </>
          )}
        </div>
      </div>

      {dialog && (
        <ConfirmDialog
          dialog={dialog}
          busy={updating}
          onConfirm={handleConfirm}
          onCancel={() => setDialog(null)}
        />
      )}
    </div>
  );
}

export default ReturnRequestDetails;
