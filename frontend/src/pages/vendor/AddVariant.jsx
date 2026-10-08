import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaTrash, FaPlus, FaImage } from "react-icons/fa";
import { toast } from "react-toastify";
import { FieldArray, Form, Formik } from "formik";

import api from "../../api/axios";
import FormField from "../../component/FormField.jsx";
import {
  ALLOWED_VARIANT_IMAGE_TYPES,
  MAX_ATTRIBUTES,
  MAX_IMAGE_SIZE_BYTES,
  MAX_PRICE,
  MAX_STOCK,
  MAX_VARIANT_IMAGES,
} from "../../config/limits.js";
import { createVariantSchema } from "../../validation/variantSchemas.js";

const getImageError = (errors) => {
  if (typeof errors.images === "string") return errors.images;
  if (Array.isArray(errors.images)) {
    return errors.images.find((error) => typeof error === "string");
  }
  return undefined;
};

function AddVariant() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [imagePreviews, setImagePreviews] = useState([]);

  // Keep the latest previews so we can free them when leaving the page
  const previewsRef = useRef([]);
  useEffect(() => {
    previewsRef.current = imagePreviews;
  }, [imagePreviews]);

  useEffect(() => {
    return () => previewsRef.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  // --------------------------------
  // --------------------------------
  // Images
  // --------------------------------
  const handleImageChange = (
    e,
    currentImages,
    setFieldValue,
    setFieldError
  ) => {
    const selectedFiles = Array.from(e.target.files);
    e.target.value = ""; // lets the same file be picked again after removal

    if (selectedFiles.length === 0) return;

    if (currentImages.length + selectedFiles.length > MAX_VARIANT_IMAGES) {
      toast.error(`You can upload maximum ${MAX_VARIANT_IMAGES} images`);
      setFieldError(
        "images",
        `You can upload maximum ${MAX_VARIANT_IMAGES} images`
      );
      return;
    }

    for (const file of selectedFiles) {
      if (!ALLOWED_VARIANT_IMAGE_TYPES.includes(file.type)) {
        toast.error("Only JPG and PNG images are allowed");
        setFieldError("images", "Only JPG and PNG images are allowed");
        return;
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        toast.error(`${file.name} is larger than 5 MB`);
        setFieldError("images", "Images must be 5 MB or smaller");
        return;
      }
    }

    setFieldError("images", undefined);
    setFieldValue("images", [...currentImages, ...selectedFiles]);
    setImagePreviews((prev) => [
      ...prev,
      ...selectedFiles.map((file) => URL.createObjectURL(file)),
    ]);
  };

  const removeImage = (index, images, setFieldValue) => {
    URL.revokeObjectURL(imagePreviews[index]); // free the browser memory
    setFieldValue("images", images.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // --------------------------------
  // Submit variant
  // --------------------------------
  const handleSubmit = async (values, { setSubmitting }) => {
    if (!id) {
      toast.error("Product ID is missing");
      return;
    }

    try {
      const attributesObject = Object.fromEntries(
        values.attributes.map(({ key, value }) => [
          key.trim().toLowerCase(),
          value.trim(),
        ])
      );

      const formData = new FormData();

      // Product ID comes from the URL
      formData.append("product", id);
      formData.append("price", String(Number(values.price)));
      formData.append("stock", String(Number(values.stock)));
      formData.append("attributes", JSON.stringify(attributesObject));

      values.images.forEach((image) => {
        formData.append("images", image);
      });

      const response = await api.post("/variant", formData);

      toast.success(response.data.message || "Variant added successfully");

      // Go back to vendor product view
      navigate(`/vendor/products/${id}`);
    } catch (error) {
      console.error("Error adding variant:", error.response?.data || error);

      toast.error(error.response?.data?.message || "Failed to add variant");
    } finally {
      setSubmitting(false);
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

      <Formik
        initialValues={{
          product: id || "",
          price: "",
          stock: "",
          attributes: [{ key: "", value: "" }],
          images: [],
        }}
        validationSchema={createVariantSchema}
        onSubmit={handleSubmit}
      >
        {({
          values,
          errors,
          touched,
          isSubmitting,
          setFieldValue,
          setFieldTouched,
          setFieldError,
        }) => (
          <Form className="p-6 space-y-6" noValidate>
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-800">Attributes</h3>
                <FieldArray name="attributes">
                  {({ push }) => (
                    <button
                      type="button"
                      onClick={() => push({ key: "", value: "" })}
                      disabled={values.attributes.length >= MAX_ATTRIBUTES}
                      className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
                    >
                      <FaPlus />
                      Add Attribute
                    </button>
                  )}
                </FieldArray>
              </div>

              <FieldArray name="attributes">
                {({ remove }) => (
                  <div className="space-y-3">
                    {values.attributes.map((attribute, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <FormField
                          name={`attributes.${index}.key`}
                          aria-label="Attribute name"
                          placeholder="Attribute name (e.g. color)"
                          containerClassName="flex-1 mb-0"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <FormField
                          name={`attributes.${index}.value`}
                          aria-label="Attribute value"
                          placeholder="Value (e.g. purple)"
                          containerClassName="flex-1 mb-0"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg"
                          title="Remove attribute"
                          aria-label={`Remove attribute ${index + 1}`}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </FieldArray>
              {typeof errors.attributes === "string" && touched.attributes && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.attributes}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField
                name="price"
                label="Price"
                type="number"
                min="1"
                max={MAX_PRICE}
                step="0.01"
                placeholder="Enter price"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
              <FormField
                name="stock"
                label="Stock"
                type="number"
                min="0"
                max={MAX_STOCK}
                step="1"
                placeholder="Enter stock"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="variant-images"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Product Images
              </label>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50">
                <FaImage className="text-2xl text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">Click to select images</span>
                <span className="text-xs text-gray-400 mt-1">
                  Maximum {MAX_VARIANT_IMAGES} images, JPG/PNG, up to 5 MB each
                </span>
                <input
                  id="variant-images"
                  type="file"
                  accept="image/jpeg,image/png"
                  multiple
                  onChange={(event) => {
                    handleImageChange(
                      event,
                      values.images,
                      setFieldValue,
                      setFieldError
                    );
                    setFieldTouched("images", true, false);
                  }}
                  className="hidden"
                  aria-describedby={
                    touched.images && getImageError(errors)
                      ? "variant-images-error"
                      : undefined
                  }
                  aria-invalid={
                    touched.images && getImageError(errors) ? "true" : undefined
                  }
                />
              </label>
              {touched.images && getImageError(errors) && (
                <p
                  id="variant-images-error"
                  className="mt-1 text-sm text-red-600"
                  role="alert"
                >
                  {getImageError(errors)}
                </p>
              )}

              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mt-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={preview} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-28 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          removeImage(index, values.images, setFieldValue);
                          setFieldTouched("images", true, false);
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition"
                        aria-label={`Remove image ${index + 1}`}
                      >
                        <FaTrash className="text-xs" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Adding Variant..." : "Add Variant"}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}

export default AddVariant;