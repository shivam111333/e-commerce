import { useEffect, useState } from "react";
import api from "../../api/axios";
import ProductCard from "../../component/ProductCard";

function Home() {
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
          response = await api.get("/product");
        } else {
          // Fetch products for selected category
          response = await api.get(
            `/category/all/${selectedCategory}`
          );
        
        }
          console.log(response.data.data)
        setProducts(response.data.data);
      } catch (error) {
        console.log("Product error:", error);

        setError("Failed to load products");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [selectedCategory]);

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* ================= HEADER ================= */}

        <div className="flex items-center justify-between mb-8">

          <h1 className="text-2xl font-bold text-gray-800">
            Products
          </h1>

          {/* ================= CATEGORY DROPDOWN ================= */}

          <div className="flex items-center gap-3">

            <label
              htmlFor="category"
              className="font-medium text-gray-700"
            >
              Category:
            </label>

            <select
              id="category"
              value={selectedCategory}
              onChange={(e) =>
                setSelectedCategory(e.target.value)
              }
              className="
                px-4
                py-2
                rounded-lg
                border
                border-gray-300
                bg-white
                text-gray-700
                outline-none
                focus:border-blue-500
                focus:ring-2
                focus:ring-blue-100
              "
            >
              {/* ALL */}
              <option value="all">
                All
              </option>

              {/* CATEGORIES */}
              {categories.map((category) => (
                <option
                  key={category._id}
                  value={category._id}
                >
                  {category.name}
                </option>
              ))}
            </select>

          </div>

        </div>


        {/* ================= PRODUCTS ================= */}

        {loading && (
          <div className="text-center py-10">
            Loading products...
          </div>
        )}

        {error && (
          <div className="text-center py-10 text-red-500">
            {error}
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            No products found.
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <div
            className="
              grid
              grid-cols-1
              sm:grid-cols-2
              md:grid-cols-3
              lg:grid-cols-4
              gap-6
            "
          >
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
              />
            ))}
          </div>
        )}

      </div>

    </div>
  );
}

export default Home;