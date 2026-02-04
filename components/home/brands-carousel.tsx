'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { BrandGroup, getBrandTheme, formatBrandName } from '@/lib/brand-utils';

interface BrandsCarouselProps {
  brands: BrandGroup[];
}

export function BrandsCarousel({ brands }: BrandsCarouselProps) {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      const maxScroll = scrollWidth - clientWidth;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < maxScroll - 1);
    }
  };

  const getScrollAmount = () => {
    if (typeof window === 'undefined') return 220;
    const w = window.innerWidth;
    if (w < 640) return 208;   // 192 + gap
    if (w < 1024) return 232;  // 224 + gap
    return 268;                 // 256 + gap
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
  }, [brands]);

  if (brands.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12">
        <div className="text-4xl sm:text-5xl mb-4">🏷️</div>
        <p className="text-gray-500 text-base sm:text-lg">No brands available yet.</p>
        <p className="text-gray-400 text-sm mt-2">Add some branded categories to see them here.</p>
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

      {/* Scrollable Brands Container - dir="ltr" for consistent scroll in RTL pages */}
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
        {brands.map((brandGroup, index) => (
          <Link
            key={brandGroup.brand}
            href={`/brands/${encodeURIComponent(brandGroup.brand.toLowerCase())}`}
            className="group flex-shrink-0 w-[42vw] min-w-[150px] max-w-[192px] sm:w-48 sm:min-w-0 sm:max-w-none md:w-56 lg:w-64 relative"
            style={{ scrollSnapAlign: index === 0 ? 'start' : 'center' }}
          >
            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform group-hover:-translate-y-1 group-hover:scale-105">
              <div className="aspect-[4/3] relative overflow-hidden">
                {/* Brand Icon Background */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-6xl sm:text-7xl text-white/20">
                    {brandGroup.icon}
                  </span>
                </div>
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-all duration-500 group-hover:from-orange-900/60" />
                
                {/* Brand Info */}
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                  <h3 className="text-lg sm:text-xl font-bold text-white drop-shadow-lg mb-1">
                    {formatBrandName(brandGroup.brand)}
                  </h3>
                  <p className="text-white/90 text-sm drop-shadow-md">
                    {brandGroup.totalProducts} products
                  </p>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500">
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-white text-sm">→</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
