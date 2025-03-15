'use client';

import { useState } from "react";
import { ProductGrid } from "@/components/products/product-grid";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TranslatedContent } from "@/components/ui/translated-content";

interface ProductsClientProps {
  initialProducts: any[];
  categories: any[];
  maxPrice: number;
  isAdmin: boolean;
  searchParams: {
    page?: string;
  };
  totalPages: number;
}

export function ProductsClient({ 
  initialProducts, 
  categories, 
  maxPrice, 
  isAdmin,
  searchParams,
  totalPages
}: ProductsClientProps) {
  const router = useRouter();
  const currentPage = Number(searchParams.page) || 1;
  
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Products Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            <TranslatedContent translationKey="products.allProducts" />
          </h1>
        </div>

        {initialProducts.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500">
              <TranslatedContent translationKey="products.noProductsFound" />
            </p>
          </div>
        ) : (
          <ProductGrid products={initialProducts} />
        )}

        {/* Pagination */}
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
      </div>
    </div>
  );
} 