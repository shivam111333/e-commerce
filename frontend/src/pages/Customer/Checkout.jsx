import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaCheck } from "react-icons/fa";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import api from "../../api/axios.jsx";
import { clearCart } from "../../redux/slices/cartSlice";
import { useDispatch } from "react-redux";
import { MAX_ORDER_AMOUNT } from "../../config/limits.js";
import { Form, Formik } from "formik";
import FormField from "../../component/FormField.jsx";
import { checkoutAddressSchema } from "../../validation/checkoutSchemas.js";


function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

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

  // ADD: Payment method state
  const [paymentMethod, setPaymentMethod] = useState("cod");

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
          error.response?.data?.message || "Unable to load checkout items.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadCheckoutItems();
  }, [isAuthenticated, isBuyNow, buyNowVariant, buyNowQuantity, navigate]);

  // ==========================================
  // TOTAL
  // ==========================================

  const totalAmount = items.reduce((total, item) => {
    const price = Number(item.variant?.price || 0);
    const quantity = Number(item.quantity || 0);

    return total + price * quantity;
  }, 0);
  const exceedsLimit = totalAmount > MAX_ORDER_AMOUNT;

  // ==========================================
  // PLACE ORDER
  // ==========================================


  const handlePayment = async (values) => {
    if (exceedsLimit) {
      toast.error(
        `Order total cannot exceed ₹${MAX_ORDER_AMOUNT.toLocaleString("en-IN")}.`
      );
      return;
    }

    let razorpayOpened = false;

    try {
      setPlacingOrder(true);

      // -----------------------------------------
      // 1. Basic validation
      // -----------------------------------------

      const castValues = checkoutAddressSchema.cast(values);
      const shippingAddress = Object.fromEntries(
        Object.entries(castValues.shippingAddress).map(([key, value]) => [
          key,
          value.trim(),
        ])
      );

      if (!items.length) {
        toast.error("No items available for checkout.");
        return;
      }

      // -----------------------------------------
      // 2. Validate items
      // -----------------------------------------

      for (const item of items) {
        if (!item.variant?._id) {
          toast.error("Invalid product variant.");
          return;
        }

        if (!item.quantity || item.quantity < 1) {
          toast.error("Invalid quantity.");
          return;
        }

        // This is only frontend validation.
        // Backend MUST check stock again.
        if (item.quantity > item.variant.stock) {
          toast.error(
            `${item.variant.attributes?.Color || "Product"} does not have enough stock.`
          );
          return;
        }
      }

      // -----------------------------------------
      // 3. Prepare order items
      // -----------------------------------------

      const orderItems = items.map((item) => ({
        variant: item.variant._id,
        quantity: item.quantity,
      }));

      const orderData = {
        items: orderItems,

        shippingAddress: {
          ...shippingAddress,
        },

        paymentMethod,
        isBuyNow,
      };

      // -----------------------------------------
      // 4. COD
      // -----------------------------------------

      if (paymentMethod === "cod") {
        const response = await api.post(
          "/order",
          orderData
        );

        if (!response.data?.success) {
          toast.error(
            response.data?.message ||
            "Failed to place order."
          );
          return;
        }

        toast.success("Order placed successfully!");

        // Cart checkout
        if (!isBuyNow) {
          dispatch(clearCart());
        }

        navigate("/orders");
        return;
      }

      // -----------------------------------------
      // 5. CARD / UPI
      // -----------------------------------------

      if (
        paymentMethod === "online" 
    
      ) {
        // ---------------------------------------
        // Step 5A: Create Razorpay order
        // ---------------------------------------

        const razorpayResponse = await api.post(
          "/payment/razorpay/order",
          {
            items: orderItems,
  shippingAddress: orderData.shippingAddress,
  isBuyNow,
          }
        );

        if (!razorpayResponse.data?.success) {
          toast.error(
            razorpayResponse.data?.message ||
            "Unable to create payment."
          );
          return;
        }

        const razorpayOrder =
          razorpayResponse.data.data;

        // ---------------------------------------
        // Step 5B: Open Razorpay Checkout
        // ---------------------------------------

        if (!window.Razorpay) {
          toast.error(
            "Razorpay Checkout is not loaded."
          );
          return;
        }

        const options = {
          key: razorpayOrder.key,

          amount: razorpayOrder.amount,

          currency: razorpayOrder.currency,

          name: "Your Ecommerce Store",

          description: "Order Payment",

          order_id: razorpayOrder.razorpayOrderId,

          prefill: {
            name: shippingAddress.name,
            contact: shippingAddress.phone,
          },

          handler: async function (
            paymentResponse
          ) {
            try {
              // -----------------------------------
              // Step 5C: Verify payment
              // -----------------------------------

              const verifyResponse =
                await api.post(
                  "/payment/razorpay/verify",
                  {
                    razorpay_order_id:
                      paymentResponse.razorpay_order_id,

                    razorpay_payment_id:
                      paymentResponse.razorpay_payment_id,

                    razorpay_signature:
                      paymentResponse.razorpay_signature,

                    // Send the original order data
                    // so backend can create Order
                    items: orderItems,

                    shippingAddress:
                      orderData.shippingAddress,

                    paymentMethod:
                      paymentMethod,
                         isBuyNow,
                  }
                );

              if (
                !verifyResponse.data?.success
              ) {
                toast.error(
                  verifyResponse.data?.message ||
                  "Payment verification failed."
                );
                return;
              }

              toast.success(
                "Payment successful! Order placed."
              );

              // -----------------------------------
              // Clear cart only for cart checkout
              // -----------------------------------

              if (!isBuyNow) {
                dispatch(clearCart());
              }

              navigate("/orders");
            } catch (error) {
              console.error(
                "Payment verification error:",
                error
              );

              toast.error(
                error.response?.data?.message ||
                "Payment verification failed."
              );
            } finally {
              setPlacingOrder(false);
            }
          },

          modal: {
            ondismiss: function () {
              setPlacingOrder(false);

              toast.info(
                "Payment was cancelled."
              );
            },
          },

          theme: {
            color: "#3399cc",
          },
        };

        const razorpay =
          new window.Razorpay(options);

        razorpay.open();
        razorpayOpened = true;

        return;
      }

      toast.error("Invalid payment method.");
    } catch (error) {
      console.error(
        "Payment error:",
        error
      );

      toast.error(
        error.response?.data?.message ||
        "Payment failed."
      );
    } finally {
      if (!razorpayOpened) {
        setPlacingOrder(false);
      }
    }
  };




  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Loading checkout...</p>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-slate-50 px-4 py-7 sm:py-9">
      <div className="mx-auto max-w-6xl">
        {/* Back */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-5 flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-blue-700"
        >
          <FaArrowLeft />
          Back
        </button>

        {/* Heading */}
        <div className="mb-6 rounded-2xl bg-white px-5 py-5 shadow-sm sm:px-7">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Secure checkout</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Checkout</h1>

          <p className="mt-1 text-slate-500">
            {isBuyNow
              ? "Complete your purchase"
              : "Review your cart and complete your order"}
          </p>
        </div>

        <Formik
          initialValues={{
            shippingAddress: {
              name: "",
              phone: "",
              address: "",
              city: "",
              state: "",
              pincode: "",
            },
          }}
          validationSchema={checkoutAddressSchema}
          onSubmit={handlePayment}
        >
          {({ isSubmitting }) => (
        <Form noValidate>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* =================================
                LEFT
            ================================= */}

            <div className="lg:col-span-2 space-y-6">
              {/* SHIPPING ADDRESS */}

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="mb-5 text-xl font-semibold text-slate-900">
                  Shipping Address
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    name="shippingAddress.name"
                    label="Full Name"
                    autoComplete="name"
                    placeholder="Enter your name"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    containerClassName="mb-0"
                  />
                  <FormField
                    name="shippingAddress.phone"
                    label="Phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="Enter phone number"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    containerClassName="mb-0"
                  />
                  <FormField
                    name="shippingAddress.address"
                    label="Address"
                    as="textarea"
                    rows={3}
                    placeholder="House number, street, area..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    containerClassName="md:col-span-2 mb-0"
                  />
                  <FormField
                    name="shippingAddress.city"
                    label="City"
                    autoComplete="address-level2"
                    placeholder="Enter city"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    containerClassName="mb-0"
                  />
                  <FormField
                    name="shippingAddress.state"
                    label="State"
                    autoComplete="address-level1"
                    placeholder="Enter state"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    containerClassName="mb-0"
                  />
                  <FormField
                    name="shippingAddress.pincode"
                    label="Pincode"
                    autoComplete="postal-code"
                    placeholder="6-digit pincode"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    containerClassName="mb-0"
                  />
                </div>
              </div>

              {/* =================================
                  PAYMENT METHOD (NEW)
              ================================= */}

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="mb-5 text-xl font-semibold text-slate-900">
                  Payment Method
                </h2>

                <div className="space-y-3">
                  {[
                    { value: "cod", label: "💳 Cash on Delivery", desc: "Pay when you receive your order" },
                    { value: "online", label: "🏦 Debit/Credit Card/UPI/NetBanking", desc: "Secure payment" },
                   
                  ].map((method) => (
                    <label key={method.value} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${paymentMethod === method.value ? "border-blue-500 bg-blue-50/70" : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"}`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.value}
                        checked={paymentMethod === method.value}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium text-gray-800">{method.label}</p>
                        <p className="text-sm text-gray-500">{method.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* =================================
                  ORDER ITEMS
              ================================= */}

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
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

                    const attributes = variant?.attributes || {};

                    const image = variant?.images?.[0];

                    const itemTotal =
                      Number(variant?.price || 0) * Number(item.quantity || 0);

                    return (
                      <div
                        key={variant?._id}
                        className="flex gap-4 rounded-xl border border-slate-200 p-4"
                      >
                        {/* Image */}
                        <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50">
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
                            {Object.entries(attributes).map(([key, value]) => (
                              <span key={key} className="text-sm text-gray-500">
                                <span className="font-medium">{key}:</span>{" "}
                                {value}
                              </span>
                            ))}
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
              <div className="sticky top-28 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="mb-5 text-xl font-semibold text-slate-900">
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
                    <span className="text-green-600">Free</span>
                  </div>

                  <div className="mt-4 border-t border-slate-200 pt-4">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold">Total</span>

                      <span className="text-2xl font-bold text-slate-900">
                        ₹{totalAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>

                {exceedsLimit && (
                  <p className="mt-4 text-sm text-red-600" role="alert">
                    Order total cannot exceed ₹
                    {MAX_ORDER_AMOUNT.toLocaleString("en-IN")}. Please remove
                    or reduce items before checkout.
                  </p>
                )}

                {/* Place Order */}

                <button
                  type="submit"
                  disabled={
                    placingOrder || isSubmitting || items.length === 0 || exceedsLimit
                  }

                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 py-3 font-bold text-slate-900 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <FaCheck />

                {placingOrder
    ? "Processing..."
    : paymentMethod === "cod"
    ? "Place Order"
    : "Pay Now"}
                </button>

              </div>
            </div>
          </div>
        </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}

export default Checkout;
