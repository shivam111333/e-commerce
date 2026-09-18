import mongoose from 'mongoose'

const userSchema =new mongoose.Schema({
    name: {
      type: String,
      minLength: 2,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique:true
    },
    phone: {
      type: String,
      required: true,
      match: [/^\+?[1-9]\d{1,14}$/],
    },
    role: {
      type: String,
      enum: ["admin", "user", "vendor"],
      default: "user",
    },
    password: {
      type: String,
      required: true,
    
    },
    status:{
        type:String,
        enum:["active","blocked"],
        default:"active"
    }
  },
  {
    timestamps: true,
  });
const User=mongoose.model("User",userSchema);
export default User;