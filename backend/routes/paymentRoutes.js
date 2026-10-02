import express from "express";
import authentication from "../middlewares/authMiddleware.js";
import authorization from "../middlewares/authorizationMiddleware.js"
import {
  createRazorpayOrder,verifyRazorpayPayment,razorpayWebhook,
} from "../controllers/paymentController.js";

const router = express.Router();

router.post(
  "/razorpay/order",
  authentication,
  authorization(["user"]),
  createRazorpayOrder
);
router.post(
  "/razorpay/verify",
  authentication,
  authorization(["user"]),
  verifyRazorpayPayment
);

router.post(
  "/razorpay/webhook",
  razorpayWebhook
);


export default router;