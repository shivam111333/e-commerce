import express from "express";

const router = express.Router();

import { register, login } from "../controllers/authController.js";

import validate from "../middlewares/validate.js";

import {
  registerSchema,
  loginSchema,
} from "../validators/authValidator.js";

router.post(
  "/register",
  validate(registerSchema),
  register
);

router.post(
  "/login",
  validate(loginSchema),
  login
);

export default router;