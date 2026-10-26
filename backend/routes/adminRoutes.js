import express from 'express'
const router=express.Router();
import { getAllUser,getAllVendor,getOrdersByCustomer,getOrdersByVendor,updateUserStatus } from '../controllers/adminController.js';
import authorization from '../middlewares/authorizationMiddleware.js';
import authentication from '../middlewares/authMiddleware.js';
import validate from '../middlewares/validate.js';
import { updateUserStatusSchema } from '../validators/adminValidator.js';
import {
  getAdminReturnRequest,
  getAdminReturnRequests,
  updateAdminReturnRequestStatus,
} from "../controllers/returnRequestController.js";
import {
  returnRequestParamsSchema,
  updateReturnRequestStatusSchema,
} from "../validators/returnRequestValidator.js";

router.get('/user',authentication,authorization(["admin"]),getAllUser);
router.get('/vendor',authentication,authorization(["admin"]),getAllVendor);

router.get(
  "/customer/:id",
  authentication,
  authorization(["admin"]),
  getOrdersByCustomer
);

router.get(
  "/vendor/:id",
  authentication,
  authorization(["admin"]),
  getOrdersByVendor
);
router.patch(
  "/",
  authentication,
  authorization(["admin"]),
  validate(updateUserStatusSchema),
  updateUserStatus
);

router.get(
  "/return-requests",
  authentication,
  authorization(["admin"]),
  getAdminReturnRequests
);

router.get(
  "/return-requests/:requestId",
  authentication,
  authorization(["admin"]),
  validate(returnRequestParamsSchema, "params"),
  getAdminReturnRequest
);

router.patch(
  "/return-requests/:requestId",
  authentication,
  authorization(["admin"]),
  validate(returnRequestParamsSchema, "params"),
  validate(updateReturnRequestStatusSchema),
  updateAdminReturnRequestStatus
);

export default router;