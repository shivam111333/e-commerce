import * as yup from "yup";

const name = yup
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name must be at most 100 characters");

const email = yup
  .string()
  .trim()
  .lowercase()
  .email("Please enter a valid email address")
  .max(255, "Email must be at most 255 characters");

const phone = yup
  .string()
  .trim()
  .matches(
    /^\+?[1-9]\d{1,14}$/,
    "Please enter a valid phone number"
  );

const password = yup
  .string()
  .min(6, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters");

const role = yup
  .string()
  .oneOf(
    ["user", "vendor"],
    "Role must be either user or vendor"
  );

// POST /api/auth/register
export const registerSchema = yup.object({
  name: name.required("Name is required"),

  email: email.required("Email is required"),

  phone: phone.required("Phone number is required"),

  role: role.required("Role is required"),

  password: password.required("Password is required"),
});

// POST /api/auth/login
export const loginSchema = yup.object({
  email: email.required("Email is required"),

  password: password.required("Password is required"),
});