import razorpay from "../config/razorpay.js";
import Variant from "../models/variantSchema.js";
import Product from "../models/productSchema.js";
import Order from "../models/orderSchema.js";
import Cart from "../models/cartSchema.js";
import crypto from "crypto";


export const createRazorpayOrder = async (req, res) => {
  try {
    const { items } = req.body;

    const userId = req.user._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Items are required",
      });
    }

    let totalAmount = 0;

    for (const item of items) {
      const variant = await Variant.findById(item.variant);

      if (!variant) {
        return res.status(404).json({
          success: false,
          message: "Variant not found",
        });
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

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const generateOrderNumber = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).toUpperCase();

  return `ORD-${timestamp}-${random}`;
};

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
    
    console.log("isBuyNow received:", isBuyNow);
 

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
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

    if (!["card", "upi"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid online payment method",
      });
    }

    // ==========================================
    // 2. Verify Razorpay signature
    // ==========================================

    const body =
      razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    // ==========================================
    // 3. Re-check Razorpay order
    // ==========================================

    const razorpayOrder =
      await razorpay.orders.fetch(
        razorpay_order_id
      );

    if (!razorpayOrder) {
      return res.status(400).json({
        success: false,
        message: "Razorpay order not found",
      });
    }

    // ==========================================
    // 4. Calculate total again from database
    // ==========================================

    const processedItems = [];
    let totalAmount = 0;

    for (const item of items) {
      if (
        !item.variant ||
        !item.quantity ||
        item.quantity < 1
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid variant or quantity",
        });
      }

      const variant =
        await Variant.findById(item.variant);

      if (!variant) {
        return res.status(404).json({
          success: false,
          message: "Variant not found",
        });
      }

      // IMPORTANT:
      // Check stock again after payment
      if (variant.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message:
            "Product is no longer available in the requested quantity",
        });
      }

      const product =
        await Product.findById(variant.product);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      const itemTotal =
        variant.price * item.quantity;

      totalAmount += itemTotal;

      const attributes =
        variant.attributes instanceof Map
          ? Object.fromEntries(
              variant.attributes.entries()
            )
          : variant.attributes || {};

      processedItems.push({
        variant: variant._id,
        vendor: product.vendor,
        name: product.name,
        price: variant.price,
        quantity: item.quantity,
        attributes,
        status: "pending",
        paymentStatus: "paid",
      });
    }

    // ==========================================
    // 5. Verify Razorpay amount
    // ==========================================

    const expectedAmountInPaise =
      Math.round(totalAmount * 100);

    if (
      Number(razorpayOrder.amount) !==
      expectedAmountInPaise
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment amount does not match order amount",
      });
    }

    // ==========================================
    // 6. Reduce stock
    // ==========================================

    for (const item of items) {
      const variant =
        await Variant.findById(item.variant);

      if (!variant) {
        return res.status(404).json({
          success: false,
          message: "Variant not found",
        });
      }

      variant.stock -= item.quantity;

      await variant.save();
    }

    // ==========================================
    // 7. Create ecommerce Order
    // ==========================================

    const order = await Order.create({
      orderNumber: generateOrderNumber(),

      user: userId,

      items: processedItems,

      totalAmount,

      payment: {
        method: paymentMethod,
        status: "paid",
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

    // ==========================================
    // 8. Clear cart
    // ==========================================

    if (!isBuyNow) {
  await Cart.findOneAndUpdate(
    { user: userId },
    { $set: { items: [] } }
  );
}

    // ==========================================
    // 9. Return created order
    // ==========================================

    return res.status(201).json({
      success: true,
      message: "Payment successful and order placed",
      data: order,
    });

  } catch (error) {
    console.error(
      "Razorpay verification error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const razorpayWebhook = async (req, res) => {
  try {
    const webhookSignature =
      req.headers["x-razorpay-signature"];

    if (!webhookSignature) {
      return res.status(400).json({
        success: false,
        message: "Webhook signature missing",
      });
    }

    const expectedSignature =
      crypto
        .createHmac(
          "sha256",
          process.env.RAZORPAY_WEBHOOK_SECRET
        )
        .update(req.body)
        .digest("hex");

    if (expectedSignature !== webhookSignature) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature",
      });
    }

    const payload = JSON.parse(req.body.toString());

    console.log(
      "RAZORPAY WEBHOOK EVENT:",
      payload.event
    );

    return res.status(200).json({
      success: true,
      message: "Webhook received",
    });

  } catch (err) {
    console.error("Webhook error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};