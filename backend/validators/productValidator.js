import * as yup from "yup";
import { objectId } from "./commonValidator.js";

const name = yup
  .string()
  .trim()
  .min(2, "Product name must be at least 2 characters")
  .max(120, "Product name must be at most 120 characters");

const description = yup
  .string()
  .trim()
  .min(10, "Description must be at least 10 characters")
  .max(2000, "Description must be at most 2000 characters");

// POST /api/product
// `vendor` is deliberately not accepted from the client: it comes from req.user
export const createProductSchema = yup.object({
  name: name.required("Product name is required"),
  description: description.required("Description is required"),
  category: objectId("category"),
  subcategory: objectId("subcategory"),
});

// PUT /api/product/:id
// Your updateProduct controller expects all four fields, so all are required
export const updateProductSchema = yup.object({
  name: name.required("Product name is required"),
  description: description.required("Description is required"),
  category: objectId("category"),
  subcategory: objectId("subcategory"),
});