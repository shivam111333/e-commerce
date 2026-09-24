import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { FaTrash, FaPlus } from "react-icons/fa";

import api from "../../../api/axios.jsx";

function CategoriesSection() {
  const [categories, setCategories] = useState([]);
  const [productCounts, setProductCounts] = useState({});
  const [subcategories, setSubcategories] = useState({});
  const [loading, setLoading] = useState(true);

  // Add subcategory form
  const [showSubcategoryForm, setShowSubcategoryForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [subcategoryName, setSubcategoryName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  //category add form
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [discription, setDiscription] = useState("");
  const [submittingCategory, setSubmittingCategory] = useState(false);

  // --------------------------------
  // Fetch Product Counts
  // --------------------------------

  const fetchProductCounts = async (categoryList) => {
    if (categoryList.length === 0) {
      setProductCounts({});
      return;
    }

    try {
      const counts = {};

      for (const category of categoryList) {
        const response = await api.get(`/category/all/${category._id}`);

        const products = response.data.data || [];

        counts[category._id] = products.length;
      }

      setProductCounts(counts);
    } catch (err) {
      console.log(err);

      toast.error("Failed to fetch product count");
    }
  };

  // --------------------------------
  // Fetch Subcategories
  // --------------------------------

  const fetchSubcategories = async (categoryList) => {
    if (categoryList.length === 0) {
      setSubcategories({});
      return;
    }

    try {
      const subcategoryData = {};

      for (const category of categoryList) {
        const response = await api.get(`/subcategory/category/${category._id}`);

        subcategoryData[category._id] = response.data.data || [];
        console.log(response.data.data);
      }

      setSubcategories(subcategoryData);
      console.log(subcategoryData);
    } catch (err) {
      console.log(err);

      toast.error("Failed to load subcategories");
    }
  };

  // --------------------------------
  // Initial Fetch
  // --------------------------------

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);

      try {
        const response = await api.get("/category/");

        const categoryData = response.data.data || [];

        setCategories(categoryData);

        fetchProductCounts(categoryData);
        fetchSubcategories(categoryData);
      } catch (err) {
        console.log(err);

        toast.error("Failed to load categories");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // --------------------------------
  // Open Add Subcategory Form
  // --------------------------------

  const handleOpenSubcategoryForm = (category) => {
    setSelectedCategory(category);
    setSubcategoryName("");
    setShowSubcategoryForm(true);
  };

  //open add Category Form
  const handleOpenCategoryForm = () => {
    setCategoryName("");
    setDiscription("");
    setShowCategoryForm(true);
  };

  //add Category function
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      toast.error("Category name is required");
      return;
    }
    if (!discription.trim()) {
      toast.error("Discription is required");
      return;
    }
    try {
      setSubmittingCategory(true);

      const response = await api.post("/category/", {
        name: categoryName.trim(),
        discription: discription.trim(),
      });

      const newCategory = response.data.data;

      toast.success("Subcategory added successfully");

      // Add new category directly to UI
      setCategories((prev) => [...prev, newCategory]);

      // Close form
      setShowCategoryForm(false);

      setCategoryName("");
      setDiscription("");
    } catch (err) {
      console.log(err);

      toast.error(err.response?.data?.message || "Failed to add category");
    } finally {
      setSubmittingCategory(false);
    }
  };
  // --------------------------------
  // Add Subcategory
  // --------------------------------

  const handleAddSubcategory = async (e) => {
    e.preventDefault();

    if (!subcategoryName.trim()) {
      toast.error("Subcategory name is required");
      return;
    }

    if (!selectedCategory) {
      toast.error("Category is required");
      return;
    }

    try {
      setSubmitting(true);

      const response = await api.post("/subcategory/", {
        name: subcategoryName.trim(),
        category: selectedCategory._id,
      });

      const newSubcategory = response.data.data;

      toast.success("Subcategory added successfully");

      // Add new subcategory directly to UI
      setSubcategories((prev) => ({
        ...prev,
        [selectedCategory._id]: [
          ...(prev[selectedCategory._id] || []),
          newSubcategory,
        ],
      }));

      // Close form
      setShowSubcategoryForm(false);
      setSelectedCategory(null);
      setSubcategoryName("");
    } catch (err) {
      console.log(err);

      toast.error(err.response?.data?.message || "Failed to add subcategory");
    } finally {
      setSubmitting(false);
    }
  };

  // --------------------------------
  // Delete Category
  // --------------------------------

  const handleDeleteCategory = async (categoryId) => {
    const productCount = productCounts[categoryId] || 0;

    // Frontend protection
    if (productCount > 0) {
      toast.error("You cannot delete a category containing products");

      return;
    }

    try {
      await api.delete(`/category/${categoryId}`);

      toast.success("Category and its subcategories deleted successfully");

      // Remove category
      setCategories((prev) =>
        prev.filter((category) => category._id !== categoryId),
      );

      // Remove product count
      setProductCounts((prev) => {
        const updated = { ...prev };

        delete updated[categoryId];

        return updated;
      });

      // Remove subcategories
      setSubcategories((prev) => {
        const updated = { ...prev };

        delete updated[categoryId];

        return updated;
      });
    } catch (err) {
      console.log(err);

      toast.error(err.response?.data?.message || "Failed to delete category");
    }
  };

  // --------------------------------
  // Loading
  // --------------------------------

  if (loading) {
    return (
      <div className="py-10 text-center text-gray-500">
        Loading Categories...
      </div>
    );
  }

  // --------------------------------
  // UI
  // --------------------------------

  return (
    <>
      <h1 className="mb-5 text-2xl font-bold text-gray-900">Categories</h1>

      <div className="mb-5 flex items-center justify-between rounded-lg bg-white p-5 shadow">
        <p className="m-0 text-gray-700">Manage Categories and Subcategories</p>

        <button
          className="rounded bg-black px-4 py-2 text-white"
          onClick={() => {
            handleOpenCategoryForm();
          }}
        >
          + Add Category
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg shadow ring-1 ring-black ring-opacity-5">
        <table className="min-w-full divide-y divide-gray-300 bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">
                Name
              </th>

              <th className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">
                Description
              </th>

              <th className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">
                Subcategories
              </th>

              <th className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">
                Products
              </th>

              <th className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {categories.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="px-6 py-10 text-center text-gray-500"
                >
                  No categories found
                </td>
              </tr>
            ) : (
              categories.map((category) => {
                const productCount = productCounts[category._id] || 0;

                const categorySubcategories = subcategories[category._id] || [];

                return (
                  <tr
                    key={category._id}
                    className="transition-colors hover:bg-gray-50"
                  >
                    {/* Category Name */}
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {category.name}
                    </td>

                    {/* Description */}
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {category.description || "No description"}
                    </td>

                    {/* Subcategories */}
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {categorySubcategories.length === 0 ? (
                          <span className="text-sm text-gray-400">
                            No subcategories
                          </span>
                        ) : (
                          categorySubcategories
                            .filter(
                              (subcategory) => subcategory && subcategory._id,
                            )
                            .map((subcategory) => (
                              <div
                                key={subcategory._id}
                                className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1"
                              >
                                <span className="text-xs font-medium text-gray-700">
                                  {subcategory.name || "Unnamed"}
                                </span>

                                
                              </div>
                            ))
                        )}

                        {/* Add Subcategory */}
                        <button
                          onClick={() => handleOpenSubcategoryForm(category)}
                          className="flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100"
                        >
                          <FaPlus size={9} />
                          Add
                        </button>
                      </div>
                    </td>

                    {/* Product Count */}
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {productCount}
                    </td>

                    {/* Category Action */}
                    <td className="px-6 py-4">
                      {productCount === 0 ? (
                        <button
                          onClick={() => handleDeleteCategory(category._id)}
                          className="rounded-lg bg-red-50 p-2 text-red-500 hover:bg-red-100"
                          title="Delete category"
                        >
                          <FaTrash size={14} />
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">
                          Has products
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Subcategory Modal */}

      {showSubcategoryForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-1 text-xl font-bold text-gray-900">
              Add Subcategory
            </h2>

            <p className="mb-5 text-sm text-gray-500">
              Category:
              <span className="font-semibold text-gray-700">
                {selectedCategory?.name}
              </span>
            </p>

            <form onSubmit={handleAddSubcategory}>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Subcategory Name
              </label>

              <input
                type="text"
                value={subcategoryName}
                onChange={(e) => setSubcategoryName(e.target.value)}
                placeholder="Enter subcategory name"
                className="mb-5 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
              />

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowSubcategoryForm(false);
                    setSelectedCategory(null);
                    setSubcategoryName("");
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
                >
                  {submitting ? "Adding..." : "Add Subcategory"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}

      {showCategoryForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-1 text-xl font-bold text-gray-900">
              Add Category
            </h2>

            <form onSubmit={handleAddCategory}>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Category Name
              </label>

              <input
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Enter subcategory name"
                className="mb-5 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
              />
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Discription
              </label>

              <input
                type="text"
                value={discription}
                onChange={(e) => setDiscription(e.target.value)}
                placeholder="Enter subcategory name"
                className="mb-5 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
              />

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryForm(false);

                    setSubcategoryName("");
                    setDiscription("");
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
                >
                  {submittingCategory ? "Adding..." : "Add Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default CategoriesSection;
