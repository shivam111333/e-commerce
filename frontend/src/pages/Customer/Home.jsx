import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import ProductCard from "../../component/ProductCard";
import { FaArrowRight, FaBolt, FaCheckCircle, FaShoppingBag, FaTruck } from "react-icons/fa";

function Home() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState("all");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =========================
  // FETCH CATEGORIES
  // =========================
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get("/category");

        setCategories(response.data.data || []);
      } catch (error) {
        console.log("Category error:", error);
      }
    };

    fetchCategories();
  }, []);

  // =========================
  // FETCH PRODUCTS
  // =========================
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        let response;

        if (selectedCategory === "all") {
          // Fetch all products
          response = await api.get("/product/");
        } else {
          // Fetch products for selected category
          response = await api.get(
            `/category/all/${selectedCategory}`
          );
        
        }
        setProducts(response.data.data || []);
      } catch (error) {
        if (error.response?.status === 404) {
          setProducts([]);
        } else {
          console.error("Product loading error:", error);
          setError("Failed to load products");
          setProducts([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [selectedCategory]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {!loading && products[0] && (
          <section className="relative isolate flex min-h-[300px] overflow-hidden rounded-3xl bg-blue-100 shadow-sm sm:min-h-[360px]">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-blue-50/95 to-blue-50/10 sm:to-transparent" />
            {products[0].variants?.[0]?.images?.[0] && (
              <img src={products[0].variants[0].images[0]} alt="" className="absolute inset-y-0 right-0 h-full w-full object-cover opacity-30 sm:w-3/5 sm:opacity-100" />
            )}
            <div className="relative z-10 flex max-w-xl flex-col items-start justify-center p-7 sm:p-12">
              <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-700">
                <FaBolt className="text-amber-400" /> Shop the everyday edit
              </span>
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl">Great finds.<br />Better living.</h1>
              <p className="mt-3 max-w-sm text-sm leading-6 text-slate-600 sm:text-base">Discover useful picks and new favorites, all in one place.</p>
              <button type="button" onClick={() => navigate("/products")} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-amber-300">
                Shop all products <FaArrowRight size={12} />
              </button>
            </div>
          </section>
        )}

        <section>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Browse your way</p><h2 className="mt-1 text-2xl font-bold tracking-tight">Shop by category</h2></div>
            <button type="button" onClick={() => navigate("/products")} className="text-sm font-semibold text-blue-700 hover:text-blue-900">View all <FaArrowRight className="ml-1 inline" size={11} /></button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            <button type="button" onClick={() => setSelectedCategory("all")} className={`shrink-0 rounded-xl border px-5 py-3 text-sm font-semibold transition ${selectedCategory === "all" ? "border-blue-600 bg-blue-600 text-white shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-blue-300"}`}>Everything</button>
            {categories.map((category) => (
              <button type="button" key={category._id} onClick={() => setSelectedCategory(category._id)} className={`shrink-0 rounded-xl border px-5 py-3 text-sm font-semibold transition ${selectedCategory === category._id ? "border-blue-600 bg-blue-600 text-white shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-blue-300"}`}>
                {category.name}
              </button>
            ))}
          </div>
        </section>

        <section className="pb-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Picked for you</p><h2 className="mt-1 text-2xl font-bold tracking-tight">{selectedCategory === "all" ? "Popular right now" : categories.find((category) => category._id === selectedCategory)?.name}</h2></div>
            <button type="button" onClick={() => navigate("/products")} className="hidden text-sm font-semibold text-blue-700 hover:text-blue-900 sm:block">Explore products <FaArrowRight className="ml-1 inline" size={11} /></button>
          </div>
          {loading && <p className="py-12 text-center text-slate-500">Loading products...</p>}
          {error && <p className="rounded-xl bg-red-50 p-5 text-center text-red-700">{error}</p>}
          {!loading && !error && products.length === 0 && <p className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">No products found.</p>}
          {!loading && !error && products.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {products.slice(0, 8).map((product) => <ProductCard key={product._id} product={product} />)}
            </div>
          )}
        </section>

        <section className="grid gap-3 border-t border-slate-200 py-6 sm:grid-cols-3">
          {[
            { icon: <FaTruck />, title: "Delivery to your door", text: "Track your order from checkout to delivery." },
            { icon: <FaCheckCircle />, title: "Easy ordering", text: "A smooth, secure checkout experience." },
            { icon: <FaShoppingBag />, title: "A little of everything", text: "Explore products across all your favorite categories." },
          ].map((benefit) => (
            <div key={benefit.title} className="flex items-center gap-3 rounded-xl bg-white p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700">{benefit.icon}</span>
              <div><p className="text-sm font-semibold">{benefit.title}</p><p className="mt-1 text-xs text-slate-500">{benefit.text}</p></div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}

export default Home;