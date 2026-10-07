import express from "express";
const router = express.Router();
import validate from "../middlewares/validate.js";
import authentication from "../middlewares/authMiddleware.js";
import authorization from "../middlewares/authorizationMiddleware.js";
import { idParamSchema } from "../validators/commonValidator.js";
import {
  createSubcategorySchema,
  updateSubcategorySchema,
} from "../validators/subcategoryValidator.js";

import {
  getsubCategory,
  getsubCategoryById,
  createsubCategory,
  updatesubCategory,
  deletesubCategory,
  getSubcategoriesByCategory,
} from "../controllers/subcategoryController.js";

// Public
router.get("/", getsubCategory);

// Specific path first, so it can never be mistaken for "/:id"
router.get(
  "/category/:id",
  validate(idParamSchema(), "params"),
  getSubcategoriesByCategory
);

router.get("/:id", validate(idParamSchema(), "params"), getsubCategoryById);

// Admin only: authentication → authorization → validation → controller
router.post(
  "/",
  authentication,
  authorization(["admin"]),
  validate(createSubcategorySchema),
  createsubCategory
);

router.put(
  "/:id",
  authentication,
  authorization(["admin"]),
  validate(idParamSchema(), "params"),
  validate(updateSubcategorySchema),
  updatesubCategory
);

router.delete(
  "/:id",
  authentication,
  authorization(["admin"]),
  validate(idParamSchema(), "params"),
  deletesubCategory
);

export default router;