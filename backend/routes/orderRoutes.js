import { getOrderByUserId,createUserOrder,getVendorOrders,updateVendorOrderItemStatus,getAllOrder, updateOrderPaymentStatus,
  updateOrderItemPaymentStatus} from "../controllers/orderController.js";
import express from 'express'
import authentication from "../middlewares/authMiddleware.js";
import authorization from '../middlewares/authorizationMiddleware.js'
const router=express.Router();

router.get('/all',authentication,authorization(["admin"]),getAllOrder)
router.get('/my-orders',authentication,authorization(["user"]),getOrderByUserId);
router.post('/',authentication,authorization(["user","admin"]),createUserOrder)
router.get('/',authentication,authorization(["vendor","admin"]),getVendorOrders)
router.patch( "/:orderId/item/:itemId/status",authentication,authorization(["vendor"]),updateVendorOrderItemStatus)
router.patch("/:orderId/payment-status",authentication,authorization(["admin"]),updateOrderPaymentStatus);

router.patch("/:orderId/item/:itemId/payment-status",authentication,authorization(["admin"]),updateOrderItemPaymentStatus);
export default router