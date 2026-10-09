import { useEffect, useState,useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaShoppingCart, FaArrowLeft } from "react-icons/fa";
import { toast } from "react-toastify";
import { useSelector, useDispatch } from "react-redux";
import { setCart as setReduxCart } from "../redux/slices/cartSlice.js";
import api from "../api/axios.jsx";
import {
  MAX_ORDER_AMOUNT,
  MAX_QTY_PER_ITEM as MAX_QTY,
} from "../config/limits.js";
// Show "only N left" in orange at or below this stock level
const LOW_STOCK = 5;

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);

  const [selectedImage, setSelectedImage] = useState("");
  const [quantity, setQuantity] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { isAuthenticated } = useSelector((state) => state.auth);

  const [cartItems, setCartItems] = useState([]);
  const [addingToCart, setAddingToCart] = useState(false);

  // =========================
  // FETCH PRODUCT
  // =========================

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(`/product/${id}`);

        const data = response.data.data;

        if (!data?._id) {
          setError("Product not found.");
          return;
        }

        setProduct(data);

        // Select first variant by default
        if (data.variants?.length > 0) {
          const firstVariant = data.variants[0];

          setSelectedVariant(firstVariant);

          if (firstVariant.images?.length > 0) {
            setSelectedImage(firstVariant.images[0]);
          }
        }
      } catch (error) {
        console.error(error);

        setError(error.response?.data?.message || "Unable to load product.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // =========================
  // FETCH CART (to determine Add to Cart vs Go to Cart)
  // =========================
  // =========================
  // FETCH CART (populated, so prices are available)
  // =========================

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCartItems([]);
      return;
    }

    try {
      const response = await api.get("/cart");

      const items = response.data?.data?.items || [];

      setCartItems(items);
      dispatch(setReduxCart(items));
    } catch (error) {
      // Fail silently: don't block the page over the cart
      console.error("Fetch cart error:", error);
      setCartItems([]);
    }
  }, [isAuthenticated, dispatch]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Current cart total, from database prices returned by GET /cart
  const cartTotal = cartItems.reduce(
    (sum, item) =>
      sum + Number(item.variant?.price || 0) * Number(item.quantity || 0),
    0
  );
  const cartRoomLeft = Math.max(0, MAX_ORDER_AMOUNT - cartTotal);

  // =========================
  // VARIANT SELECTION
  // =========================

  const handleVariantChange = (variant) => {
    setSelectedVariant(variant);
    setQuantity(1);

    if (variant.images?.length > 0) {
      setSelectedImage(variant.images[0]);
    } else if (product?.images?.length > 0) {
      setSelectedImage(product.images[0]);
    }
  };

  // =========================
  // QUANTITY
  // Limited by BOTH the stock left and the per-item maximum
  // =========================

  const increaseQuantity = () => {
    const stock = selectedVariant?.stock ?? product?.stock ?? 0;
    const maxAllowed = Math.min(stock, MAX_QTY);

    if (quantity < maxAllowed) {
      setQuantity((prev) => prev + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  // =========================
  // ADD TO CART
  // =========================

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.info("Please log in to add items to your cart.");
      navigate("/login");
      return;
    }

    if (!selectedVariant) {
      toast.error("Please select a variant.");
      return;
    }

    if (selectedVariant.stock <= 0) {
      toast.error("This variant is out of stock.");
      return;
    }

    if (quantity > selectedVariant.stock) {
      toast.error(`Only ${selectedVariant.stock} left in stock.`);
      return;
    }
        if (cartTotal + Number(selectedVariant.price) * quantity > MAX_ORDER_AMOUNT) {
      toast.error(
        `Your cart total cannot exceed ₹${MAX_ORDER_AMOUNT.toLocaleString("en-IN")}. You can add up to ₹${cartRoomLeft.toLocaleString("en-IN")} more.`
      );
      return;
    }

    if (quantity > MAX_QTY) {
      toast.error(`You can buy at most ${MAX_QTY} of one item.`);
      return;
    }

    try {
      setAddingToCart(true);

      const response = await api.post("/cart", {
        variant: selectedVariant._id,
        quantity,
      });

      const items = response.data?.data?.items || [];

      setCartItems(items);
      dispatch(setReduxCart(items));

      toast.success("Product added to cart.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add to cart.");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleGoToCart = () => {
    navigate("/cart");
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Loading product...</p>
      </div>
    );
  }

  // =========================
  // ERROR
  // =========================

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <p className="text-red-500 text-lg mb-4">
          {error || "Product not found."}
        </p>

        <button
          onClick={() => navigate("/")}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
        >
          Back to Products
        </button>
      </div>
    );
  }

  const variants = product.variants || [];

  const currentPrice = selectedVariant?.price ?? product.price;

  const currentStock = selectedVariant?.stock ?? product.stock ?? 0;

  // The most the user can pick right now
  const maxAllowed = Math.min(currentStock, MAX_QTY);

  // Is the currently selected variant already in the cart?
  const isInCart = selectedVariant
    ? cartItems.some((item) => {
        const itemVariantId =
          typeof item.variant === "string" ? item.variant : item.variant?._id;
        return itemVariantId === selectedVariant._id;
      })
    : false;

  // =========================
  // BUY NOW
  // =========================

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.info("Please log in to continue.");
      navigate("/login");
      return;
    }

    if (!selectedVariant) {
      toast.error("Please select a variant.");
      return;
    }

    if (selectedVariant.stock <= 0) {
      toast.error("This variant is out of stock.");
      return;
    }

    if (quantity > selectedVariant.stock) {
      toast.error(`Only ${selectedVariant.stock} left in stock.`);
      return;
    }

    if (quantity > MAX_QTY) {
      toast.error(`You can buy at most ${MAX_QTY} of one item.`);
      return;
    }

    if (Number(selectedVariant.price) * quantity > MAX_ORDER_AMOUNT) {
      toast.error(
        `Order total cannot exceed ₹${MAX_ORDER_AMOUNT.toLocaleString("en-IN")}.`
      );
      return;
    }

    navigate("/checkout", {
      state: {
        buyNow: true,
        variant: selectedVariant,
        quantity,
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        {/* Back Button */}

        <button
          onClick={() => navigate(-1)}
          className="mb-5 flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-blue-700"
        >
          <FaArrowLeft />
          Back
        </button>

        {/* Product Container */}

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
            {/* =========================
                LEFT - IMAGES
            ========================= */}

            <div>
              <div className="flex h-[340px] w-full items-center justify-center overflow-hidden rounded-2xl bg-slate-50 sm:h-[470px]">
                {selectedImage ? (
                  <img
                    src={selectedImage}
                    alt={product.name}
                    className="h-full w-full object-contain p-5"
                  />
                ) : (
                  <p className="text-gray-400">No image available</p>
                )}
              </div>
              {(selectedVariant?.images || []).length > 1 && (
                <div className="mt-3 flex gap-3 overflow-x-auto">
                  {selectedVariant.images.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() => setSelectedImage(image)}
                      aria-label={`View product image ${index + 1}`}
                      className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border bg-white p-1 ${selectedImage === image ? "border-blue-600 ring-2 ring-blue-100" : "border-slate-200"}`}
                    >
                      <img src={image} alt="" className="h-full w-full object-contain" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* =========================
                RIGHT - PRODUCT INFO
            ========================= */}

            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                {product.name}
              </h1>

              {product.category?.name && (
                <p className="mb-2 text-sm font-semibold text-blue-700">
                  {product.category.name}
                </p>
              )}

              {product.subcategory?.name && (
                <p className="mb-2 text-sm font-medium text-slate-500">
                  {product.subcategory.name}
                </p>
              )}

              <p className="mt-4 leading-7 text-slate-600">
                {product.description}
              </p>

              {/* Price */}

              <div className="mt-6">
                <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                  ₹{Number(currentPrice).toLocaleString("en-IN")}
                </span>
              </div>

              {/* Stock */}

              <div className="mt-3">
                {currentStock > 0 ? (
                  <span
                    className={`font-medium ${
                      currentStock <= LOW_STOCK
                        ? "text-orange-600"
                        : "text-green-600"
                    }`}
                  >
                    {currentStock <= LOW_STOCK
                      ? `Only ${currentStock} left in stock`
                      : `In Stock (${currentStock} available)`}
                  </span>
                ) : (
                  <span className="text-red-600 font-medium">Out of Stock</span>
                )}
              </div>

              {/* =========================
                  VARIANTS
              ========================= */}

              {variants.length > 0 && (
                <div className="mt-7">
                  <h3 className="mb-3 font-semibold text-slate-900">
                    Select Variant
                  </h3>

                  <div className="space-y-3">
                    {variants.map((variant) => {
                      const isSelected = selectedVariant?._id === variant._id;

                      return (
                        <button
                          key={variant._id}
                          onClick={() => handleVariantChange(variant)}
                          className={`w-full text-left border rounded-lg p-4 transition ${
                            isSelected
                              ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100"
                              : "border-slate-200 hover:border-blue-400"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              {variant.attributes &&
                                Object.entries(variant.attributes).map(
                                  ([key, value]) => (
                                    <span
                                      key={key}
                                      className="mr-4 text-sm text-gray-700"
                                    >
                                      <span className="font-medium">
                                        {key}:
                                      </span>{" "}
                                      {value}
                                    </span>
                                  ),
                                )}
                            </div>

                            <span className="font-semibold">
                              ₹{Number(variant.price).toLocaleString("en-IN")}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* =========================
                  QUANTITY
              ========================= */}

              {currentStock > 0 && (
                <div className="mt-7">
                  <h3 className="font-semibold text-gray-800 mb-3">Quantity</h3>

                  <div className="flex items-center">
                    <button
                      onClick={decreaseQuantity}
                      disabled={quantity <= 1}
                      className="w-10 h-10 border border-gray-300 rounded-l-lg hover:bg-gray-100 disabled:opacity-40"
                    >
                      -
                    </button>

                    <div className="w-12 h-10 border-t border-b border-gray-300 flex items-center justify-center font-medium">
                      {quantity}
                    </div>

                    <button
                      onClick={increaseQuantity}
                      disabled={quantity >= maxAllowed}
                      className="w-10 h-10 border border-gray-300 rounded-r-lg hover:bg-gray-100 disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>

                  {/* Why the + button stopped */}
                  {quantity >= maxAllowed && (
                    <p className="text-xs text-gray-500 mt-2">
                      {currentStock <= MAX_QTY
                        ? `Maximum available: ${currentStock}`
                        : `Maximum ${MAX_QTY} per order`}
                    </p>
                  )}
                </div>
              )}

              {/* =========================
                  ADD TO CART / BUY NOW
              ========================= */}

              <div className="mt-7 flex w-full flex-col gap-3 sm:flex-row">
                <button
                  onClick={isInCart ? handleGoToCart : handleAddToCart}
                  disabled={currentStock <= 0 || addingToCart}
                  className="flex-1 rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <FaShoppingCart />
                  {currentStock > 0
                    ? isInCart
                      ? "Go to Cart"
                      : addingToCart
                      ? "Adding..."
                      : "Add to Cart"
                    : "Out of Stock"}
                </button>

                <button
                  onClick={handleCheckout}
                  disabled={currentStock <= 0}
                  className="flex-1 rounded-xl bg-amber-400 py-3 font-bold text-slate-900 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;