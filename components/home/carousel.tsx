'use client';

import React, { useState, useEffect, useCallback, useRef, TouchEvent } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CarouselImage {
  id: string;
  url: string;
  order: number;
}

export function HomeCarousel() {
  const [images, setImages] = useState<CarouselImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  // Required minimum swipe distance
  const minSwipeDistance = 50;

  // Fetch carousel images from the API
  useEffect(() => {
    const fetchCarouselImages = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/carousel');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch carousel images: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Ensure we have a valid images array
        if (!data || !data.images || !Array.isArray(data.images)) {
          console.warn('Invalid carousel data format', data);
          setImages([]);
        } else {
          setImages(data.images);
        }
      } catch (error) {
        console.error('Error fetching carousel images:', error);
        setError('Failed to load carousel images');
        setImages([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCarouselImages();
  }, []);

  // Auto-advance the carousel every 5 seconds
  useEffect(() => {
    if (images.length <= 1) return;
    
    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000);
    
    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [images.length]);

  // Navigation handlers
  const goToPrevious = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  }, [images.length]);

  const goToNext = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((prevIndex) => 
      (prevIndex + 1) % images.length
    );
  }, [images.length]);

  const goToSlide = useCallback((index: number) => {
    if (index < 0 || index >= images.length) return;
    setCurrentIndex(index);
  }, [images.length]);

  // Touch handlers for mobile swipe
  const onTouchStart = (e: TouchEvent) => {
    setTouchEnd(null); // Reset touchEnd
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    // Reset after swipe detection
    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }
  };

  // If we're still loading, show a placeholder
  if (isLoading) {
    return (
      <div className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] bg-gray-200 animate-pulse rounded-lg">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-400">Loading carousel...</div>
        </div>
      </div>
    );
  }

  // If there was an error, show error message
  if (error) {
    return (
      <div className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] bg-gray-100 rounded-lg">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-500">{error}</div>
        </div>
      </div>
    );
  }

  // If there are no images, show a placeholder
  if (images.length === 0) {
    return (
      <div className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] bg-gray-100 rounded-lg">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-500">No carousel images available</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden rounded-lg"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Main Carousel Image */}
      <div className="relative w-full h-full">
        {images.map((image, index) => (
          <div 
            key={image.id || `img-${index}`}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === currentIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <Image
              src={image.url}
              alt={`Carousel image ${index + 1}`}
              fill
              priority={index === currentIndex}
              className="object-cover object-center"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 100vw, (max-width: 1024px) 100vw, 1280px"
            />
          </div>
        ))}
      </div>

      {/* Navigation Arrows - Hide on mobile */}
      {images.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 focus:outline-none transition-colors hidden sm:block"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 focus:outline-none transition-colors hidden sm:block"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Indicator Dots */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-colors ${
                index === currentIndex 
                  ? 'bg-white' 
                  : 'bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

