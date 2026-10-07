import express from "express";
const router = express.Router();

import validate from "../middlewares/validate.js";
import authentication from "../middlewares/authMiddleware.js";
import authorization from "../middlewares/authorizationMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";
import { idParamSchema } from "../validators/commonValidator.js";
import {
  createVariantSchema,
  updateVariantSchema,
} from "../validators/variantValidator.js";

import {
  getVariant,
  getVariantById,
  createVariant,
  updateVariant,
  deleteVariant,
} from "../controllers/variantController.js";

// Public
router.get("/", getVariant);
router.get("/:id", validate(idParamSchema(), "params"), getVariantById);

// Vendor only
router.post(
  "/",
  authentication,
  authorization(["vendor"]),
  upload.array("images", 5),   // multer first: it creates req.body
  validate(createVariantSchema),
  createVariant
);

router.put(
  "/:id",
  authentication,
  authorization(["vendor"]),
  validate(idParamSchema(), "params"),
  upload.none(),
  validate(updateVariantSchema),
  updateVariant
);

router.delete(
  "/:id",
  authentication,
  authorization(["vendor"]),
  validate(idParamSchema(), "params"),
  deleteVariant
);

export default router;