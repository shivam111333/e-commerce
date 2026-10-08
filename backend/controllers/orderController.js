import Order from "../models/orderSchema.js";
import Product from "../models/productSchema.js";
import Variant from "../models/variantSchema.js";
import Cart from "../models/cartSchema.js";
import Payment from "../models/paymentSchema.js";
import { formatInr, getMaxOrderAmount } from "../config/limits.js";

// ==========================================
// UTILITIES
// ==========================================
const generateOrderNumber = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

// An order only counts as "placed" when it is cash on delivery, or an
// online order that has actually been paid. Unpaid online checkouts must
// never show up in customer, vendor or admin lists.
const PLACED_ORDER_FILTER = {
  $or: [{ "payment.method": "cod" }, { "payment.status": "paid" }],
};

const ADMIN_COD_STATUSES = ["pending", "paid", "failed"];

/**
 * Recalculates the order-level payment status from its items (COD only)
 * and creates the cash Payment record when the order becomes fully paid.
 * Call it after changing an item's paymentStatus, or after an item is
 * cancelled, and then call order.save().
 */
export const syncCodOrderPayment = async (order) => {
  const activeItems = order.items.filter((i) => i.status !== "cancelled");

  // Everything cancelled: nothing left to collect
  if (activeItems.length === 0) return;

  const allPaid = activeItems.every((i) => i.paymentStatus === "paid");
  const allFailed = activeItems.every((i) => i.paymentStatus === "failed");

  let newStatus = "pending"; // mixed states stay pending
  if (allPaid) newStatus = "paid";
  else if (allFailed) newStatus = "failed";

  if (newStatus === "paid" && order.payment.status !== "paid") {
    // Cash actually collected = non-cancelled items only
    const amount = activeItems.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0
    );

    try {
      await Payment.create({
        user: order.user,
        order: order._id,
        // no razorpayOrderId / razorpayPaymentId for cash
        method: "cash",
        amount,
        currency: "INR",
        status: "captured",
      });
      console.log("COD cash Payment created for order", String(order._id));
    } catch (err) {
      // Ignore a duplicate-key error ONLY when a Payment for this order really
      // exists. Any other duplicate-key error means an index problem.
      if (err.code === 11000 && (await Payment.exists({ order: order._id }))) {
        // already created: fine
      } else {
        throw err;
      }
    }
  }

  order.payment.status = newStatus;
};

// ==========================================
// CUSTOMER: my orders
// ==========================================
export const getOrderByUserId = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // The customer sees ALL their own orders, including online checkouts that
    // are still unpaid or failed (the frontend labels them by payment.status).
    // Vendors and admin still use PLACED_ORDER_FILTER.
    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No orders found",
      });
    }

    return res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ==========================================
// CUSTOMER: place a CASH ON DELIVERY order
// (online payments go through /api/payment/razorpay/order)
// ==========================================
export const createUserOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, isBuyNow } = req.body;
    const userId = req.user._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // This endpoint only creates COD orders. An "online" order created here
    // would reduce stock without any payment.
    if (paymentMethod && paymentMethod !== "cod") {
      return res.status(400).json({
        success: false,
        message: "Online payments must use the online checkout",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order must contain at least one item",
      });
    }

    if (
      !shippingAddress ||
      !shippingAddress.name ||
      !shippingAddress.phone ||
      !shippingAddress.address ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.pincode
    ) {
      return res.status(400).json({
        success: false,
        message: "Complete shipping address is required",
      });
    }

    // ---- 1. Validate everything first (no stock is touched yet) ----
    const processedItems = [];
    const seen = new Set();
    let totalAmount = 0;

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
        return res.status(404).json({
          success: false,
          message: "Variant not found",
        });
      }

      if (variant.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.variant}`,
        });
      }

      const product = await Product.findById(variant.product);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      // Price always comes from the database, never from the browser
      totalAmount += variant.price * quantity;

      const attributes =
        variant.attributes instanceof Map
          ? Object.fromEntries(variant.attributes.entries())
          : variant.attributes || {};

      processedItems.push({
        variant: variant._id,
        vendor: product.vendor,
        name: product.name,
        price: variant.price,
        quantity,
        attributes,
        status: "pending",
        paymentStatus: "pending",
      });
    }

    if (totalAmount > getMaxOrderAmount()) {
      return res.status(400).json({
        success: false,
        message: `Order total cannot exceed ${formatInr(getMaxOrderAmount())}`,
      });
    }

    // ---- 2. Reduce stock atomically; undo everything if anything fails ----
    const reduced = [];

    const restoreStock = async () => {
      for (const r of reduced) {
        await Variant.updateOne(
          { _id: r.variant },
          { $inc: { stock: r.quantity } }
        );
      }
    };

    for (const item of processedItems) {
      const result = await Variant.updateOne(
        { _id: item.variant, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } }
      );

      if (result.modifiedCount === 0) {
        await restoreStock();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.name}`,
        });
      }

      reduced.push({ variant: item.variant, quantity: item.quantity });
    }

    // ---- 3. Create the order ----
    let order;

    try {
      order = await Order.create({
        orderNumber: generateOrderNumber(),
        user: userId,
        items: processedItems,
        totalAmount,
        shippingAddress: {
          name: shippingAddress.name,
          phone: shippingAddress.phone,
          address: shippingAddress.address,
          city: shippingAddress.city,
          state: shippingAddress.state,
          pincode: shippingAddress.pincode,
        },
        payment: {
          method: "cod",
          status: "pending",
        },
      });
    } catch (err) {
      await restoreStock();
      throw err;
    }

    // Buy Now must not empty the cart
    if (!isBuyNow) {
      await Cart.findOneAndUpdate(
        { user: userId },
        { $set: { items: [] } }
      );
    }

    return res.status(201).json({
      success: true,
      message: "Order successfully placed",
      data: order,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ==========================================
// VENDOR: my orders
// ==========================================
export const getVendorOrders = async (req, res) => {
  try {
    const vendorId = req.user._id;

    if (!vendorId) {
      return res.status(401).json({
        success: false,
        message: "Vendor not found",
      });
    }

    // Orders that contain at least one item belonging to this vendor
    // (and are really placed: COD, or online and paid)
    const orders = await Order.find({
      "items.vendor": vendorId,
      ...PLACED_ORDER_FILTER,
    })
      .populate("user", "name email phone")
      .sort({ createdAt: -1 });

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No orders found",
      });
    }

    // Only return this vendor's items
    const vendorOrders = orders.map((order) => {
      const vendorItems = order.items.filter(
        (item) => item.vendor.toString() === vendorId.toString()
      );

      const vendorTotal = vendorItems.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );

      return {
        _id: order._id,
        orderNumber: order.orderNumber,
        user: order.user,
        items: vendorItems,
        vendorTotal,
        shippingAddress: order.shippingAddress,
        payment: order.payment,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      };
    });

    return res.status(200).json({
      success: true,
      data: vendorOrders,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ==========================================
// VENDOR: update one item's delivery status
// ==========================================
export const updateVendorOrderItemStatus = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { status, cancellationReason } = req.body;
    const vendorId = req.user._id;

    if (!orderId || !itemId) {
      return res.status(400).json({
        success: false,
        message: "Order ID and item ID are required",
      });
    }

    const allowedStatuses = [
      "pending",
      "confirmed",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // An unpaid online checkout is not a real order yet
    if (order.payment.method === "online" && order.payment.status !== "paid") {
      return res.status(400).json({
        success: false,
        message: "This order has not been paid yet",
      });
    }

    const item = order.items.id(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Order item not found",
      });
    }

    // Vendor can modify only their own item
    if (item.vendor.toString() !== vendorId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this order item",
      });
    }

    if (item.status === "delivered") {
      return res.status(400).json({
        success: false,
        message: "Delivered item cannot be updated",
      });
    }

    if (item.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cancelled item cannot be updated",
      });
    }

    const statusOrder = {
      pending: 1,
      confirmed: 2,
      shipped: 3,
      delivered: 4,
    };

    if (
      status &&
      status !== "cancelled" &&
      statusOrder[status] < statusOrder[item.status]
    ) {
      return res.status(400).json({
        success: false,
        message: "Order status cannot move backwards",
      });
    }

    // ===================================
    // UPDATE STATUS
    // ===================================
    if (status) {
      if (status === "cancelled") {
        if (!cancellationReason?.trim()) {
          return res.status(400).json({
            success: false,
            message: "Cancellation reason is required",
          });
        }

        // Restore stock
        const variant = await Variant.findById(item.variant);

        if (!variant) {
          return res.status(404).json({
            success: false,
            message:
              "Variant associated with this order item was not found",
          });
        }

        await Variant.updateOne(
          { _id: item.variant },
          { $inc: { stock: item.quantity } }
        );

        item.status = "cancelled";
        item.cancellationReason = cancellationReason.trim();
        item.cancelledAt = new Date();
      } else {
        item.status = status;
      }
    }

    // COD: the remaining items may now all be paid
    if (status === "cancelled" && order.payment.method === "cod") {
      await syncCodOrderPayment(order);
    }

    await order.save();

    // Online and already paid: the customer must be refunded for this item
    if (status === "cancelled" && order.payment.method === "online") {
      await Payment.updateOne(
        { order: order._id },
        {
          $set: { needsRefund: true },
          $inc: { refundAmount: item.price * item.quantity },
        }
      );
    }

    return res.status(200).json({
      success: true,
      message:
        status === "cancelled"
          ? "Order item cancelled successfully"
          : "Order item updated successfully",
      data: order,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ==========================================
// ADMIN: all orders
// ==========================================
export const getAllOrder = async (req, res) => {
  try {
    const user = req.user._id;

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User id is required",
      });
    }

    const orders = await Order.find(PLACED_ORDER_FILTER).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* =========================================================
   ADMIN, order-level COD payment: sets every active item,
   then syncs the order
   ========================================================= */
export const updateOrderPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentStatus } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    if (!ADMIN_COD_STATUSES.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status",
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Admin can manually change payment status only for COD orders
    if (order.payment.method !== "cod") {
      return res.status(403).json({
        success: false,
        message:
          "Payment status for online orders is controlled by the payment gateway",
      });
    }

    // Paid is final for now (no refund flow yet).
    // Asking for "paid" again is harmless, so answer with success.
    if (order.payment.status === "paid") {
      if (paymentStatus === "paid") {
        return res.status(200).json({
          success: true,
          message: "Order is already paid",
          data: order,
        });
      }

      return res.status(409).json({
        success: false,
        message: "This order is already paid and cannot be changed",
      });
    }

    const activeItems = order.items.filter((i) => i.status !== "cancelled");

    if (activeItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "All items in this order are cancelled",
      });
    }

    // Cash is collected on delivery
    if (
      paymentStatus === "paid" &&
      activeItems.some((i) => i.status !== "delivered")
    ) {
      return res.status(400).json({
        success: false,
        message: "All active items must be delivered before marking as paid",
      });
    }

    activeItems.forEach((i) => {
      i.paymentStatus = paymentStatus;
    });

    await syncCodOrderPayment(order);
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order payment status updated successfully",
      data: order,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* =========================================================
   ADMIN, item-level COD payment: updates one item,
   then syncs the order
   ========================================================= */
export const updateOrderItemPaymentStatus = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { paymentStatus } = req.body;

    if (!orderId || !itemId) {
      return res.status(400).json({
        success: false,
        message: "Order ID and item ID are required",
      });
    }

    if (!ADMIN_COD_STATUSES.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status",
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Only COD can be manually controlled by admin
    if (order.payment.method !== "cod") {
      return res.status(403).json({
        success: false,
        message:
          "Payment status for online orders is controlled by the payment gateway",
      });
    }

    if (order.payment.status === "paid") {
      if (paymentStatus === "paid") {
        return res.status(200).json({
          success: true,
          message: "Order is already paid",
          data: order,
        });
      }

      return res.status(409).json({
        success: false,
        message: "This order is already paid and cannot be changed",
      });
    }

    const item = order.items.id(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Order item not found",
      });
    }

    if (item.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cannot change payment status of a cancelled item",
      });
    }

    if (paymentStatus === "paid" && item.status !== "delivered") {
      return res.status(400).json({
        success: false,
        message: "Item must be delivered before marking as paid",
      });
    }

    item.paymentStatus = paymentStatus;

    await syncCodOrderPayment(order);
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order item payment status updated successfully",
      data: order,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};