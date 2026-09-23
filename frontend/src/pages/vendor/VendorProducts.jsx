import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios.jsx";
import { toast } from "react-toastify";
import {
  FaPlus,
  FaSearch,
  FaBoxOpen,
  FaChevronRight,
  FaEdit,
  FaTrash,
  FaArrowLeft
} from "react-icons/fa";

function VendorProducts() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVendorProducts = async () => {
      try {
        const response = await api.get("/vendor");

        setProducts(response.data.data);
      } catch (err) {
        console.log(err);
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchVendorProducts();
  }, []);

  // Search products
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleDelete = async (productId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this product?",
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/product/${productId}`);

      setProducts((prev) =>
        prev.filter((product) => product._id !== productId),
      );

      toast.success("Product deleted successfully");
    } catch (err) {
      console.log(err);
      toast.error("Failed to delete product");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">My Products</h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage your products and their variants
            </p>
          </div>

          <button
            onClick={() => navigate("/vendor/products/add")}
            className="flex items-center justify-center gap-2 rounded-lg
                       bg-blue-600 px-5 py-2.5 font-medium text-white
                       transition hover:bg-blue-700"
          >
            <FaPlus size={14} />
            Add Product
          </button>
        </div>
        <button
                    onClick={() => navigate("/vendor/dashboard")}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 w-fit"
                  >
                    <FaArrowLeft />
                    Back to Dashboard
                  </button>

        {/* Search / Filter */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row">
            {/* Search */}
            <div className="relative flex-1">
              <FaSearch
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={15}
              />

              <input
                type="text"
                placeholder="Search your products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-200
                           py-2.5 pl-10 pr-4 text-sm outline-none
                           transition focus:border-blue-500"
              />
            </div>

            {/* Product Count */}
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-4 py-2.5">
              <FaBoxOpen className="text-gray-500" />

              <span className="text-sm text-gray-600">
                {products.length} Products
              </span>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
            <p className="text-gray-500">Loading products...</p>
          </div>
        )}

        {/* Empty */}
        {!loading && products.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white py-16 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <FaBoxOpen size={26} className="text-gray-400" />
            </div>

            <h2 className="text-lg font-semibold text-gray-800">
              No products yet
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Start adding products to your store.
            </p>

            <button
              onClick={() => navigate("/vendor/products/add")}
              className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5
                         text-sm font-medium text-white
                         hover:bg-blue-700"
            >
              Add Your First Product
            </button>
          </div>
        )}

        {/* No Search Result */}
        {!loading && products.length > 0 && filteredProducts.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white py-12 text-center">
            <p className="text-gray-500">No products found for "{search}"</p>
          </div>
        )}

        {/* Product Table */}
        {!loading && filteredProducts.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {/* Desktop Table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Product
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Category
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      SubCategory
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.map((product) => (
                    <tr
                      key={product._id}
                      className="transition hover:bg-gray-50"
                    >
                      {/* Product */}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                            <FaBoxOpen className="text-gray-400" size={20} />
                          </div>

                          <div>
                            <p className="font-semibold text-gray-800">
                              {product.name}
                            </p>

                            <p className="mt-1 max-w-xs truncate text-sm text-gray-500">
                              {product.description || "No description"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-5">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                          {product.category?.name || "Category"}
                        </span>
                      </td>
                      {/* SubCategory */}
                      <td className="px-6 py-5">
                        <span className="rounded-full bg-blue-50 px-5 py-1 text-xs font-medium text-blue-600">
                          {product.subcategory?.name || "Category"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-5">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() =>
                              navigate(`/vendor/products/${product._id}`)
                            }
                            className="flex items-center gap-2 rounded-lg
                                       bg-blue-50 px-3 py-2 text-sm
                                       font-medium text-blue-600
                                       hover:bg-blue-100"
                          >
                            View
                            <FaChevronRight size={11} />
                          </button>

                          <button
                            onClick={() =>
                              navigate(`/vendor/products/${product._id}/edit`)
                            }
                            className="rounded-lg bg-gray-100 p-2
                                       text-gray-600 hover:bg-gray-200"
                          >
                            <FaEdit size={14} />
                          </button>

                          <button
                            onClick={() => handleDelete(product._id)}
                            className="rounded-lg bg-red-50 p-2
                                       text-red-500 hover:bg-red-100"
                          >
                            <FaTrash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="divide-y divide-gray-100 md:hidden">
              {filteredProducts.map((product) => (
                <div key={product._id} className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                      <FaBoxOpen className="text-gray-400" size={20} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-800">
                        {product.name}
                      </h3>

                      <p className="mt-1 truncate text-sm text-gray-500">
                        {product.description || "No description"}
                      </p>

                      <div className="mt-3">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                          {product.category?.name || "Category"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() =>
                        navigate(`/vendor/products/${product._id}`)
                      }
                      className="flex flex-1 items-center justify-center
                                 gap-2 rounded-lg bg-blue-600 px-3 py-2
                                 text-sm font-medium text-white
                                 hover:bg-blue-700"
                    >
                      View Product
                      <FaChevronRight size={11} />
                    </button>

                    <button
                      onClick={() =>
                        navigate(`/vendor/products/edit/${product._id}`)
                      }
                      className="rounded-lg bg-gray-100 px-3 py-2
                                 text-gray-600 hover:bg-gray-200"
                    >
                      <FaEdit size={14} />
                    </button>

                    <button
                      onClick={() => handleDelete(product._id)}
                      className="rounded-lg bg-red-50 px-3 py-2
                                 text-red-500 hover:bg-red-100"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default VendorProducts;
