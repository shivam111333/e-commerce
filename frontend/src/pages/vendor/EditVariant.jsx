import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaPlus, FaTrash, FaSave } from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../../api/axios";

function EditVariant() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [variant, setVariant] = useState(null);

  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");

  const [attributes, setAttributes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // --------------------------------
  // Fetch Variant
  // --------------------------------

  useEffect(() => {
    const fetchVariant = async () => {
      try {
        setLoading(true);

        const response = await api.get(`/variant/${id}`);

        const variantData = response.data;

        console.log("Variant response:", variantData);

        if (!variantData?._id) {
          toast.error("Variant not found");
          navigate("/vendor/products");
          return;
        }

        setVariant(variantData);

        setPrice(variantData.price ?? "");
        setStock(variantData.stock ?? "");

        // Convert attributes Map/object into array
        const attributesObject = variantData.attributes || {};

        let attributesArray = [];

        if (attributesObject instanceof Map) {
          attributesArray = Array.from(attributesObject.entries()).map(
            ([key, value]) => ({
              key,
              value,
            })
          );
        } else {
          attributesArray = Object.entries(attributesObject).map(
            ([key, value]) => ({
              key,
              value,
            })
          );
        }

        setAttributes(
          attributesArray.length > 0
            ? attributesArray
            : [{ key: "", value: "" }]
        );
      } catch (err) {
        console.error(err);

        toast.error(
          err.response?.data?.message || "Failed to fetch variant"
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchVariant();
    }
  }, [id, navigate]);

  // --------------------------------
  // Attribute handlers
  // --------------------------------

  const handleAttributeChange = (index, field, value) => {
    setAttributes((prev) =>
      prev.map((attribute, i) =>
        i === index
          ? {
              ...attribute,
              [field]: value,
            }
          : attribute
      )
    );
  };

  const addAttribute = () => {
    setAttributes((prev) => [
      ...prev,
      {
        key: "",
        value: "",
      },
    ]);
  };

  const removeAttribute = (index) => {
    setAttributes((prev) => prev.filter((_, i) => i !== index));
  };

  // --------------------------------
  // Submit
  // --------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!variant) {
      toast.error("Variant not found");
      return;
    }

    // Price validation
    if (price === "" || Number(price) < 0) {
      toast.error("Please enter a valid price");
      return;
    }

    // Stock validation
    if (stock === "" || Number(stock) < 0) {
      toast.error("Please enter a valid stock");
      return;
    }

    // Create attributes object
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
      setSaving(true);

      const data = {
        product: variant.product,
        price: Number(price),
        stock: Number(stock),
        attributes: JSON.stringify(attributesObject),
      };

      console.log("Updating variant:", data);

      const response = await api.put(`/variant/${id}`, data);

      if (response.data.success) {
        toast.success(
          response.data.message || "Variant updated successfully"
        );

        navigate(`/vendor/products/${variant.product}`);
      } else {
        toast.error(
          response.data.message || "Failed to update variant"
        );
      }
    } catch (err) {
      console.error(err);

      toast.error(
        err.response?.data?.message || "Failed to update variant"
      );
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------
  // Loading
  // --------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading variant...</p>
      </div>
    );
  }

  // --------------------------------
  // UI
  // --------------------------------

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Back button */}
        <button
          type="button"
          onClick={() =>
            navigate(
              variant
                ? `/vendor/products/${variant.product}`
                : "/vendor/products"
            )
          }
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <FaArrowLeft />
          Back to Product
        </button>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Edit Variant
            </h1>

            <p className="text-gray-500 mt-1">
              Update price, stock and variant attributes.
            </p>
          </div>

          <form onSubmit={handleSubmit}>

            {/* Price */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter price"
              />
            </div>

            {/* Stock */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock
              </label>

              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter stock"
              />
            </div>

            {/* Attributes */}
            <div className="mb-6">

              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Attributes
                  </h2>

                  <p className="text-sm text-gray-500">
                    Example: Color → Black, Size → XL
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addAttribute}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
                >
                  <FaPlus />
                  Add Attribute
                </button>
              </div>

              <div className="space-y-3">

                {attributes.map((attribute, index) => (
                  <div
                    key={index}
                    className="flex gap-3 items-center"
                  >

                    {/* Key */}
                    <input
                      type="text"
                      value={attribute.key}
                      onChange={(e) =>
                        handleAttributeChange(
                          index,
                          "key",
                          e.target.value
                        )
                      }
                      placeholder="Attribute name"
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    {/* Value */}
                    <input
                      type="text"
                      value={attribute.value}
                      onChange={(e) =>
                        handleAttributeChange(
                          index,
                          "value",
                          e.target.value
                        )
                      }
                      placeholder="Attribute value"
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    {/* Remove */}
                    {attributes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAttribute(index)}
                        className="p-3 text-red-500 hover:bg-red-50 rounded-lg"
                        title="Remove attribute"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                ))}

              </div>
            </div>


            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">

              <button
                type="button"
                onClick={() =>
                  navigate(
                    variant
                      ? `/vendor/products/${variant.product}`
                      : "/vendor/products"
                  )
                }
                className="flex-1 px-5 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                <FaSave />

                {saving ? "Updating..." : "Update Variant"}
              </button>

            </div>

          </form>
        </div>
      </div>
    </div>
  );
}

export default EditVariant;