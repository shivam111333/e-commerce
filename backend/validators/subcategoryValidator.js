import * as yup from "yup";
import { objectId } from "./commonValidator.js";

const name = yup
  .string()
  .trim()
  .min(2, "Subcategory name must be at least 2 characters")
  .max(50, "Subcategory name must be at most 50 characters");

// POST /api/subcategory
export const createSubcategorySchema = yup.object({
  name: name.required("Subcategory name is required"),
  category: objectId("category"),
});

// PUT /api/subcategory/:id
// Your updatesubCategory controller expects both fields, so both are required here
export const updateSubcategorySchema = yup.object({
  name: name.required("Subcategory name is required"),
  category: objectId("category"),
});