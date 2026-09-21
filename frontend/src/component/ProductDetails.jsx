import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaShoppingCart, FaArrowLeft } from "react-icons/fa";
import { toast } from "react-toastify";
import { useSelector, useDispatch } from "react-redux";
import { setCart as setReduxCart } from "../redux/slices/cartSlice.js";
import api from "../api/axios.jsx";

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
     
        const data = response.data;
        console.log(data)



setProduct(data);

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

  useEffect(() => {
    const fetchCart = async () => {
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
        setCartItems([]); // fail silently — don't block the page over this
          toast.error(error);
      }
    };

    fetchCart();
  }, [isAuthenticated]);

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
  // =========================

  const increaseQuantity = () => {
    const stock = selectedVariant?.stock ?? product?.stock ?? 0;

    if (quantity < stock) {
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

  // Is the currently selected variant already in the cart?
  const isInCart = selectedVariant
    ? cartItems.some((item) => {
        const itemVariantId =
          typeof item.variant === "string" ? item.variant : item.variant?._id;
        return itemVariantId === selectedVariant._id;
      })
    : false;

   

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}

        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6"
        >
          <FaArrowLeft />
          Back
        </button>

        {/* Product Container */}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* =========================
                LEFT - IMAGES
            ========================= */}

            <div>
              {/* Main Image */}

              <div className="w-full h-[450px] bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
                {selectedImage ? (
                  <img
                    src={selectedImage}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <p className="text-gray-400">No image available</p>
                )}
              </div>
            </div>

            {/* =========================
                RIGHT - PRODUCT INFO
            ========================= */}

            <div>
             

              {/* Product Name */}

              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                {product.name}
              </h1>
              {product.category?.name && (
  <p className="text-sm text-blue-600 font-medium mb-2">
    Category: {product.category.name}
  </p>
)}
        

{product.subcategory?.name && (
  <p className="text-sm text-gray-500 font-medium mb-2">
    Subcategory: {product.subcategory.name}
  </p>
)}

              {/* Description */}

              <p className="text-gray-600 mt-4 leading-7">
                {product.description}
              </p>

              {/* Price */}

              <div className="mt-6">
                <span className="text-3xl font-bold text-gray-900">
                  ₹{currentPrice}
                </span>
              </div>

              {/* Stock */}

              <div className="mt-3">
                {currentStock > 0 ? (
                  <span className="text-green-600 font-medium">
                    In Stock ({currentStock} available)
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
                  <h3 className="font-semibold text-gray-800 mb-3">
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
                              ? "border-blue-600 bg-blue-50"
                              : "border-gray-300 hover:border-blue-400"
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
                              ₹{variant.price}
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
                      disabled={quantity >= currentStock}
                      className="w-10 h-10 border border-gray-300 rounded-r-lg hover:bg-gray-100 disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* =========================
                  ADD TO CART
              ========================= */}

              <button
                onClick={isInCart ? handleGoToCart : handleAddToCart}
                disabled={currentStock <= 0 || addingToCart}
                className="mt-7 w-full bg-blue-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-3 hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
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

              {/* Vendor */}

              {product.vendor?.name && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-500">Sold by</p>

                  <p className="font-semibold text-gray-800">
                    {product.vendor.name}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;
