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
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      const newScrollLeft = scrollContainerRef.current.scrollLeft + 
        (direction === 'left' ? -scrollAmount : scrollAmount);
      
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    checkScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollButtons);
      return () => container.removeEventListener('scroll', checkScrollButtons);
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
    <div className="relative">
      {/* Left Arrow */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 sm:p-3 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 hover:border-orange-300"
          aria-label="Scroll left"
        >
          <ChevronLeft size={20} className="text-gray-700" />
        </button>
      )}

      {/* Right Arrow */}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 sm:p-3 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 hover:border-orange-300"
          aria-label="Scroll right"
        >
          <ChevronRight size={20} className="text-gray-700" />
        </button>
      )}

      {/* Scrollable Brands Container */}
      <div
        ref={scrollContainerRef}
        onScroll={checkScrollButtons}
        className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide pb-4 px-4"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {brands.map((brandGroup) => (
          <Link
            key={brandGroup.brand}
            href={`/brands/${encodeURIComponent(brandGroup.brand.toLowerCase())}`}
            className="group flex-shrink-0 w-48 sm:w-56 lg:w-64 relative"
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
