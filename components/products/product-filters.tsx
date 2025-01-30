'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';

interface ProductFiltersProps {
  categories: Array<{ id: string; name: string }>;
  maxPrice: number;
}

export function ProductFilters({ categories, maxPrice }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [priceRange, setPriceRange] = useState([0, maxPrice]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set('minPrice', priceRange[0].toString());
    params.set('maxPrice', priceRange[1].toString());
    router.push(`/products?${params.toString()}`);
  }, [priceRange, router, searchParams]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Categories</h3>
        <div className="space-y-2">
          {categories.map((category) => (
            <label key={category.id} className="flex items-center">
              <input
                type="checkbox"
                checked={searchParams.get('category') === category.id}
                onChange={(e) => {
                  const params = new URLSearchParams(searchParams);
                  if (e.target.checked) {
                    params.set('category', category.id);
                  } else {
                    params.delete('category');
                  }
                  router.push(`/products?${params.toString()}`);
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2">{category.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Price Range</h3>
        <Slider
          value={priceRange}
          onChange={setPriceRange}
          min={0}
          max={maxPrice}
          step={100}
        />
        <div className="flex justify-between mt-2">
          <span>${priceRange[0]}</span>
          <span>${priceRange[1]}</span>
        </div>
      </div>
    </div>
  );
} 