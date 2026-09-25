import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaTrash,
  FaMinus,
  FaPlus,
  FaShoppingBag,
} from "react-icons/fa";
import api from "../../api/axios.jsx";
import { useDispatch } from "react-redux";
import { setCart as setReduxCart } from "../../redux/slices/cartSlice.js";

function Cart() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  // =========================
  // FETCH CART
  // =========================

 const fetchCart = async () => {
  try {
    setLoading(true);
    setError("");

    const response = await api.get("/cart");

    const cartData = response.data?.data || {
      items: [],
    };

    setCart(cartData);

    // Update Redux so Navbar counter updates
    dispatch(setReduxCart(cartData.items));
  } catch (err) {
    console.error("Fetch cart error:", err);

    setError(
      err.response?.data?.message ||
        "Unable to load cart."
    );
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
     const fetchCart = async () => {
  try {
    setLoading(true);
    setError("");

    const response = await api.get("/cart");

    const cartData = response.data?.data || {
      items: [],
    };

    setCart(cartData);

    // Update Redux so Navbar counter updates
    dispatch(setReduxCart(cartData.items));
  } catch (err) {
    console.error("Fetch cart error:", err);

    setError(
      err.response?.data?.message ||
        "Unable to load cart."
    );
  } finally {
    setLoading(false);
  }
};

    fetchCart();
  }, []);

  // =========================
  // UPDATE QUANTITY
  // =========================

 const handleQuantityChange = async (
  variantId,
  newQuantity,
  stock
) => {
  if (newQuantity < 1) {
    return;
  }

  if (newQuantity > stock) {
    toast.error("Not enough stock available.");
    return;
  }

  try {
    setUpdatingId(variantId);

    await api.put("/cart", {
      variant: variantId,
      quantity: newQuantity,
    });

    // Get populated cart and update Redux
    await fetchCart();
  } catch (err) {
    console.error("Update cart error:", err);

    toast.error(
      err.response?.data?.message ||
        "Failed to update quantity."
    );
  } finally {
    setUpdatingId(null);
  }
};
  // =========================
  // REMOVE ITEM
  // =========================

  const handleRemove = async (variantId) => {
  try {
    setUpdatingId(variantId);

    await api.delete(`/cart/${variantId}`);

    // Refresh local cart + Redux cart
    await fetchCart();

    toast.success("Item removed from cart.");
  } catch (err) {
    console.error("Remove cart item error:", err);

    toast.error(
      err.response?.data?.message ||
        "Failed to remove item."
    );
  } finally {
    setUpdatingId(null);
  }
};

  // =========================
  // CART ITEMS
  // =========================

  const items = cart?.items || [];

  // =========================
  // TOTAL AMOUNT
  // =========================

  const totalAmount = items.reduce((sum, item) => {
    const price = Number(item.variant?.price) || 0;
    const quantity = Number(item.quantity) || 0;

    return sum + price * quantity;
  }, 0);

  // =========================
  // STOCK CHECK
  // =========================

  const hasOutOfStockItem = items.some((item) => {
    if (!item.variant) {
      return true;
    }

    return item.quantity > (item.variant.stock ?? 0);
  });

  // =========================
  // CHECKOUT
  // =========================

  const handleCheckout = () => {
    if (hasOutOfStockItem) {
      toast.error("Please fix out-of-stock items before checkout.");
      return;
    }

    navigate("/checkout");
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Loading cart...</p>
      </div>
    );
  }

  // =========================
  // ERROR
  // =========================

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <p className="text-red-500 text-lg mb-4">{error}</p>

        <button
          onClick={fetchCart}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  // =========================
  // EMPTY CART
  // =========================

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <FaShoppingBag className="text-gray-300 text-6xl mb-4" />

        <p className="text-gray-500 text-lg mb-4">Your cart is empty.</p>

        <button
          onClick={() => navigate("/")}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  // =========================
  // CART CONTENT
  // =========================

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* CART TITLE */}

        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Shopping Cart ({items.length})
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* =========================
              CART ITEMS
          ========================= */}

          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const variant = item.variant;

              // Variant was deleted/unavailable
              const isUnavailable = !variant;

              // =========================
              // UNAVAILABLE ITEM
              // =========================

              if (isUnavailable) {
                return (
                  <div
                    key={item._id}
                    className="bg-white rounded-xl border border-red-200 p-4 flex items-center justify-between"
                  >
                    <p className="text-red-500 text-sm">
                      This item is no longer available.
                    </p>

                    <button
                      onClick={() => handleRemove(item.variant)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FaTrash />
                    </button>
                  </div>
                );
              }

              // =========================
              // VARIANT DATA
              // =========================

              const price = Number(variant.price) || 0;

              const stock = Number(variant.stock) || 0;

              const quantity = Number(item.quantity) || 0;

              const outOfRange = quantity > stock;

              const isUpdating = updatingId === variant._id;

              // =========================
              // NORMAL CART ITEM
              // =========================

              return (
                <div
                  key={item._id}
                  className={`bg-white rounded-xl border p-4 flex gap-4 ${
                    outOfRange ? "border-red-300" : "border-gray-200"
                  }`}
                >
                  {/* =========================
                      IMAGE
                  ========================= */}

                  <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {variant.images?.[0] ? (
                      <img
                        src={variant.images[0]}
                        alt={variant.product?.name || "Product"}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-gray-400 text-xs">No image</span>
                    )}
                  </div>

                  {/* =========================
                      PRODUCT DETAILS
                  ========================= */}

                  <div className="flex-1 min-w-0">
                    {/* PRODUCT NAME */}

                    <Link
                      to={`/product/${variant.product?._id || variant.product}`}
                      className="font-medium text-gray-900 hover:text-blue-600 truncate block"
                    >
                      {variant.product?.name || "Product"}
                    </Link>

                    {/* ATTRIBUTES */}

                    {variant.attributes &&
                      Object.keys(variant.attributes).length > 0 && (
                        <p className="text-sm text-gray-500 mt-1">
                          {Object.entries(variant.attributes)
                            .map(([key, value]) => `${key}: ${value}`)
                            .join(" | ")}
                        </p>
                      )}

                    {/* PRICE */}

                    <p className="font-semibold text-gray-900 mt-2">
                      ₹{price.toLocaleString()}
                    </p>

                    {/* OUT OF STOCK WARNING */}

                    {outOfRange && (
                      <p className="text-red-500 text-xs mt-1">
                        Only {stock} left in stock — please reduce quantity.
                      </p>
                    )}

                    {/* =========================
                        QUANTITY CONTROLS
                    ========================= */}

                    <div className="flex items-center mt-3">
                      {/* MINUS */}

                      <button
                        onClick={() =>
                          handleQuantityChange(variant._id, quantity - 1, stock)
                        }
                        disabled={quantity <= 1 || isUpdating}
                        className="w-8 h-8 border border-gray-300 rounded-l-lg hover:bg-gray-100 disabled:opacity-40 flex items-center justify-center"
                      >
                        <FaMinus size={10} />
                      </button>

                      {/* QUANTITY */}

                      <div className="w-10 h-8 border-t border-b border-gray-300 flex items-center justify-center text-sm font-medium">
                        {quantity}
                      </div>

                      {/* PLUS */}

                      <button
                        onClick={() =>
                          handleQuantityChange(variant._id, quantity + 1, stock)
                        }
                        disabled={quantity >= stock || isUpdating}
                        className="w-8 h-8 border border-gray-300 rounded-r-lg hover:bg-gray-100 disabled:opacity-40 flex items-center justify-center"
                      >
                        <FaPlus size={10} />
                      </button>

                      {/* REMOVE */}

                      <button
                        onClick={() => handleRemove(variant._id)}
                        disabled={isUpdating}
                        className="ml-4 text-red-500 hover:text-red-700 text-sm flex items-center gap-1"
                      >
                        <FaTrash size={12} />
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* =========================
                      LINE TOTAL
                  ========================= */}

                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      ₹{(price * quantity).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* =========================
              ORDER SUMMARY
          ========================= */}

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
              <h2 className="font-semibold text-gray-900 mb-4">
                Order Summary
              </h2>

              {/* SUBTOTAL */}

              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Subtotal ({items.length} items)</span>

                <span>₹{totalAmount.toLocaleString()}</span>
              </div>

              {/* DIVIDER */}

              <div className="border-t border-gray-200 my-3" />

              {/* TOTAL */}

              <div className="flex justify-between font-semibold text-gray-900 mb-6">
                <span>Total</span>

                <span>₹{totalAmount.toLocaleString()}</span>
              </div>

              {/* CHECKOUT */}

              <button
                onClick={handleCheckout}
                disabled={hasOutOfStockItem}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Proceed to Checkout
              </button>

              {/* CONTINUE SHOPPING */}

              <button
                onClick={() => navigate("/")}
                className="w-full mt-3 text-blue-600 text-sm hover:underline"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cart;