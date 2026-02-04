'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCard } from '@/components/products/product-card';

type ProductForCard = {
  id: string;
  name: string;
  description: string;
  price: number;
  salePrice?: number | null;
  taxStatus?: 'PAID' | 'UNPAID' | null;
  saleEndDate?: string | null;
  images: string[];
  slug: string;
  variants?: Array<{ id: string; color: string; quantity: number }>;
  storages?: Array<{
    id: string;
    size: string;
    price: number;
    salePercentage?: number | null;
    saleEndDate?: string | null;
    units?: Array<{
      id: string;
      color: string;
      stock: number;
      taxStatus: string;
      taxType: string;
      taxAmount?: number | null;
      taxPercentage?: number | null;
    }>;
  }>;
};

interface ProductsHorizontalScrollProps {
  products: ProductForCard[];
  /** Max number of products visible in the viewport at once (e.g. 6). Default: no limit. */
  maxVisible?: number;
}

export function ProductsHorizontalScroll({ products, maxVisible }: ProductsHorizontalScrollProps) {
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
  }, [products]);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (container) {
      const cardWidth = 200;
      const gap = 16;
      const scrollAmount = cardWidth + gap;
      const scrollValue = direction === 'left' ? -scrollAmount : scrollAmount;
      container.scrollBy({
        left: scrollValue,
        behavior: 'smooth',
      });
    }
  };

  if (products.length === 0) return null;

  // Width for maxVisible cards: N * 200px + (N-1) * 16px gap. For 6: 1280px
  const containerMaxWidth = maxVisible ? `${maxVisible * 200 + (maxVisible - 1) * 16}px` : undefined;

  return (
    <div
      className={`relative ${containerMaxWidth ? 'mx-auto' : '-mx-2 sm:-mx-4'}`}
      style={containerMaxWidth ? { maxWidth: containerMaxWidth } : undefined}
    >
      {/* Left gradient fade */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-12 z-10 bg-gradient-to-r from-white dark:from-gray-900 to-transparent pointer-events-none transition-opacity duration-300 ${
          canScrollLeft ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Right gradient fade */}
      <div
        className={`absolute right-0 top-0 bottom-0 w-12 z-10 bg-gradient-to-l from-white dark:from-gray-900 to-transparent pointer-events-none transition-opacity duration-300 ${
          canScrollRight ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Scroll Buttons */}
      {products.length > 2 && (
        <>
          <button
            onClick={() => scroll('left')}
            className={`absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700 flex items-center justify-center transition-all duration-300 hover:scale-110 ${
              canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            aria-label="Scroll left"
          >
            <ChevronLeft size={22} className="text-gray-700 dark:text-gray-300" />
          </button>

          <button
            onClick={() => scroll('right')}
            className={`absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700 flex items-center justify-center transition-all duration-300 hover:scale-110 ${
              canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            aria-label="Scroll right"
          >
            <ChevronRight size={22} className="text-gray-700 dark:text-gray-300" />
          </button>
        </>
      )}

      {/* Scrollable Products Container - dir="ltr" forces consistent scroll behavior in RTL pages */}
      <div
        ref={scrollContainerRef}
        dir="ltr"
        onScroll={checkScrollButtons}
        className="flex gap-4 overflow-x-auto scroll-smooth scrollbar-hide py-2 px-2 sm:px-4"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          scrollSnapType: 'x mandatory',
        }}
      >
        {products.map((product, index) => (
          <div
            key={product.id}
            className="flex-shrink-0 w-[180px] sm:w-[200px]"
            style={{ scrollSnapAlign: index === 0 ? 'start' : 'center' }}
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
}
