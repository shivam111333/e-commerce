import Category from "../models/categorySchema.js";

export const getCategory = async (req, res) => {
  try {
    const category = await Category.find();
    return res.status(200).json({
      success:true,
      data:category
    });
  } catch (err) {
    console.log("Error", err);
    return res.status(500).json({ message: err.message });
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const id = req.params.id;
    const category = await Category.findById(id);
    if (!category) {
      return res
        .stauts(400)
        .json({ success: false, message: "No category available" });
    }
    return res.json({
      success: true,
      category,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: err.message });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if(!name || !name.trim())
    {
        return res.status(500).json({
            message:" Category Name is required "

        })
    }
    
    const newCategory = await Category.create({ name:name.trim(), description });
    return res.status(201).json({success:true,

      message: "Category Created Successfully ",
      newCategory
    });
  } catch (err) {
    console.log("Error", err);
    return res.status(500).json({ message: err.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const id = req.params.id;
    const { name, description } = req.body;

  

    const category_result = await Category.findByIdAndUpdate(id, {
      name,
      description,
    },{
        new:true,
        runValidators:true
    }

);

   if(!category_result)
   {
    return res.status(403).json({
        message:"Category not found"
    })
   }

    return res.status(200).json({
      success: true,
      message: "Successfully Updated",
    });
  } catch (err) {
    console.log(err);
    return res.json({ message: err.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await Category.findByIdAndDelete(id);
    if(!result)
   {
    return res.status(403).json({
        message:"Category not found"
    })
   }
    return res.status(200).json({
      message: "Successfully deleted",
    });
  } catch (err) {
    console.log(err);
    return res.json({ message: err.message });
  }
};
