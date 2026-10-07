import express from 'express'
const router=express.Router();
import { getAllUser,getAllVendor,updateUserStatus } from '../controllers/adminController.js';
import authorization from '../middlewares/authorizationMiddleware.js';
import authentication from '../middlewares/authMiddleware.js';
import validate from '../middlewares/validate.js';
import { updateUserStatusSchema } from '../validators/adminValidator.js';

router.get('/user',authentication,authorization(["admin"]),getAllUser);
router.get('/vendor',authentication,authorization(["admin"]),getAllVendor);
router.patch(
  "/",
  authentication,
  authorization(["admin"]),
  validate(updateUserStatusSchema),
  updateUserStatus
);
export default router;