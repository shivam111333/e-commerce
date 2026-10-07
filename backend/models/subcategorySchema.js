import mongoose from 'mongoose'

const subcategorySchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true

    },
    category:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Category',
        required:'true'

    }
},{
    timestamps:true
}
)
subcategorySchema.index(
  { category: 1, name: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } }
);
const Subcategory=mongoose.model("Subcategory",subcategorySchema);
export default Subcategory;