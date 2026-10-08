import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios.jsx";
import { toast } from "react-toastify";
import { Form, Formik } from "formik";
import FormField from "../../component/FormField.jsx";
import { productSchema } from "../../validation/productSchemas.js";

function AddProduct() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get("/category");

        setCategories(response.data.data || response.data || []);
      } catch (error) {
        console.error("Error fetching categories:", error);

        toast.error(
          error.response?.data?.message ||
            "Failed to load categories"
        );
      }
    };

    fetchCategories();
  }, []);

  // Fetch subcategories when category changes
  useEffect(() => {
    if (!selectedCategory) return;

    const fetchSubcategories = async () => {
      try {
        const response = await api.get(
          `/subcategory/category/${selectedCategory}`
        );

        setSubcategories(response.data.data || []);
      } catch (error) {
        console.error(
          "Error fetching subcategories:",
          error
        );

        setSubcategories([]);

        toast.error(
          error.response?.data?.message ||
            "Failed to load subcategories"
        );
      }
    };

    fetchSubcategories();
  }, [selectedCategory]);

  // Create product
  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setLoading(true);
      const response = await api.post("/product", {
        ...values,
        name: values.name.trim(),
        description: values.description.trim(),
      });

      const createdProduct = response.data.data;

      if (!createdProduct?._id) {
        toast.error(
          "Product created but product ID was not returned"
        );
        return;
      }

      console.log(
        "Created Product ID:",
        createdProduct._id
      );

      toast.success("Product created successfully");

      // Go to Add Variant page
      navigate(
        `/vendor/products/${createdProduct._id}/add-variant`
      );
    } catch (error) {
      console.error(
        "Product creation error:",
        error.response?.data || error.message
      );

      toast.error(
        error.response?.data?.message ||
          "Failed to create product"
      );
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Product Form */}
        <div className="bg-white rounded-lg shadow p-6">

          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            Add Product
          </h1>

          <Formik
            initialValues={{
              name: "",
              description: "",
              category: "",
              subcategory: "",
            }}
            validationSchema={productSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, setFieldValue }) => (
              <Form className="space-y-5" noValidate>
                <FormField
                  name="name"
                  label="Product Name"
                  placeholder="Enter product name"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
                <FormField
                  name="description"
                  label="Description"
                  as="textarea"
                  rows={4}
                  placeholder="Enter product description"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
                <FormField
                  name="category"
                  label="Category"
                  as="select"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(event) => {
                    const categoryId = event.target.value;
                    setFieldValue("category", categoryId);
                    setFieldValue("subcategory", "");
                    setSubcategories([]);
                    setSelectedCategory(categoryId);
                  }}
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </FormField>
                <FormField
                  name="subcategory"
                  label="Subcategory"
                  as="select"
                  disabled={!selectedCategory}
                  className={`w-full border border-gray-300 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500 ${
                    !selectedCategory ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                >
                  <option value="">
                    {selectedCategory
                      ? "Select Subcategory"
                      : "Select Category First"}
                  </option>
                  {subcategories.map((subcategory) => (
                    <option key={subcategory._id} value={subcategory._id}>
                      {subcategory.name}
                    </option>
                  ))}
                </FormField>
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading || isSubmitting}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading || isSubmitting
                      ? "Creating Product..."
                      : "Create Product"}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>

      </div>
    </div>
  );
}

export default AddProduct;