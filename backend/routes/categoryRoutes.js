import express from "express";
const router = express.Router();
import {
  getCategory,
  deleteCategory,
  createCategory,
  updateCategory,
  getCategoryById,
  getProductsByCategory
} from "../controllers/categoryController.js";
import authentication from "../middlewares/authMiddleware.js";
import authorization from "../middlewares/authorizationMiddleware.js";

router.get("/", getCategory);
router.get('/all/:categoryId',getProductsByCategory)
router.get("/:id", getCategoryById);

router.post("/", authentication, authorization(["admin"]), createCategory);

router.put("/:id", authentication, authorization(["admin"]), updateCategory);

router.delete("/:id", authentication, authorization(["admin"]), deleteCategory);

export default router;
