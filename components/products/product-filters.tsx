'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { useTranslation } from '@/hooks/use-translation';
import { ChevronDown, ChevronUp, Filter, X } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
}

interface ProductFiltersProps {
  parentCategories: Category[];
  maxPrice: number;
}

export function ProductFilters({
  parentCategories,
  maxPrice,
}: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  const effectiveMax = maxPrice || 10000;

  const parentCategoryParam = searchParams.get('parentCategory') || '';
  const minPriceParam = searchParams.get('minPrice');
  const maxPriceParam = searchParams.get('maxPrice');
  const hasSaleParam = searchParams.get('hasSale') === 'true' || searchParams.get('hasSale') === '1';

  const [parentCategory, setParentCategory] = useState(parentCategoryParam);
  const [priceRange, setPriceRange] = useState<number[]>([
    minPriceParam && !isNaN(parseFloat(minPriceParam)) ? parseFloat(minPriceParam) : 0,
    maxPriceParam && !isNaN(parseFloat(maxPriceParam)) ? parseFloat(maxPriceParam) : effectiveMax,
  ]);
  const [hasSale, setHasSale] = useState(hasSaleParam);

  useEffect(() => {
    setParentCategory(parentCategoryParam);
    const min = minPriceParam && !isNaN(parseFloat(minPriceParam)) ? parseFloat(minPriceParam) : 0;
    const max = maxPriceParam && !isNaN(parseFloat(maxPriceParam)) ? parseFloat(maxPriceParam) : effectiveMax;
    setPriceRange([min, max]);
    setHasSale(hasSaleParam);
  }, [parentCategoryParam, minPriceParam, maxPriceParam, hasSaleParam, effectiveMax]);

  const buildParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '') {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      params.delete('page');
      return params.toString();
    },
    [searchParams]
  );

  const applyFilters = () => {
    const params = buildParams({
      parentCategory: parentCategory || null,
      minPrice: priceRange[0] > 0 ? priceRange[0].toString() : null,
      maxPrice: priceRange[1] < (maxPrice || 10000) ? priceRange[1].toString() : null,
      hasSale: hasSale ? 'true' : null,
    });
    router.push(`/products?${params}`);
  };

  const clearFilters = () => {
    setParentCategory('');
    setPriceRange([0, maxPrice || 10000]);
    setHasSale(false);
    router.push('/products');
  };

  const hasActiveFilters =
    searchParams.get('parentCategory') ||
    searchParams.get('hasSale') ||
    (minPriceParam && parseFloat(minPriceParam) > 0) ||
    (maxPriceParam && parseFloat(maxPriceParam) < (maxPrice || 10000));

  const FilterSection = ({
    titleKey,
    children,
    defaultOpen = true,
  }: {
    titleKey: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
  }) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center justify-between w-full py-2 text-left font-medium text-gray-900 dark:text-gray-100"
        >
          {t(titleKey)}
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {open && <div className="pt-1">{children}</div>}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-orange-600" />
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {t('products.filters')}
          </span>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700"
          >
            <X className="w-4 h-4" />
            {t('products.resetFilters')}
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Category (parent categories) */}
        {parentCategories.length > 0 && (
          <FilterSection titleKey="products.filterCategory">
            <select
              value={parentCategory}
              onChange={(e) => setParentCategory(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
            >
              <option value="">{t('products.filterAllCategories')}</option>
              {parentCategories.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </FilterSection>
        )}

        {/* Price Range */}
        {maxPrice > 0 && (
          <FilterSection titleKey="products.priceRange">
            <div className="space-y-3">
              <Slider
                value={priceRange}
                onChange={(v: number[]) => setPriceRange(v)}
                min={0}
                max={maxPrice}
                step={Math.max(1, Math.floor((maxPrice || 10000) / 100))}
              />
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>EGP {priceRange[0].toLocaleString()}</span>
                <span>EGP {priceRange[1].toLocaleString()}</span>
              </div>
            </div>
          </FilterSection>
        )}

        {/* Has Sale */}
        <FilterSection titleKey="products.filterHasSale">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={hasSale}
              onChange={(e) => setHasSale(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {t('products.filterHasSale')}
            </span>
          </label>
        </FilterSection>

        {/* Apply Filters button */}
        <button
          type="button"
          onClick={applyFilters}
          className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {t('products.applyFilters')}
        </button>
      </div>
    </div>
  );
}
