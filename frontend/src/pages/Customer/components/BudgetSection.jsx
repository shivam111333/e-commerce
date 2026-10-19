import { useNavigate } from "react-router-dom";

function BudgetSection({ budgetSections, loading, error }) {
  const navigate = useNavigate();

  return (
    <section className="space-y-5 pb-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Find a great deal</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Shop by budget</h2>
        <p className="mt-1 text-sm text-slate-500">Choose a price range and tap a product to see its details.</p>
      </div>

      {loading ? (
        <p className="py-8 text-center text-slate-500">Loading budget picks...</p>
      ) : error ? (
        <p role="alert" className="rounded-xl bg-red-50 p-5 text-center text-red-700">
          {error}
        </p>
      ) : budgetSections.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {budgetSections.map((section, index) => (
            <section
              key={section.title}
              aria-labelledby={`budget-${index}`}
              className={`rounded-2xl border p-3 shadow-sm ${
                index % 2 === 0
                  ? "border-sky-100 bg-gradient-to-br from-white via-sky-50 to-blue-100"
                  : "border-blue-100 bg-gradient-to-br from-white via-blue-50 to-indigo-50"
              }`}
            >
              <h3 id={`budget-${index}`} className="mb-3 text-base font-bold text-slate-950">
                {section.title}
              </h3>

              <div className="grid grid-cols-2 gap-2">
                {section.products.map((product) => {
                  const image = product.variants?.find(
                    (variant) => Number(variant.stock) > 0 && variant.images?.[0]
                  )?.images?.[0];
                  const price = product.lowestInStockPrice;

                  return (
                    <button
                      key={product._id}
                      type="button"
                      onClick={() => navigate(`/product/${product._id}`)}
                      aria-label={`View ${product.name}`}
                      className="group min-w-0 overflow-hidden rounded-xl bg-white p-2 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-700"
                    >
                      <span className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-slate-50">
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
                      </span>
                      <span className="mt-2 block truncate text-xs font-semibold text-slate-800">{product.name}</span>
                      <span className="mt-0.5 block text-xs font-bold text-slate-950">
                        From ₹{price.toLocaleString("en-IN")}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          No deals available in these budget tiers right now.
        </p>
      )}
    </section>
  );
}

export default BudgetSection;