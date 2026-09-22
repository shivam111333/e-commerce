import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaCheck } from "react-icons/fa";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import api from "../../api/axios.jsx";

function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();

  const { isAuthenticated } = useSelector((state) => state.auth);

  // ==========================================
  // BUY NOW DATA
  // ==========================================

  const isBuyNow = location.state?.buyNow === true;

  const buyNowVariant = location.state?.variant || null;
  const buyNowQuantity = location.state?.quantity || 1;

  // ==========================================
  // STATE
  // ==========================================

  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  const [shippingAddress, setShippingAddress] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  // ==========================================
  // FETCH CHECKOUT ITEMS
  // ==========================================

  useEffect(() => {
    const loadCheckoutItems = async () => {
      try {
        setLoading(true);

        if (!isAuthenticated) {
          toast.info("Please log in to continue.");
          navigate("/login");
          return;
        }

        // --------------------------------------
        // BUY NOW
        // --------------------------------------

        if (isBuyNow) {
          if (!buyNowVariant?._id) {
            toast.error("Invalid Buy Now item.");
            navigate("/");
            return;
          }

          if (buyNowVariant.stock <= 0) {
            toast.error("This product is out of stock.");
            navigate(-1);
            return;
          }

          if (buyNowQuantity > buyNowVariant.stock) {
            toast.error("Selected quantity is greater than available stock.");
            navigate(-1);
            return;
          }

          setItems([
            {
              variant: buyNowVariant,
              quantity: buyNowQuantity,
            },
          ]);

          return;
        }

        // --------------------------------------
        // NORMAL CART CHECKOUT
        // --------------------------------------

        const response = await api.get("/cart");

        const cartItems = response.data?.data?.items || [];

        if (cartItems.length === 0) {
          toast.info("Your cart is empty.");
          navigate("/cart");
          return;
        }

        setItems(cartItems);
      } catch (error) {
        console.error(error);

        toast.error(
          error.response?.data?.message ||
            "Unable to load checkout items."
        );
      } finally {
        setLoading(false);
      }
    };

    loadCheckoutItems();
  }, [
    isAuthenticated,
    isBuyNow,
    buyNowVariant,
    buyNowQuantity,
    navigate,
  ]);

  // ==========================================
  // ADDRESS CHANGE
  // ==========================================

  const handleAddressChange = (e) => {
    const { name, value } = e.target;

    setShippingAddress((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==========================================
  // TOTAL
  // ==========================================

  const totalAmount = items.reduce((total, item) => {
    const price = Number(item.variant?.price || 0);
    const quantity = Number(item.quantity || 0);

    return total + price * quantity;
  }, 0);

  // ==========================================
  // PLACE ORDER
  // ==========================================

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    // --------------------------------------
    // Validate address
    // --------------------------------------

    const {
      name,
      phone,
      address,
      city,
      state,
      pincode,
    } = shippingAddress;

    if (
      !name.trim() ||
      !phone.trim() ||
      !address.trim() ||
      !city.trim() ||
      !state.trim() ||
      !pincode.trim()
    ) {
      toast.error("Please fill all shipping address fields.");
      return;
    }

    if (phone.length < 10) {
      toast.error("Please enter a valid phone number.");
      return;
    }

    if (pincode.length !== 6) {
      toast.error("Please enter a valid 6-digit pincode.");
      return;
    }

    if (items.length === 0) {
      toast.error("No items available for checkout.");
      return;
    }

    // --------------------------------------
    // Check stock
    // --------------------------------------

    for (const item of items) {
      if (!item.variant) {
        toast.error("Invalid product variant.");
        return;
      }

      if (item.quantity > item.variant.stock) {
        toast.error(
          `${item.variant.attributes?.Color || "Product"} does not have enough stock.`
        );
        return;
      }
    }

    try {
      setPlacingOrder(true);

      // --------------------------------------
      // Send only IDs + quantity
      // Backend should calculate prices
      // --------------------------------------

      const orderItems = items.map((item) => ({
        variant: item.variant._id,
        quantity: item.quantity,
      }));

      const orderData = {
        items: orderItems,
        shippingAddress: {
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
        },
      };

      console.log("Creating order:", orderData);

      const response = await api.post("/order", orderData);

      if (!response.data?.success) {
        toast.error(
          response.data?.message || "Failed to place order."
        );
        return;
      }

      toast.success("Order placed successfully!");

      // --------------------------------------
      // Redirect
      // --------------------------------------

      navigate("/orders");
    } catch (error) {
      console.error(error);

      toast.error(
        error.response?.data?.message ||
          "Failed to place order."
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">
          Loading checkout...
        </p>
      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">

      <div className="max-w-6xl mx-auto">

        {/* Back */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6"
        >
          <FaArrowLeft />
          Back
        </button>

        {/* Heading */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Checkout
          </h1>

          <p className="text-gray-500 mt-1">
            {isBuyNow
              ? "Complete your purchase"
              : "Review your cart and complete your order"}
          </p>
        </div>

        <form onSubmit={handlePlaceOrder}>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* =================================
                LEFT
            ================================= */}

            <div className="lg:col-span-2 space-y-6">

              {/* SHIPPING ADDRESS */}

              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">

                <h2 className="text-xl font-semibold text-gray-900 mb-5">
                  Shipping Address
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>

                    <input
                      type="text"
                      name="name"
                      value={shippingAddress.name}
                      onChange={handleAddressChange}
                      placeholder="Enter your name"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>

                    <input
                      type="tel"
                      name="phone"
                      value={shippingAddress.phone}
                      onChange={handleAddressChange}
                      placeholder="Enter phone number"
                      maxLength="10"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Address */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>

                    <textarea
                      name="address"
                      value={shippingAddress.address}
                      onChange={handleAddressChange}
                      placeholder="House number, street, area..."
                      rows="3"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>

                    <input
                      type="text"
                      name="city"
                      value={shippingAddress.city}
                      onChange={handleAddressChange}
                      placeholder="Enter city"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* State */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State
                    </label>

                    <input
                      type="text"
                      name="state"
                      value={shippingAddress.state}
                      onChange={handleAddressChange}
                      placeholder="Enter state"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Pincode */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pincode
                    </label>

                    <input
                      type="text"
                      name="pincode"
                      value={shippingAddress.pincode}
                      onChange={handleAddressChange}
                      placeholder="6-digit pincode"
                      maxLength="6"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                </div>
              </div>

              {/* =================================
                  ORDER ITEMS
              ================================= */}

              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">

                <div className="flex items-center justify-between mb-5">

                  <h2 className="text-xl font-semibold text-gray-900">
                    Order Items
                  </h2>

                  {isBuyNow && (
                    <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full">
                      Buy Now
                    </span>
                  )}

                </div>

                <div className="space-y-4">

                  {items.map((item) => {

                    const variant = item.variant;

                    const attributes =
                      variant?.attributes || {};

                    const image =
                      variant?.images?.[0];

                    const itemTotal =
                      Number(variant?.price || 0) *
                      Number(item.quantity || 0);

                    return (
                      <div
                        key={variant?._id}
                        className="flex gap-4 border border-gray-200 rounded-lg p-4"
                      >

                        {/* Image */}
                        <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">

                          {image ? (
                            <img
                              src={image}
                              alt="Product"
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <span className="text-xs text-gray-400">
                              No Image
                            </span>
                          )}

                        </div>

                        {/* Details */}
                        <div className="flex-1">

                          <h3 className="font-semibold text-gray-900">
                            {variant?.product?.name ||
                              item.product?.name ||
                              "Product"}
                          </h3>

                          <div className="mt-1 flex flex-wrap gap-2">

                            {Object.entries(attributes).map(
                              ([key, value]) => (
                                <span
                                  key={key}
                                  className="text-sm text-gray-500"
                                >
                                  <span className="font-medium">
                                    {key}:
                                  </span>{" "}
                                  {value}
                                </span>
                              )
                            )}

                          </div>

                          <p className="text-sm text-gray-500 mt-2">
                            Quantity: {item.quantity}
                          </p>

                          <p className="font-semibold text-gray-900 mt-1">
                            ₹{variant?.price}
                          </p>

                        </div>

                        {/* Total */}
                        <div className="font-semibold text-gray-900">
                          ₹{itemTotal}
                        </div>

                      </div>
                    );
                  })}

                </div>
              </div>

            </div>

            {/* =================================
                RIGHT - SUMMARY
            ================================= */}

            <div>

              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm sticky top-24">

                <h2 className="text-xl font-semibold text-gray-900 mb-5">
                  Order Summary
                </h2>

                <div className="space-y-3">

                  <div className="flex justify-between text-gray-600">
                    <span>Items</span>
                    <span>{items.length}</span>
                  </div>

                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>₹{totalAmount}</span>
                  </div>

                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span className="text-green-600">
                      Free
                    </span>
                  </div>

                  <div className="border-t border-gray-200 pt-4 mt-4">

                    <div className="flex justify-between">

                      <span className="text-lg font-semibold">
                        Total
                      </span>

                      <span className="text-2xl font-bold text-gray-900">
                        ₹{totalAmount}
                      </span>

                    </div>

                  </div>

                </div>

                {/* Place Order */}

                <button
                  type="submit"
                  disabled={placingOrder || items.length === 0}
                  className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <FaCheck />

                  {placingOrder
                    ? "Placing Order..."
                    : "Place Order"}
                </button>

                <p className="text-xs text-gray-500 text-center mt-4">
                  Your order will be created after you confirm.
                </p>

              </div>

            </div>

          </div>

        </form>

      </div>

    </div>
  );
}

export default Checkout;