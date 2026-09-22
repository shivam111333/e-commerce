import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaEdit,
  FaTrash,
  FaPlus,
} from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../../api/axios";


function VendorProductView() {
  const { id } = useParams();
  const navigate = useNavigate();


  console.log("Product ID:", id);

  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);

  const [loading, setLoading] = useState(true);
  const [deletingProduct, setDeletingProduct] = useState(false);
  const [deletingVariant, setDeletingVariant] = useState(null);

  // Fetch product
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);

        const response = await api.get(`/product/${id}`);

        const data = response.data.data;

        // Your customer product API returns an array
        const productData = Array.isArray(data)
          ? data[0]
          : data;

        if (!productData) {
          toast.error("Product not found");
          navigate("/vendor/products");
          return;
        }

        setProduct(productData);
        setVariants(productData.variants || []);
      } catch (error) {
        console.error(
          "Error fetching product:",
          error.response?.data || error
        );

        toast.error(
          error.response?.data?.message ||
            "Failed to load product"
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id, navigate]);

  // Delete product
  const handleDeleteProduct = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product? All its variants will also be deleted."
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingProduct(true);

      const response = await api.delete(`/product/${id}`);

      toast.success(
        response.data.message ||
          "Product deleted successfully"
      );

      navigate("/vendor/products");
    } catch (error) {
      console.error(
        "Delete product error:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
          "Failed to delete product"
      );
    } finally {
      setDeletingProduct(false);
    }
  };

  // Delete variant
  const handleDeleteVariant = async (variantId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this variant?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingVariant(variantId);

      const response = await api.delete(
        `/variant/${variantId}`
      );

      toast.success(
        response.data.message ||
          "Variant deleted successfully"
      );

      // Remove deleted variant from UI
      setVariants((prev) =>
        prev.filter(
          (variant) => variant._id !== variantId
        )
      );
    } catch (error) {
      console.error(
        "Delete variant error:",
        error.response?.data || error
      );

      toast.error(
        error.response?.data?.message ||
          "Failed to delete variant"
      );
    } finally {
      setDeletingVariant(null);
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">
          Loading product...
        </p>
      </div>
    );
  }

  // Product not found
  if (!product) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800">
            Product not found
          </h2>

          <button
            onClick={() => navigate("/vendor/products")}
            className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">

          <button
            onClick={() => navigate("/vendor/products")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 w-fit"
          >
            <FaArrowLeft />
            Back to Products
          </button>

          <div className="flex gap-3">
            <button
              onClick={() =>
                navigate(`/vendor/products/${id}/edit`)
              }
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <FaEdit />
              Edit Product
            </button>

            <button
              onClick={() =>
                navigate(`/vendor/products/${product._id}/add-variant`)
              }
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <FaPlus />
              Add Variant
            </button>

            <button
              onClick={handleDeleteProduct}
              disabled={deletingProduct}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              <FaTrash />

              {deletingProduct
                ? "Deleting..."
                : "Delete Product"}
            </button>
          </div>
        </div>

        {/* Product Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">

          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            {product.name}
          </h1>

          <div className="mb-6">
            <h2 className="text-sm font-medium text-gray-500 mb-1">
              Description
            </h2>

            <p className="text-gray-700">
              {product.description || "No description"}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            <div>
              <p className="text-sm text-gray-500">
                Category
              </p>

              <p className="font-medium text-gray-800 mt-1">
                {product.category?.name || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Subcategory
              </p>

              <p className="font-medium text-gray-800 mt-1">
                {product.subcategory?.name || "N/A"}
              </p>
            </div>

          </div>
        </div>

        {/* Variants */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">

          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex items-center justify-between">

              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Variants
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  {variants.length} variant
                  {variants.length !== 1 ? "s" : ""}
                </p>
              </div>

              <button
                onClick={() =>
                  navigate(
                    `/vendor/products/${id}/add-variant`
                  )
                }
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <FaPlus />
                Add Variant
              </button>

            </div>
          </div>

          {/* No variants */}
          {variants.length === 0 && (
            <div className="p-10 text-center">
              <p className="text-gray-500">
                This product has no variants yet.
              </p>

              <button
                onClick={() =>
                  navigate(
                    `/vendor/products/${id}/add-variant`
                  )
                }
                className="mt-4 px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Add First Variant
              </button>
            </div>
          )}

          {/* Variant cards */}
          {variants.length > 0 && (
            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">

              {variants.map((variant) => (
                <div
                  key={variant._id}
                  className="border border-gray-200 rounded-xl overflow-hidden"
                >

                  {/* Images */}
                  {variant.images?.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50">

                      {variant.images
                        .slice(0, 3)
                        .map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt={`${product.name} ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        ))}

                    </div>
                  ) : (
                    <div className="h-32 bg-gray-100 flex items-center justify-center">
                      <p className="text-gray-400 text-sm">
                        No images
                      </p>
                    </div>
                  )}

                  {/* Variant details */}
                  <div className="p-5">

                    <div className="flex items-start justify-between gap-4 mb-4">

                      <div>
                        <h3 className="font-semibold text-gray-800">
                          Variant
                        </h3>

                        <p className="text-xs text-gray-400 mt-1">
                          ID: {variant._id}
                        </p>
                      </div>

                      <div className="flex gap-2">

                        <button
                          onClick={() =>
                            navigate(
                              `/vendor/variants/${variant._id}/edit`
                            )
                          }
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit Variant"
                        >
                          <FaEdit />
                        </button>

                        <button
                          onClick={() =>
                            handleDeleteVariant(
                              variant._id
                            )
                          }
                          disabled={
                            deletingVariant ===
                            variant._id
                          }
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                          title="Delete Variant"
                        >
                          <FaTrash />
                        </button>

                      </div>

                    </div>

                    {/* Price & Stock */}
                    <div className="grid grid-cols-2 gap-4 mb-5">

                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">
                          Price
                        </p>

                        <p className="text-lg font-semibold text-gray-800 mt-1">
                          ₹{Number(
                            variant.price
                          ).toLocaleString("en-IN")}
                        </p>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">
                          Stock
                        </p>

                        <p className="text-lg font-semibold text-gray-800 mt-1">
                          {variant.stock}
                        </p>
                      </div>

                    </div>

                    {/* Attributes */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Attributes
                      </p>

                      <div className="flex flex-wrap gap-2">

                        {variant.attributes &&
                          Object.entries(
                            variant.attributes
                          ).map(
                            ([key, value]) => (
                              <span
                                key={key}
                                className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700"
                              >
                                <span className="font-medium">
                                  {key}:
                                </span>{" "}
                                {value}
                              </span>
                            )
                          )}

                      </div>
                    </div>

                  </div>
                </div>
              ))}

            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default VendorProductView;