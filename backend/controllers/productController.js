import Product from "../models/productSchema.js";
import Variant from "../models/variantSchema.js";
// import Category from '../models/categorySchema.js'
import Subcategory from '../models/subcategorySchema.js'

export const getProduct = async (req, res) => {
  try {
    const products = await Product.aggregate([
      {
        $lookup: {
          from: "variants",
          localField: "_id",
          foreignField: "product",
          as: "variants",
        },
      },
      {
        $match: {
          variants: {
            $elemMatch: {
              stock: { $gt: 0 },
            },
          },
        },
      },
    ]);

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product Not Found",
      });
    }

    return res.status(200).json({
      success: true,
      data: products,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
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
    if (!id) {
      return res.json({ message: "Id is Required" });
    }
    const product_exist = await Product.findById(id);
    if (!product_exist) {
      return res.status(404).json({
        message: "Product Not found",
      });
    }
    await Variant.deleteMany({
      product: id,
    });  
    
    const result = await Product.findByIdAndDelete(id);
    return res.status(200).json({
      success: true,
      message: "Successfuly Deleted Product",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
