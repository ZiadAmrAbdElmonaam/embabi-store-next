'use client';

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/use-debounce";

export function PriceRange() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [min, setMin] = useState(searchParams.get('min') || '');
  const [max, setMax] = useState(searchParams.get('max') || '');
  
  const debouncedMin = useDebounce(min, 500);
  const debouncedMax = useDebounce(max, 500);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (debouncedMin) params.set('min', debouncedMin);
    else params.delete('min');
    if (debouncedMax) params.set('max', debouncedMax);
    else params.delete('max');
    router.push(`/products?${params.toString()}`);
  }, [debouncedMin, debouncedMax, router, searchParams]);

  return (
    <div className="space-y-2">
      <h3 className="font-semibold">Price Range</h3>
      <div className="flex gap-2 items-center">
        <input
          type="number"
          value={min}
          onChange={(e) => setMin(e.target.value)}
          placeholder="Min"
          className="w-24 px-2 py-1 border rounded"
        />
        <span>-</span>
        <input
          type="number"
          value={max}
          onChange={(e) => setMax(e.target.value)}
          placeholder="Max"
          className="w-24 px-2 py-1 border rounded"
        />
      </div>
    </div>
  );
} 