import * as yup from "yup";
import { objectId } from "./commonValidator.js";

// Same env value your controllers use (dotenv loads first in index.js)
const MAX_PRICE = Number(process.env.LIMIT_RAZORPAY_LIMIT) || 500000;

const isPlainObject = (v) =>
  v !== null && typeof v === "object" && !Array.isArray(v);

// attributes arrive as a JSON string: '{"color":"Black","storage":"128GB"}'
const attributes = yup
  .mixed()
  // 1. parse the JSON string (leave other values for the test to reject)
  .transform((value, original) => {
    if (typeof original !== "string") return original;
    try {
      return JSON.parse(original);
    } catch {
      return original;
    }
  })
  // 2. normalize: trim, lowercase keys, numbers become strings
  .transform((value) => {
    if (!isPlainObject(value)) return value;
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k.trim().toLowerCase()] =
        typeof v === "number" ? String(v) : typeof v === "string" ? v.trim() : v;
    }
    return out;
  })
  .required("Attributes are required")
  .test({
    name: "attributes-shape",
    test(value, ctx) {
      if (!isPlainObject(value)) {
        return ctx.createError({
          message: 'Attributes must be a JSON object like {"color":"black"}',
        });
      }
      const entries = Object.entries(value);
      if (entries.length < 1 || entries.length > 10) {
        return ctx.createError({ message: "Provide between 1 and 10 attributes" });
      }
      for (const [k, v] of entries) {
        if (!k || k.length > 30) {
          return ctx.createError({
            message: "Attribute names must be 1 to 30 characters",
          });
        }
        if (typeof v !== "string" || !v || v.length > 50) {
          return ctx.createError({
            message: `Value of "${k}" must be 1 to 50 characters`,
          });
        }
      }
      return true;
    },
  });

const price = yup
  .number()
  .typeError("Price must be a number")
  .min(1, "Price must be at least 1")
  .max(MAX_PRICE, `Price must not exceed ${MAX_PRICE}`);

const stock = yup
  .number()
  .typeError("Stock must be a number")
  .integer("Stock must be a whole number")
  .min(0, "Stock cannot be negative")
  .max(100000, "Stock is too large");

// POST /api/variant
export const createVariantSchema = yup.object({
  product: objectId("product"),
  price: price.required("Price is required"),
  stock: stock.required("Stock is required"),
  attributes,
});

// PUT /api/variant/:id
// Your controller expects all four fields (and rejects moving a variant to another product)
export const updateVariantSchema = yup.object({
  product: objectId("product"),
  price: price.required("Price is required"),
  stock: stock.required("Stock is required"),
  attributes,
});