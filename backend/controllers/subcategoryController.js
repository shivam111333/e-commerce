import Category from "../models/categorySchema.js";
import Subcategory from "../models/subcategorySchema.js";

export const getsubCategory = async (req, res) => {
  try {
    const subcategory = await Subcategory.find();

    return res.status(200).json({data:subcategory});
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const getsubCategoryById = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await Subcategory.findById(id);
    if (!result) {
      return res.status(404).json({
        message: "No Sub-Category find",
      });
    }
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const createsubCategory = async (req, res) => {
  try {
    const { name, category } = req.body;

    if (!name || !category) {
      return res.json({
        message: "fields are required",
      });
    }
    const getcategory = await Category.findById(category);

    if (!getcategory) {
      return res.status(404).json({
        message: "Category not found",
      });
    }
    const result = await Subcategory.create({ name: name.trim(), category });
    return res.status(201).json({
      message: "Sub-Category successfully Added",
      data:result
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const updatesubCategory = async (req, res) => {
  try {
    const id = req.params.id;
    const { name, category } = req.body;
    if (!id) {
      return res.json({
        message: "Id is required",
      });
    }
    if (!name || !category) {
      return res.json({
        message: "Field is empty",
      });
    }

    const result = await Category.findById(category);

    if (!result) {
      return res.status(403).json({
        message: "Category not found",
      });
    }

    const subcategory = await Subcategory.findByIdAndUpdate(id,
      { name: name.trim(), category },
      {
        new: true,
        runvaldidator: true,
      },
    );
    if (!subcategory) {
      return res.status(403).json({ message: "Sub-category not found" });
    }
    return res.status(200).json({
      message: "Sub-category Successfully Updated",
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

export const deletesubCategory = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.json({ message: "Id is required" });
    }
    const result = await Subcategory.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).json({
        message: "Sub-Category Not found",
      });
    }
    return res.status(200).json({
      message: "Successfully deleted",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


export const getSubcategoriesByCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "Category ID is required",
      });
    }

    const subcategories = await Subcategory.find({
      category: categoryId,
    });

    return res.status(200).json({
      success: true,
      data: subcategories,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};