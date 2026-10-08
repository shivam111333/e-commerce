import * as yup from "yup";

const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;
const INDIAN_PINCODE_REGEX = /^[1-9]\d{5}$/;

export const normalizePhone = (value) => {
  if (typeof value !== "string") return value;

  const digits = value.replace(/[\s()-]/g, "");
  const match = digits.match(/^(?:\+91|91|0)?([6-9]\d{9})$/);
  return match ? match[1] : digits;
};

export const phoneRule = (
  requiredMessage = "Phone number is required",
  invalidMessage = "Enter a valid 10-digit mobile number"
) =>
  yup
    .string()
    .transform(normalizePhone)
    .matches(INDIAN_MOBILE_REGEX, invalidMessage)
    .required(requiredMessage);

export const pincodeRule = (
  requiredMessage = "Pincode is required",
  invalidMessage = "Pincode must be a valid 6-digit number"
) =>
  yup
    .string()
    .trim()
    .matches(INDIAN_PINCODE_REGEX, invalidMessage)
    .required(requiredMessage);

export const objectIdRule = (label = "id") =>
  yup
    .string()
    .trim()
    .matches(/^[0-9a-fA-F]{24}$/, `Invalid ${label}`)
    .required(`${label} is required`);
