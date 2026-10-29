import Product from "../models/productSchema.js";
import Variant from "../models/variantSchema.js";
import Order from "../models/orderSchema.js";
 import Category from '../models/categorySchema.js'
import Subcategory from '../models/subcategorySchema.js'
import User from '../models/userSchema.js'


import mongoose from "mongoose";

export const getProduct = async (req, res) => {
  try {
    // 1. Read pagination, search, filters, and sorting parameters.
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);

    // Keep the page size fixed at 12.
    const limit = 12;

    const skip = (page - 1) * limit;

    const search = (req.query.search || "").trim();
    const category = req.query.category;
    const subcategory = req.query.subcategory;
    const sort = req.query.sort || "featured";

    // 2. Find active vendors.
    const activeVendors = await User.find(
      { role: "vendor", status: "active" },
      "_id"
    ).lean();

    const activeVendorIds = activeVendors.map((vendor) => vendor._id);

    // Return an empty result instead of a 404.
    if (activeVendorIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: {
          currentPage: page,
          limit,
          totalProducts: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      });
    }

    // 3. Build the product filters.
    const matchConditions = {
      vendor: { $in: activeVendorIds },
    };

    // Validate and filter by category
    if (category) {
      if (!mongoose.isValidObjectId(category)) {
        return res.status(400).json({
          success: false,
          message: "Invalid category ID",
        });
      }

      matchConditions.category = new mongoose.Types.ObjectId(category);
    }

    // Validate and filter by subcategory
    if (subcategory) {
      if (!mongoose.isValidObjectId(subcategory)) {
        return res.status(400).json({
          success: false,
          message: "Invalid subcategory ID",
        });
      }

      matchConditions.subcategory = new mongoose.Types.ObjectId(
        subcategory
      );
    }

    // 4. Search: product title, category name, or subcategory name only.
    // The description is NOT searched.
    // The match must start at the beginning of a word, so "ram" finds
    // "RAM" but not "grams" or "program".
    let searchStages = [];

    if (search) {
      const escapedSearch = search.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      const wordStart = `\\b${escapedSearch}`;

      searchStages = [
        {
          $lookup: {
            from: Category.collection.name,
            localField: "category",
            foreignField: "_id",
            as: "categoryDoc",
          },
        },
        {
          $lookup: {
            from: Subcategory.collection.name,
            localField: "subcategory",
            foreignField: "_id",
            as: "subcategoryDoc",
          },
        },
        {
          $match: {
            $or: [
              { name: { $regex: wordStart, $options: "i" } },
              { "categoryDoc.name": { $regex: wordStart, $options: "i" } },
              { "subcategoryDoc.name": { $regex: wordStart, $options: "i" } },
            ],
          },
        },
      ];
    }

    // 5. Apply sorting.
    // Price sorting uses the lowest in-stock variant price.
    let sortStage;

    switch (sort) {
      case "price-low":
        sortStage = { minPrice: 1, _id: 1 };
        break;

      case "price-high":
        sortStage = { minPrice: -1, _id: 1 };
        break;

      default:
        sortStage = { _id: -1 };
        break;
    }

    // 6. Fetch products and calculate pagination metadata.
    const result = await Product.aggregate([
      {
        $match: matchConditions,
      },
      ...searchStages,
      {
        $lookup: {
          from: Variant.collection.name,
          localField: "_id",
          foreignField: "product",
          as: "variants",
        },
      },
      {
        $addFields: {
          variants: {
            $filter: {
              input: "$variants",
              as: "variant",
              cond: {
                $gt: ["$$variant.stock", 0],
              },
            },
          },
        },
      },
      {
        // Only products with at least one in-stock variant.
        $match: {
          "variants.0": { $exists: true },
        },
      },
      {
        $addFields: {
          minPrice: {
            $min: "$variants.price",
          },
        },
      },
      {
        $facet: {
          // Count all matching products before pagination.
          metadata: [
            { $count: "totalProducts" },
          ],

          // Return only the products for the requested page.
          products: [
            { $sort: sortStage },
            { $skip: skip },
            { $limit: limit },
            {
              // Remove helper fields used only for searching and sorting
              $project: {
                minPrice: 0,
                categoryDoc: 0,
                subcategoryDoc: 0,
              },
            },
          ],
        },
      },
    ]);

    const totalProducts = result[0].metadata[0]?.totalProducts || 0;
    const totalPages = Math.ceil(totalProducts / limit);

    const products = result[0].products;

    // 7. Send products and pagination metadata.
    return res.status(200).json({
      success: true,
      data: products,
      pagination: {
        currentPage: page,
        limit,
        totalProducts,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1 && totalPages > 0,
      },
    });
  } catch (err) {
    console.error("GET PRODUCTS ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};

export const getAllProduct = async (req, res) => {
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

export const getTopSellingProducts = async (req, res) => {
  try {
    const products = await Order.aggregate([
      { $unwind: "$items" },
      {
        $match: {
          "items.status": "delivered",
          "items.paymentStatus": "paid",
        },
      },
      {
        $lookup: {
          from: "variants",
          localField: "items.variant",
          foreignField: "_id",
          as: "variant",
        },
      },
      { $unwind: "$variant" },
      {
        $group: {
          _id: "$variant.product",
          soldQuantity: { $sum: "$items.quantity" },
        },
      },
      { $sort: { soldQuantity: -1, _id: 1 } },
    ]);

    return res.status(200).json({ success: true, data: products });
  } catch (err) {
    console.error("GET TOP-SELLING PRODUCTS ERROR:", err);
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
