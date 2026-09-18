import mongoose from "mongoose";
const variantSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    images: {
      type: [String],
      default: [],
      required: false,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    stock: {
      type: Number,
      default: 1,
      required: false,
    },
    attributes: {
      type: Map, //key value pair size-S
      //color:red
      of: String,
      default: {},
    },
    attributeKey: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);
variantSchema.index({ product: 1, attributeKey: 1 }, { unique: true });
const Variant = mongoose.model("Variant", variantSchema);
export default Variant;
