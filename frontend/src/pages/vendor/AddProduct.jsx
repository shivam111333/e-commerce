import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios.jsx";
import { toast } from "react-toastify";

function AddProduct() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  const [product, setProduct] = useState({
    name: "",
    description: "",
    category: "",
    subcategory: "",
  });

  const [errors, setErrors] = useState({});
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
    if (!product.category) {
     
      return;
    }

    const fetchSubcategories = async () => {
      try {
        const response = await api.get(
          `/subcategory/category/${product.category}`
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
  }, [product.category]);

  // Handle input/select change
  const handleChange = (e) => {
    const { name, value } = e.target;

    // If category changes
    if (name === "category") {
      setProduct((prev) => ({
        ...prev,
        category: value,
        subcategory: "",
      }));

      setErrors((prev) => ({
        ...prev,
        category: "",
        subcategory: "",
      }));

      return;
    }

    setProduct((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Remove error when user starts fixing field
    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  // Validate product form
  const validateForm = () => {
    const newErrors = {};

    if (!product.name.trim()) {
      newErrors.name = "Product name is required";
    }

    if (!product.description.trim()) {
      newErrors.description =
        "Product description is required";
    }

    if (!product.category) {
      newErrors.category = "Please select a category";
    }

    if (!product.subcategory) {
      newErrors.subcategory =
        "Please select a subcategory";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // Create product
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await api.post(
        "/product",
        product
      );

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

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name
              </label>

              <input
                type="text"
                name="name"
                value={product.name}
                onChange={handleChange}
                placeholder="Enter product name"
                className={`w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 ${
                  errors.name
                    ? "border-red-500 focus:ring-red-400"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
              />

              {errors.name && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>

              <textarea
                name="description"
                value={product.description}
                onChange={handleChange}
                placeholder="Enter product description"
                rows="4"
                className={`w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 ${
                  errors.description
                    ? "border-red-500 focus:ring-red-400"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
              />

              {errors.description && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.description}
                </p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>

              <select
                name="category"
                value={product.category}
                onChange={handleChange}
                className={`w-full border rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 ${
                  errors.category
                    ? "border-red-500 focus:ring-red-400"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
              >
                <option value="">
                  Select Category
                </option>

                {categories.map((category) => (
                  <option
                    key={category._id}
                    value={category._id}
                  >
                    {category.name}
                  </option>
                ))}
              </select>

              {errors.category && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.category}
                </p>
              )}
            </div>

            {/* Subcategory */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subcategory
              </label>

              <select
                name="subcategory"
                value={product.subcategory}
                onChange={handleChange}
                disabled={!product.category}
                className={`w-full border rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 ${
                  errors.subcategory
                    ? "border-red-500 focus:ring-red-400"
                    : "border-gray-300 focus:ring-blue-500"
                } ${
                  !product.category
                    ? "bg-gray-100 cursor-not-allowed"
                    : ""
                }`}
              >
                <option value="">
                  {product.category
                    ? "Select Subcategory"
                    : "Select Category First"}
                </option>

                {subcategories.map((subcategory) => (
                  <option
                    key={subcategory._id}
                    value={subcategory._id}
                  >
                    {subcategory.name}
                  </option>
                ))}
              </select>

              {errors.subcategory && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.subcategory}
                </p>
              )}
            </div>

            {/* Submit */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? "Creating Product..."
                  : "Create Product"}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}

export default AddProduct;