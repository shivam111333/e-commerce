import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowRight,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

function FeaturedProduct({ products, loading }) {
  const navigate = useNavigate();
  const [slideIndex, setSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const slides = products.slice(0, 8);
  const activeSlide = slides.length
    ? slides[slideIndex % slides.length]
    : null;

  useEffect(() => {
    if (loading || slides.length < 2 || isPaused) {
      return undefined;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }

    const slideTimer = window.setInterval(() => {
      setSlideIndex((currentIndex) => (currentIndex + 1) % slides.length);
    }, 2000);

    return () => window.clearInterval(slideTimer);
  }, [loading, slides.length, isPaused]);

  const showPreviousSlide = () => {
    setSlideIndex((currentIndex) =>
      (currentIndex - 1 + slides.length) % slides.length
    );
  };

  const showNextSlide = () => {
    setSlideIndex((currentIndex) => (currentIndex + 1) % slides.length);
  };

  if (loading || !activeSlide) {
    return null;
  }

  return (
    <section
      aria-label="Featured products"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") showPreviousSlide();
        if (event.key === "ArrowRight") showNextSlide();
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsPaused(false);
        }
      }}
      className="relative isolate h-[380px] overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-sky-100 to-blue-200 shadow-sm outline-none sm:h-[470px] lg:h-[340px]"
    >
      <div className="grid h-full grid-cols-1 grid-rows-[160px_1fr] sm:grid-rows-[180px_1fr] lg:grid-cols-2 lg:grid-rows-1">
        <div className="relative order-first min-h-0 lg:order-last">
          <div className="pointer-events-none absolute left-1/2 top-1/2 aspect-square h-3/4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/50 blur-xl" />
          {activeSlide.variants?.[0]?.images?.[0] ? (
            <img
              key={activeSlide._id}
              src={activeSlide.variants[0].images[0]}
              alt={activeSlide.name}
              className="absolute inset-0 h-full w-full object-contain px-12 pb-2 pt-4 drop-shadow-xl transition-opacity duration-500 starting:opacity-0 sm:px-14 lg:px-20 lg:py-6"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center px-12 text-center text-sm font-medium text-blue-900">
              Discover a new favorite
            </div>
          )}
        </div>

        <div className="relative z-10 flex min-h-0 min-w-0 flex-col items-start justify-center overflow-hidden px-5 pb-14 pt-2 sm:px-8 lg:py-6 lg:pb-14 lg:pl-20 lg:pr-8">
          <span className="max-w-full truncate rounded-full border border-white/80 bg-white/70 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-blue-800 shadow-sm">
            {activeSlide.category?.name || "Featured find"}
          </span>
          <h1 className="mt-3 line-clamp-2 w-full break-words text-xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-3xl lg:text-4xl">
            {activeSlide.name}
          </h1>
          <p className="mt-2 hidden max-w-md line-clamp-2 break-words text-sm leading-5 text-slate-600 sm:block">
            A great find from our marketplace. Explore the details and see if it
            belongs in your everyday.
          </p>
          <button
            type="button"
            onClick={() => navigate(`/product/${activeSlide._id}`)}
            className="mt-4 inline-flex shrink-0 items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200"
          >
            Explore this find <FaArrowRight size={12} aria-hidden="true" />
          </button>
        </div>
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={showPreviousSlide}
            aria-label="Show previous featured product"
            className="absolute left-2 top-[80px] z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/90 text-slate-800 shadow-md transition hover:scale-105 hover:bg-white focus:outline-none focus:ring-4 focus:ring-blue-200 sm:left-4 sm:top-[90px] sm:h-10 sm:w-10 lg:top-1/2 lg:h-11 lg:w-11"
          >
            <FaChevronLeft size={13} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={showNextSlide}
            aria-label="Show next featured product"
            className="absolute right-2 top-[80px] z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/90 text-slate-800 shadow-md transition hover:scale-105 hover:bg-white focus:outline-none focus:ring-4 focus:ring-blue-200 sm:right-4 sm:top-[90px] sm:h-10 sm:w-10 lg:top-1/2 lg:h-11 lg:w-11"
          >
            <FaChevronRight size={13} aria-hidden="true" />
          </button>

          <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-full border border-white/70 bg-white/75 px-3 py-1.5 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-2" aria-label="Choose a featured product">
              {slides.map((slide, index) => (
                <button
                  key={slide._id}
                  type="button"
                  onClick={() => setSlideIndex(index)}
                  aria-label={`Show featured product ${index + 1}`}
                  aria-current={index === slideIndex % slides.length}
                  className={`h-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2 ${
                    index === slideIndex % slides.length
                      ? "w-6 bg-blue-700"
                      : "w-2 bg-blue-700/30 hover:bg-blue-700/60"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-semibold tabular-nums text-slate-600">
              {`${(slideIndex % slides.length) + 1} / ${slides.length}`}
            </span>
          </div>
        </>
      )}
    </section>
  );
}

export default FeaturedProduct;
