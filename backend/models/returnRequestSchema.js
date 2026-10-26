import mongoose from "mongoose";

const refundBankAccountSchema = new mongoose.Schema(
  {
    accountHolderName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    accountNumber: {
      type: String,
      required: true,
    },
    ifscCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      match: [/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code"],
    },
  },
  { _id: false }
);

const returnRequestSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    item: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    requestedQuantity: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "Requested quantity must be a whole number",
      },
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 1000,
    },
    refundBankAccount: {
      type: refundBankAccountSchema,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "requested",
        "approved",
        "rejected",
        "received",
        "refund_pending",
        "refunded",
        "cancelled",
      ],
      default: "requested",
      index: true,
    },
    refundAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    bankTransferReference: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    refundProcessedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    refundProcessedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

returnRequestSchema.index({ order: 1, item: 1 }, { unique: true });

export default mongoose.model("ReturnRequest", returnRequestSchema);
