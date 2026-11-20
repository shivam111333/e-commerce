import Product from "../models/productSchema.js";
import Variant from "../models/variantSchema.js";
import Order from "../models/orderSchema.js";
import mongoose from "mongoose";
// import Category from '../models/categorySchema.js'
import Subcategory from "../models/subcategorySchema.js";
import User from "../models/userSchema.js";


const parsePositiveInteger = (value, fallback) => {
  if (value === undefined) return fallback;
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
    return null;
  }
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : null;
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getProduct = async (req, res) => {
  try {
    const isPaginatedRequest =
      req.query.page !== undefined || req.query.limit !== undefined;
    const page = parsePositiveInteger(req.query.page, 1);
    const requestedLimit = parsePositiveInteger(req.query.limit, 12);

    if (page === null || requestedLimit === null) {
      return res.status(400).json({
        success: false,
        message: "page and limit must be positive integers",
      });
    }

    const search =
      typeof req.query.search === "string" ? req.query.search.trim() : "";
    if (
      (req.query.search !== undefined &&
        typeof req.query.search !== "string") ||
      search.length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "search must be a string of 100 characters or fewer",
      });
    }

    const { category, subcategory } = req.query;
    if (
      category !== undefined &&
      (typeof category !== "string" ||
        (category !== "all" && !mongoose.isValidObjectId(category)))
    ) {
      return res.status(400).json({
        success: false,
        message: "category must be a valid category ID",
      });
    }
    if (
      subcategory !== undefined &&
      (typeof subcategory !== "string" ||
        !mongoose.isValidObjectId(subcategory))
    ) {
      return res.status(400).json({
        success: false,
        message: "subcategory must be a valid subcategory ID",
      });
    }

    const sortOrder = req.query.sort ?? "featured";
    const sortFields = {
      featured: { createdAt: -1, _id: -1 },
      "price-low": { minPrice: 1, _id: 1 },
      "price-high": { minPrice: -1, _id: 1 },
    };
    if (
      typeof sortOrder !== "string" ||
      !Object.prototype.hasOwnProperty.call(sortFields, sortOrder)
    ) {
      return res.status(400).json({
        success: false,
        message: "sort must be featured, price-low, or price-high",
      });
    }

    const limit = Math.min(requestedLimit, 50);
    const skip = (page - 1) * limit;

    if (!Number.isSafeInteger(skip)) {
      return res.status(400).json({
        success: false,
        message: "page is too large",
      });
    }

    // 1. Find all active vendor IDs
    const activeVendors = await User.find(
      { role: "vendor", status: "active" },
      "_id",
    );

    if (!activeVendors.length) {
      if (isPaginatedRequest) {
        return res.status(200).json({
          success: true,
          data: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
          },
        });
      }

      return res.status(404).json({
        success: false,
        message: "Product Not Found",
      });
    }

    const activeVendorIds = activeVendors.map((vendor) => vendor._id);
    const productMatch = { vendor: { $in: activeVendorIds } };

    if (search) {
      productMatch.name = { $regex: escapeRegex(search), $options: "i" };
    }
    if (category && category !== "all") {
      productMatch.category = new mongoose.Types.ObjectId(category);
    }
    if (subcategory) {
      productMatch.subcategory = new mongoose.Types.ObjectId(subcategory);
    }

    const pipeline = [
      { $match: productMatch },
      {
        $lookup: {
          from: "variants",
          localField: "_id",
          foreignField: "product",
          pipeline: [
            { $match: { stock: { $gt: 0 } } },
            { $sort: { price: 1, _id: 1 } },
            ...(isPaginatedRequest
              ? [
                  {
                    $project: {
                      price: 1,
                      stock: 1,
                      images: { $slice: ["$images", 1] },
                    },
                  },
                ]
              : []),
          ],
          as: "variants",
        },
      },
      { $match: { "variants.0": { $exists: true } } },
      ...(sortOrder === "featured"
        ? []
        : [{ $addFields: { minPrice: { $min: "$variants.price" } } }]),
      ...(isPaginatedRequest
        ? [
            {
              $facet: {
                data: [
                  { $sort: sortFields[sortOrder] },
                  { $skip: skip },
                  { $limit: limit },
                  {
                    $project: {
                      _id: 1,
                      name: 1,
                      category: 1,
                      subcategory: 1,
                      variants: 1,
                    },
                  },
                ],
                metadata: [{ $count: "total" }],
              },
            },
          ]
        : [
            ...(req.query.sort === undefined
              ? []
              : [{ $sort: sortFields[sortOrder] }]),
            ...(sortOrder === "featured" ? [] : [{ $project: { minPrice: 0 } }]),
          ]),
    ];

    const results = await Product.aggregate(pipeline);

    if (isPaginatedRequest) {
      const result = results[0];
      if (
        !result ||
        !Array.isArray(result.data) ||
        !Array.isArray(result.metadata)
      ) {
        throw new Error("Product pagination query returned an invalid result.");
      }

      const products = result.data;
      const total = result.metadata[0]?.total ?? 0;

      return res.status(200).json({
        success: true,
        data: products,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: skip + products.length < total,
        },
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product Not Found",
      });
    }

    return res.status(200).json({ success: true, data: results });
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

    return res.status(200).json({ data: productWithVariants });
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

    return res
      .status(201)
      .json({ data: product, message: "Successfully Created a Product" });
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

    if (!name?.trim() || !description?.trim() || !category || !subcategory) {
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
    if (product.vendor.toString() !== req.user._id.toString()) {
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
