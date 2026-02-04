'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from '@/hooks/use-translation';

interface Subcategory {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  productCount: number;
}

interface SubcategoriesCarouselProps {
  subcategories: Subcategory[];
}

export function SubcategoriesCarousel({ subcategories }: SubcategoriesCarouselProps) {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  const getScrollAmount = () => {
    if (typeof window === 'undefined') return 220;
    const w = window.innerWidth;
    if (w < 640) return 208;
    if (w < 1024) return 232;
    return 268;
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollValue = direction === 'left' ? -getScrollAmount() : getScrollAmount();
      scrollContainerRef.current.scrollBy({
        left: scrollValue,
        behavior: 'smooth'
      });
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
  }, [subcategories]);

  if (subcategories.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12 bg-white rounded-2xl shadow-sm">
        <div className="text-4xl sm:text-5xl mb-4">📦</div>
        <p className="text-gray-500 text-base sm:text-lg">No subcategories available yet.</p>
        <p className="text-gray-400 text-sm mt-2">Create some subcategories to see them here.</p>
      </div>
    );
  }

  return (
    <div className="relative px-2 sm:px-4">
      {/* Left Arrow */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 hover:border-orange-300 flex items-center justify-center"
          aria-label="Scroll left"
        >
          <ChevronLeft size={20} className="text-gray-700" />
        </button>
      )}

      {/* Right Arrow */}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 hover:border-orange-300 flex items-center justify-center"
          aria-label="Scroll right"
        >
          <ChevronRight size={20} className="text-gray-700" />
        </button>
      )}

      {/* Scrollable Subcategories Container - dir="ltr" for consistent scroll in RTL pages */}
      <div
        ref={scrollContainerRef}
        dir="ltr"
        onScroll={checkScrollButtons}
        className="flex gap-3 sm:gap-4 md:gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4 pt-1 px-1 sm:px-2"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {subcategories.map((subcategory, index) => (
          <Link
            key={subcategory.id}
            href={`/categories/${subcategory.slug}`}
            className="group flex-shrink-0 w-[42vw] min-w-[150px] max-w-[192px] sm:w-48 sm:min-w-0 sm:max-w-none md:w-56 lg:w-64 relative"
            style={{ scrollSnapAlign: index === 0 ? 'start' : 'center' }}
          >
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform group-hover:-translate-y-1 border border-gray-100 hover:border-orange-200">
              <div className="aspect-[4/3] relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                {subcategory.image ? (
                  <Image
                    src={subcategory.image}
                    alt={subcategory.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 192px, (max-width: 1024px) 224px, 256px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-4xl text-gray-400">📂</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Product Count Badge */}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1">
                  <span className="text-xs font-medium text-gray-700">
                    {subcategory.productCount}
                  </span>
                </div>
              </div>
              
              <div className="p-4 sm:p-5">
                <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-1 group-hover:text-orange-600 transition-colors truncate">
                  {subcategory.name}
                </h3>
                <p className="text-sm text-gray-500">
                  {subcategory.productCount} {subcategory.productCount === 1 ? t('home.product') : t('home.products')}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
