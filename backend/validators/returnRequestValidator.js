import * as yup from "yup";

export const createReturnRequestSchema = yup.object({
  requestedQuantity: yup
    .number()
    .typeError("Requested quantity must be a number")
    .integer("Requested quantity must be a whole number")
    .min(1, "Requested quantity must be at least 1")
    .required("Requested quantity is required"),
  reason: yup
    .string()
    .trim()
    .min(1, "Return reason is required")
    .max(1000, "Return reason must be at most 1000 characters")
    .required("Return reason is required"),
  refundBankAccount: yup
    .object({
      accountHolderName: yup
        .string()
        .trim()
        .min(2, "Account holder name must be at least 2 characters")
        .max(100, "Account holder name must be at most 100 characters")
        .required("Account holder name is required"),
      accountNumber: yup
        .string()
        .matches(/^\d{6,18}$/, "Enter a valid account number")
        .required("Account number is required"),
      ifscCode: yup
        .string()
        .trim()
        .uppercase()
        .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Enter a valid IFSC code")
        .required("IFSC code is required"),
    })
    .required("Refund bank details are required"),
});

export const returnRequestParamsSchema = yup.object({
  requestId: yup
    .string()
    .trim()
    .matches(/^[0-9a-fA-F]{24}$/, "Invalid return request id")
    .required("Return request id is required"),
});

export const updateReturnRequestStatusSchema = yup.object({
  status: yup
    .string()
    .oneOf(
      ["approved", "rejected", "received", "refund_pending", "refunded"],
      "Invalid return request status"
    )
    .required("Return request status is required"),
  bankTransferReference: yup
    .string()
    .trim()
    .max(100, "Transfer reference must be at most 100 characters")
    .when("status", {
      is: "refunded",
      then: (schema) => schema.required("Bank transfer reference is required"),
      otherwise: (schema) => schema.optional(),
    }),
});
