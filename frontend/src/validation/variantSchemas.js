import * as yup from "yup";
import { objectIdRule } from "./commonSchemas.js";
import {
  ALLOWED_VARIANT_IMAGE_TYPES,
  MAX_ATTRIBUTES,
  MAX_ATTRIBUTE_KEY_LENGTH,
  MAX_ATTRIBUTE_VALUE_LENGTH,
  MAX_IMAGE_SIZE_BYTES,
  MAX_PRICE,
  MAX_STOCK,
  MAX_VARIANT_IMAGES,
} from "../config/limits.js";

// Mirrors backend/validators/variantValidator.js.
const variantFields = {
  product: objectIdRule("product"),
  price: yup
    .number()
    .typeError("Price must be a number")
    .min(1, "Price must be at least 1")
    .max(MAX_PRICE, `Price must not exceed ${MAX_PRICE}`)
    .required("Price is required"),
  stock: yup
    .number()
    .typeError("Stock must be a number")
    .integer("Stock must be a whole number")
    .min(0, "Stock cannot be negative")
    .max(MAX_STOCK, "Stock is too large")
    .required("Stock is required"),
  attributes: yup
    .array()
    .of(
      yup.object({
        key: yup
          .string()
          .trim()
          .max(
            MAX_ATTRIBUTE_KEY_LENGTH,
            `Attribute names must be 1 to ${MAX_ATTRIBUTE_KEY_LENGTH} characters`
          )
          .required("Attribute name is required"),
        value: yup
          .string()
          .trim()
          .max(
            MAX_ATTRIBUTE_VALUE_LENGTH,
            `Attribute values must be 1 to ${MAX_ATTRIBUTE_VALUE_LENGTH} characters`
          )
          .required("Attribute value is required"),
      })
    )
    .min(1, "Provide between 1 and 10 attributes")
    .max(MAX_ATTRIBUTES, "Provide between 1 and 10 attributes")
    .required("Attributes are required"),
};

export const variantSchema = yup.object(variantFields);

const imageArray = yup
  .array()
  .of(
    yup
      .mixed()
      .test(
        "image-type",
        "Only JPG and PNG images are allowed",
        (file) => !file || ALLOWED_VARIANT_IMAGE_TYPES.includes(file.type)
      )
      .test(
        "image-size",
        "Images must be 5 MB or smaller",
        (file) => !file || file.size <= MAX_IMAGE_SIZE_BYTES
      )
  )
  .min(1, "At least one image is required")
  .max(MAX_VARIANT_IMAGES, `You can upload maximum ${MAX_VARIANT_IMAGES} images`)
  .required("At least one image is required");

export const createVariantSchema = yup.object({
  ...variantFields,
  images: imageArray,
});
