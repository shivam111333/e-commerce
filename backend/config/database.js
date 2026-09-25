import mongoose from 'mongoose'

const connectionDb= async ()=>{
   try{
     
    await mongoose.connect(process.env.DATA_BASE)
     console.log("Successfully connected")

   }catch(err){
    console.log(err)

   }
}
export default connectionDb;

