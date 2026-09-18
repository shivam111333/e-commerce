import express from 'express'
const router=express.Router()

import authentication from '../middlewares/authMiddleware.js'
import authorization from '../middlewares/authorizationMiddleware.js'
import { getVendorProduct,getProductVariant } from '../controllers/vendorController.js'


router.get('/',authentication,authorization(['vendor']),getVendorProduct);
router.get('/:id',authentication,authorization(['vendor']),getProductVariant);

export default router;