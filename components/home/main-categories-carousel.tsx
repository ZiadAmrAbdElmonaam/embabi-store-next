'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

interface MainCategory {
  id: string;
  name: string;
  slug: string;
  image?: string;
  subcategoryCount: number;
}

interface MainCategoriesCarouselProps {
  categories: MainCategory[];
}

export function MainCategoriesCarousel({ categories }: MainCategoriesCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollButtons = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      const maxScroll = scrollWidth - clientWidth;
      setCanScrollLeft(scrollLeft > 8);
      setCanScrollRight(scrollLeft < maxScroll - 8);
    }
  };

  useEffect(() => {
    checkScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollButtons);
      window.addEventListener('resize', checkScrollButtons);
      return () => {
        container.removeEventListener('scroll', checkScrollButtons);
        window.removeEventListener('resize', checkScrollButtons);
      };
    }
  }, [categories]);

  const getScrollAmount = () => {
    if (typeof window === 'undefined') return 216;
    return window.innerWidth < 640 ? 200 + 16 : 220 + 20; // card + gap per breakpoint
  };

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollValue = direction === 'left' ? -getScrollAmount() : getScrollAmount();
      container.scrollBy({
        left: scrollValue,
        behavior: 'smooth',
      });
    }
  };

  if (categories.length === 0) return null;

  return (
    <div className="relative -mx-2 sm:-mx-4">
      {/* Left gradient fade - matches categories section background */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-12 sm:w-16 z-[1] bg-gradient-to-r from-slate-50 dark:from-slate-900/60 to-transparent pointer-events-none transition-opacity duration-300 ${
          canScrollLeft ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Right gradient fade */}
      <div
        className={`absolute right-0 top-0 bottom-0 w-12 sm:w-16 z-[1] bg-gradient-to-l from-slate-100/80 dark:from-slate-800/50 to-transparent pointer-events-none transition-opacity duration-300 ${
          canScrollRight ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Scroll Buttons */}
      {categories.length > 2 && (
        <>
          <button
            onClick={() => scroll('left')}
            className={`absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-xl hover:border-orange-200 dark:hover:border-orange-800 ${
              canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            aria-label="Scroll left"
          >
            <ChevronLeft size={22} className="text-gray-700 dark:text-gray-300" />
          </button>

          <button
            onClick={() => scroll('right')}
            className={`absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-xl hover:border-orange-200 dark:hover:border-orange-800 ${
              canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            aria-label="Scroll right"
          >
            <ChevronRight size={22} className="text-gray-700 dark:text-gray-300" />
          </button>
        </>
      )}

      {/* Scrollable Categories Container - dir="ltr" for consistent scroll in RTL pages */}
      <div
        ref={scrollContainerRef}
        dir="ltr"
        onScroll={checkScrollButtons}
        className="flex gap-3 sm:gap-4 md:gap-5 overflow-x-auto scroll-smooth scrollbar-hide py-2 px-2 sm:px-4"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {categories.map((category, index) => (
          <Link
            key={category.id}
            href={`/categories/${category.slug}`}
            className="group flex-shrink-0 w-[44vw] min-w-[140px] max-w-[200px] sm:w-[200px] sm:min-w-0 sm:max-w-none md:w-[220px] relative"
            style={{ scrollSnapAlign: index === 0 ? 'start' : 'center' }}
          >
            <div className="relative rounded-2xl overflow-hidden bg-white dark:bg-gray-800 shadow-md hover:shadow-2xl border border-gray-100 dark:border-gray-700 transition-all duration-500 ease-out group-hover:-translate-y-2 group-hover:border-orange-200 dark:group-hover:border-orange-800 group-hover:shadow-orange-100 dark:group-hover:shadow-orange-900/20">
              <div className="aspect-[4/3] relative overflow-hidden">
                {category.image ? (
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    sizes="(max-width: 640px) 200px, (max-width: 768px) 200px, 220px"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-400 via-orange-500 to-amber-600 flex items-center justify-center transition-all duration-500 group-hover:from-orange-500 group-hover:via-orange-600 group-hover:to-amber-700">
                    <span className="text-5xl sm:text-6xl opacity-90 transition-transform duration-500 group-hover:scale-110">
                      📁
                    </span>
                  </div>
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent transition-all duration-500 group-hover:from-black/70 group-hover:via-orange-900/20 group-hover:to-transparent" />

                {/* Category Info */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-base sm:text-lg font-bold text-white drop-shadow-lg transition-colors duration-300 group-hover:text-orange-50">
                    {category.name}
                  </h3>
                  {category.subcategoryCount > 0 && (
                    <p className="text-xs sm:text-sm text-white/80 mt-0.5">
                      {category.subcategoryCount} {category.subcategoryCount === 1 ? 'category' : 'categories'}
                    </p>
                  )}
                </div>

                {/* Hover Arrow */}
                <div className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ease-out">
                  <ArrowRight size={18} className="text-white" strokeWidth={2.5} />
                </div>

                {/* Bottom accent line on hover */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-amber-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
