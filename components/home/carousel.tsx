'use client';

import React, { useState, useEffect, useCallback, useRef, TouchEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CarouselImage {
  id: string;
  url: string;
  order: number;
  linkUrl?: string | null;
}

export function HomeCarousel() {
  const [images, setImages] = useState<CarouselImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedRef = useRef(false);

  // Required minimum swipe distance
  const minSwipeDistance = 50;

  // Fetch carousel images from the API
  useEffect(() => {
    const fetchCarouselImages = async () => {
      // Prevent multiple simultaneous requests
      if (hasLoadedRef.current) return;
      
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
        
        hasLoadedRef.current = true;
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
      <div className="relative w-full max-w-none lg:max-w-screen-2xl xl:max-w-full mx-auto h-[200px] xs:h-[250px] sm:h-[350px] md:h-[450px] lg:h-[550px] xl:h-[650px] 2xl:h-[700px] bg-gray-200 dark:bg-gray-800 animate-pulse rounded-xl shadow-lg">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-400 dark:text-gray-600 text-sm md:text-base">Loading carousel...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative w-full max-w-none lg:max-w-screen-2xl xl:max-w-full mx-auto h-[200px] xs:h-[250px] sm:h-[350px] md:h-[450px] lg:h-[550px] xl:h-[650px] 2xl:h-[700px] bg-gray-100 dark:bg-gray-900 rounded-xl shadow-lg">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-500 dark:text-gray-400 text-sm md:text-base text-center px-4">{error}</div>
        </div>
      </div>
    );
  }

  // If there are no images, show a placeholder
  if (images.length === 0) {
    return (
      <div className="relative w-full max-w-none lg:max-w-screen-2xl xl:max-w-full mx-auto h-[200px] xs:h-[250px] sm:h-[350px] md:h-[450px] lg:h-[550px] xl:h-[650px] 2xl:h-[700px] bg-gray-100 dark:bg-gray-900 rounded-xl shadow-lg">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-500 dark:text-gray-400 text-sm md:text-base text-center px-4">No carousel images available</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full max-w-none lg:max-w-screen-2xl xl:max-w-full mx-auto h-[200px] xs:h-[250px] sm:h-[350px] md:h-[450px] lg:h-[550px] xl:h-[650px] 2xl:h-[700px] overflow-hidden rounded-xl bg-white dark:bg-gray-900 shadow-lg hover:shadow-xl transition-shadow duration-300"
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
            {image.linkUrl ? (
              <Link
                href={image.linkUrl}
                aria-label={`View details for slide ${index + 1}`}
                className="block h-full w-full"
              >
                <Image
                  src={image.url}
                  alt={`Carousel image ${index + 1}`}
                  fill
                  priority={index === currentIndex}
                  className="object-contain object-center transition-all duration-300 cursor-pointer"
                  sizes="(max-width: 480px) 100vw, (max-width: 768px) 100vw, (max-width: 1024px) 100vw, (max-width: 1280px) 100vw, 1400px"
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyb5bt69OuuIyn0lcgezo9vFJs/1pSMicp6lSNRV4+0Ob/7fZvP3wZqBw=="
                />
              </Link>
            ) : (
              <Image
                src={image.url}
                alt={`Carousel image ${index + 1}`}
                fill
                priority={index === currentIndex}
                className="object-contain object-center transition-all duration-300"
                sizes="(max-width: 480px) 100vw, (max-width: 768px) 100vw, (max-width: 1024px) 100vw, (max-width: 1280px) 100vw, 1400px"
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyb5bt69OuuIyn0lcgezo9vFJs/1pSMicp6lSNRV4+0Ob/7fZvP3wZqBw=="
              />
            )}
          </div>
        ))}
      </div>

      {/* Navigation Arrows - Responsive sizing */}
      {images.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 md:p-2 focus:outline-none transition-all duration-200 hidden sm:flex items-center justify-center backdrop-blur-sm"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-4 w-4 md:h-6 md:w-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 md:p-2 focus:outline-none transition-all duration-200 hidden sm:flex items-center justify-center backdrop-blur-sm"
            aria-label="Next slide"
          >
            <ChevronRight className="h-4 w-4 md:h-6 md:w-6" />
          </button>
        </>
      )}

      {/* Indicator Dots - Responsive sizing and positioning */}
      {images.length > 1 && (
        <div className="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 flex space-x-1.5 md:space-x-2 bg-black/20 backdrop-blur-sm rounded-full px-2 py-1">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 md:w-2.5 md:h-2.5 lg:w-3 lg:h-3 rounded-full transition-all duration-200 ${
                index === currentIndex 
                  ? 'bg-white scale-110' 
                  : 'bg-white/60 hover:bg-white/80 hover:scale-105'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

