import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // One Payment per Order
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
    },

    // Online payments only. For cash (COD) leave these two fields OUT
    // (never set them to null) so the sparse unique index ignores them.
    razorpayOrderId: {
      type: String,
      unique: true,
      sparse: true,
    },

    razorpayPaymentId: {
      type: String,
      unique: true,
      sparse: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      required: true,
      default: "INR",
    },

    // Gateway-level status (never shown to customers)
    status: {
      type: String,
      enum: [
        "pending",
        "authorized",
        "captured",
       
        "failed",
        "refunded",
        "partially_refunded",
      ],
      default: "pending",
    },

    // "online" until payment succeeds, then Razorpay's real method
    // (upi, card, netbanking, wallet, ...). "cash" for COD.
    method: {
      type: String,
    },

    // Set exactly once, by whichever of verify / webhook gets there first.
    // That caller reduces stock; the other one finds it already done.
    finalizedAt: {
      type: Date,
      default: null,
    },

    // Customer paid but some items were out of stock: admin must refund
    needsRefund: {
      type: Boolean,
      default: false,
    },

    refundAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Payment", paymentSchema);