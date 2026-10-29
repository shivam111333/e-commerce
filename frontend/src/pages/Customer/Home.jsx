import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../api/axios.jsx";
import FeaturedProducts from "./components/FeaturedProduct.jsx";
import CatalogSection from "./components/CatalogSection.jsx";
import BudgetSection from "./components/BudgetSection.jsx";
import BenefitsSection from "./components/BenefitsSection.jsx";

function Home() {
  const [searchParams] = useSearchParams();
  const selectedCategory = searchParams.get("category") || "all";
  const selectedSubcategory = searchParams.get("subcategory") || "";

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [salesByProduct, setSalesByProduct] = useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================
  // FETCH CATEGORIES & SUBCATEGORIES
  // =========================
  useEffect(() => {
    const fetchCatalogOptions = async () => {
      try {
        const [categoryResponse, subcategoryResponse] = await Promise.all([
          api.get("/category"),
          api.get("/subcategory"),
        ]);
        setCategories(categoryResponse.data?.data || []);
        setSubcategories(subcategoryResponse.data?.data || []);
      } catch (catalogError) {
        console.error("Catalog categories loading error:", catalogError);
      }
    };

    fetchCatalogOptions();
  }, []);

  // =========================
  // FETCH PRODUCTS
  // =========================
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const [productResponse, salesResponse] = await Promise.all([
          selectedCategory === "all"
            ? api.get("/product/all")
            : api.get(`/category/all/${selectedCategory}`),
          api.get("/product/top-selling"),
        ]);

        setProducts(productResponse.data.data || []);
        setSalesByProduct(
          Object.fromEntries(
            (salesResponse.data?.data || []).map(({ _id, soldQuantity }) => [
              _id,
              soldQuantity,
            ])
          )
        );
      } catch (err) {
        if (err.response?.status === 404) {
          setProducts([]);
          setSalesByProduct({});
        } else {
          console.error("Product loading error:", err);
          setError("Failed to load products");
          setProducts([]);
          setSalesByProduct({});
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [selectedCategory]);

  // =========================
  // DERIVED DATA
  // =========================
  const visibleProducts = products.filter((product) => {
    if (!selectedSubcategory) return true;
    const subcategoryId =
      typeof product.subcategory === "string" ? product.subcategory : product.subcategory?._id;
    return subcategoryId === selectedSubcategory;
  });

  const getLowestInStockPrice = (product) => {
    const prices = (product.variants || [])
      .filter((variant) => Number(variant.stock) > 0)
      .map((variant) => Number(variant.price))
      .filter((price) => Number.isFinite(price) && price >= 0);

    return prices.length ? Math.min(...prices) : null;
  };

  const budgetRanges = [
    { title: "Under ₹100", min: 0, max: 100 },
    { title: "Under ₹500", min: 101, max: 500 },
    { title: "₹500 - ₹999", min: 500, max: 1000 },
    { title: "₹1,000 - ₹1,999", min: 1000, max: 2000 },
  ];

  const budgetSections = budgetRanges
    .map((range) => ({
      ...range,
      products: visibleProducts
        .filter((product) => {
          const price = getLowestInStockPrice(product);
          return price !== null && price >= range.min && price < range.max;
        })
        .sort((first, second) => getLowestInStockPrice(first) - getLowestInStockPrice(second))
        .slice(0, 4)
        .map((product) => ({ ...product, lowestInStockPrice: getLowestInStockPrice(product) })),
    }))
    .filter((section) => section.products.length > 0);

  const getId = (value) => (typeof value === "string" ? value : value?._id);

  const catalogSections = categories.flatMap((category) =>
    subcategories
      .filter((subcategory) => getId(subcategory.category) === category._id)
      .map((subcategory) => ({
        category,
        subcategory,
        products: visibleProducts
          .filter(
            (product) =>
              getId(product.category) === category._id &&
              getId(product.subcategory) === subcategory._id
          )
          .sort(
            (first, second) =>
              (salesByProduct[second._id] || 0) - (salesByProduct[first._id] || 0)
          )
          .slice(0, 4),
      }))
      .filter((section) => section.products.length > 0)
  );

  // =========================
  // RENDER
  // =========================
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <FeaturedProducts
          key={visibleProducts.slice(0, 8).map((product) => product._id).join(",")}
          products={visibleProducts}
          loading={loading}
        />

        <CatalogSection
          selectedCategory={selectedCategory}
          categories={categories}
          catalogSections={catalogSections}
          salesByProduct={salesByProduct}
          loading={loading}
          error={error}
          visibleProducts={visibleProducts}
        />

        <BudgetSection budgetSections={budgetSections} loading={loading} error={error} />

        <BenefitsSection />
      </div>
    </main>
  );
}

export default Home;