'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TranslatedContent } from '@/components/ui/translated-content';

interface CarouselImage {
  id: string;
  url: string;
  order: number;
  linkUrl?: string | null;
}

interface HeroThumbnail {
  id: string;
  url: string;
  order: number;
  linkUrl?: string | null;
}

// Unified height: carousel and 2x2 thumbnails share same height on desktop
const CAROUSEL_HEIGHT = {
  mobile: 'h-[200px]',
  sm: 'sm:h-[260px]',
  md: 'md:h-[320px]',
  lg: 'lg:h-[380px]',
  xl: 'xl:h-[420px]',
};

export function HomeCarousel() {
  const [images, setImages] = useState<CarouselImage[]>([]);
  const [thumbnails, setThumbnails] = useState<HeroThumbnail[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedRef = useRef(false);
  const minSwipeDistance = 50;

  useEffect(() => {
    if (hasLoadedRef.current) return;
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [carouselRes, thumbRes] = await Promise.all([
          fetch('/api/carousel'),
          fetch('/api/hero-thumbnails'),
        ]);
        if (!carouselRes.ok) throw new Error('Failed to fetch carousel');
        const carouselData = await carouselRes.json();
        setImages(carouselData.images || []);

        if (thumbRes.ok) {
          const thumbData = await thumbRes.json();
          setThumbnails(thumbData.thumbnails || []);
        }
        hasLoadedRef.current = true;
      } catch (err) {
        console.error(err);
        setError('Failed to load');
        setImages([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (images.length <= 1) return;
    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [images.length]);

  const goToPrevious = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const goToNext = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const goToSlide = useCallback((index: number) => {
    if (index < 0 || index >= images.length) return;
    setCurrentIndex(index);
  }, [images.length]);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  const onTouchEnd = () => {
    if (touchStart == null || touchEnd == null) return;
    const d = touchStart - touchEnd;
    if (d > minSwipeDistance) goToNext();
    else if (d < -minSwipeDistance) goToPrevious();
  };

  if (isLoading) {
    return (
      <div className={`w-full flex flex-col lg:flex-row gap-2 lg:gap-3 ${CAROUSEL_HEIGHT.mobile} ${CAROUSEL_HEIGHT.sm} ${CAROUSEL_HEIGHT.md} ${CAROUSEL_HEIGHT.lg} ${CAROUSEL_HEIGHT.xl}`}>
        <div className="flex-1 min-h-0 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-xl" />
        <div className="grid grid-cols-2 grid-rows-2 lg:w-1/2 lg:h-full gap-2 lg:gap-3 min-h-[160px] lg:min-h-0 w-full">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="min-h-0 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`w-full ${CAROUSEL_HEIGHT.mobile} ${CAROUSEL_HEIGHT.sm} bg-gray-100 dark:bg-gray-900 rounded-xl flex items-center justify-center`}>
        <p className="text-gray-500 dark:text-gray-400 text-sm">{error}</p>
      </div>
    );
  }

  const hasCarousel = images.length > 0;
  const hasThumbnails = thumbnails.length > 0;

  return (
    <div
      className={`w-full flex flex-col lg:flex-row gap-2 lg:gap-3 ${CAROUSEL_HEIGHT.mobile} ${CAROUSEL_HEIGHT.sm} ${CAROUSEL_HEIGHT.md} ${CAROUSEL_HEIGHT.lg} ${CAROUSEL_HEIGHT.xl}`}
    >
      {/* Main Carousel - 50% on desktop, matches height of 2x2 thumbnails */}
      <div
        className={`relative overflow-hidden rounded-xl bg-white dark:bg-gray-900 shadow-lg ${hasThumbnails ? 'lg:w-1/2 lg:h-full' : 'flex-1'}`}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {hasCarousel ? (
          <>
            {/* Fade transition like Smartkoshk - crossfade between slides */}
            <div className="relative w-full h-full">
              {images.map((image, index) => (
                <div
                  key={image.id || index}
                  className="absolute inset-0 transition-opacity duration-700 ease-in-out"
                  style={{ opacity: index === currentIndex ? 1 : 0, pointerEvents: index === currentIndex ? 'auto' : 'none' }}
                >
                  <Image
                    src={image.url}
                    alt={`Slide ${index + 1}`}
                    fill
                    priority={index === 0}
                    className="object-contain object-center"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  {/* Buy Now button */}
                  {image.linkUrl && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 lg:bottom-6">
                      <Link
                        href={image.linkUrl}
                        className="inline-block px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-full shadow-lg transition-colors"
                      >
                        <TranslatedContent translationKey="home.buyNow" />
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {images.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition-colors hidden sm:flex"
                  aria-label="Previous"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition-colors hidden sm:flex"
                  aria-label="Next"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/20 backdrop-blur-sm rounded-full px-2 py-1">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => goToSlide(i)}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${i === currentIndex ? 'bg-white scale-110' : 'bg-white/60 hover:bg-white/80'}`}
                      aria-label={`Slide ${i + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
            No carousel images
          </div>
        )}
      </div>

      {/* Hero Thumbnails - 50% on desktop, 2x2 grid, same height as carousel */}
      {hasThumbnails && (
        <div className="grid grid-cols-2 grid-rows-2 lg:w-1/2 lg:h-full gap-2 lg:gap-3 w-full min-h-[160px] lg:min-h-0">
          {thumbnails
            .sort((a, b) => a.order - b.order)
            .map((thumb) => (
              <div key={thumb.id} className="relative rounded-xl overflow-hidden shadow-md min-h-0">
                {thumb.linkUrl ? (
                  <Link href={thumb.linkUrl} className="block absolute inset-0">
                    <Image
                      src={thumb.url}
                      alt=""
                      fill
                      className="object-cover transition-transform duration-300 hover:scale-105"
                      sizes="(max-width: 1024px) 50vw, 25vw"
                    />
                  </Link>
                ) : (
                  <Image
                    src={thumb.url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 50vw, 25vw"
                  />
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
