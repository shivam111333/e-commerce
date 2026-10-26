import Order from "../models/orderSchema.js";
import ReturnRequest from "../models/returnRequestSchema.js";
import {
  syncCodOrderPayment,
  syncOrderRefundPaymentStatus,
} from "./orderController.js";

const RETURN_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export const createReturnRequest = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { requestedQuantity, reason, refundBankAccount } = req.body;

    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const item = order.items.id(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Order item not found",
      });
    }

    if (item.status !== "delivered" || !item.deliveredAt) {
      return res.status(400).json({
        success: false,
        message: "Only delivered items can be returned",
      });
    }

    if (
      !["online", "cod"].includes(order.payment?.method) ||
      item.paymentStatus !== "paid"
    ) {
      return res.status(400).json({
        success: false,
        message: "The item must be paid before a return can be requested",
      });
    }

    const now = Date.now();
    const deliveredAt = new Date(item.deliveredAt).getTime();

    if (
      !Number.isFinite(deliveredAt) ||
      deliveredAt > now ||
      now - deliveredAt > RETURN_WINDOW_MS
    ) {
      return res.status(400).json({
        success: false,
        message: "Return requests must be made within 7 days of delivery",
      });
    }

    if (
      !Number.isInteger(requestedQuantity) ||
      requestedQuantity < 1 ||
      requestedQuantity > item.quantity
    ) {
      return res.status(400).json({
        success: false,
        message: `Requested quantity must be between 1 and ${item.quantity}`,
      });
    }

    const existingRequest = await ReturnRequest.exists({
      order: order._id,
      item: item._id,
    });

    if (existingRequest) {
      return res.status(409).json({
        success: false,
        message: "A return request has already been submitted for this item",
      });
    }

    const refundAmount = Number((item.price * requestedQuantity).toFixed(2));

    const returnRequest = await ReturnRequest.create({
      customer: req.user._id,
      order: order._id,
      item: item._id,
      requestedQuantity,
      reason,
      refundBankAccount,
      status: "requested",
      refundAmount,
    });

    return res.status(201).json({
      success: true,
      message: "Return request submitted successfully",
      data: returnRequest,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A return request has already been submitted for this item",
      });
    }

    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Failed to submit return request",
    });
  }
};

export const getMyReturnRequests = async (req, res) => {
  try {
    const returnRequests = await ReturnRequest.find({
      customer: req.user._id,
    })
      .select("-refundBankAccount")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: returnRequests,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Failed to load return requests",
    });
  }
};

export const getAdminReturnRequests = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const returnRequests = await ReturnRequest.find(filter)
      .select("-refundBankAccount")
      .populate("customer", "name email")
      .populate("order", "orderNumber items payment")
      .sort({ createdAt: -1 })
      .lean();

    const data = returnRequests.map((request) => {
      const item = request.order?.items?.find(
        (orderItem) => String(orderItem._id) === String(request.item)
      );
      return {
        ...request,
        item: item
          ? { _id: item._id, name: item.name, price: item.price }
          : request.item,
      };
    });

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Failed to load return requests",
    });
  }
};

export const getAdminReturnRequest = async (req, res) => {
  try {
    const returnRequest = await ReturnRequest.findById(req.params.requestId)
      .populate("customer", "name email")
      .populate("order", "orderNumber items payment")
      .lean();

    if (!returnRequest) {
      return res.status(404).json({
        success: false,
        message: "Return request not found",
      });
    }

    const item = returnRequest.order?.items?.find(
      (orderItem) => String(orderItem._id) === String(returnRequest.item)
    );

    return res.status(200).json({
      success: true,
      data: {
        ...returnRequest,
        item: item || returnRequest.item,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Failed to load return request",
    });
  }
};

const ALLOWED_RETURN_TRANSITIONS = {
  requested: ["approved", "rejected"],
  approved: ["received"],
  received: ["refund_pending"],
  refund_pending: ["refunded"],
  rejected: [],
  refunded: [],
  cancelled: [],
};

export const updateAdminReturnRequestStatus = async (req, res) => {
  try {
    const { status, bankTransferReference } = req.body;
    const returnRequest = await ReturnRequest.findById(req.params.requestId);

    if (!returnRequest) {
      return res.status(404).json({
        success: false,
        message: "Return request not found",
      });
    }

    if (!ALLOWED_RETURN_TRANSITIONS[returnRequest.status]?.includes(status)) {
      return res.status(409).json({
        success: false,
        message: `Cannot change return request from ${returnRequest.status} to ${status}`,
      });
    }

    let order;
    let item;
    let previousItemPaymentStatus;

    if (status === "refunded") {
      if (!bankTransferReference?.trim()) {
        return res.status(400).json({
          success: false,
          message: "Bank transfer reference is required to complete the refund",
        });
      }

      order = await Order.findById(returnRequest.order);
      item = order?.items.id(returnRequest.item);

      if (!order || !item) {
        return res.status(404).json({
          success: false,
          message: "Order item for this return request was not found",
        });
      }

      previousItemPaymentStatus = item.paymentStatus;
      item.paymentStatus =
        returnRequest.requestedQuantity >= item.quantity
          ? "refunded"
          : "partially_refunded";
      returnRequest.bankTransferReference = bankTransferReference.trim();
      returnRequest.refundProcessedBy = req.user._id;
      returnRequest.refundProcessedAt = new Date();
    }

    returnRequest.status = status;
    await returnRequest.save();

    if (status === "refunded") {
      try {
        if (order.payment.method === "cod") {
          await syncCodOrderPayment(order);
        } else {
          await syncOrderRefundPaymentStatus(order);
        }
        await order.save();
      } catch (err) {
        await ReturnRequest.updateOne(
          { _id: returnRequest._id, status: "refunded" },
          {
            $set: {
              status: "refund_pending",
            },
            $unset: {
              bankTransferReference: "",
              refundProcessedBy: "",
              refundProcessedAt: "",
            },
          }
        );
        item.paymentStatus = previousItemPaymentStatus;
        throw err;
      }
    }

    return res.status(200).json({
      success: true,
      message: "Return request updated successfully",
      data: {
        _id: returnRequest._id,
        status: returnRequest.status,
        bankTransferReference: returnRequest.bankTransferReference,
        refundProcessedBy: returnRequest.refundProcessedBy,
        refundProcessedAt: returnRequest.refundProcessedAt,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Failed to update return request",
    });
  }
};
