import express from "express";
import validate from "../middlewares/validate.js";
import authentication from "../middlewares/authMiddleware.js";
import authorization from "../middlewares/authorizationMiddleware.js";
import { idParamSchema } from "../validators/commonValidator.js";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../validators/categoryValidator.js";
import {
  getCategory,
  getCategoryById,
  getProductsByCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";

const router = express.Router();

// Public
router.get("/", getCategory);

router.get(
  "/all/:categoryId",
  validate(idParamSchema("categoryId"), "params"),
  getProductsByCategory
);

router.get("/:id", validate(idParamSchema(), "params"), getCategoryById);

// Admin only
router.post(
  "/",
  authentication,
  authorization(["admin"]),
  validate(createCategorySchema),
  createCategory
);

router.put(
  "/:id",
  authentication,
  authorization(["admin"]),
  validate(idParamSchema(), "params"),
  validate(updateCategorySchema),
  updateCategory
);

router.delete(
  "/:id",
  authentication,
  authorization(["admin"]),
  validate(idParamSchema(), "params"),
  deleteCategory
);

export default router;