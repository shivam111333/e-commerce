import * as yup from "yup";
import { objectId } from "./commonValidator.js";

const orderItemSchema = yup.object({
  variant: objectId("variant"),
  quantity: yup
    .number()
    .typeError("Quantity must be a number")
    .integer("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1")
    .required("Quantity is required"),
});

const shippingAddressSchema = yup.object({
  name: yup
    .string()
    .trim()
    .min(2, "Shipping name must be at least 2 characters")
    .max(100, "Shipping name must be at most 100 characters")
    .required("Shipping name is required"),
  phone: yup
    .string()
    .trim()
    .matches(/^\+?[1-9]\d{1,14}$/, "Please enter a valid shipping phone number")
    .required("Shipping phone is required"),
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
  pincode: yup
    .string()
    .trim()
    .matches(/^\d{6}$/, "Pincode must be a valid 6-digit number")
    .required("Pincode is required"),
});

export const createRazorpayOrderSchema = yup.object({
  items: yup
    .array()
    .of(orderItemSchema)
    .min(1, "Order must contain at least one item")
    .required("Order items are required"),
  shippingAddress: shippingAddressSchema.required(
    "Shipping address is required"
  ),
  isBuyNow: yup.boolean().default(false),
});

export const verifyRazorpayPaymentSchema = yup.object({
  razorpay_order_id: yup
    .string()
    .trim()
    .max(100, "Razorpay order ID is too long")
    .required("Razorpay order ID is required"),
  razorpay_payment_id: yup
    .string()
    .trim()
    .max(100, "Razorpay payment ID is too long")
    .required("Razorpay payment ID is required"),
  razorpay_signature: yup
    .string()
    .trim()
    .matches(/^[0-9a-f]{64}$/i, "Razorpay signature must be a valid SHA-256 signature")
    .required("Razorpay signature is required"),
  isBuyNow: yup.boolean().default(false),
});
