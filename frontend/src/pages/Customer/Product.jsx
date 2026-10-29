import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../api/axios";
import ProductCard from "../../component/ProductCard";
import { FaFilter, FaSlidersH } from "react-icons/fa";

const PRODUCTS_PER_PAGE = 12;

const EMPTY_PAGINATION = {
  currentPage: 1,
  limit: PRODUCTS_PER_PAGE,
  totalProducts: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPrevPage: false,
};

function Products() {
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get("search") || "";
  const selectedCategory = searchParams.get("category") || "all";
  const selectedSubcategory = searchParams.get("subcategory") || "";

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [subcategoryOptions, setSubcategoryOptions] = useState({
    categoryId: null,
    data: [],
  });

  const [sortOrder, setSortOrder] = useState("featured");
  const [currentPage, setCurrentPage] = useState(1);
  const [retryCount, setRetryCount] = useState(0);

  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Reset pagination when search, filters, or sorting change.
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory, selectedSubcategory, sortOrder]);

  // Fetch products using backend pagination.
  useEffect(() => {
    let isCurrentRequest = true;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

       // replace with this:
const response = await api.get("/product", {
  params: {
    page: currentPage,
    limit: PRODUCTS_PER_PAGE,
    search: search.trim(),
    category: selectedCategory === "all" ? undefined : selectedCategory,
    subcategory:
      selectedCategory === "all" ? undefined : selectedSubcategory || undefined,
    sort: sortOrder,
  },
});

        if (!isCurrentRequest) return;

        const fetchedProducts = response.data?.data || [];
        const fetchedPagination = response.data?.pagination || {
          ...EMPTY_PAGINATION,
          currentPage,
        };

        setProducts(fetchedProducts);
        setPagination(fetchedPagination);

        // Handle a page that no longer exists after filtering/deletion.
        if (
          fetchedPagination.totalPages > 0 &&
          currentPage > fetchedPagination.totalPages
        ) {
          setCurrentPage(fetchedPagination.totalPages);
        }
      } catch (err) {
        if (!isCurrentRequest) return;

        console.error("Product loading error:", err);

        setError(
          err.response?.data?.message || "Failed to load products."
        );

        setProducts([]);
        setPagination({
          ...EMPTY_PAGINATION,
          currentPage,
        });
      } finally {
        if (isCurrentRequest) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      isCurrentRequest = false;
    };
  }, [
    currentPage,
    selectedCategory,
    selectedSubcategory,
    search,
    sortOrder,
    retryCount,
  ]);

  // Fetch categories.
  useEffect(() => {
    let isCurrentRequest = true;

    const fetchCategories = async () => {
      try {
        const response = await api.get("/category");

        if (isCurrentRequest) {
          setCategories(response.data?.data || []);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };

    fetchCategories();

    return () => {
      isCurrentRequest = false;
    };
  }, []);

  // Fetch subcategories for the selected category.
  useEffect(() => {
    let isCurrentRequest = true;

    if (selectedCategory === "all") {
      setSubcategoryOptions({
        categoryId: null,
        data: [],
      });

      return () => {
        isCurrentRequest = false;
      };
    }

    const fetchSubcategories = async () => {
      try {
        const response = await api.get(
          `/subcategory/category/${selectedCategory}`
        );

        if (isCurrentRequest) {
          setSubcategoryOptions({
            categoryId: selectedCategory,
            data: response.data?.data || [],
          });
        }
      } catch (err) {
        if (isCurrentRequest) {
          console.error("Error fetching subcategories:", err);

          setSubcategoryOptions({
            categoryId: selectedCategory,
            data: [],
          });
        }
      }
    };

    fetchSubcategories();

    return () => {
      isCurrentRequest = false;
    };
  }, [selectedCategory]);

  const subcategories =
    subcategoryOptions.categoryId === selectedCategory
      ? subcategoryOptions.data
      : [];

  // Pagination information returned by the backend.
  const totalProducts = Number(pagination.totalProducts) || 0;
  const totalPages = Number(pagination.totalPages) || 0;

  // const startIndex =
  //   totalProducts === 0
  //     ? 0
  //     : (currentPage - 1) * PRODUCTS_PER_PAGE + 1;

  // const endIndex =
  //   totalProducts === 0
  //     ? 0
  //     : Math.min(
  //         (currentPage - 1) * PRODUCTS_PER_PAGE + products.length,
  //         totalProducts
  //       );

  // Navigate between pages.
  const goToPage = (requestedPage) => {
    const safePage = Math.min(
      Math.max(1, requestedPage),
      Math.max(1, totalPages)
    );

    if (safePage === currentPage) return;

    setCurrentPage(safePage);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Retry a failed request.
  const retryFetch = useCallback(() => {
    setRetryCount((count) => count + 1);
  }, []);

  // Update category in the URL.
  const selectCategory = (categoryId) => {
    const nextSearchParams = new URLSearchParams(searchParams);

    if (categoryId === "all") {
      nextSearchParams.delete("category");
      nextSearchParams.delete("subcategory");
    } else {
      nextSearchParams.set("category", categoryId);
      nextSearchParams.delete("subcategory");
    }

    setSearchParams(nextSearchParams);
    setCurrentPage(1);
  };

  // Update subcategory in the URL.
  const selectSubcategory = (subcategoryId) => {
    const nextSearchParams = new URLSearchParams(searchParams);

    if (subcategoryId) {
      nextSearchParams.set("subcategory", subcategoryId);
    } else {
      nextSearchParams.delete("subcategory");
    }

    setSearchParams(nextSearchParams);
    setCurrentPage(1);
  };

  // Clear category filters and restore default sorting.
  const clearFilters = () => {
    const nextSearchParams = new URLSearchParams(searchParams);

    nextSearchParams.delete("category");
    nextSearchParams.delete("subcategory");
    nextSearchParams.delete("search");  

    setSearchParams(nextSearchParams);
    setSortOrder("featured");
    setCurrentPage(1);
  };
  // Remove only the search, keep category and subcategory
const clearSearch = () => {
  const nextSearchParams = new URLSearchParams(searchParams);
  nextSearchParams.delete("search");

  setSearchParams(nextSearchParams);
  setCurrentPage(1);
};

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        <div className="grid items-start gap-5 lg:grid-cols-[230px_minmax(0,1fr)]">

          {/* Filter sidebar */}
          <aside className="rounded-2xl border border-slate-200 bg-white p-5 lg:sticky lg:top-24">
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
              <FaFilter className="text-blue-600" />
              Filters
            </h2>

            {/* Sorting */}
            <label
              htmlFor="product-sort"
              className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700"
            >
              <FaSlidersH
                aria-hidden="true"
                className="text-slate-500"
              />
              Sort by
            </label>

            <select
              id="product-sort"
              value={sortOrder}
              onChange={(event) => {
                setSortOrder(event.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
            </select>

            {/* Category */}
            <label
              htmlFor="product-category"
              className="mb-2 mt-4 block text-sm font-medium text-slate-700"
            >
              Category
            </label>

            <select
              id="product-category"
              value={selectedCategory}
              onChange={(event) => selectCategory(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="all">All categories</option>

              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>

            {/* Subcategory */}
            <label
              htmlFor="product-subcategory"
              className="mb-2 mt-4 block text-sm font-medium text-slate-700"
            >
              Subcategory
            </label>

            <select
              id="product-subcategory"
              value={
                selectedCategory === "all" ? "" : selectedSubcategory
              }
              onChange={(event) =>
                selectSubcategory(event.target.value)
              }
              disabled={selectedCategory === "all"}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              <option value="">
                {selectedCategory === "all"
                  ? "Select a category first"
                  : "All subcategories"}
              </option>

              {subcategories.map((subcategory) => (
                <option key={subcategory._id} value={subcategory._id}>
                  {subcategory.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 text-sm font-semibold text-blue-700 hover:text-blue-900"
            >
              Clear filters
            </button>
          </aside>

          {/* Product listing */}
          <section className="min-w-0">

            {/* Active search */}
            {search && (
              <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm text-blue-900">
                <span>
                  Showing results for <b>“{search}”</b>
                </span>

                <button
                  type="button"
                  onClick={clearSearch}
                  className="ml-auto font-semibold text-blue-700 underline hover:text-blue-900"
                >
                  Clear search
                </button>
              </div>
            )}

            {/* Loading state */}
            {loading ? (
              <div
                role="status"
                className="flex min-h-[40vh] items-center justify-center rounded-2xl bg-white text-slate-500"
              >
                Loading products...
              </div>
            ) : error ? (
              /* Error state */
              <div
                role="alert"
                className="flex min-h-[30vh] flex-col items-center justify-center gap-3 rounded-2xl bg-white px-4 text-center"
              >
                <p className="text-red-600">{error}</p>

                <button
                  type="button"
                  onClick={retryFetch}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Try again
                </button>
              </div>
            ) : products.length === 0 ? (
              /* Empty state */
              <div className="flex min-h-[40vh] items-center justify-center rounded-2xl bg-white px-4 text-center text-slate-500">
              No products found{search ? ` for “${search}”` : ""}. Try another search or category
              </div>
            ) : (
              <>
                {/* Maximum 12 products per page */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {products.map((product) => (
                    <ProductCard
                      key={product._id}
                      product={product}
                    />
                  ))}
                </div>

                {/* Previous / Next buttons at the bottom */}
                {totalProducts > 0 && (
                  <nav
                    aria-label="Product pagination"
                    className="mt-8 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4"
                  >
                    <button
                      type="button"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage <= 1 || loading}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 sm:px-5"
                    >
                      Previous
                    </button>

                    <span className="text-center text-sm text-slate-600">
                      Page{" "}
                      <span className="font-semibold text-slate-900">
                        {currentPage}
                      </span>{" "}
                      of{" "}
                      <span className="font-semibold text-slate-900">
                        {totalPages}
                      </span>
                    </span>

                    <button
                      type="button"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage >= totalPages || loading}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40 sm:px-5"
                    >
                      Next
                    </button>
                  </nav>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

export default Products;