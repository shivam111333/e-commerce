import Product from "../models/productSchema.js";
import Variant from '../models/variantScehma.js'

export const getVendorProduct = async (req, res) => {
  try {
    const vendor_id = req.user._id;
    if (!vendor_id) {
      return res.status(401).json({
        message: "You are not authorized vendor id is missing ",
      });
    }

    const product = await Product.find({ vendor: vendor_id });
    return res.status(200).json(product);
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
