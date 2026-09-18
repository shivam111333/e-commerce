import express from 'express'
const router=express.Router();
import authentication from '../middlewares/authMiddleware.js'
import authorization from '../middlewares/authorizationMiddleware.js'

import { getProduct,getProductById,createProduct,updateProduct,deleteProduct } from '../controllers/productController.js';

router.get('/',getProduct);
router.get('/:id',getProductById);
router.post('/',authentication,authorization(["vendor"]),createProduct);
router.put('/:id',authentication ,authorization(["vendor"]),updateProduct);
router.delete('/:id',authentication,authorization(["vendor"]),deleteProduct);


export default router;