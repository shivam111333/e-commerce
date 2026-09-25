import Category from "../models/categorySchema.js";
import Product from "../models/productSchema.js";
import Subcategory from "../models/subcategorySchema.js";
import Variant  from "../models/variantSchema.js";

export const getCategory = async (req, res) => {
  try {
    const category = await Category.find();
    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (err) {
    console.log("Error", err);
    return res.status(500).json({ message: err.message });
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const id = req.params.id;
    const category = await Category.findById(id);
    if (!category) {
      return res
        .stauts(400)
        .json({ success: false, message: "No category available" });
    }
    return res.json({
      success: true,
      category,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: err.message });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(500).json({
        message: " Category Name is required ",
      });
    }

    const newCategory = await Category.create({
      name: name.trim(),
      description,
    });
    return res.status(201).json({
      success: true,

      message: "Category Created Successfully ",
    
      data:newCategory
    });
  } catch (err) {
    console.log("Error", err);
    return res.status(500).json({ message: err.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const id = req.params.id;
    const { name, description } = req.body;

    const category_result = await Category.findByIdAndUpdate(
      id,
      {
        name,
        description,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!category_result) {
      return res.status(403).json({
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Successfully Updated",
    });
  } catch (err) {
    console.log(err);
    return res.json({ message: err.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(404).json({
        success: false,
        message: "Id is required",
      });
    }

    await Subcategory.deleteMany({
      category: id,
    });

    const result = await Category.findByIdAndDelete(id);
    if (!result) {
      return res.status(403).json({
        message: "Category not found",
      });
    }

    return res.status(200).json({
      message: "Successfully deleted",
    });
  } catch (err) {
    console.log(err);
    return res.json({ message: err.message });
  }
};

export const getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
     console.log("CATEGORY ID:", categoryId);


    const products = await Product.find({
      category: categoryId,
    })
      .populate("category", "name")
      .populate("subcategory", "name");

    if (products.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const productIds = products.map((product) => product._id);

    const variants = await Variant.find({
      product: { $in: productIds },
    });

    const productsWithVariants = products.map((product) => {
      const productVariants = variants.filter(
        (variant) =>
          variant.product.toString() === product._id.toString()
      );

      return {
        ...product.toObject(),
        variants: productVariants,
      };
    });

    return res.status(200).json({
      success: true,
      data: productsWithVariants,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
