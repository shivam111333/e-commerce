import express from "express";

const router = express.Router();

import { register, login, verifyEmail } from "../controllers/authController.js";

import validate from "../middlewares/validate.js";

import {
  registerSchema,
  loginSchema,
  verifyEmailSchema
} from "../validators/authValidator.js";

router.post(
  "/register",
  validate(registerSchema),
  register
);

router.post(
  "/verify-email",
  validate(verifyEmailSchema),
  verifyEmail
);

router.post(
  "/login",
  validate(loginSchema),
  login
);

export default router;