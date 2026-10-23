import Order from '../models/orderSchema.js'
import User from '../models/userSchema.js'
import mongoose from 'mongoose'


export const getAllUser=async(req,res)=>{
    try{

        const user=await User.find({
           role:"user"
        }).select('-password')

         if(user.length==0)
         {
            return res.json({
                message:"No user found"
            })
         }
        return res.status(200).json({
           data:user,
         
        });
                                                    
    }catch(err)
    {
        return res.status(500).json({
            success:false,
            message:err.message
        })
    }
}

export const getAllVendor=async(req,res)=>{
    try{

        const vendor=await User.find({
           role:"vendor"
        }).select('-password')
        if(vendor.length==0)
        {
            return res.json({
                message:"No Vendor found"
            })
        }
        return res.status(200).json({
            success:true,
            data:vendor
        });
                                                    
    }catch(err)
    {
        return res.status(500).json({
            success:false,
            message:err.message
        })
    }
}

export const updateUserStatus=async(req,res)=>{
    try{
       
         const {userId,newStatus}=req.body;
         if(!userId || !newStatus)
         {
            return res.status(400).json({
                success:false,
                message:"user Id and Status is required"
            })
         }

        

         const status_allowed=["active","blocked"];
         
         if(!status_allowed.includes(newStatus))
         {
             return res.status(400).json({
                success:false,
                message:"Wrong status"
             })
         }

         const user=await User.findByIdAndUpdate(userId,{status:newStatus},{new:true,runValidators: true});

         if(!user)
         {
            return res.status(404)
            .json({
                success:false,
                message:"User not found"
            })
         }
         return res.status(200).json({
            success:true,
            message:"Successfully Updated",
            data:user.status
         })
    

    }catch(err)
    {
        return res.status(500).json({
            success:false,
            message:err.message
        })
    }
}



// GET /order/admin/customer/:id
export const getOrdersByCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Valid customer id is required" });
    }

    const orders = await Order.find({ user: id })
      // add your COD / paid filter here to match the admin all-orders endpoint
      .sort({ createdAt: -1 })
      .populate("user", "name email")
      .lean();

    return res.status(200).json({ data: orders });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// GET /order/admin/vendor/:id
export const getOrdersByVendor = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Valid vendor id is required" });
    }

    const orders = await Order.find({ "items.vendor": id })
      // same COD / paid filter here
      .sort({ createdAt: -1 })
      .populate("user", "name email")
      .lean();

    // keep only this vendor's items in each order
    const data = orders.map((order) => ({
      ...order,
      items: order.items.filter((item) => String(item.vendor) === id),
    }));

    return res.status(200).json({ data });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

