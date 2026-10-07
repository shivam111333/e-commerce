import * as yup from "yup";

const name = yup
  .string()
  .trim()
  .min(2, "Category name must be at least 2 characters")
  .max(50, "Category name must be at most 50 characters");

const description = yup
  .string()
  .trim()
  .max(500, "Description must be at most 500 characters");

// POST /api/category
export const createCategorySchema = yup.object({
  name: name.required("Category name is required"),
  description: description.default(""),
});

// PUT /api/category/:id  (all fields optional, but send at least one)
export const updateCategorySchema = yup
  .object({
    name,
    description,
  })
  .test(
    "at-least-one-field",
    "Provide at least one field to update",
    (value) => value && (value.name !== undefined || value.description !== undefined)
  );