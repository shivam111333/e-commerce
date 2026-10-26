import { useEffect, useState } from "react";
import { Form, Formik } from "formik";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import api from "../../api/axios.jsx";
import FormField from "../../component/FormField.jsx";
import { createReturnRequestFormSchema } from "../../validation/returnRequestSchemas.js";

const RETURN_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function ReturnRequest() {
  const { orderId, itemId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [orderItem, setOrderItem] = useState(null);
  const [existingRequest, setExistingRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const loadReturnDetails = async () => {
      try {
        const [ordersResponse, returnsResponse] = await Promise.all([
          api.get("/order/my-orders"),
          api.get("/order/returns/my"),
        ]);
        const order = (ordersResponse.data.data || []).find(
          (candidate) => String(candidate._id) === orderId
        );
        const item = order?.items?.find(
          (candidate) => String(candidate._id) === itemId
        );

        if (!order || !item) {
          setError("Order item not found.");
          return;
        }

        setOrderItem({ order, item });
        const request = (returnsResponse.data.data || []).find(
          (candidate) =>
            String(candidate.order) === orderId &&
            String(candidate.item) === itemId
        );
        setExistingRequest(request || null);

        const deliveredAt = item.deliveredAt
          ? new Date(item.deliveredAt).getTime()
          : NaN;
        const eligible =
          ["online", "cod"].includes(order.payment?.method) &&
          item.status === "delivered" &&
          item.paymentStatus === "paid" &&
          Number.isFinite(deliveredAt) &&
          deliveredAt <= Date.now() &&
          Date.now() - deliveredAt <= RETURN_WINDOW_MS;

        if (!request && !eligible) {
          setError(
            "This item is not eligible for return. It must be delivered and paid, and the request must be made within 7 days of delivery."
          );
        }
      } catch (loadError) {
        console.error(loadError);
        setError(
          loadError.response?.data?.message ||
            "Unable to load this return request."
        );
      } finally {
        setLoading(false);
      }
    };

    loadReturnDetails();
  }, [isAuthenticated, itemId, navigate, orderId]);

  const submitReturnRequest = async (values, actions) => {
    try {
      await api.post(`/order/${orderId}/item/${itemId}/return`, {
        requestedQuantity: Number(values.requestedQuantity),
        reason: values.reason.trim(),
        refundBankAccount: {
          ...values.refundBankAccount,
          ifscCode: values.refundBankAccount.ifscCode.trim().toUpperCase(),
        },
      });

      toast.success("Return request submitted successfully");
      navigate("/orders");
    } catch (submitError) {
      toast.error(
        submitError.response?.data?.message ||
          "Failed to submit return request"
      );
      actions.setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-gray-50">
        <p className="text-lg text-gray-600">Loading return details...</p>
      </div>
    );
  }

  if (error || !orderItem) {
    return (
      <main className="min-h-[60vh] bg-gray-50 px-4 py-10">
        <div className="mx-auto max-w-2xl rounded-xl bg-white p-6 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">
            {existingRequest ? "Return already requested" : "Cannot request return"}
          </h1>
          <p className="mt-2 text-gray-600">
            {existingRequest
              ? `This item already has a return request: ${existingRequest.status.replace(/_/g, " ")}.`
              : error}
          </p>
          <button
            type="button"
            onClick={() => navigate("/orders")}
            className="mt-5 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
          >
            Back to My Orders
          </button>
        </div>
      </main>
    );
  }

  const { order, item } = orderItem;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <button
          type="button"
          onClick={() => navigate("/orders")}
          className="mb-5 text-sm font-medium text-blue-700 hover:text-blue-900"
        >
          &larr; Back to My Orders
        </button>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold text-gray-900">Request a return</h1>
          <p className="mt-1 text-sm text-gray-500">
            Order {order.orderNumber || order._id}
          </p>

          <div className="mt-5 rounded-lg bg-gray-50 p-4">
            <h2 className="font-semibold text-gray-900">{item.name}</h2>
            <p className="mt-1 text-sm text-gray-600">
              Quantity purchased: {item.quantity} · ₹
              {Number(item.price).toLocaleString("en-IN")} per unit
            </p>
          </div>

          <Formik
            initialValues={{
              requestedQuantity: 1,
              reason: "",
              refundBankAccount: {
                accountHolderName: "",
                accountNumber: "",
                ifscCode: "",
              },
            }}
            validationSchema={createReturnRequestFormSchema(item.quantity)}
            onSubmit={submitReturnRequest}
          >
            {({ isSubmitting }) => (
              <Form noValidate className="mt-6 space-y-4">
                <FormField
                  name="requestedQuantity"
                  label="Quantity to return"
                  type="number"
                  min="1"
                  max={item.quantity}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  containerClassName="mb-0"
                />
                <FormField
                  name="reason"
                  label="Reason for return"
                  as="textarea"
                  rows={4}
                  maxLength={1000}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  containerClassName="mb-0"
                />

                <div className="border-t pt-4">
                  <h2 className="mb-3 font-semibold text-gray-900">
                    Bank details for refund
                  </h2>
                  <div className="space-y-4">
                    <FormField
                      name="refundBankAccount.accountHolderName"
                      label="Account holder name"
                      autoComplete="name"
                      maxLength={100}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      containerClassName="mb-0"
                    />
                    <FormField
                      name="refundBankAccount.accountNumber"
                      label="Bank account number"
                      inputMode="numeric"
                      autoComplete="off"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      containerClassName="mb-0"
                    />
                    <FormField
                      name="refundBankAccount.ifscCode"
                      label="IFSC code"
                      autoCapitalize="characters"
                      maxLength={11}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 uppercase"
                      containerClassName="mb-0"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? "Submitting..." : "Submit return request"}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/orders")}
                    disabled={isSubmitting}
                    className="rounded-lg border border-gray-300 px-5 py-2.5 font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </section>
      </div>
    </main>
  );
}

export default ReturnRequest;
