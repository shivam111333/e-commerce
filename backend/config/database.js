import mongoose from 'mongoose'

const connectionDb= async ()=>{
   try{
     
    await mongoose.connect('mongodb://localhost:27017/')
     console.log("Successfully connected")

   }catch(err){
    console.log(err)

   }
}
export default connectionDb;

