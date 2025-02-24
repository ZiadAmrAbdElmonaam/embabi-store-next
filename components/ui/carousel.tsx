'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const slides = [
  {
    image: '/carousel/slide1.jpg',
    title: 'Latest iPhones',
    description: 'Discover the newest iPhone models with amazing features'
  },
  {
    image: '/carousel/slide2.jpg',
    title: 'Premium Tablets',
    description: 'Experience the best tablets for work and entertainment'
  },
  {
    image: '/carousel/slide3.jpg',
    title: 'Tech Accessories',
    description: 'Complete your tech collection with premium accessories'
  }
];

export function Carousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((current) => (current === slides.length - 1 ? 0 : current + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const previousSlide = () => {
    setCurrent(current === 0 ? slides.length - 1 : current - 1);
  };

  const nextSlide = () => {
    setCurrent(current === slides.length - 1 ? 0 : current + 1);
  };

  return (
    <div className="relative h-[70vh]">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600 opacity-90" />
      
      {/* Carousel Content */}
      <div className="relative h-full flex items-center">
        <div className="absolute inset-0 flex items-center justify-between px-4">
          <button
            onClick={previousSlide}
            className="p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={nextSlide}
            className="p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center">
            <div className="text-white space-y-6 max-w-2xl">
              <h1 className="text-5xl font-bold leading-tight">
                {slides[current].title}
              </h1>
              <p className="text-xl opacity-90">
                {slides[current].description}
              </p>
              <button className="bg-white text-red-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition">
                Shop Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Carousel Indicators */}
      <div className="absolute bottom-4 left-0 right-0">
        <div className="flex justify-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              className={`w-3 h-3 rounded-full transition ${
                index === current ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
} 