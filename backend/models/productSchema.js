import mongoose from 'mongoose'

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required:true
    },
    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subcategory",
      required:true
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required:true,
      Index:true
    },
  },
  {
    timestamps: true,
  },
);
const Product=mongoose.model("Product",productSchema);
export default Product;