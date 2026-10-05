import Order from "../models/orderSchema.js";
import User from "../models/userSchema.js";
import Product from "../models/productSchema.js";
import Variant from "../models/variantSchema.js";
import Cart from "../models/cartSchema.js"

// ==========================================
// UTILITY: Generate unique order number
// ==========================================
const generateOrderNumber = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

export const getOrderByUserId = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

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

export const createUserOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;
    const userId = req.user._id;

    // Check user
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // Check items
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order must contain at least one item",
      });
    }

    // Check shipping address
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

    // Validate payment method
    const validPaymentMethods = ["cod", "online"];
    const method = paymentMethod || "cod";

    if (!validPaymentMethods.includes(method)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    const processedItems = [];
    let totalAmount = 0;

    // Process every order item
    for (const item of items) {
      // Validate variant and quantity
      if (!item.variant || !item.quantity || item.quantity < 1) {
        return res.status(400).json({
          success: false,
          message: "Invalid variant or quantity",
        });
      }

      // Find variant
      const variant = await Variant.findById(item.variant);

      if (!variant) {
        return res.status(404).json({
          success: false,
          message: "Variant not found",
        });
      }

      // Check stock
      if (variant.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.variant}`,
        });
      }

      // Find product
      const product = await Product.findById(variant.product);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      // Calculate item total using backend price
      const itemTotal = variant.price * item.quantity;

      totalAmount += itemTotal;

      // Convert Variant attributes Map into normal object
      const attributes =
        variant.attributes instanceof Map
          ? Object.fromEntries(variant.attributes.entries())
          : variant.attributes || {};

      // Create order item snapshot with NEW fields
      processedItems.push({
        variant: variant._id,
        vendor: product.vendor,
        name: product.name,
        price: variant.price,
        quantity: item.quantity,
        attributes: attributes,
        status: "pending",
        paymentStatus: "pending", // ADD: Per-item payment status
      });

      // Reduce stock
      variant.stock -= item.quantity;

      await variant.save();
    }

    // Create complete order with NEW structure
    const order = await Order.create({
      orderNumber: generateOrderNumber(), // ADD: Unique order number
      user: userId,
      items: processedItems,
      totalAmount: totalAmount,
      shippingAddress: {
        name: shippingAddress.name,
        phone: shippingAddress.phone,
        address: shippingAddress.address,
        city: shippingAddress.city,
        state: shippingAddress.state,
        pincode: shippingAddress.pincode,
      },
      payment: { // NEW: Nested payment object
        method: method,
        status: "pending",
      },
    });

    await Cart.findOneAndUpdate(
      { user: userId },
      { $set: { items: [] } }
    );

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

export const getVendorOrders = async (req, res) => {
  try {
    const vendorId = req.user._id;

    if (!vendorId) {
      return res.status(401).json({
        success: false,
        message: "Vendor not found",
      });
    }

    // Find orders which contain at least one item belonging to this vendor
    const orders = await Order.find({
      "items.vendor": vendorId,
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
        (item) =>
          item.vendor.toString() === vendorId.toString()
      );

      // Calculate only this vendor's total
      const vendorTotal = vendorItems.reduce(
        (total, item) =>
          total + item.price * item.quantity,
        0
      );

      return {
        _id: order._id,
        orderNumber: order.orderNumber, // ADD: Order number
        user: order.user,
        items: vendorItems,
        vendorTotal,
        shippingAddress: order.shippingAddress,
        payment: order.payment, // CHANGED: From paymentStatus to payment object
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

export const updateVendorOrderItemStatus = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;

    const {
      status,
      cancellationReason,
    } = req.body;

    const vendorId = req.user._id;

    if (!orderId || !itemId) {
      return res.status(400).json({
        success: false,
        message: "Order ID and item ID are required",
      });
    }

    // UPDATED: Add new statuses
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

    const item = order.items.id(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Order item not found",
      });
    }

    // Security check: Vendor can modify only their own item
    if (
      item.vendor.toString() !==
      vendorId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to update this order item",
      });
    }

    // Already delivered
    if (item.status === "delivered") {
      return res.status(400).json({
        success: false,
        message:
          "Delivered item cannot be updated",
      });
    }

    // Already cancelled
    if (item.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message:
          "Cancelled item cannot be updated",
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
        message:
          "Order status cannot move backwards",
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
            message:
              "Cancellation reason is required",
          });
        }

        // Restore stock
        const variant = await Variant.findById(
          item.variant
        );

        if (!variant) {
          return res.status(404).json({
            success: false,
            message:
              "Variant associated with this order item was not found",
          });
        }

        variant.stock += item.quantity;

        await variant.save();

        item.status = "cancelled";
        item.cancellationReason =
          cancellationReason.trim();
        item.cancelledAt = new Date();
      } else {
        // Normal status update
        item.status = status;
      }
    }

    

    await order.save();

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

export const getAllOrder = async (req, res) => {
  try {
    const user = req.user._id;

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User id is required"
      });
    }

    const orders = await Order.find()

    return res.status(200).json({
      success: true,
      data: orders
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

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

    const allowedPaymentStatuses = [
      "pending",
      "processing",
      "paid",
      "failed",
      "partially_refunded",
      "refunded",
    ];

    if (!allowedPaymentStatuses.includes(paymentStatus)) {
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

    // Admin can manually change payment status
    // only for COD orders.
    if (order.payment.method !== "cod") {
      return res.status(403).json({
        success: false,
        message:
          "Payment status for card and UPI orders is controlled by the payment gateway",
      });
    }

    order.payment.status = paymentStatus;

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

    const allowedPaymentStatuses = [
      "pending",
      "paid",
      "failed",
      "partially_refunded",
      "refunded",
    ];

    if (!allowedPaymentStatuses.includes(paymentStatus)) {
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
          "Payment status for card and UPI orders is controlled by the payment gateway",
      });
    }

    const item = order.items.id(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Order item not found",
      });
    }

    item.paymentStatus = paymentStatus;

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
