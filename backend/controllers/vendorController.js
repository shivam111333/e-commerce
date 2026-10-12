import Product from "../models/productSchema.js";
import Variant from '../models/variantSchema.js'

export const getVendorProduct = async (req, res) => {
  try {
    const vendor_id = req.user._id;
    if (!vendor_id) {
      return res.status(401).json({
        message: "You are not authorized vendor id is missing ",
      });
    }

    const products = await Product.find({ vendor: vendor_id })
      .populate("category", "name")
      .populate("subcategory", "name");

    const variants = await Variant.find({
      product: { $in: products.map((item) => item._id) },
    }).select("product images price stock attributes");

    const variantsByProduct = new Map();
    for (const variant of variants) {
      const productId = variant.product.toString();
      const productVariants = variantsByProduct.get(productId) || [];
      productVariants.push(variant);
      variantsByProduct.set(productId, productVariants);
    }

    const productsWithVariants = products.map((product) => ({
      ...product.toObject(),
      variants: variantsByProduct.get(product._id.toString()) || [],
    }));

    return res.status(200).json({
      success:true,
      data:productsWithVariants
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const getProductVariant = async (req, res) => {
  try {
    const product_id=req.params.id;
    const vendor_id = req.user._id;
    if(!product_id)
    {
      return res.json({message:"Proudct id is required"});
    }
    if (!vendor_id) {
      return res.status(401).json({
        message: "You are not authorized vendor id is missing ",
      });
    }
     const variant=await Variant.find({product:product_id});
     return res.status(200).json(variant)
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
