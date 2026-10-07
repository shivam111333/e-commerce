import express from 'express'
const router=express.Router()

import authentication from '../middlewares/authMiddleware.js'
import authorization from '../middlewares/authorizationMiddleware.js'
import validate from '../middlewares/validate.js'
import { idParamSchema } from '../validators/commonValidator.js'
import { getVendorProduct,getProductVariant } from '../controllers/vendorController.js'


router.get('/',authentication,authorization(['vendor']),getVendorProduct);
router.get(
  '/:id',
  authentication,
  authorization(['vendor']),
  validate(idParamSchema(), 'params'),
  getProductVariant
);

export default router;