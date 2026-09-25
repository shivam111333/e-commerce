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
