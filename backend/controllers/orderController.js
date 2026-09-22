import Order from '../models/orderSchema.js'
import User from '../models/userSchema.js'
import Product from '../models/productSchema.js';

export const getOrderByUserId=async(req,res)=>{
    try{

         const id =req.params.id;
         if(!id)
         {
            return res.status(400).json({
                message:"Id is required"
            })
         }
         const user=await User.findById(id);
         if(!user)
         {
            return res.status(403).json({
                success:false,
                message:"User not found"
            })
         }
         const order =await Order.find({user:id})
         if(!order)
         {
            return res.status(403).json({
                success:false,
                message:"Order Not found"
            })
         }
         return res.status(200).json({
            success:true,
            data:order
         })

    }
    catch(err)
    {
        return res.status(500).json(
           { success:false,
            message:err.message}
        )
    }
}

export const createUserOrder=async(req,res)=>{
    try{
         const {items,shippingAddress}=req.body;
          const id=req.user._id
          
          if(!id)
          {
            return res.status(400).json({
                success:false,
                message:"UserId not found"
            })
          }
          if(items.length===0)
          {
            return res.json("Items  not present")
          }
          const processedItem=[];
          const total_Amount=0
         for(const item of items)
         {
            const exist_product=await Product.findById(item.product);
            if(!exist_product)
            {
                return res.status(403).json({
                    success:false,
                    message:"Product Not fount"
                },item)
            }

            const price=
         }
    }catch(err)
    {
        return res.status(500).json({
            success:false,
            message:err.message
        })
    }
}