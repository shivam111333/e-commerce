import { getOrderByUserId,createUserOrder,getVendorOrders,updateVendorOrderItemStatus} from "../controllers/orderController.js";
import express from 'express'
import authentication from "../middlewares/authMiddleware.js";
import authorization from '../middlewares/authorizationMiddleware.js'
const router=express.Router();

router.get('/:id',authentication,authorization(["user"]),getOrderByUserId);
router.post('/',authentication,authorization(["user"]),createUserOrder)
router.get('/',authentication,authorization(["vendor"]),getVendorOrders)
router.patch( "/:orderId/item/:itemId/status",authentication,authorization(["vendor"]),updateVendorOrderItemStatus
);

export default router