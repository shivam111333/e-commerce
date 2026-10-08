import * as yup from "yup";
import { phoneRule } from "./commonSchemas.js";

// Mirrors backend/validators/authValidator.js.
const email = yup
  .string()
  .trim()
  .lowercase()
  .email("Please enter a valid email address")
  .max(255, "Email must be at most 255 characters")
  .required("Email is required");

const password = yup
  .string()
  .min(6, "Password must be at least 6 characters")
  .max(128, "Password must be at most 128 characters")
  .required("Password is required");

export const loginSchema = yup.object({
  email,
  password: yup.string().required("Password is required"),
});

export const registerSchema = yup.object({
  name: yup
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters")
    .required("Name is required"),
  email,
  phone: phoneRule(
    "Phone number is required",
    "Please enter a valid phone number"
  ),
  role: yup
    .string()
    .oneOf(["user", "vendor"], "Role must be either user or vendor")
    .required("Role is required"),
  password,
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords do not match")
    .required("Please confirm your password"),
});
