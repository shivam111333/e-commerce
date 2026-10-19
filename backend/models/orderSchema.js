import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
   
    variant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Variant",
      required: true,
    },

    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Product name at the time of purchase
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Price at the time of purchase
    price: {
      type: Number,
      required: true,
      min: 0,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    // Snapshot of variant attributes
    attributes: {
      type: Map,
      of: String,
      default: {},
    },

    // Individual item order status
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "shipped",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },

    // Individual item payment status
    paymentStatus: {
      type: String,
      enum: [
        "created",
        "pending",
        "paid",
        "cancelled",
        "failed",
        "refunded",
        "partially_refunded",
      ],
      default: "created",
    },

 

    cancellationReason: {
      type: String,
      trim: true,
    },

    cancelledAt: {
      type: Date,
    },
  },
  {
    _id: true,
  }
);

const orderSchema = new mongoose.Schema(
  {
    // Customer-facing order number
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

  

    // Customer
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Products in this order
    items: {
      type: [orderItemSchema],
      required: true,

      validate: {
        validator: function (items) {
          return items.length > 0;
        },
        message: "Order must contain at least one item",
      },
    },

    // Total order amount
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Central payment
    payment: {
      method: {
        type: String,
        enum: [
          "cod",
         "online"
          
        ],
        required: true,
      },

      status: {
        type: String,
        enum: [
          "created",
          "pending",
          "paid",
          "cancelled",
          "failed",
          "refunded",
          "partially_refunded",
        ],
        default: "created",
      },
    },

    // Delivery address snapshot
    shippingAddress: {
      name: {
        type: String,
        required: true,
        trim: true,
      },

      phone: {
        type: String,
        required: true,
        trim: true,
      },

      address: {
        type: String,
        required: true,
        trim: true,
      },

      city: {
        type: String,
        required: true,
        trim: true,
      },

      state: {
        type: String,
        required: true,
        trim: true,
      },

      pincode: {
        type: String,
        required: true,
        trim: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Order", orderSchema);