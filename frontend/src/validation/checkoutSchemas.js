import * as yup from "yup";
import { phoneRule, pincodeRule } from "./commonSchemas.js";

// Mirrors the shippingAddress schema in backend/validators/orderValidator.js
// and backend/validators/paymentValidator.js.
export const checkoutAddressSchema = yup.object({
  shippingAddress: yup
    .object({
      name: yup
        .string()
        .trim()
        .min(2, "Shipping name must be at least 2 characters")
        .max(100, "Shipping name must be at most 100 characters")
        .required("Shipping name is required"),
      phone: phoneRule(
        "Shipping phone is required",
        "Please enter a valid shipping phone number"
      ),
      address: yup
        .string()
        .trim()
        .min(5, "Address must be at least 5 characters")
        .max(300, "Address must be at most 300 characters")
        .required("Address is required"),
      city: yup
        .string()
        .trim()
        .min(2, "City must be at least 2 characters")
        .max(100, "City must be at most 100 characters")
        .required("City is required"),
      state: yup
        .string()
        .trim()
        .min(2, "State must be at least 2 characters")
        .max(100, "State must be at most 100 characters")
        .required("State is required"),
      pincode: pincodeRule(),
    })
    .required("Shipping address is required"),
});
