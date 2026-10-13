import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../api/axios";
import {
  FaArrowRight,
  FaCheckCircle,
  FaChevronLeft,
  FaChevronRight,
  FaShoppingBag,
  FaTruck,
} from "react-icons/fa";

function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedCategory = searchParams.get("category") || "all";
  const selectedSubcategory = searchParams.get("subcategory") || "";
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [products, setProducts] = useState([]);

  const [heroSlideIndex, setHeroSlideIndex] = useState(0);
  const [isHeroPaused, setIsHeroPaused] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

        const response =
          selectedCategory === "all"
            ? await api.get("/product/")
            : await api.get(`/category/all/${selectedCategory}`);

        setHeroSlideIndex(0);
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

  const visibleProducts = products.filter((product) => {
    if (!selectedSubcategory) return true;
    const subcategoryId = typeof product.subcategory === "string"
      ? product.subcategory
      : product.subcategory?._id;
    return subcategoryId === selectedSubcategory;
  });

  const getId = (value) => (typeof value === "string" ? value : value?._id);
  const catalogSections = categories.flatMap((category) =>
    subcategories
      .filter((subcategory) => getId(subcategory.category) === category._id)
      .map((subcategory) => ({
        category,
        subcategory,
        products: visibleProducts
          .filter((product) =>
            getId(product.category) === category._id &&
            getId(product.subcategory) === subcategory._id
          )
          .slice(0, 4),
      }))
      .filter((section) => section.products.length > 0)
  );
  const heroSlides = visibleProducts.slice(0, 8);
  const activeHeroSlide = heroSlides.length
    ? heroSlides[heroSlideIndex % heroSlides.length]
    : null;

  useEffect(() => {
    if (heroSlides.length < 2 || isHeroPaused) {
      return undefined;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }

    const slideTimer = window.setInterval(() => {
      setHeroSlideIndex((currentIndex) => (currentIndex + 1) % heroSlides.length);
    }, 2000);

    return () => window.clearInterval(slideTimer);
  }, [heroSlides.length, isHeroPaused]);

  const showPreviousHeroSlide = () => {
    setHeroSlideIndex((currentIndex) =>
      (currentIndex - 1 + heroSlides.length) % heroSlides.length
    );
  };

  const showNextHeroSlide = () => {
    setHeroSlideIndex((currentIndex) => (currentIndex + 1) % heroSlides.length);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
  
{!loading && activeHeroSlide && (
  <section
    aria-label="Featured products"
    tabIndex={0}
    onKeyDown={(event) => {
      if (event.key === "ArrowLeft") showPreviousHeroSlide();
      if (event.key === "ArrowRight") showNextHeroSlide();
    }}
    onMouseEnter={() => setIsHeroPaused(true)}
    onMouseLeave={() => setIsHeroPaused(false)}
    onFocusCapture={() => setIsHeroPaused(true)}
    onBlurCapture={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) {
        setIsHeroPaused(false);
      }
    }}
    className="relative isolate h-[380px] overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-sky-100 to-blue-200 shadow-sm outline-none sm:h-[470px] lg:h-[340px]"
  >
    <div className="grid h-full grid-cols-1 grid-rows-[160px_1fr] sm:grid-rows-[180px_1fr] lg:grid-cols-2 lg:grid-rows-1">
      {/* IMAGE BOX: fixed size, image fits inside it */}
      <div className="relative order-first min-h-0 lg:order-last">
        <div className="pointer-events-none absolute left-1/2 top-1/2 aspect-square h-3/4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/50 blur-xl" />
        {activeHeroSlide.variants?.[0]?.images?.[0] ? (
          <img
            key={activeHeroSlide._id}
            src={activeHeroSlide.variants[0].images[0]}
            alt={activeHeroSlide.name}
            className="absolute inset-0 h-full w-full object-contain px-12 pb-2 pt-4 drop-shadow-xl transition-opacity duration-500 starting:opacity-0 sm:px-14 lg:px-20 lg:py-6"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center px-12 text-center text-sm font-medium text-blue-900">
            Discover a new favorite
          </div>
        )}
      </div>

      {/* TEXT BOX */}
      <div className="relative z-10 flex min-h-0 min-w-0 flex-col items-start justify-center overflow-hidden px-5 pb-14 pt-2 sm:px-8 lg:py-6 lg:pb-14 lg:pl-20 lg:pr-8">
        <span className="max-w-full truncate rounded-full border border-white/80 bg-white/70 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-blue-800 shadow-sm">
          {activeHeroSlide.category?.name || "Featured find"}
        </span>
        <h1 className="mt-3 line-clamp-2 w-full break-words text-xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-3xl lg:text-4xl">
          {activeHeroSlide.name}
        </h1>
        <p className="mt-2 hidden max-w-md line-clamp-2 break-words text-sm leading-5 text-slate-600 sm:block">
          A great find from our marketplace. Explore the details and see if it
          belongs in your everyday.
        </p>
        <button
          type="button"
          onClick={() => navigate(`/product/${activeHeroSlide._id}`)}
          className="mt-4 inline-flex shrink-0 items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200"
        >
          Explore this find <FaArrowRight size={12} aria-hidden="true" />
        </button>
      </div>
    </div>

    {heroSlides.length > 1 && (
      <>
        {/* top = half of the image box height (160px mobile, 180px tablet) */}
        <button
          type="button"
          onClick={showPreviousHeroSlide}
          aria-label="Show previous featured product"
          className="absolute left-2 top-[80px] z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/90 text-slate-800 shadow-md transition hover:scale-105 hover:bg-white focus:outline-none focus:ring-4 focus:ring-blue-200 sm:left-4 sm:top-[90px] sm:h-10 sm:w-10 lg:top-1/2 lg:h-11 lg:w-11"
        >
          <FaChevronLeft size={13} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={showNextHeroSlide}
          aria-label="Show next featured product"
          className="absolute right-2 top-[80px] z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/90 text-slate-800 shadow-md transition hover:scale-105 hover:bg-white focus:outline-none focus:ring-4 focus:ring-blue-200 sm:right-4 sm:top-[90px] sm:h-10 sm:w-10 lg:top-1/2 lg:h-11 lg:w-11"
        >
          <FaChevronRight size={13} aria-hidden="true" />
        </button>

        <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-full border border-white/70 bg-white/75 px-3 py-1.5 shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-2" aria-label="Choose a featured product">
            {heroSlides.map((slide, index) => (
              <button
                key={slide._id}
                type="button"
                onClick={() => setHeroSlideIndex(index)}
                aria-label={`Show featured product ${index + 1}`}
                aria-current={index === heroSlideIndex % heroSlides.length}
                className={`h-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2 ${
                  index === heroSlideIndex % heroSlides.length
                    ? "w-6 bg-blue-700"
                    : "w-2 bg-blue-700/30 hover:bg-blue-700/60"
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-semibold tabular-nums text-slate-600">
            {`${(heroSlideIndex % heroSlides.length) + 1} / ${heroSlides.length}`}
          </span>
        </div>
      </>
    )}
  </section>
)}
        <section className="space-y-6 pb-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Shop by category</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight">
                {selectedCategory === "all"
                  ? "Explore our catalog"
                  : categories.find((category) => category._id === selectedCategory)?.name || "Category picks"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">Discover four hand-picked products from each collection.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/products")}
              className="hidden text-sm font-semibold text-blue-700 hover:text-blue-900 sm:block"
            >
              Explore all products <FaArrowRight className="ml-1 inline" size={11} />
            </button>
          </div>
          {loading && <p className="py-12 text-center text-slate-500">Loading products...</p>}
          {error && <p className="rounded-xl bg-red-50 p-5 text-center text-red-700">{error}</p>}
          {!loading && !error && visibleProducts.length === 0 && <p className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">No products found.</p>}
          {!loading && !error && visibleProducts.length > 0 && catalogSections.length === 0 && (
            <p className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">
              No category collections are available yet. <button type="button" onClick={() => navigate("/products")} className="font-semibold text-blue-700 hover:text-blue-900">Browse all products</button>
            </p>
          )}
          {!loading && !error && catalogSections.length > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {catalogSections.map(({ category, subcategory, products: sectionProducts }, index) => (
                <section
                  key={subcategory._id}
                  aria-labelledby={`catalog-${subcategory._id}`}
                  className={`rounded-2xl border p-3 shadow-sm ${
                    index % 2 === 0
                      ? "border-sky-100 bg-gradient-to-br from-white via-sky-50 to-blue-100"
                      : "border-blue-100 bg-gradient-to-br from-white via-blue-50 to-indigo-50"
                  }`}
                >
                  <div className="mb-2 flex min-h-11 items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p id={`catalog-${subcategory._id}`} className="line-clamp-2 text-base font-bold leading-5 text-slate-950">
                        Top picks in {subcategory.name}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] font-semibold text-blue-700">{category.name}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/products?category=${encodeURIComponent(category._id)}&subcategory=${encodeURIComponent(subcategory._id)}`)}
                      aria-label={`Explore ${subcategory.name} products`}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 transition hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-700"
                    >
                      <FaChevronRight aria-hidden="true" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {sectionProducts.map((product) => {
                      const image = product.variants?.[0]?.images?.[0];
                      const price = Number(product.variants?.[0]?.price ?? product.price);

                      return (
                        <button
                          key={product._id}
                          type="button"
                          onClick={() => navigate(`/product/${product._id}`)}
                          aria-label={`View ${product.name}`}
                          className="group min-w-0 overflow-hidden rounded-xl bg-white p-2 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-700"
                        >
                          <span className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-slate-50">
                            {image ? (
                              <img
                                src={image}
                                alt=""
                                loading="lazy"
                                className="h-full w-full object-contain p-1 transition duration-200 group-hover:scale-105"
                              />
                            ) : (
                              <span className="px-2 text-center text-xs text-slate-400">Image coming soon</span>
                            )}
                          </span>
                          <span className="mt-2 block truncate text-xs font-semibold text-slate-800">{product.name}</span>
                          <span className="mt-0.5 block text-xs font-bold text-slate-950">
                            {Number.isFinite(price) ? `₹${price.toLocaleString("en-IN")}` : "Price unavailable"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
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