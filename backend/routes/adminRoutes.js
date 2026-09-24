import express from 'express'
const router=express.Router();
import { getAllUser,getAllVendor } from '../controllers/adminController.js';
import authorization from '../middlewares/authorizationMiddleware.js';
import authentication from '../middlewares/authMiddleware.js';

router.get('/user',authentication,authorization(["admin"]),getAllUser);
router.get('/vendor',authentication,authorization(["admin"]),getAllVendor);
export default router;