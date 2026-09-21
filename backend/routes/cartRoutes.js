import express from 'express'
const router=express.Router()
import { getCart,addToCart,updateCartItem,deleteCartItem} from '../controllers/cartController.js'
import authentication from '../middlewares/authMiddleware.js';


router.get('/',authentication,getCart);
router.post('/',authentication,addToCart);
router.put('/',authentication,updateCartItem)
router.delete('/:variant',authentication,deleteCartItem)
export default router