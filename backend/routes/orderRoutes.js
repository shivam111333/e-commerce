import { getOrderByUserId } from "../controllers/orderController.js";
import express from 'express'
import authentication from "../middlewares/authMiddleware.js";
import authorization from '../middlewares/authorizationMiddleware.js'
const router=express.Router();

router.get('/:id',authentication,authorization(["user"]),getOrderByUserId);

export default router