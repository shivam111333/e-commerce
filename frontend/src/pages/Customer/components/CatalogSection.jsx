import { useNavigate } from "react-router-dom";
import { FaArrowRight, FaChevronRight } from "react-icons/fa";

function CatalogSection({
  selectedCategory,
  categories,
  catalogSections,
  salesByProduct,
  loading,
  error,
  visibleProducts,
}) {
  const navigate = useNavigate();

  return (
    <section className="space-y-6 pb-8">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Shop by category</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">
            {selectedCategory === "all"
              ? "Explore our catalog"
              : categories.find((c) => c._id === selectedCategory)?.name || "Category picks"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">Discover hand-picked products from each collection.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/products")}
          className="hidden text-sm font-semibold text-blue-700 hover:text-blue-900 sm:block"
        >
          Explore all products <FaArrowRight className="ml-1 inline" size={11} />
        </button>
      </div>

      {loading && <p className="py-12 text-center text-slate-500">Loading products...</p>}

      {error && <p className="rounded-xl bg-red-50 p-5 text-center text-red-700">{error}</p>}

      {!loading && !error && visibleProducts.length === 0 && (
        <p className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          No products found.
        </p>
      )}

      {!loading && !error && visibleProducts.length > 0 && catalogSections.length === 0 && (
        <p className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          No category collections are available yet.{" "}
          <button
            type="button"
            onClick={() => navigate("/products")}
            className="font-semibold text-blue-700 hover:text-blue-900"
          >
            Browse all products
          </button>
        </p>
      )}

      {!loading && !error && catalogSections.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {catalogSections.map(({ category, subcategory, products }, index) => (
            <section
              key={subcategory._id}
              aria-labelledby={`catalog-${subcategory._id}`}
              className={`rounded-2xl border p-3 shadow-sm ${
                index % 2 === 0
                  ? "border-sky-100 bg-gradient-to-br from-white via-sky-50 to-blue-100"
                  : "border-blue-100 bg-gradient-to-br from-white via-blue-50 to-indigo-50"
              }`}
            >
              <div className="mb-2 flex min-h-11 items-start justify-between gap-2">
                <div className="min-w-0">
                  <p
                    id={`catalog-${subcategory._id}`}
                    className="line-clamp-2 text-base font-bold leading-5 text-slate-950"
                  >
                    Top picks in {subcategory.name}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] font-semibold text-blue-700">{category.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/products?category=${encodeURIComponent(category._id)}&subcategory=${encodeURIComponent(subcategory._id)}`
                    )
                  }
                  aria-label={`Explore ${subcategory.name} products`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-400 text-slate-950 transition hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-blue-700"
                >
                  <FaChevronRight aria-hidden="true" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {products.map((product, productIndex) => {
                  const image = product.variants?.[0]?.images?.[0];
                  const price = Number(product.variants?.[0]?.price ?? product.price);

                  return (
                    <button
                      key={product._id}
                      type="button"
                      onClick={() => navigate(`/product/${product._id}`)}
                      aria-label={`View ${product.name}`}
                      className="group min-w-0 overflow-hidden rounded-xl bg-white p-2 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-700"
                    >
                      <span className="relative flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-slate-50">
                        {image ? (
                          <img
                            src={image}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-contain p-1 transition duration-200 group-hover:scale-105"
                          />
                        ) : (
                          <span className="px-2 text-center text-xs text-slate-400">Image coming soon</span>
                        )}
                        {productIndex === 0 && salesByProduct[product._id] > 0 && (
                          <span className="absolute left-1 top-1 rounded-full bg-blue-700 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                            Best seller
                          </span>
                        )}
                      </span>
                      <span className="mt-2 block truncate text-xs font-semibold text-slate-800">
                        {product.name}
                      </span>
                      <span className="mt-0.5 block text-xs font-bold text-slate-950">
                        {Number.isFinite(price) ? `₹${price.toLocaleString("en-IN")}` : "Price unavailable"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}

export default CatalogSection;