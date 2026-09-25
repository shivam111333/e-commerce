import { useNavigate } from "react-router-dom";

function ProductCard({ product }) {
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col">

      {/* Product Image */}
      <div className="h-56 w-full bg-gray-100">
        {product.variants?.[0]?.images?.[0] ? (
          <img
            src={product.variants[0].images[0]}
            alt={product.name}
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            No Image
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="p-5 flex flex-col flex-1 min-h-[180px]">

        {/* Product Name */}
        <h2 className="mb-2 text-xl font-semibold text-gray-800 line-clamp-2 min-h-[56px]">
          {product.name}
        </h2>

        {/* Price */}
        <p className="mb-3 text-sm text-gray-500">
          ₹{product.variants?.[0]?.price || "N/A"}
        </p>

        {/* Button */}
        <button
          onClick={() => navigate(`/product/${product._id}`)}
          className="w-full mt-auto rounded-md bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700"
        >
          View Product
        </button>

      </div>
    </div>
  );
}

export default ProductCard;