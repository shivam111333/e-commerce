import * as yup from "yup";
import { objectId } from "./commonValidator.js";

export const updateUserStatusSchema = yup.object({
  userId: objectId("userId"),
  newStatus: yup
    .string()
    .oneOf(["active", "blocked"], "Status must be active or blocked")
    .required("Status is required"),
});
