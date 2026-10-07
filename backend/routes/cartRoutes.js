import express from "express";
const router = express.Router();
import validate from "../middlewares/validate.js";
import authentication from "../middlewares/authMiddleware.js";
import authorization from "../middlewares/authorizationMiddleware.js";
import { idParamSchema } from "../validators/commonValidator.js";
import {
  addToCartSchema,
  updateCartItemSchema,
} from "../validators/cartValidator.js";
import {
  getCart,
  addToCart,
  updateCartItem,
  deleteCartItem,
} from "../controllers/cartController.js";

router.get("/", authentication, authorization(["user"]), getCart);

router.post(
  "/",
  authentication,
  authorization(["user"]),
  validate(addToCartSchema),
  addToCart
);

router.put(
  "/",
  authentication,
  authorization(["user"]),
  validate(updateCartItemSchema),
  updateCartItem
);

router.delete(
  "/:variant",
  authentication,
  authorization(["user"]),
  validate(idParamSchema("variant"), "params"),
  deleteCartItem
);

export default router;