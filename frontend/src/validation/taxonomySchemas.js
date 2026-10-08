import * as yup from "yup";
import { objectIdRule } from "./commonSchemas.js";

// Mirrors backend/validators/categoryValidator.js.
export const createCategorySchema = yup.object({
  name: yup
    .string()
    .trim()
    .min(2, "Category name must be at least 2 characters")
    .max(50, "Category name must be at most 50 characters")
    .required("Category name is required"),
  description: yup
    .string()
    .trim()
    .max(500, "Description must be at most 500 characters")
    .default(""),
});

// Mirrors backend/validators/subcategoryValidator.js.
export const createSubcategorySchema = yup.object({
  name: yup
    .string()
    .trim()
    .min(2, "Subcategory name must be at least 2 characters")
    .max(50, "Subcategory name must be at most 50 characters")
    .required("Subcategory name is required"),
  category: objectIdRule("category"),
});
