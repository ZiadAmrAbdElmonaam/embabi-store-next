'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Category } from '@prisma/client';

interface ProductFiltersProps {
  categories: Category[];
}

export function ProductFilters({ categories }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleCategoryChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('category', value);
    } else {
      params.delete('category');
    }
    router.push(`/products?${params.toString()}`);
  };

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('sort', value);
    } else {
      params.delete('sort');
    }
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="flex gap-4">
      <select
        className="border rounded-md px-2 py-1"
        onChange={(e) => handleCategoryChange(e.target.value)}
        value={searchParams.get('category') || ''}
      >
        <option value="">All Categories</option>
        {categories.map((category) => (
          <option key={category.id} value={category.slug}>
            {category.name}
          </option>
        ))}
      </select>

      <select
        className="border rounded-md px-2 py-1"
        onChange={(e) => handleSortChange(e.target.value)}
        value={searchParams.get('sort') || ''}
      >
        <option value="">Latest</option>
        <option value="price_asc">Price: Low to High</option>
        <option value="price_desc">Price: High to Low</option>
      </select>
    </div>
  );
} 