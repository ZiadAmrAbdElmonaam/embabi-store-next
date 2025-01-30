'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type SortOption = {
  label: string;
  value: string;
};

const sortOptions: SortOption[] = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Most Popular', value: 'popular' },
];

export function ProductSort() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSort = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', value);
    router.push(`/products?${params.toString()}`);
  };

  return (
    <select
      value={searchParams.get('sort') || 'newest'}
      onChange={(e) => handleSort(e.target.value)}
      className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {sortOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
} 