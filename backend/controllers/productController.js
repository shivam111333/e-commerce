import Product from "../models/productSchema.js";
import Variant from "../models/variantSchema.js";
// import Category from '../models/categorySchema.js'
import Subcategory from '../models/subcategorySchema.js'
import User from '../models/userSchema.js'



export const getProduct = async (req, res) => {
  try {
    // 1. Find all active vendor IDs
    const activeVendors = await User.find(
      { role: "vendor", status: "active" }, 
      "_id"
    );
    
    if (!activeVendors.length) {
      return res.status(404).json({ success: false, message: "Product Not Found" });
    }
    
    const activeVendorIds = activeVendors.map((vendor) => vendor._id);

    // 2. Fetch products and their in-stock variants in a single database operation
    const productsWithVariants = await Product.aggregate([
      { 
        // Filter products belonging to active vendors
        $match: { vendor: { $in: activeVendorIds } } 
      },
      {
        // Join with the variants collection
        $lookup: {
          from: "variants", // Ensure this matches your actual MongoDB collection name for variants
          localField: "_id",
          foreignField: "product",
          as: "variants"
        }
      },
      {
        // Filter the joined variants to only keep those with stock > 0
        $addFields: {
          variants: {
            $filter: {
              input: "$variants",
              as: "variant",
              cond: { $gt: ["$$variant.stock", 0] }
            }
          }
        }
      },
      {
        // Only return products that have at least one in-stock variant
        $match: {
          "variants.0": { $exists: true }
        }
      }
    ]);

    if (productsWithVariants.length === 0) {
      return res.status(404).json({ success: false, message: "Product Not Found" });
    }

    return res.status(200).json({ success: true, data: productsWithVariants });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};


export const getProductById = async (req, res) => {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Id is required",
      });
    }

    const product = await Product.findById(id)
      .populate("category", "name ")
      .populate("subcategory", "name");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const variants = await Variant.find({
      product: product._id,
    });

    const productWithVariants = {
      ...product.toObject(),
      variants,
    };

    return res.status(200).json({data:productWithVariants});
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, description, category, subcategory } = req.body;

    if (!name || !description || !category || !subcategory) {
      return res.json({ message: "All Field are Required" });
    }

    const vendor = req.user._id;

    const product = await Product.create({
      name: name.trim(),
      description,
      category,
      subcategory,
      vendor,
    });

    return res.status(201).json({ data:product,message: "Successfully Created a Product" });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    const { name, description, category, subcategory } = req.body;

    if (
      !name?.trim() ||
      !description?.trim() ||
      !category ||
      !subcategory
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Vendor can edit only their own product
    if (
      product.vendor.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to edit this product",
      });
    }

    // Verify subcategory belongs to selected category
    const subcategoryExists = await Subcategory.findOne({
      _id: subcategory,
      category: category,
    });

    if (!subcategoryExists) {
      return res.status(400).json({
        success: false,
        message: "Invalid subcategory for selected category",
      });
    }

    product.name = name.trim();
    product.description = description.trim();
    product.category = category;
    product.subcategory = subcategory;

    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const id = req.params.id;

    const product = await Product.findById(id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    if (product.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this product",
      });
    }

    await Variant.deleteMany({ product: id });
    await Product.findByIdAndDelete(id);

    return res
      .status(200)
      .json({ success: true, message: "Successfully deleted product" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

