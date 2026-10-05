import razorpay from "../config/razorpay.js";
import Variant from "../models/variantSchema.js";
import Product from "../models/productSchema.js";
import Order from "../models/orderSchema.js";
import Cart from "../models/cartSchema.js";
import Payment from "../models/paymentSchema.js"; 
import crypto from "crypto";


export const createRazorpayOrder = async (req, res) => {
  try {
    const { items } = req.body;
    const userId = req.user._id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Items are required" });
    }

    let totalAmount = 0;

    for (const item of items) {
      const variant = await Variant.findById(item.variant);

      if (!variant) {
        return res.status(404).json({ success: false, message: "Variant not found" });
      }

      if (variant.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for variant ${item.variant}`,
        });
      }

      totalAmount += variant.price * item.quantity;
    }

    // Razorpay amount is in paise
    const amountInPaise = Math.round(totalAmount * 100);

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

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

const generateOrderNumber = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

/* =========================================================
   2. VERIFY PAYMENT + CREATE ORDER + CREATE PAYMENT
   ========================================================= */
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      items,
      shippingAddress,
      paymentMethod,
      isBuyNow,
    } = req.body;

    const userId = req.user._id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment information is incomplete",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order items are required",
      });
    }

    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: "Shipping address is required",
      });
    }

    // The customer picks card/UPI/netbanking inside Razorpay's window,
    // so the checkout page only decides "online" vs "cod".
    if (paymentMethod !== "online") {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method for online payment",
      });
    }

    // ------------------------------------------
    // A. Verify Razorpay signature
    // ------------------------------------------
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    // ------------------------------------------
    // B. Idempotency: was this payment already processed?
    // ------------------------------------------
    const existingPayment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
    });

    if (existingPayment) {
      if (String(existingPayment.user) !== String(userId)) {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }

      const existingOrder = await Order.findById(existingPayment.order);

      return res.status(200).json({
        success: true,
        message: "Order already placed",
        data: existingOrder,
      });
    }

    // ------------------------------------------
    // C. Ask Razorpay for the real order + payment state
    // ------------------------------------------
    const razorpayOrder = await razorpay.orders.fetch(razorpay_order_id);

    if (!razorpayOrder) {
      return res.status(400).json({
        success: false,
        message: "Razorpay order not found",
      });
    }

    const rzpPayment = await razorpay.payments.fetch(razorpay_payment_id);

    if (
      rzpPayment.order_id !== razorpay_order_id ||
      !["authorized", "captured"].includes(rzpPayment.status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment is not successful",
      });
    }

    const paymentStatus = rzpPayment.status; // "authorized" | "captured"
    // Order/item payment status uses only business-level values
    // (pending / paid / failed ...), so it also makes sense for COD.
    // "authorized" exists only on the Payment (gateway) record.
    const orderPaymentStatus =
      paymentStatus === "captured" ? "paid" : "pending";

    // ------------------------------------------
    // D. Recalculate total from the database
    // ------------------------------------------
    const processedItems = [];
    let totalAmount = 0;

    for (const item of items) {
      if (!item.variant || !item.quantity || item.quantity < 1) {
        return res.status(400).json({
          success: false,
          message: "Invalid variant or quantity",
        });
      }

      const variant = await Variant.findById(item.variant);

      if (!variant) {
        return res.status(404).json({ success: false, message: "Variant not found" });
      }

      if (variant.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: "Product is no longer available in the requested quantity",
        });
      }

      const product = await Product.findById(variant.product);

      if (!product) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }

      totalAmount += variant.price * item.quantity;

      const attributes =
        variant.attributes instanceof Map
          ? Object.fromEntries(variant.attributes.entries())
          : variant.attributes || {};

      processedItems.push({
        variant: variant._id,
        vendor: product.vendor,
        name: product.name,
        price: variant.price,
        quantity: item.quantity,
        attributes,
        status: "pending",
        paymentStatus: orderPaymentStatus,
      });
    }

    // ------------------------------------------
    // E. Verify amount paid matches amount calculated
    // ------------------------------------------
    const expectedAmountInPaise = Math.round(totalAmount * 100);

    if (Number(razorpayOrder.amount) !== expectedAmountInPaise) {
      return res.status(400).json({
        success: false,
        message: "Payment amount does not match order amount",
      });
    }

    // ------------------------------------------
    // F. Reduce stock atomically
    //    (only succeeds if enough stock is still there)
    // ------------------------------------------
    const reduced = [];

    const restoreStock = async () => {
      for (const r of reduced) {
        await Variant.updateOne(
          { _id: r.variant },
          { $inc: { stock: r.quantity } }
        );
      }
    };

    for (const item of items) {
      const result = await Variant.updateOne(
        { _id: item.variant, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } }
      );

      if (result.modifiedCount === 0) {
        await restoreStock();
        return res.status(400).json({
          success: false,
          message: "Product is no longer available in the requested quantity",
        });
      }

      reduced.push({ variant: item.variant, quantity: item.quantity });
    }

    // ------------------------------------------
    // G. Create Order + Payment
    // ------------------------------------------
    let order;

    try {
      order = await Order.create({
        orderNumber: generateOrderNumber(),
        user: userId,
        items: processedItems,
        totalAmount,
        payment: {
          method: "online",
          status: orderPaymentStatus,
        },
        shippingAddress: {
          name: shippingAddress.name,
          phone: shippingAddress.phone,
          address: shippingAddress.address,
          city: shippingAddress.city,
          state: shippingAddress.state,
          pincode: shippingAddress.pincode,
        },
      });

      await Payment.create({
        user: userId,
        order: order._id,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        amount: totalAmount,
        currency: "INR",
        method: rzpPayment.method, // real method: upi / card / netbanking / wallet ...
        status: paymentStatus,
      });
    } catch (err) {
      // Undo everything this request did
      await restoreStock();
      if (order) await Order.deleteOne({ _id: order._id });

      // Two simultaneous requests: the unique index caught the second one
      if (err.code === 11000) {
        const p = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
        const o = p && (await Order.findById(p.order));

        return res.status(200).json({
          success: true,
          message: "Order already placed",
          data: o,
        });
      }

      throw err;
    }

    // ------------------------------------------
    // H. Clear cart (not for Buy Now)
    // ------------------------------------------
    if (!isBuyNow) {
      await Cart.findOneAndUpdate(
        { user: userId },
        { $set: { items: [] } }
      );
    }

    return res.status(201).json({
      success: true,
      message: "Payment successful and order placed",
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

// Payment states only move forward, never backwards
const PAYMENT_RANK = {
  pending: 0,
  failed: 1,
  authorized: 2,
  captured: 3,
  partially_refunded: 4,
  refunded: 5,
};

// Razorpay event -> new Payment.status / Order payment status
const EVENT_MAP = {
  "payment.authorized": { payment: "authorized", order: "pending" },
  "payment.captured": { payment: "captured", order: "paid" },
  "payment.failed": { payment: "failed", order: "failed" },
};

export const razorpayWebhook = async (req, res) => {
  try {
    const webhookSignature = req.headers["x-razorpay-signature"];

    if (!webhookSignature) {
      return res.status(400).json({
        success: false,
        message: "Webhook signature missing",
      });
    }

    // req.body is a Buffer here because of express.raw() in server.js
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(req.body)
      .digest("hex");

    if (expectedSignature !== webhookSignature) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature",
      });
    }

    const payload = JSON.parse(req.body.toString());
    console.log("RAZORPAY WEBHOOK EVENT:", payload.event);

    const mapped = EVENT_MAP[payload.event];
    const rzpPayment = payload.payload?.payment?.entity;

    // Events we don't handle: acknowledge so Razorpay doesn't retry
    if (!mapped || !rzpPayment?.order_id) {
      return res.status(200).json({ success: true, message: "Event ignored" });
    }

    const payment = await Payment.findOne({
      razorpayOrderId: rzpPayment.order_id,
    });

    // verifyRazorpayPayment hasn't created it yet (or it never will).
    // verify reads the real status from Razorpay itself, so nothing is lost.
    if (!payment) {
      console.warn("Webhook: no Payment found for", rzpPayment.order_id);
      return res.status(200).json({ success: true, message: "No matching payment" });
    }

    // A different attempt on the same Razorpay order (e.g. an earlier failed try)
    if (payment.razorpayPaymentId && payment.razorpayPaymentId !== rzpPayment.id) {
      return res.status(200).json({ success: true, message: "Different attempt ignored" });
    }

    // Duplicate or out-of-order delivery
    if (PAYMENT_RANK[mapped.payment] <= PAYMENT_RANK[payment.status]) {
      return res.status(200).json({ success: true, message: "Already processed" });
    }

    payment.status = mapped.payment;
    payment.razorpayPaymentId = payment.razorpayPaymentId || rzpPayment.id;
    await payment.save();

    const order = await Order.findById(payment.order);

    if (order) {
      order.payment.status = mapped.order;

      order.items.forEach((item) => {
        if (item.status !== "cancelled") {
          item.paymentStatus = mapped.order;
        }
      });

      await order.save();
    }

    return res.status(200).json({ success: true, message: "Webhook processed" });
  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};