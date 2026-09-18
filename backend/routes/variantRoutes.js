import express from "express";
const router = express.Router();

import authentication from "../middlewares/authMiddleware.js";
import authorization from "../middlewares/authorizationMiddleware.js";


import {
  getVariant,
  getVariantById,
  createVariant,
  updateVariant,
  deleteVariant,
} from "../controllers/variantController.js";

import upload from '../middlewares/uploadMiddleware.js'

router.get("/", getVariant);
router.get("/:id", getVariantById);
router.post("/", authentication, authorization(['vendor']),upload.array("images",5),createVariant);
router.put("/:id", authentication, authorization(['vendor']),upload.none(),updateVariant);
router.delete("/:id", authentication, authorization(['vendor']), deleteVariant);

export default router;
