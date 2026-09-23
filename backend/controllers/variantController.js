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
    const { product, price, stock, attributes } = req.body;

    if (
      !product ||
      price === undefined ||
      price === null ||
      stock === undefined ||
      stock === null ||
      !attributes
    ) {
      return res.json({
        success: false,
        message: "All fields are required",
      });
    }

    const product_exist = await Product.findById(product);
    if (!product_exist) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (product_exist.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to change this product",
      });
    }

    let parsedAttributes = {};
    try {
      parsedAttributes = JSON.parse(attributes);
    } catch (error) {
      return res.json({
        success: false,
        message: "Attributes must be valid JSON",
      });
    }

    const attributeKey = createAttributeKey(parsedAttributes);

    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer);
        imageUrls.push(result.secure_url);
      }
    }
      const duplicate = await Variant.findOne({
     
      product,
      attributeKey,
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "This variant combination already exists for this product",
      });
    } 
    const variant = await Variant.create({
      product,
      price,
      stock,
      attributes: parsedAttributes,
      attributeKey,
      images: imageUrls,
    });

    return res.status(201).json({
      success: true,
      message: "Successfully added variant",
      data: variant,
    });
  } catch (err) {
   
    console.log(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const updateVariant = async (req, res) => {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Id is required",
      });
    }

    const { product, price, stock, attributes } = req.body;

    if (
      !product ||
      price === undefined ||
      price === null ||
      stock === undefined ||
      stock === null ||
      !attributes
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const product_exist = await Product.findById(product);

    if (!product_exist) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (product_exist.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to change this product",
      });
    }

    let parsedAttributes = {};

    try {
      parsedAttributes = JSON.parse(attributes);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Attributes must be valid JSON",
      });
    }

    const attributeKey = createAttributeKey(parsedAttributes);

    const duplicate = await Variant.findOne({
      _id: { $ne: id },
      
      product,
      attributeKey,
    });
console.log("Duplicate match:", duplicate);
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "This variant combination already exists for this product",
      });
    }

    const variant = await Variant.findByIdAndUpdate(
      id,
      {
        product,
        price,
        stock,
        attributes: parsedAttributes,
        attributeKey,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: "Variant not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Successfully updated",
      data: variant,
    });
  } catch (err) {
   
    return res.status(500).json({
      success: false,
      message: err.message,
    });
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
    const product =await Product.findById(variant.product);
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
