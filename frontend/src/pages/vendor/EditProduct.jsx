import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../api/axios.jsx";
import { Form, Formik } from "formik";
import FormField from "../../component/FormField.jsx";
import { productSchema } from "../../validation/productSchemas.js";

function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");

  const [product, setProduct] = useState({
    name: "",
    description: "",
    category: "",
    subcategory: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get("/category");

        setCategories(
          response.data.data || response.data || []
        );
      } catch (error) {
        console.error(
          "Error fetching categories:",
          error
        );

        toast.error(
          error.response?.data?.message ||
            "Failed to load categories"
        );
      }
    };

    fetchCategories();
  }, []);

  // Fetch product
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);

        const response = await api.get(`/product/${id}`);

        const productData = response.data.data;

        if (!productData?._id) {
          toast.error("Product not found");
          navigate("/vendor/products");
          return;
        }

        setProduct({
          name: productData.name || "",
          description: productData.description || "",
          category:
            productData.category?._id ||
            productData.category ||
            "",
          subcategory:
            productData.subcategory?._id ||
            productData.subcategory ||
            "",
        });
        setSelectedCategory(
          productData.category?._id || productData.category || ""
        );
      } catch (error) {
        console.error(
          "Error fetching product:",
          error.response?.data || error
        );

        toast.error(
          error.response?.data?.message ||
            "Failed to load product"
        );

        navigate("/vendor/products");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id, navigate]);

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

  // Update product
  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setSaving(true);

      const response = await api.put(`/product/${id}`, {
        ...values,
        name: values.name.trim(),
        description: values.description.trim(),
      });

      toast.success(
        response.data.message ||
          "Product updated successfully"
      );

      navigate(`/vendor/products/${id}`);
    } catch (error) {
      console.error(
        "Update product error:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
          "Failed to update product"
      );
    } finally {
      setSaving(false);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">
          Loading product...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">

        <div className="bg-white rounded-lg shadow p-6">

          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              Edit Product
            </h1>

            <button
              type="button"
              onClick={() =>
                navigate(`/vendor/products/${id}`)
              }
              className="text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
          </div>

          <Formik
            enableReinitialize
            initialValues={product}
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
                  rows={5}
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
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => navigate(`/vendor/products/${id}`)}
                    className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || isSubmitting}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving || isSubmitting ? "Updating..." : "Update Product"}
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

export default EditProduct;