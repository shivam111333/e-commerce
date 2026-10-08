import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaPlus, FaTrash, FaSave } from "react-icons/fa";
import { toast } from "react-toastify";
import { FieldArray, Form, Formik } from "formik";
import api from "../../api/axios";
import FormField from "../../component/FormField.jsx";
import { MAX_ATTRIBUTES, MAX_PRICE, MAX_STOCK } from "../../config/limits.js";
import { variantSchema } from "../../validation/variantSchemas.js";

function EditVariant() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [variant, setVariant] = useState(null);

  const [loading, setLoading] = useState(true);

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
  // Submit
  // --------------------------------

  const handleSubmit = async (values, { setSubmitting }) => {
    if (!variant) {
      toast.error("Variant not found");
      return;
    }

    try {
      const attributesObject = Object.fromEntries(
        values.attributes.map(({ key, value }) => [
          key.trim().toLowerCase(),
          value.trim(),
        ])
      );

      const data = {
        product: String(variant.product?._id || variant.product),
        price: Number(values.price),
        stock: Number(values.stock),
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
      setSubmitting(false);
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

          <Formik
            enableReinitialize
            initialValues={{
              product: String(variant.product?._id || variant.product),
              price: String(variant.price ?? ""),
              stock: String(variant.stock ?? ""),
              attributes:
                variant.attributes instanceof Map
                  ? Array.from(variant.attributes.entries()).map(([key, value]) => ({
                      key,
                      value,
                    }))
                  : Object.entries(variant.attributes || {}).map(
                      ([key, value]) => ({ key, value })
                    ),
            }}
            validationSchema={variantSchema}
            onSubmit={handleSubmit}
          >
            {({ values, errors, touched, isSubmitting }) => (
              <Form noValidate>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField
                    name="price"
                    label="Price"
                    type="number"
                    min="1"
                    max={MAX_PRICE}
                    step="0.01"
                    placeholder="Enter price"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <FormField
                    name="stock"
                    label="Stock"
                    type="number"
                    min="0"
                    max={MAX_STOCK}
                    step="1"
                    placeholder="Enter stock"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <FieldArray name="attributes">
                  {({ push, remove }) => (
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
                          onClick={() => push({ key: "", value: "" })}
                          disabled={values.attributes.length >= MAX_ATTRIBUTES}
                          className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium disabled:opacity-50"
                        >
                          <FaPlus />
                          Add Attribute
                        </button>
                      </div>

                      <div className="space-y-3">
                        {values.attributes.map((attribute, index) => (
                          <div key={index} className="flex gap-3 items-start">
                            <FormField
                              name={`attributes.${index}.key`}
                              aria-label="Attribute name"
                              placeholder="Attribute name"
                              containerClassName="flex-1 mb-0"
                              className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <FormField
                              name={`attributes.${index}.value`}
                              aria-label="Attribute value"
                              placeholder="Attribute value"
                              containerClassName="flex-1 mb-0"
                              className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              className="p-3 text-red-500 hover:bg-red-50 rounded-lg"
                              title="Remove attribute"
                              aria-label={`Remove attribute ${index + 1}`}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        ))}
                      </div>
                      {typeof errors.attributes === "string" &&
                        touched.attributes && (
                          <p className="mt-1 text-sm text-red-600" role="alert">
                            {errors.attributes}
                          </p>
                        )}
                    </div>
                  )}
                </FieldArray>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/vendor/products/${variant.product}`)
                    }
                    className="flex-1 px-5 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                  >
                    <FaSave />
                    {isSubmitting ? "Updating..." : "Update Variant"}
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

export default EditVariant;