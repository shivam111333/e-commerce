import { getOrderByUserId,createUserOrder,getVendorOrders,updateVendorOrderItemStatus,getAllOrder} from "../controllers/orderController.js";
import express from 'express'
import authentication from "../middlewares/authMiddleware.js";
import authorization from '../middlewares/authorizationMiddleware.js'
const router=express.Router();

router.get('/all',authentication,authorization(["admin"]),getAllOrder)
router.get('/:id',authentication,authorization(["user","admin"]),getOrderByUserId);
router.post('/',authentication,authorization(["user","admin"]),createUserOrder)
router.get('/',authentication,authorization(["vendor","admin"]),getVendorOrders)
router.patch( "/:orderId/item/:itemId/status",authentication,authorization(["vendor"]),updateVendorOrderItemStatus)

export default router