import razorpay from "../config/razorpay.js";
import Variant from "../models/variantSchema.js";
import Product from "../models/productSchema.js";
import Order from "../models/orderSchema.js";
import Cart from "../models/cartSchema.js";
import Payment from "../models/paymentSchema.js";
import crypto from "crypto";
import { formatInr, getMaxOrderAmount } from "../config/limits.js";

/* =========================================================
   Helpers
   ========================================================= */

const generateOrderNumber = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Payment (gateway) states only ever move forward
const PAYMENT_RANK = {
  created: 0,
  pending: 1,
  failed: 2,
  cancelled: 2,
  authorized: 3,
  captured: 4,
  partially_refunded: 5,
  refunded: 6,
};

const statusesBelow = (status) =>
  Object.keys(PAYMENT_RANK).filter(
    (s) => PAYMENT_RANK[s] < PAYMENT_RANK[status],
  );

// Gateway status -> business-level status shown on Order and items
const ORDER_STATUS_FOR = {
  pending: "pending",
  failed: "failed",
  authorized: "pending",
  captured: "paid",
};

// An order status is only overwritten when it is currently one of these
// (so a late event can never undo "paid", or a later refund)
const ORDER_STATUS_ALLOWED_FROM = {
  pending: ["created", "pending", "failed", "cancelled"],
  failed: ["created", "pending"],
  paid: ["created", "pending", "failed", "cancelled"],
};

/**
 * Runs exactly once per payment. Whoever flips finalizedAt from empty to a
 * date does the work; any other caller (verify or webhook) returns right away.
 * Reduces stock for the Order's items. Items that are out of stock are
 * cancelled and the Payment is flagged so an admin can refund them.
 */
const finalizePayment = async (payment) => {
  const claimed = await Payment.findOneAndUpdate(
    { _id: payment._id, finalizedAt: null },
    { $set: { finalizedAt: new Date() } },
    { new: true },
  );

  if (!claimed) return false;

  const order = await Order.findById(payment.order);
  if (!order) return false;

  const reduced = [];
  const outOfStockItemIds = [];
  let refundAmount = 0;

  try {
    for (const item of order.items) {
      if (item.status === "cancelled") continue;

      const result = await Variant.updateOne(
        { _id: item.variant, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
      );

      if (result.modifiedCount === 0) {
        outOfStockItemIds.push(item._id);
        refundAmount += item.price * item.quantity;
      } else {
        reduced.push({ variant: item.variant, quantity: item.quantity });
      }
    }

    if (outOfStockItemIds.length > 0) {
      await Payment.updateOne(
        { _id: payment._id },
        { $set: { needsRefund: true, refundAmount } },
      );

      await Order.updateOne(
        { _id: order._id },
        {
          $set: {
            "items.$[i].status": "cancelled",
            "items.$[i].cancellationReason": "Out of stock after payment",
            "items.$[i].cancelledAt": new Date(),
          },
        },
        { arrayFilters: [{ "i._id": { $in: outOfStockItemIds } }] },
      );
    }
  } catch (err) {
    // Undo what this call did and release the claim so it can be retried
    for (const r of reduced) {
      await Variant.updateOne(
        { _id: r.variant },
        { $inc: { stock: r.quantity } },
      );
    }
    await Payment.updateOne(
      { _id: payment._id },
      { $set: { finalizedAt: null } },
    );
    throw err;
  }

  return true;
};

/**
 * The single place where a payment result is applied.
 * Called by both verify (target from Razorpay API) and the webhook
 * (target from the event). Safe to call many times, in any order.
 *
 * target: "authorized" | "captured" | "failed"
 */
const settlePayment = async (paymentId, target, rzp) => {
  const payment = await Payment.findById(paymentId);

  if (!payment) return { settled: false, reason: "not_found" };

  const isSuccess = target === "authorized" || target === "captured";

  // The money Razorpay holds must match what we stored at checkout
  if (isSuccess && Number(rzp.amount) !== Math.round(payment.amount * 100)) {
    console.error("Amount mismatch for", payment.razorpayOrderId);
    return { settled: false, reason: "amount_mismatch" };
  }

  const set = { status: target };

  // Only a successful attempt is remembered. A failed attempt must not
  // block a later successful retry on the same Razorpay order.
  if (isSuccess) {
    set.razorpayPaymentId = rzp.id;
    set.method = rzp.method;
  }

  // Atomic, forward-only update of the Payment
  const advanced = await Payment.findOneAndUpdate(
    { _id: paymentId, status: { $in: statusesBelow(target) } },
    { $set: set },
    { new: true },
  );

  const current = advanced || (await Payment.findById(paymentId));

  // authorized or captured: make sure stock was reduced (once)
  // Finalize stock only after Razorpay confirms capture.
  if (current.status === "captured") {
    await finalizePayment(current);
  }

  // Mirror the gateway status onto the Order and every item
  const orderStatus = ORDER_STATUS_FOR[current.status];
  const allowedFrom = ORDER_STATUS_ALLOWED_FROM[orderStatus];

  if (orderStatus && allowedFrom) {
    await Order.updateOne(
      { _id: current.order, "payment.status": { $in: allowedFrom } },
      {
        $set: {
          "payment.status": orderStatus,
          "items.$[].paymentStatus": orderStatus,
        },
      },
    );
  }

  return { settled: true };
};

const markOnlinePaymentPending = async (payment) => {
  const now = new Date();
  const movedToPending = await Payment.findOneAndUpdate(
    { _id: payment._id, status: "created", method: "online" },
    {
      $set: {
        status: "pending",
        pendingAt: now,
      },
    },
    { new: true },
  );

  if (movedToPending) {
    await Order.updateOne(
      { _id: movedToPending.order, "payment.status": "created" },
      {
        $set: {
          "payment.status": "pending",
          "items.$[].paymentStatus": "pending",
        },
      },
    );
    return true;
  }

  if (payment.status === "pending" && !payment.pendingAt) {
    await Payment.updateOne(
      { _id: payment._id, status: "pending", pendingAt: null },
      { $set: { pendingAt: now } },
    );
  }

  return false;
};

/**
 * Reconcile an open or authorized local payment against Razorpay's attempts.
 * Authorized payments remain authorized unless Razorpay reports capture.
 */
export const reconcilePendingRazorpayPayment = async (paymentId) => {
  const payment = await Payment.findById(paymentId);

  if (!payment) {
    return { reconciled: false, reason: "not_found" };
  }

  if (
    !["created", "pending", "authorized"].includes(payment.status) ||
    payment.method !== "online"
  ) {
    return { reconciled: false, reason: "not_open" };
  }

  if (!payment.razorpayOrderId) {
    throw new Error(
      `Pending online payment ${payment._id} has no Razorpay order ID`,
    );
  }

  const response = await razorpay.orders.fetchPayments(payment.razorpayOrderId);

  if (!Array.isArray(response?.items)) {
    throw new Error(
      `Razorpay returned an invalid payment list for ${payment.razorpayOrderId}`,
    );
  }

  const attempts = response.items.filter(
    (attempt) => attempt.order_id === payment.razorpayOrderId,
  );

  const successfulAttempt =
    attempts.find((attempt) => attempt.status === "captured") ||
    attempts.find((attempt) => attempt.status === "authorized");

  if (successfulAttempt) {
    const result = await settlePayment(
      payment._id,
      successfulAttempt.status,
      successfulAttempt,
    );

    if (!result.settled) {
      return { reconciled: false, reason: result.reason };
    }

    return {
      reconciled: true,
      status: successfulAttempt.status,
      razorpayPaymentId: successfulAttempt.id,
    };
  }

  if (attempts.length === 0) {
    if (payment.status === "authorized") {
      return { reconciled: false, reason: "authorization_unresolved" };
    }

    return { reconciled: false, reason: "no_attempts" };
  }

  if (attempts.every((attempt) => attempt.status === "failed")) {
    if (payment.status === "authorized") {
      return { reconciled: false, reason: "authorization_unresolved" };
    }

    return { reconciled: false, reason: "all_attempts_failed" };
  }

  if (payment.status === "authorized") {
    return { reconciled: false, reason: "authorization_unresolved" };
  }

  // There is an attempt, but no final successful or all-failed result.
  // Move created -> pending only because the server checked Razorpay.
  await markOnlinePaymentPending(payment);

  return { reconciled: false, reason: "attempt_in_progress" };
};

/* =========================================================
   1. CREATE RAZORPAY ORDER
      Creates the Razorpay order + a created Order + a created Payment
   ========================================================= */
export const createRazorpayOrder = async (req, res) => {
  try {
    const { items, shippingAddress } = req.body;
    const userId = req.user._id;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "User not found" });
    }

    const addressFields = [
      "name",
      "phone",
      "address",
      "city",
      "state",
      "pincode",
    ];

    if (
      !shippingAddress ||
      addressFields.some((f) => !String(shippingAddress[f] ?? "").trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Complete shipping address is required",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Items are required" });
    }

    let totalAmount = 0;
    const orderItems = [];
    const seen = new Set();

    for (const item of items) {
      const quantity = Number(item.quantity);

      if (!item.variant || !Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({
          success: false,
          message: "Invalid variant or quantity",
        });
      }

      const key = String(item.variant);

      if (seen.has(key)) {
        return res.status(400).json({
          success: false,
          message: "The same variant cannot appear twice",
        });
      }
      seen.add(key);

      const variant = await Variant.findById(item.variant);

      if (!variant) {
        return res
          .status(404)
          .json({ success: false, message: "Variant not found" });
      }

      if (variant.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for variant ${item.variant}`,
        });
      }

      const product = await Product.findById(variant.product);

      if (!product) {
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      }

      totalAmount += variant.price * quantity;

      const attributes =
        variant.attributes instanceof Map
          ? Object.fromEntries(variant.attributes.entries())
          : variant.attributes || {};

      orderItems.push({
        variant: variant._id,
        vendor: product.vendor,
        name: product.name,
        price: variant.price,
        quantity,
        attributes,
        status: "pending",
        paymentStatus: "created",
      });
    }

    if (totalAmount > getMaxOrderAmount()) {
      return res.status(400).json({
        success: false,
        message: `Order total cannot exceed ${formatInr(getMaxOrderAmount())}`,
      });
    }

    const orderNumber = generateOrderNumber();

    // Razorpay amount is in paise
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt: orderNumber,
    });

    let pendingOrder;

    try {
      pendingOrder = await Order.create({
        orderNumber,
        user: userId,
        items: orderItems,
        totalAmount,
        payment: { method: "online", status: "created" },
        shippingAddress: {
          name: String(shippingAddress.name).trim(),
          phone: String(shippingAddress.phone).trim(),
          address: String(shippingAddress.address).trim(),
          city: String(shippingAddress.city).trim(),
          state: String(shippingAddress.state).trim(),
          pincode: String(shippingAddress.pincode).trim(),
        },
      });

      await Payment.create({
        user: userId,
        order: pendingOrder._id,
        razorpayOrderId: razorpayOrder.id,
        amount: totalAmount,
        currency: "INR",
        method: "online",
        status: "created",
      });
    } catch (err) {
      // Do not leave an Order behind without its Payment
      if (pendingOrder) await Order.deleteOne({ _id: pendingOrder._id });
      throw err;
    }

    return res.status(200).json({
      success: true,
      data: {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* =========================================================
   2. VERIFY PAYMENT (called by the frontend after paying)
      Uses the pending Order/Payment as the source of truth.
      Items and address from the browser are NOT used.
   ========================================================= */
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      isBuyNow,
    } = req.body;

    const userId = req.user._id;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "User not found" });
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment information is incomplete",
      });
    }

    // A. Signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    // B. Our pending Payment for this Razorpay order
    const payment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
    });

    if (!payment) {
      return res
        .status(404)
        .json({ success: false, message: "Payment not found" });
    }

    if (String(payment.user) !== String(userId)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    // C. Real status from Razorpay
    let rzpPayment = await razorpay.payments.fetch(razorpay_payment_id);

    if (rzpPayment.order_id !== razorpay_order_id) {
      return res.status(400).json({
        success: false,
        message: "Payment does not belong to this order",
      });
    }

    await markOnlinePaymentPending(payment);

    // With auto-capture, "authorized" turns into "captured" within a second or
    // two. Wait briefly so the customer lands on a finished order.
    for (let i = 0; i < 3 && rzpPayment.status === "authorized"; i++) {
      await sleep(1000);
      rzpPayment = await razorpay.payments.fetch(razorpay_payment_id);
    }

    if (!["authorized", "captured"].includes(rzpPayment.status)) {
      return res.status(400).json({
        success: false,
        message: "Payment is not successful",
      });
    }

    // D. Apply it (safe even if the webhook already did)
    const result = await settlePayment(
      payment._id,
      rzpPayment.status,
      rzpPayment,
    );

    if (!result.settled) {
      return res.status(400).json({
        success: false,
        message:
          result.reason === "amount_mismatch"
            ? "Payment amount does not match order amount"
            : "Could not process payment",
      });
    }

    // E. Clear cart (not for Buy Now)
    if (!isBuyNow) {
      await Cart.findOneAndUpdate({ user: userId }, { $set: { items: [] } });
    }

    const [order, latest] = await Promise.all([
      Order.findById(payment.order),
      Payment.findById(payment._id),
    ]);

    return res.status(200).json({
      success: true,
      message: latest.needsRefund
        ? "Payment received. Some items were out of stock and will be refunded."
        : "Payment successful and order placed",
      needsRefund: latest.needsRefund,
      data: order,
    });
  } catch (error) {
    console.error("Razorpay verification error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================================================
   3. RAZORPAY WEBHOOK
   ========================================================= */

// Razorpay event -> target Payment status
const EVENT_TARGET = {
  "payment.authorized": "authorized",
  "payment.captured": "captured",
};

export const razorpayWebhook = async (req, res) => {
  try {
    console.log("WEBHOOK HIT", new Date().toISOString());

    const webhookSignature = req.headers["x-razorpay-signature"];

    if (!webhookSignature) {
      return res.status(400).json({
        success: false,
        message: "Webhook signature missing",
      });
    }

    // req.body is a Buffer because of express.raw() in server.js
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(req.body)
      .digest("hex");

    if (expectedSignature !== webhookSignature) {
      console.log("WEBHOOK SIGNATURE MISMATCH");
      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature",
      });
    }

    const payload = JSON.parse(req.body.toString());

    console.log(
      "RAZORPAY WEBHOOK EVENT:",
      payload.event,
      req.headers["x-razorpay-event-id"],
    );

    if (payload.event === "payment.failed") {
      const failedAttempt = payload.payload?.payment?.entity;

      if (!failedAttempt?.order_id || !failedAttempt?.id) {
        return res.status(200).json({
          success: true,
          message: "Failed payment event ignored: missing payment identifiers",
        });
      }

      const payment = await Payment.findOne({
        razorpayOrderId: failedAttempt.order_id,
      });

      if (!payment) {
        console.warn(
          "Failed payment webhook: no Payment found for",
          failedAttempt.order_id,
        );
      } else {
        await markOnlinePaymentPending(payment);
      }

      console.info("Razorpay payment attempt failed", {
        orderId: failedAttempt?.order_id,
        paymentId: failedAttempt?.id,
        errorCode: failedAttempt?.error_code,
      });

      return res.status(200).json({
        success: true,
        message: "Failed attempt received; checkout may still be retried",
      });
    }

    const target = EVENT_TARGET[payload.event];
    const rzpPayment = payload.payload?.payment?.entity;

    // Events we don't handle: acknowledge so Razorpay doesn't retry
    if (!target || !rzpPayment?.order_id) {
      return res.status(200).json({ success: true, message: "Event ignored" });
    }

    const payment = await Payment.findOne({
      razorpayOrderId: rzpPayment.order_id,
    });

    if (!payment) {
      console.warn("Webhook: no Payment found for", rzpPayment.order_id);
      return res
        .status(200)
        .json({ success: true, message: "No matching payment" });
    }

    // A different successful attempt than the one we already recorded
    if (
      target !== "failed" &&
      payment.razorpayPaymentId &&
      payment.razorpayPaymentId !== rzpPayment.id
    ) {
      return res
        .status(200)
        .json({ success: true, message: "Different attempt ignored" });
    }

    await markOnlinePaymentPending(payment);

    const result = await settlePayment(payment._id, target, rzpPayment);

    return res.status(200).json({
      success: true,
      message: result.settled ? "Webhook processed" : "Webhook not applied",
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const dismissRazorpayCheckout = async (req, res) => {
  try {
    const { razorpay_order_id: razorpayOrderId } = req.body;

    // Scope the lookup to the authenticated user. Do not trust a user ID
    // supplied by the browser.
    const payment = await Payment.findOne({
      razorpayOrderId,
      user: req.user._id,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    if (
      !["created", "pending", "authorized"].includes(payment.status) ||
      payment.method !== "online"
    ) {
      return res.status(200).json({
        success: true,
        data: { status: payment.status },
      });
    }

    const result = await reconcilePendingRazorpayPayment(payment._id);

    if (result.reconciled) {
      return res.status(200).json({
        success: true,
        data: { status: result.status },
      });
    }

    const finalStatusByReason = {
      no_attempts: "cancelled",
      all_attempts_failed: "failed",
    };

    const finalStatus = finalStatusByReason[result.reason];

    if (finalStatus) {
      const updatedPayment = await Payment.findOneAndUpdate(
        {
          _id: payment._id,
          status: { $in: ["created", "pending"] },
          method: "online",
        },
        { $set: { status: finalStatus } },
        { new: true },
      );

      if (updatedPayment) {
        await Order.updateOne(
          {
            _id: updatedPayment.order,
            "payment.status": { $in: ["created", "pending"] },
          },
          {
            $set: {
              "payment.status": finalStatus,
              "items.$[].paymentStatus": finalStatus,
            },
          },
        );

        return res.status(200).json({
          success: true,
          data: { status: finalStatus },
        });
      }

      // A webhook or verification may have updated it concurrently.
      const latestPayment = await Payment.findById(payment._id);

      return res.status(200).json({
        success: true,
        data: { status: latestPayment?.status || "unknown" },
      });
    }

    // Razorpay reports an attempt that is not yet conclusively successful
    // or failed. Leave the order pending for a later reconciliation.
    return res.status(200).json({
      success: true,
      data: {
        status: payment.status === "authorized" ? "authorized" : "pending",
      },
      message: "Payment is still being checked",
    });
  } catch (error) {
    console.error("Razorpay dismissal reconciliation error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to check payment status",
    });
  }
};
