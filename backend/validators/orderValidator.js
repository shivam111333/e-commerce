import * as yup from "yup";
import { objectId, phoneRule, pincodeRule } from "./commonValidator.js";

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
});

// POST /api/order
export const createOrderSchema = yup.object({
  items: yup
    .array()
    .of(orderItemSchema)
    .min(1, "Order must contain at least one item")
    .required("Order items are required"),

  shippingAddress: shippingAddressSchema.required(
    "Shipping address is required"
  ),

  paymentMethod: yup
    .string()
    .oneOf(
      ["cod"],
      "Only COD orders can be created through this endpoint"
    )
    .default("cod"),

  isBuyNow: yup
    .boolean()
    .default(false),
});

// PATCH /api/order/:orderId/item/:itemId/status
export const updateOrderItemStatusSchema = yup.object({
  status: yup
    .string()
    .oneOf(
      [
        "pending",
        "confirmed",
        "shipped",
        "delivered",
        "cancelled",
      ],
      "Invalid order status"
    )
    .required("Order status is required"),

  cancellationReason: yup
    .string()
    .trim()
    .max(
      500,
      "Cancellation reason must be at most 500 characters"
    )
    .optional(),
});

// PATCH /api/order/:orderId/payment-status
export const updateOrderPaymentStatusSchema = yup.object({
  paymentStatus: yup
    .string()
    .oneOf(
      ["pending", "paid", "failed"],
      "Invalid payment status"
    )
    .required("Payment status is required"),
});

// PATCH /api/order/:orderId/item/:itemId/payment-status
export const updateOrderItemPaymentStatusSchema = yup.object({
  paymentStatus: yup
    .string()
    .oneOf(
      ["pending", "paid", "failed"],
      "Invalid payment status"
    )
    .required("Payment status is required"),
});

// /:orderId
export const orderParamsSchema = yup.object({
  orderId: objectId("orderId"),
});

// /:orderId/item/:itemId
export const orderItemParamsSchema = yup.object({
  orderId: objectId("orderId"),
  itemId: objectId("itemId"),
});