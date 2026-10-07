import express from "express";

const router = express.Router();

import {
  getOrderByUserId,
  createUserOrder,
  getVendorOrders,
  updateVendorOrderItemStatus,
  getAllOrder,
  updateOrderPaymentStatus,
  updateOrderItemPaymentStatus,
} from "../controllers/orderController.js";

import authentication from "../middlewares/authMiddleware.js";
import authorization from "../middlewares/authorizationMiddleware.js";
import validate from "../middlewares/validate.js";

import {
  createOrderSchema,
  updateOrderItemStatusSchema,
  updateOrderPaymentStatusSchema,
  updateOrderItemPaymentStatusSchema,
  orderParamsSchema,
  orderItemParamsSchema,
} from "../validators/orderValidator.js";

// Admin
router.get(
  "/all",
  authentication,
  authorization(["admin"]),
  getAllOrder
);

// Customer
router.get(
  "/my-orders",
  authentication,
  authorization(["user"]),
  getOrderByUserId
);

// Customer creates COD order
router.post(
  "/",
  authentication,
  authorization(["user"]),
  validate(createOrderSchema),
  createUserOrder
);

// Vendor/Admin orders
router.get(
  "/",
  authentication,
  authorization(["vendor", "admin"]),
  getVendorOrders
);

// Vendor updates item fulfillment status
router.patch(
  "/:orderId/item/:itemId/status",
  authentication,
  authorization(["vendor"]),
  validate(orderItemParamsSchema, "params"),
  validate(updateOrderItemStatusSchema),
  updateVendorOrderItemStatus
);

// Admin updates order-level payment status
router.patch(
  "/:orderId/payment-status",
  authentication,
  authorization(["admin"]),
  validate(orderParamsSchema, "params"),
  validate(updateOrderPaymentStatusSchema),
  updateOrderPaymentStatus
);

// Admin updates item-level payment status
router.patch(
  "/:orderId/item/:itemId/payment-status",
  authentication,
  authorization(["admin"]),
  validate(orderItemParamsSchema, "params"),
  validate(updateOrderItemPaymentStatusSchema),
  updateOrderItemPaymentStatus
);

export default router;