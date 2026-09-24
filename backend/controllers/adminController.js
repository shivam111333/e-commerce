import User from '../models/userSchema.js'


export const getAllUser=async(req,res)=>{
    try{

        const user=await User.find({
           role:"user"
        })

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
        })
        if(vendor.length==0)
        {
            return res.json({
                message:"No Vendor found"
            })
        }
        return res.status(200).json({
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

