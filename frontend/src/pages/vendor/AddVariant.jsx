import { useState } from "react";
import {useParams, useNavigate } from "react-router-dom";
import { FaTrash, FaPlus, FaImage } from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../../api/axios";

function AddVariant() {
     const { id } = useParams();
  const navigate = useNavigate();

  const [attributes, setAttributes] = useState([
    {
      key: "",
      value: "",
    },
  ]);

  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");

  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const [loading, setLoading] = useState(false);

  // --------------------------------
  // Add new attribute
  // --------------------------------
  const addAttribute = () => {
    setAttributes([
      ...attributes,
      {
        key: "",
        value: "",
      },
    ]);
  };

  // --------------------------------
  // Remove attribute
  // --------------------------------
  const removeAttribute = (index) => {
    if (attributes.length === 1) {
      return;
    }

    setAttributes(attributes.filter((_, i) => i !== index));
  };

  // --------------------------------
  // Change attribute
  // --------------------------------
  const handleAttributeChange = (index, field, value) => {
    const updatedAttributes = [...attributes];

    updatedAttributes[index][field] = value;

    setAttributes(updatedAttributes);
  };

  // --------------------------------
  // Select images
  // --------------------------------
  const handleImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    if (selectedFiles.length === 0) {
      return;
    }

    // Maximum 5 images
    if (images.length + selectedFiles.length > 5) {
      toast.error("You can upload maximum 5 images");
      return;
    }

    const newImages = [...images, ...selectedFiles];

    setImages(newImages);

    const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file));

    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  // --------------------------------
  // Remove image
  // --------------------------------
  const removeImage = (index) => {
    const updatedImages = images.filter((_, i) => i !== index);

    const updatedPreviews = imagePreviews.filter((_, i) => i !== index);

    setImages(updatedImages);
    setImagePreviews(updatedPreviews);
  };

  // --------------------------------
  // Submit variant
const handleSubmit = async (e) => {
    e.preventDefault();

    if (!id) {
        toast.error("Product ID is missing");
        return;
    }

    if (!price || Number(price) <= 0) {
        toast.error("Please enter a valid price");
        return;
    }

    if (stock === "" || Number(stock) < 0) {
        toast.error("Please enter a valid stock");
        return;
    }

    if (images.length === 0) {
        toast.error("Please upload at least one image");
        return;
    }

    // Convert attribute rows into an object
    const attributesObject = {};

    for (const attribute of attributes) {
        const key = attribute.key.trim();
        const value = attribute.value.trim();

        if (!key || !value) {
            toast.error("Please fill all attribute fields");
            return;
        }

        if (attributesObject[key]) {
            toast.error(`Duplicate attribute: ${key}`);
            return;
        }

        attributesObject[key] = value;
    }

    try {
        setLoading(true);

        const formData = new FormData();

        // Product ID comes from URL
        formData.append("product", id);

        formData.append("price", price);
        formData.append("stock", stock);

        formData.append(
            "attributes",
            JSON.stringify(attributesObject)
        );

        images.forEach((image) => {
            formData.append("images", image);
        });

        const response = await api.post(
            "/variant",
            formData
        );

        toast.success(
            response.data.message ||
            "Variant added successfully"
        );

        // Go back to vendor product view
        navigate(`/vendor/products/${id}`);

    } catch (error) {
        console.error(
            "Error adding variant:",
            error.response?.data || error
        );

        toast.error(
            error.response?.data?.message ||
            "Failed to add variant"
        );
    } finally {
        setLoading(false);
    }
};

  return (
    <div className="mt-8 bg-white border border-gray-200 rounded-xl shadow-sm">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Add Variant</h2>

        <p className="text-sm text-gray-500 mt-1">
          Add price, stock, attributes and images for this product.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Attributes */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-800">Attributes</h3>

            <button
              type="button"
              onClick={addAttribute}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              <FaPlus />
              Add Attribute
            </button>
          </div>

          <div className="space-y-3">
            {attributes.map((attribute, index) => (
              <div key={index} className="flex gap-3">
                <input
                  type="text"
                  placeholder="Attribute name (e.g. color)"
                  value={attribute.key}
                  onChange={(e) =>
                    handleAttributeChange(index, "key", e.target.value)
                  }
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />

                <input
                  type="text"
                  placeholder="Value (e.g. purple)"
                  value={attribute.value}
                  onChange={(e) =>
                    handleAttributeChange(index, "value", e.target.value)
                  }
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />

                <button
                  type="button"
                  onClick={() => removeAttribute(index)}
                  className="px-3 text-red-500 hover:bg-red-50 rounded-lg"
                  title="Remove attribute"
                >
                  <FaTrash />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Price and Stock */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Enter price"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stock
            </label>

            <input
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="Enter stock"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Images
          </label>

          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50">
            <FaImage className="text-2xl text-gray-400 mb-2" />

            <span className="text-sm text-gray-500">
              Click to select images
            </span>

            <span className="text-xs text-gray-400 mt-1">Maximum 5 images</span>

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="hidden"
            />
          </label>

          {/* Image previews */}
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mt-4">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-28 object-cover rounded-lg border"
                  />

                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition"
                  >
                    <FaTrash className="text-xs" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Adding Variant..." : "Add Variant"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddVariant;
