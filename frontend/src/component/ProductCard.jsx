import { useNavigate } from "react-router-dom";

function ProductCard({ product }) {
  const navigate = useNavigate();
  const variant = product.variants?.[0];
  const price = Number(variant?.price ?? product.price);
  const image = variant?.images?.[0];

  return (
    <article className="group flex w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg">
      <button
        type="button"
        onClick={() => navigate(`/product/${product._id}`)}
        aria-label={`View ${product.name}`}
        className="relative flex h-52 w-full items-center justify-center bg-slate-50 p-5 sm:h-56"
      >
        {image ? (
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Image coming soon
          </div>
        )}
      </button>
      <div className="flex min-h-[155px] flex-1 flex-col p-4">
        {product.category?.name && <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-blue-700">{product.category.name}</p>}
        <h2 className="line-clamp-2 min-h-12 font-semibold leading-6 text-slate-900">{product.name}</h2>
        <p className="mt-2 mb-4 text-lg font-bold text-slate-900">
          {Number.isFinite(price) ? `₹${price.toLocaleString("en-IN")}` : "Price unavailable"}
        </p>
        <button
          type="button"
          onClick={() => navigate(`/product/${product._id}`)}
          className="mt-auto w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
        >
          View details
        </button>
      </div>
    </article>
  );
}

export default ProductCard;