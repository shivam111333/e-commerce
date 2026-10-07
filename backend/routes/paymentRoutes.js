import express from "express";
import validate from "../middlewares/validate.js";
import authentication from "../middlewares/authMiddleware.js";
import authorization from "../middlewares/authorizationMiddleware.js"
import {
  createRazorpayOrderSchema,
  verifyRazorpayPaymentSchema,
} from "../validators/paymentValidator.js";
import {
  createRazorpayOrder,verifyRazorpayPayment,razorpayWebhook,
} from "../controllers/paymentController.js";

const router = express.Router();

router.post(
  "/razorpay/order",
  authentication,
  authorization(["user"]),
  validate(createRazorpayOrderSchema),
  createRazorpayOrder
);
router.post(
  "/razorpay/verify",
  authentication,
  authorization(["user"]),
  validate(verifyRazorpayPaymentSchema),
  verifyRazorpayPayment
);

router.post(
  "/razorpay/webhook",
  razorpayWebhook
);


export default router;