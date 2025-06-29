'use client';

import { useState, useRef } from 'react';
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
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -320,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 320,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="relative px-4">
      {/* Navigation Buttons */}
      {categories.length > 4 && (
        <>
          <button
            onClick={scrollLeft}
            disabled={!canScrollLeft}
            className={`absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white shadow-xl border border-gray-100 flex items-center justify-center transition-all duration-300 hover:scale-110 ${
              canScrollLeft 
                ? 'opacity-100 hover:bg-orange-50 hover:border-orange-200 hover:shadow-orange-100' 
                : 'opacity-40 cursor-not-allowed'
            }`}
          >
            <ChevronLeft className={`w-6 h-6 ${canScrollLeft ? 'text-orange-600' : 'text-gray-400'}`} />
          </button>
          
          <button
            onClick={scrollRight}
            disabled={!canScrollRight}
            className={`absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white shadow-xl border border-gray-100 flex items-center justify-center transition-all duration-300 hover:scale-110 ${
              canScrollRight 
                ? 'opacity-100 hover:bg-orange-50 hover:border-orange-200 hover:shadow-orange-100' 
                : 'opacity-40 cursor-not-allowed'
            }`}
          >
            <ChevronRight className={`w-6 h-6 ${canScrollRight ? 'text-orange-600' : 'text-gray-400'}`} />
          </button>
        </>
      )}

      {/* Scrollable Categories Container */}
      <div
        ref={scrollContainerRef}
        onScroll={checkScrollButtons}
        className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 px-8"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/categories/${category.slug}`}
            className="group flex-shrink-0 w-72 relative"
          >
            <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform group-hover:-translate-y-2 group-hover:scale-105 border border-gray-100">
              <div className="aspect-[4/3] relative overflow-hidden">
                {category.image && (
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover transition-all duration-700 group-hover:scale-125 group-hover:rotate-2"
                    sizes="288px"
                  />
                )}
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-all duration-500 group-hover:from-orange-900/60 group-hover:via-orange-600/10" />
                
                {/* Category Name */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-2xl font-bold text-white drop-shadow-lg transition-all duration-500 group-hover:text-orange-100 group-hover:transform group-hover:scale-110">
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

      {/* Custom scrollbar hiding styles */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
} 