import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaTrash, FaMinus, FaPlus, FaShoppingBag } from "react-icons/fa";
import api from "../../api/axios.jsx";
import { useDispatch } from "react-redux";
import { setCart as setReduxCart } from "../../redux/slices/cartSlice.js";
import {
  MAX_ORDER_AMOUNT,
  MAX_QTY_PER_ITEM as MAX_QTY,
} from "../../config/limits.js";

function Cart() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  // =========================
  // FETCH CART
  // showLoader = true only for the first load and Retry,
  // so quantity changes don't blank the whole page
  // =========================
  const fetchCart = useCallback(
    async (showLoader = false) => {
      try {
        if (showLoader) setLoading(true);
        setError("");

        const response = await api.get("/cart");

        // Ignore lines whose variant no longer exists
        const cartData = response.data?.data || { items: [] };
        const validItems = (cartData.items || []).filter((item) => item.variant);

        setCart({ ...cartData, items: validItems });

        // Update Redux so the Navbar counter updates
        dispatch(setReduxCart(validItems));
      } catch (err) {
        console.error("Fetch cart error:", err);
        setError(err.response?.data?.message || "Unable to load cart.");
      } finally {
        if (showLoader) setLoading(false);
      }
    },
    [dispatch]
  );

  useEffect(() => {
    fetchCart(true);
  }, [fetchCart]);

  // =========================
  // UPDATE QUANTITY
  // =========================
  const handleQuantityChange = async (variantId, newQuantity, stock) => {
    if (newQuantity < 1) return;

    if (newQuantity > MAX_QTY) {
      toast.error(`You can buy at most ${MAX_QTY} of one item.`);
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

      await fetchCart();
    } catch (err) {
      console.error("Update cart error:", err);
      toast.error(err.response?.data?.message || "Failed to update quantity.");
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
      await fetchCart();

      toast.success("Item removed from cart.");
    } catch (err) {
      console.error("Remove cart item error:", err);
      toast.error(err.response?.data?.message || "Failed to remove item.");
    } finally {
      setUpdatingId(null);
    }
  };

  // =========================
  // DERIVED VALUES
  // (display only: the server recalculates prices at checkout)
  // =========================
  const items = cart?.items || [];

  const totalAmount = items.reduce((sum, item) => {
    const price = Number(item.variant?.price) || 0;
    const quantity = Number(item.quantity) || 0;
    return sum + price * quantity;
  }, 0);

  const totalUnits = items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0
  );

  const hasOutOfStockItem = items.some(
    (item) => item.quantity > (item.variant?.stock ?? 0)
  );
  const exceedsLimit = totalAmount > MAX_ORDER_AMOUNT;

  // =========================
  // CHECKOUT
  // =========================
  const handleCheckout = () => {
    if (exceedsLimit) {
      toast.error(
        `Cart total cannot exceed ₹${MAX_ORDER_AMOUNT.toLocaleString("en-IN")}.`
      );
      return;
    }
    if (hasOutOfStockItem) {
      toast.error("Please fix out-of-stock items before checkout.");
      return;
    }
    navigate("/checkout");
  };

  // =========================
  // LOADING / ERROR / EMPTY
  // =========================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Loading cart...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <p className="text-red-500 text-lg mb-4">{error}</p>

        <button
          onClick={() => fetchCart(true)}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

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
    <div className="min-h-screen bg-slate-50 px-4 py-7 sm:py-9">
      <div className="mx-auto max-w-6xl">
        <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Almost yours</p>
        <h1 className="mb-6 text-3xl font-bold tracking-tight text-slate-900">
          Your cart <span className="text-lg font-medium text-slate-500">({items.length} {items.length === 1 ? "item" : "items"})</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CART ITEMS */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const variant = item.variant;

              const price = Number(variant.price) || 0;
              const stock = Number(variant.stock) || 0;
              const quantity = Number(item.quantity) || 0;

              const outOfRange = quantity > stock;
              const isUpdating = updatingId === variant._id;

              // Largest quantity the user may choose
              const maxAllowed = Math.min(stock, MAX_QTY);

              // If the cart holds more than the stock, minus jumps straight to the stock
              const minusTarget = outOfRange ? stock : quantity - 1;
              const minusDisabled =
                isUpdating || (outOfRange ? stock < 1 : quantity <= 1);

              return (
                <div
                  key={item._id}
                  className={`flex gap-4 rounded-2xl border bg-white p-4 shadow-sm ${
                    outOfRange ? "border-red-300" : "border-slate-200"
                  }`}
                >
                  {/* IMAGE */}
                  <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50">
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

                  {/* DETAILS */}
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/product/${variant.product?._id || variant.product}`}
                      className="block truncate font-semibold text-slate-900 hover:text-blue-700"
                    >
                      {variant.product?.name || "Product"}
                    </Link>

                    {variant.attributes &&
                      Object.keys(variant.attributes).length > 0 && (
                        <p className="text-sm text-gray-500 mt-1">
                          {Object.entries(variant.attributes)
                            .map(([key, value]) => `${key}: ${value}`)
                            .join(" | ")}
                        </p>
                      )}

                    <p className="font-semibold text-gray-900 mt-2">
                      ₹{price.toLocaleString("en-IN")}
                    </p>

                    {outOfRange && (
                      <p className="text-red-500 text-xs mt-1">
                        {stock > 0
                          ? `Only ${stock} left in stock — reduce quantity.`
                          : "Out of stock — please remove this item."}
                      </p>
                    )}

                    {/* QUANTITY CONTROLS */}
                    <div className="flex items-center mt-3">
                      <button
                        onClick={() =>
                          handleQuantityChange(variant._id, minusTarget, stock)
                        }
                        disabled={minusDisabled}
                        className="w-8 h-8 border border-gray-300 rounded-l-lg hover:bg-gray-100 disabled:opacity-40 flex items-center justify-center"
                      >
                        <FaMinus size={10} />
                      </button>

                      <div className="w-10 h-8 border-t border-b border-gray-300 flex items-center justify-center text-sm font-medium">
                        {quantity}
                      </div>

                      <button
                        onClick={() =>
                          handleQuantityChange(variant._id, quantity + 1, stock)
                        }
                        disabled={quantity >= maxAllowed || isUpdating}
                        className="w-8 h-8 border border-gray-300 rounded-r-lg hover:bg-gray-100 disabled:opacity-40 flex items-center justify-center"
                      >
                        <FaPlus size={10} />
                      </button>

                      <button
                        onClick={() => handleRemove(variant._id)}
                        disabled={isUpdating}
                        className="ml-4 text-red-500 hover:text-red-700 text-sm flex items-center gap-1 disabled:opacity-40"
                      >
                        <FaTrash size={12} />
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* LINE TOTAL */}
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      ₹{(price * quantity).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ORDER SUMMARY */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-semibold text-slate-900">
                Order Summary
              </h2>

              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>
                  Subtotal ({totalUnits} {totalUnits === 1 ? "item" : "items"})
                </span>
                <span>₹{totalAmount.toLocaleString("en-IN")}</span>
              </div>

              <div className="my-3 border-t border-slate-200" />

              <div className="flex justify-between font-semibold text-gray-900 mb-6">
                <span>Total</span>
                <span>₹{totalAmount.toLocaleString("en-IN")}</span>
              </div>

              {exceedsLimit && (
                <p className="text-red-500 text-xs mb-3">
                  Cart total cannot exceed ₹
                  {MAX_ORDER_AMOUNT.toLocaleString("en-IN")}. Please remove or
                  reduce some items.
                </p>
              )}

              <button
                onClick={handleCheckout}
                disabled={hasOutOfStockItem || exceedsLimit}
                className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Proceed to Checkout
              </button>

              <button
                onClick={() => navigate("/")}
                className="mt-3 w-full text-sm font-semibold text-blue-700 hover:underline"
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