import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../api/axios";
import ProductCard from "../../component/ProductCard";
import { FaFilter, FaSlidersH } from "react-icons/fa";

const PRODUCTS_PER_PAGE = 12;

// Builds the page list for the pagination bar, e.g. [1, "...", 4, 5, 6, "...", 12]
const getPageNumbers = (currentPage, totalPages) => {
  const pages = [];

  for (let page = 1; page <= totalPages; page += 1) {
    const isEdge = page === 1 || page === totalPages;
    const isNearCurrent = Math.abs(page - currentPage) <= 1;

    if (isEdge || isNearCurrent) {
      pages.push(page);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return pages;
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
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch all products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);

        const response = await api.get("/product");
        const productData = response.data?.data || [];

        setProducts(productData);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Fetch categories
  useEffect(() => {
    api
      .get("/category")
      .then((response) => {
        setCategories(response.data?.data || []);
      })
      .catch((error) => {
        console.error("Error fetching categories:", error);
      });
  }, []);

  // Fetch subcategories for the selected category
  useEffect(() => {
    let isCurrentRequest = true;

    if (selectedCategory === "all") {
      return () => {
        isCurrentRequest = false;
      };
    }

    api
      .get(`/subcategory/category/${selectedCategory}`)
      .then((response) => {
        if (isCurrentRequest) {
          setSubcategoryOptions({
            categoryId: selectedCategory,
            data: response.data?.data || [],
          });
        }
      })
      .catch((error) => {
        if (isCurrentRequest) {
          console.error("Error fetching subcategories:", error);
          setSubcategoryOptions({
            categoryId: selectedCategory,
            data: [],
          });
        }
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [selectedCategory]);

  const subcategories =
    subcategoryOptions.categoryId === selectedCategory
      ? subcategoryOptions.data
      : [];

  // Filter and sort products
  const filteredProducts = products
    .filter((product) =>
      product.name?.toLowerCase().includes(search.toLowerCase())
    )
    .filter((product) => {
      if (selectedCategory === "all") return true;

      const categoryId =
        typeof product.category === "string"
          ? product.category
          : product.category?._id;

      return categoryId === selectedCategory;
    })
    .filter((product) => {
      if (!selectedSubcategory || selectedCategory === "all") {
        return true;
      }

      const subcategoryId =
        typeof product.subcategory === "string"
          ? product.subcategory
          : product.subcategory?._id;

      return subcategoryId === selectedSubcategory;
    })
    .sort((first, second) => {
      const firstPrice = Number(first.variants?.[0]?.price || 0);
      const secondPrice = Number(second.variants?.[0]?.price || 0);

      if (sortOrder === "price-low") {
        return firstPrice - secondPrice;
      }

      if (sortOrder === "price-high") {
        return secondPrice - firstPrice;
      }

      return 0;
    });

  // Reset to page 1 when search, filters, or sorting changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory, selectedSubcategory, sortOrder]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);

  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;

  const paginatedProducts = filteredProducts.slice(
    startIndex,
    startIndex + PRODUCTS_PER_PAGE
  );

  // Change page and jump back to the top, like a normal shopping site
  const goToPage = (page) => {
    const safePage = Math.min(Math.max(1, page), totalPages);
    setCurrentPage(safePage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Update category in URL
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
  };

  // Update subcategory in URL
  const selectSubcategory = (subcategoryId) => {
    const nextSearchParams = new URLSearchParams(searchParams);

    if (subcategoryId) {
      nextSearchParams.set("subcategory", subcategoryId);
    } else {
      nextSearchParams.delete("subcategory");
    }

    setSearchParams(nextSearchParams);
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        <div className="grid items-start gap-5 lg:grid-cols-[230px_minmax(0,1fr)]">
          {/* Left sidebar: filters + sorting. Stays in view while the
              product list scrolls on large screens. */}
          <aside className="rounded-2xl border border-slate-200 bg-white p-5 lg:sticky lg:top-24">
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
              <FaFilter className="text-blue-600" />
              Filters
            </h2>

            {/* Sort by */}
            <label
              htmlFor="product-sort"
              className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700"
            >
              <FaSlidersH aria-hidden="true" className="text-slate-500" />
              Sort by
            </label>

            <select
              id="product-sort"
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
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
              value={selectedCategory === "all" ? "" : selectedSubcategory}
              onChange={(event) => selectSubcategory(event.target.value)}
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
              onClick={() => {
                selectCategory("all");
                setSortOrder("featured");
              }}
              className="mt-4 text-sm font-semibold text-blue-700 hover:text-blue-900"
            >
              Clear filters
            </button>
          </aside>

          {/* Products: a normal page. The whole page scrolls, and the
              pagination sits at the very end of the list. */}
          <section className="min-w-0">
            {/* Result count */}
            <div className="mb-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-sm text-slate-600">
                Showing{" "}
                <span className="font-semibold text-slate-900">
                  {filteredProducts.length === 0 ? 0 : startIndex + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-slate-900">
                  {Math.min(
                    startIndex + PRODUCTS_PER_PAGE,
                    filteredProducts.length
                  )}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-900">
                  {filteredProducts.length}
                </span>{" "}
                products
              </p>
            </div>

            {loading ? (
              <div className="flex min-h-[40vh] items-center justify-center rounded-2xl bg-white text-slate-500">
                Loading products...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex min-h-[40vh] items-center justify-center rounded-2xl bg-white px-4 text-center text-slate-500">
                No products found. Try another search or category.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {paginatedProducts.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            )}

            {/* Pagination: appears after the last product */}
            {!loading && filteredProducts.length > 0 && totalPages > 1 && (
              <nav
                aria-label="Product pages"
                className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row"
              >
                <p className="text-sm text-slate-600">
                  Page{" "}
                  <span className="font-semibold text-slate-900">
                    {currentPage}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-900">
                    {totalPages}
                  </span>
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  {getPageNumbers(currentPage, totalPages).map((page, index) =>
                    page === "..." ? (
                      <span
                        key={`gap-${index}`}
                        className="px-1 text-slate-400"
                        aria-hidden="true"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={page}
                        type="button"
                        onClick={() => goToPage(page)}
                        aria-current={currentPage === page ? "page" : undefined}
                        className={`min-w-10 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                          currentPage === page
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}

                  <button
                    type="button"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </nav>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

export default Products;