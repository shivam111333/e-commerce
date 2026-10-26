import * as yup from "yup";

export const createReturnRequestFormSchema = (maxQuantity) =>
  yup.object({
    requestedQuantity: yup
      .number()
      .typeError("Quantity must be a number")
      .integer("Quantity must be a whole number")
      .min(1, "Return at least one unit")
      .max(maxQuantity, `You can return at most ${maxQuantity} units`)
      .required("Quantity is required"),
    reason: yup
      .string()
      .trim()
      .required("Return reason is required")
      .max(1000, "Reason must be at most 1000 characters"),
    refundBankAccount: yup
      .object({
        accountHolderName: yup
          .string()
          .trim()
          .min(2, "Name must be at least 2 characters")
          .max(100, "Name must be at most 100 characters")
          .required("Account holder name is required"),
        accountNumber: yup
          .string()
          .trim()
          .matches(/^\d{6,18}$/, "Account number must contain 6 to 18 digits")
          .required("Account number is required"),
        ifscCode: yup
          .string()
          .trim()
          .uppercase()
          .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Enter a valid IFSC code")
          .required("IFSC code is required"),
      })
      .required("Bank details are required"),
  });
