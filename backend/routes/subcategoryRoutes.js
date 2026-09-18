import express from "express";
const router = express.Router();
import authentication from "../middlewares/authMiddleware.js";
import authorization from "../middlewares/authorizationMiddleware.js";

import {
  getsubCategory,
  getsubCategoryById,
  createsubCategory,
  updatesubCategory,
  deletesubCategory,
} from "../controllers/subcategoryController.js";

router.get('/',getsubCategory);
router.get('/:id',getsubCategoryById);
router.post('/',authentication,authorization(["admin"]),createsubCategory);
router.put('/:id',authentication,authorization(["admin"]),updatesubCategory);
router.delete('/:id',authentication,authorization(["admin"]),deletesubCategory);

export default router;

