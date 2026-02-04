'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  productCount: number;
}

interface CategoriesCarouselProps {
  categories: Category[];
}

export function CategoriesCarousel({ categories }: CategoriesCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      const maxScrollLeft = scrollWidth - clientWidth;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft < maxScrollLeft - 5);
    }
  };

  useEffect(() => {
    const timer = setTimeout(checkScrollButtons, 100);
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollButtons);
      window.addEventListener('resize', checkScrollButtons);
      return () => {
        clearTimeout(timer);
        container.removeEventListener('scroll', checkScrollButtons);
        window.removeEventListener('resize', checkScrollButtons);
      };
    }
    return () => clearTimeout(timer);
  }, [categories]);

  const getScrollAmount = () => {
    if (typeof window === 'undefined') return 280;
    const w = window.innerWidth;
    if (w < 640) return 180; // ~one card (160) + gap
    if (w < 768) return 216; // 192 + gap
    return 312; // 288 + gap
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -getScrollAmount(),
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: getScrollAmount(),
        behavior: 'smooth'
      });
    }
  };



  return (
    <div className="relative px-2 sm:px-4">
      {/* Navigation Buttons - padded so they don't overlap first/last card */}
      {categories.length > 4 && (
        <>
          <button
            onClick={scrollLeft}
            disabled={!canScrollLeft}
            className={`absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white shadow-xl border border-gray-100 items-center justify-center transition-all duration-300 hover:scale-110 flex ${
              canScrollLeft 
                ? 'opacity-100 hover:bg-orange-50 hover:border-orange-200 hover:shadow-orange-100' 
                : 'opacity-40 cursor-not-allowed'
            }`}
            aria-label="Scroll left"
          >
            <ChevronLeft className={`w-5 h-5 sm:w-6 sm:h-6 ${canScrollLeft ? 'text-orange-600' : 'text-gray-400'}`} />
          </button>
          
          <button
            onClick={scrollRight}
            disabled={!canScrollRight}
            className={`absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white shadow-xl border border-gray-100 items-center justify-center transition-all duration-300 hover:scale-110 flex ${
              canScrollRight 
                ? 'opacity-100 hover:bg-orange-50 hover:border-orange-200 hover:shadow-orange-100' 
                : 'opacity-40 cursor-not-allowed'
            }`}
            aria-label="Scroll right"
          >
            <ChevronRight className={`w-5 h-5 sm:w-6 sm:h-6 ${canScrollRight ? 'text-orange-600' : 'text-gray-400'}`} />
          </button>
        </>
      )}

      {/* Scrollable Categories Container - dir="ltr" for consistent scroll in RTL pages */}
      <div
        ref={scrollContainerRef}
        dir="ltr"
        onScroll={checkScrollButtons}
        className="flex gap-3 sm:gap-5 md:gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4 pt-1 px-1 sm:px-2"
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
            className="group flex-shrink-0 w-[42vw] min-w-[140px] max-w-[180px] sm:w-48 sm:min-w-0 sm:max-w-none md:w-56 lg:w-72 relative"
            style={{ scrollSnapAlign: index === 0 ? 'start' : 'center' }}
          >
            <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform group-hover:-translate-y-2 group-hover:scale-105 border border-gray-100">
              <div className="aspect-[4/3] relative overflow-hidden">
                {category.image && (
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover transition-all duration-700 group-hover:scale-125 group-hover:rotate-2"
                    sizes="(max-width: 640px) 180px, (max-width: 768px) 192px, (max-width: 1024px) 224px, 288px"
                  />
                )}
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-all duration-500 group-hover:from-orange-900/60 group-hover:via-orange-600/10" />
                
                {/* Category Name */}
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-6">
                  <h3 className="text-lg sm:text-2xl font-bold text-white drop-shadow-lg transition-all duration-500 group-hover:text-orange-100 group-hover:transform group-hover:scale-110">
                    {category.name}
                  </h3>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110" />
                <div className="absolute top-4 left-4 w-6 h-6 bg-orange-500/30 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-700 delay-100" />
              </div>
              
              {/* Bottom Section with Border */}
              <div className="h-2 bg-gradient-to-r from-orange-500 to-red-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 