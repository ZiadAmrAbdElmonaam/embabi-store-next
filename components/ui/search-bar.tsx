'use client';

import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { useTranslation } from "@/hooks/use-translation";
import { TranslatedContent } from "@/components/ui/translated-content";
import Image from "next/image";
import Link from "next/link";
import { translations } from "@/lib/translations";

type SearchResult = {
  products: Array<{
    id: string;
    name: string;
    slug: string;
    price: string;
    images: string[];
    thumbnails: string[];
    category: {
      name: string;
      slug: string;
    };
  }>;
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    image: string | null;
  }>;
};

interface SearchBarProps {
  isScrolled?: boolean;
}

export function SearchBar({ isScrolled = false }: SearchBarProps) {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult>({ products: [], categories: [] });
  const debouncedValue = useDebounce(value, 300);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { lang } = useTranslation();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      if (!debouncedValue) {
        setResults({ products: [], categories: [] });
        setIsOpen(false);
        return;
      }

      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(debouncedValue)}`);
        const data = await response.json();
        setResults(data);
        setIsOpen(true);
      } catch (error) {
        console.error('Search error:', error);
      }
    };

    fetchResults();
  }, [debouncedValue]);

  const handleClear = () => {
    setValue('');
    setResults({ products: [], categories: [] });
    setIsOpen(false);
  };

  const formatPrice = (priceStr: string) => {
    const price = parseFloat(priceStr);
    return price.toFixed(2);
  };

  const showNoResults = isOpen && value && results.products.length === 0 && results.categories.length === 0;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative flex items-center">
        <div className="relative flex-1">
          <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 transition-all duration-300 ${
            isScrolled ? 'h-4 w-4' : 'h-5 w-5'
          }`} />
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={translations[lang].navbar.searchPlaceholder}
            className={`w-full border-2 border-white focus:outline-none focus:border-orange-400 text-base shadow-lg transition-all duration-300 ${
              isScrolled 
                ? 'pl-10 pr-10 py-2 rounded-full text-sm' 
                : 'pl-12 pr-12 py-3 rounded-full text-base'
            }`}
          />
          {value && (
            <button
              onClick={handleClear}
              className={`absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-all duration-300 ${
                isScrolled ? 'h-4 w-4' : 'h-5 w-5'
              }`}
            >
              <X className="h-full w-full" />
            </button>
          )}
        </div>
      </div>

      {(isOpen && (results.products.length > 0 || results.categories.length > 0) || showNoResults) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border z-50 max-h-[60vh] sm:max-h-[70vh] overflow-y-auto">
          {showNoResults ? (
            <div className="p-8 text-center text-gray-500">
              <TranslatedContent translationKey="navbar.searchNoResults" />
            </div>
          ) : (
            <>
              <div className="flex border-b sticky top-0 bg-white z-10">
                <button
                  className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'products'
                      ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveTab('products')}
                >
                  <TranslatedContent translationKey="navbar.searchProducts" /> ({results.products.length})
                </button>
                <button
                  className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'categories'
                      ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveTab('categories')}
                >
                  <TranslatedContent translationKey="navbar.searchCategories" /> ({results.categories.length})
                </button>
              </div>

              <div className="p-2">
                {activeTab === 'products' && (
                  <div className="space-y-2">
                    {results.products.map((product) => (
                      <Link
                        key={product.id}
                        href={`/products/${product.slug}`}
                        className="flex items-center p-3 hover:bg-orange-50 rounded-xl transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        {product.thumbnails[0] && (
                          <div className="flex-shrink-0 w-16 h-16 relative rounded-lg overflow-hidden">
                            <Image
                              src={product.thumbnails[0]}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="ml-4 flex-1 min-w-0">
                          <h4 className="text-base font-medium text-gray-900 truncate">{product.name}</h4>
                          <p className="text-sm text-gray-500 truncate">
                            <TranslatedContent translationKey="navbar.searchInCategory" /> {product.category.name}
                          </p>
                          <p className="text-base font-medium text-orange-600">
                            ${formatPrice(product.price)}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {activeTab === 'categories' && (
                  <div className="space-y-2">
                    {results.categories.map((category) => (
                      <Link
                        key={category.id}
                        href={`/categories/${category.slug}`}
                        className="flex items-center p-3 hover:bg-orange-50 rounded-xl transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        {category.image && (
                          <div className="flex-shrink-0 w-16 h-16 relative rounded-lg overflow-hidden">
                            <Image
                              src={category.image}
                              alt={category.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="ml-4">
                          <h4 className="text-base font-medium text-gray-900">{category.name}</h4>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
} 