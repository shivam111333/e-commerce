import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../api/axios";
import ProductCard from "../../component/ProductCard";
import { FaFilter, FaSlidersH } from "react-icons/fa";

function Products() {
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search") || "";
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortOrder, setSortOrder] = useState("featured");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);

        const response = await api.get("/product");

        const productData = response.data.data || [];

        setProducts(productData);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    api.get("/category")
      .then((response) => setCategories(response.data?.data || []))
      .catch((error) => console.error("Error fetching categories:", error));
  }, []);

  const filteredProducts = products
    .filter((product) => product.name.toLowerCase().includes(search.toLowerCase()))
    .filter((product) => {
      if (selectedCategory === "all") return true;
      const categoryId = typeof product.category === "string" ? product.category : product.category?._id;
      return categoryId === selectedCategory;
    })
    .sort((first, second) => {
      if (sortOrder === "price-low") return Number(first.variants?.[0]?.price || 0) - Number(second.variants?.[0]?.price || 0);
      if (sortOrder === "price-high") return Number(second.variants?.[0]?.price || 0) - Number(first.variants?.[0]?.price || 0);
      return 0;
    });

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-2xl bg-white px-5 py-5 shadow-sm sm:px-7">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Find your next favorite</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {search ? `Results for “${search}”` : "Explore all products"}
          </h1>
          <p className="mt-2 text-sm text-slate-500">{filteredProducts.length} products to discover</p>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-[230px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-900"><FaFilter className="text-blue-600" /> Filters</h2>
            <label htmlFor="product-category" className="mb-2 block text-sm font-medium text-slate-700">Category</label>
            <select
              id="product-category"
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="all">All categories</option>
              {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
            </select>
            <button type="button" onClick={() => setSelectedCategory("all")} className="mt-4 text-sm font-semibold text-blue-700 hover:text-blue-900">Clear filters</button>
          </aside>

          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-sm text-slate-600">Showing <span className="font-semibold text-slate-900">{filteredProducts.length}</span> products</p>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <FaSlidersH aria-hidden="true" />
                <span>Sort by</span>
                <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-medium text-slate-800 outline-none focus:border-blue-500">
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: low to high</option>
                  <option value="price-high">Price: high to low</option>
                </select>
              </label>
            </div>

            {loading ? (
              <p className="rounded-2xl bg-white py-16 text-center text-slate-500">Loading products...</p>
            ) : filteredProducts.length === 0 ? (
              <p className="rounded-2xl bg-white py-16 text-center text-slate-500">No products found. Try another search or category.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map((product) => <ProductCard key={product._id} product={product} />)}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

export default Products;