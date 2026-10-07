import * as yup from "yup";
import { objectId } from "./commonValidator.js";

// Business limit per cart line: change it if you want a different cap
const MAX_QTY_PER_ITEM = 10;

const quantity = yup
  .number()
  .typeError("Quantity must be a number")
  .integer("Quantity must be a whole number")
  .min(1, "Quantity must be at least 1")
  .max(MAX_QTY_PER_ITEM, `You can add at most ${MAX_QTY_PER_ITEM} of one item`);

// POST /api/cart
export const addToCartSchema = yup.object({
  variant: objectId("variant"),
  quantity: quantity.required("Quantity is required"),
});

// PUT /api/cart  (sets the quantity to this exact value)
export const updateCartItemSchema = yup.object({
  variant: objectId("variant"),
  quantity: quantity.required("Quantity is required"),
});