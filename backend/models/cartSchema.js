import mongoose from 'mongoose'

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    items: [
      {
        variant: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Variant",
          required: true,
        },
        quantity: {
          type: Number,
          min:1,
          required:true
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);
const Cart = mongoose.model("Cart", cartSchema);
export default Cart;
