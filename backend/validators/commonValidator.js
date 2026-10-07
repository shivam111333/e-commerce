import * as yup from "yup";

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

// Reusable single field: objectId("category")
export const objectId = (label = "id") =>
  yup
    .string()
    .trim()
    .matches(OBJECT_ID_REGEX, `Invalid ${label}`)
    .required(`${label} is required`);

// Validates a route param: idParamSchema() for /:id, idParamSchema("categoryId") for /:categoryId
export const idParamSchema = (name = "id") =>
  yup.object({
    [name]: objectId(name),
  });