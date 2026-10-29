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
   cancelMyOrderItem
} from "../controllers/orderController.js";
import {
  createReturnRequest,
  getMyReturnRequests,
} from "../controllers/returnRequestController.js";

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
   cancelOrderItemSchema,    
} from "../validators/orderValidator.js";
import { createReturnRequestSchema } from "../validators/returnRequestValidator.js";

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

router.get(
  "/returns/my",
  authentication,
  authorization(["user"]),
  getMyReturnRequests
);

// Customer creates COD order
router.post(
  "/",
  authentication,
  authorization(["user"]),
  validate(createOrderSchema),
  createUserOrder
);

// Customer requests a return for a delivered item
router.post(
  "/:orderId/item/:itemId/return",
  authentication,
  authorization(["user"]),
  validate(orderItemParamsSchema, "params"),
  validate(createReturnRequestSchema),
  createReturnRequest
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

// Customer cancels an item within 24 hours of ordering
router.patch(
  "/:orderId/item/:itemId/cancel",
  authentication,
  authorization(["user"]),
  validate(orderItemParamsSchema, "params"),
  validate(cancelOrderItemSchema),
  cancelMyOrderItem
);

export default router;