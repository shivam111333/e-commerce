import * as yup from "yup";
import { objectIdRule } from "./commonSchemas.js";

// Mirrors backend/validators/productValidator.js.
const fields = {
  name: yup
    .string()
    .trim()
    .min(2, "Product name must be at least 2 characters")
    .max(120, "Product name must be at most 120 characters")
    .required("Product name is required"),
  description: yup
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must be at most 2000 characters")
    .required("Description is required"),
  category: objectIdRule("category"),
  subcategory: objectIdRule("subcategory"),
};

export const productSchema = yup.object(fields);
