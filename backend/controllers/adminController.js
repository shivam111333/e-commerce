import User from '../models/userSchema.js'

export const getAllUser=async(req,res)=>{
    try{

        const user=await User.find({
           role:"user"
        })
        return res.json(user);
                                                    
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

        const user=await User.find({
           role:"vendor"
        })
        return res.json(user);
                                                    
    }catch(err)
    {
        return res.status(500).json({
            success:false,
            message:err.message
        })
    }
}