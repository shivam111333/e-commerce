import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaBoxOpen,
  FaClipboardList,
  FaPlus,
  FaStore,
} from "react-icons/fa";
import api from "../../api/axios.jsx";

function VendorDashboard() {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderCount, setOrderCount] = useState(null);

  useEffect(() => {
    const fetchVendorProducts = async () => {
      try {
        const response = await api.get("/vendor");
        setProducts(response.data?.data || []);
      } catch (error) {
        console.error("Vendor dashboard product loading error:", error);
        toast.error(
          error.response?.data?.message || "Failed to load your products."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchVendorProducts();
  }, []);

  useEffect(() => {
    let isCurrent = true;

    const fetchVendorOrderCount = async () => {
      try {
        const response = await api.get("/order");
        const orders = response.data?.data;

        if (isCurrent) {
          setOrderCount(Array.isArray(orders) ? orders.length : 0);
        }
      } catch (error) {
        if (error.response?.status === 404) {
          if (isCurrent) setOrderCount(0);
          return;
        }

        console.error("Vendor dashboard order count error:", error);
        toast.error(
          error.response?.data?.message || "Failed to load your order count."
        );
        if (isCurrent) setOrderCount(0);
      }
    };

    fetchVendorOrderCount();

    return () => {
      isCurrent = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-7xl">
        <section className="mb-7 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
              <FaStore aria-hidden="true" />
              Vendor workspace
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Welcome{user?.name ? `, ${user.name}` : ""}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage your products and keep your store up to date.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/vendor/products/add")}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
          >
            <FaPlus aria-hidden="true" />
            Add product
          </button>
        </section>

        <section
          aria-label="Store totals"
          className="mb-8 grid gap-4 sm:grid-cols-2"
        >
          <button
            type="button"
            onClick={() => navigate("/vendor/products")}
            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-200 hover:shadow-md sm:p-6"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <FaBoxOpen size={20} aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-medium text-slate-500">
                Total Products
              </span>
              <span className="mt-1 block text-2xl font-bold tabular-nums text-slate-900">
                {loading ? "—" : products.length}
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/vendor/orders")}
            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-amber-200 hover:shadow-md sm:p-6"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <FaClipboardList size={20} aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-medium text-slate-500">
                Total Orders
              </span>
              <span className="mt-1 block text-2xl font-bold tabular-nums text-slate-900">
                {orderCount === null ? "—" : orderCount}
              </span>
            </span>
          </button>
        </section>

        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Your products</h2>
            <p className="mt-1 text-sm text-slate-500">
              {products.length} {products.length === 1 ? "product" : "products"}{" "}
              in your store
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/vendor/products")}
            className="text-sm font-semibold text-blue-700 hover:text-blue-900"
          >
            Manage products
          </button>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-500">
            Loading your products...
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <FaBoxOpen size={22} aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">
              Your store is ready for its first product
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Add a product to start building your catalog.
            </p>
            <button
              type="button"
              onClick={() => navigate("/vendor/products/add")}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <FaPlus aria-hidden="true" />
              Add your first product
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => {
              const firstVariant = product.variants?.[0];
              const image = firstVariant?.images?.[0];
              const price = firstVariant?.price;

              return (
                <article
                  key={product._id}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
                >
                  <button
                    type="button"
                    onClick={() => navigate(`/vendor/products/${product._id}`)}
                    aria-label={`View ${product.name}`}
                    className="flex h-56 w-full items-center justify-center bg-slate-50 p-5"
                  >
                    {image ? (
                      <img
                        src={image}
                        alt={product.name}
                        className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <span className="flex flex-col items-center gap-2 text-sm text-slate-400">
                        <FaBoxOpen size={28} aria-hidden="true" />
                        No product image
                      </span>
                    )}
                  </button>

                  <div className="p-5">
                    {product.category?.name && (
                      <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                        {product.category.name}
                      </p>
                    )}
                    <h3 className="mt-1 line-clamp-2 min-h-12 font-semibold leading-6 text-slate-900">
                      {product.name}
                    </h3>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className="text-lg font-bold text-slate-900">
                        {price != null
                          ? `₹${Number(price).toLocaleString("en-IN")}`
                          : "Price unavailable"}
                      </span>
                      <span className="text-xs text-slate-500">
                        {product.variants?.length || 0}{" "}
                        {(product.variants?.length || 0) === 1
                          ? "variant"
                          : "variants"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/vendor/products/${product._id}`)}
                      className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                    >
                      View product
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default VendorDashboard;
