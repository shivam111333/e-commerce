import express from "express";
const router = express.Router();
import validate from "../middlewares/validate.js";
import authentication from "../middlewares/authMiddleware.js";
import authorization from "../middlewares/authorizationMiddleware.js";
import { idParamSchema } from "../validators/commonValidator.js";
import {
  createProductSchema,
  updateProductSchema,
} from "../validators/productValidator.js";

import {
  getProduct,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";

// Public
router.get("/", getProduct);
router.get("/:id", validate(idParamSchema(), "params"), getProductById);

// Vendor only
router.post(
  "/",
  authentication,
  authorization(["vendor"]),
  validate(createProductSchema),
  createProduct
);

router.put(
  "/:id",
  authentication,
  authorization(["vendor"]),
  validate(idParamSchema(), "params"),
  validate(updateProductSchema),
  updateProduct
);

router.delete(
  "/:id",
  authentication,
  authorization(["vendor"]),
  validate(idParamSchema(), "params"),
  deleteProduct
);

export default router;