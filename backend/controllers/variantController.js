import Product from "../models/productSchema.js";
import Variant from "../models/variantSchema.js";
import uploadToCloudinary from "../utils/uploadToCloudinary.js";

export const getVariant = async (req, res) => {
  try {
    const variant = await Variant.find();

    return res.status(200).json(variant);
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const getVariantById = async (req, res) => {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({
        message: "Id is Required",
      });
    }

    const variant = await Variant.findById(id);

    if (!variant) {
      return res.status(404).json({
        message: "Variant Not exist",
      });
    }

    return res.status(200).json(variant);
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

function createAttributeKey(attributes) {
  return Object.keys(attributes)
    .sort()
    .map((key) => `${key}=${attributes[key]}`)
    .join("|");
}

export const createVariant = async (req, res) => {
  try {
    const { product, price, stock, attributes } = req.body; // attributes is already an object

    const productDoc = await Product.findById(product);
    if (!productDoc) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (productDoc.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to change this product",
      });
    }

    const attributeKey = createAttributeKey(attributes);

    // Check duplicates BEFORE uploading images
    const duplicate = await Variant.exists({ product, attributeKey });
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "This variant combination already exists for this product",
      });
    } 
    
    if (!req.files || req.files.length === 0) {
  return res.status(400).json({
    success: false,
    message: "At least one image is required",
  });
}

    const imageUrls = [];
    for (const file of req.files || []) {
      const result = await uploadToCloudinary(file.buffer);
      imageUrls.push(result.secure_url);
    }

    const variant = await Variant.create({
      product,
      price,
      stock,
      attributes,
      attributeKey,
      images: imageUrls,
    });

    return res.status(201).json({
      success: true,
      message: "Successfully added variant",
      data: variant,
    });
  } catch (err) {
    // Two simultaneous requests: the unique index catches the second
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This variant combination already exists for this product",
      });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateVariant = async (req, res) => {
  try {
    const id = req.params.id;
    const { product, price, stock, attributes } = req.body;

    const existingVariant = await Variant.findById(id);
    if (!existingVariant) {
      return res.status(404).json({ success: false, message: "Variant not found" });
    }

    const ownedProduct = await Product.exists({
      _id: existingVariant.product,
      vendor: req.user._id,
    });
    if (!ownedProduct) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to change this variant",
      });
    }

    if (existingVariant.product.toString() !== product.toString()) {
      return res.status(400).json({
        success: false,
        message: "A variant cannot be moved to another product",
      });
    }

    const attributeKey = createAttributeKey(attributes);

    const duplicate = await Variant.exists({
      _id: { $ne: id },
      product,
      attributeKey,
    });
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "This variant combination already exists for this product",
      });
    }

    const variant = await Variant.findByIdAndUpdate(
      id,
      { price, stock, attributes, attributeKey },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Successfully updated",
      data: variant,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This variant combination already exists for this product",
      });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteVariant = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.json({ message: "Id is required" });
    }

    const variant = await Variant.findById(id);

    if (!variant) {
      return res.status(403).json({
        message: "Variant not found",
      });
    }
    const product = await Product.findById(variant.product);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (product.vendor.toString() !== req.user._id.toString()) {
      return res.status(401).json({
        message: "you are not authorized ",
      });
    }
    await Variant.findByIdAndDelete(id);

    return res.status(200).json({ message: "Successfuly Deleted" });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
