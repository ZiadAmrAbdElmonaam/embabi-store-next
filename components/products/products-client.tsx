'use client';

import { ProductGrid } from "@/components/products/product-grid";
import { ProductFilters } from "@/components/products/product-filters";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { TranslatedContent } from "@/components/ui/translated-content";

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
}

interface ProductsClientProps {
  initialProducts: any[];
  parentCategories: Category[];
  maxPrice: number;
  isAdmin: boolean;
  searchParams: {
    page?: string;
    minPrice?: string;
    maxPrice?: string;
    parentCategory?: string;
    hasSale?: string;
  };
  totalPages: number;
}

export function ProductsClient({ 
  initialProducts, 
  parentCategories,
  subcategories,
  maxPrice, 
  isAdmin,
  searchParams,
  totalPages
}: ProductsClientProps) {
  const router = useRouter();
  const searchParamsObj = useSearchParams();
  const currentPage = Number(searchParams.page) || 1;
  
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParamsObj.toString());
    params.set('page', page.toString());
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            <TranslatedContent translationKey="products.allProducts" />
          </h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-72 flex-shrink-0">
            <div className="lg:sticky lg:top-24">
              <ProductFilters
                parentCategories={parentCategories}
                maxPrice={maxPrice}
              />
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            {initialProducts.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400">
                  <TranslatedContent translationKey="products.noProductsFound" />
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Try adjusting your filters</p>
              </div>
            ) : (
              <ProductGrid products={initialProducts} />
            )}

            {totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center gap-4">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            <div className="flex items-center gap-2">
              {[...Array(totalPages)].map((_, i) => {
                const page = i + 1;
                const isCurrentPage = page === currentPage;
                
                return (
                  <button
                    key={i}
                    onClick={() => handlePageChange(page)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isCurrentPage
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
} 