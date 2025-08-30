// This remains a server component (no 'use client')
import { prisma } from "@/lib/prisma";
import { CategoriesGrid } from "@/components/categories/categories-grid";
import { TranslatedContent } from "@/components/ui/translated-content";
import { SubcategoriesCarousel } from "@/components/categories/subcategories-carousel";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

// Add revalidation - cache for 10 minutes
export const revalidate = 600;

export default async function CategoriesPage() {
  // Fetch all parent categories with their children
  const parentCategories = await prisma.category.findMany({
    where: {
      parentId: null, // Only parent categories
    },
    select: {
      id: true,
      name: true,
      slug: true,
      image: true,
      children: {
        where: {
          products: { some: {} } // Only children with products
        },
        select: {
          id: true,
          name: true,
          slug: true,
          image: true,
          products: {
            select: {
              id: true,
              name: true,
              price: true,
              images: true,
              slug: true,
            },
            take: 4, // Only fetch 4 products per category for preview
          },
        },
        orderBy: { name: 'asc' }
      }
    },
    orderBy: { name: 'asc' }
  });

  // Format the data for the new grouped display
  const formattedData = parentCategories.map(parent => ({
    ...parent,
    children: parent.children.map(child => ({
      ...child,
      products: child.products.map(product => ({
        ...product,
        price: Number(product.price),
      })),
    }))
  }));

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 sm:mb-12 text-center">
          <TranslatedContent translationKey="categories.title" />
        </h1>
        
        {/* Grid Layout for Main Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
          {formattedData.map((parentCategory) => (
            <div key={parentCategory.id} className="bg-white rounded-3xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
              
              {/* Main Category Header */}
              <Link 
                href={`/categories/${parentCategory.slug}`}
                className="group block"
              >
                <div className="relative">
                  {/* Category Image Background */}
                  {parentCategory.image ? (
                    <div className="h-48 sm:h-56 bg-gradient-to-br from-orange-100 to-red-100 overflow-hidden">
                      <img 
                        src={parentCategory.image} 
                        alt={parentCategory.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div className="h-48 sm:h-56 bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                      <span className="text-6xl sm:text-7xl text-white/80">📦</span>
                    </div>
                  )}
                  
                  {/* Overlay with Category Name */}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300 flex items-end">
                    <div className="w-full p-6 sm:p-8">
                      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 group-hover:text-orange-200 transition-colors">
                        {parentCategory.name}
                      </h2>
                      <div className="flex items-center gap-2 text-white/90">
                        <span className="text-sm font-medium">
                          {parentCategory.children.length} subcategories
                        </span>
                        <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
              
              {/* Subcategories Section */}
              <div className="p-6 sm:p-8">
                {parentCategory.children.length > 0 ? (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Explore {parentCategory.name}
                    </h3>
                    
                    {/* Subcategories Grid (smaller) */}
                    <div className="grid grid-cols-2 gap-3">
                      {parentCategory.children.slice(0, 4).map((child) => (
                        <Link
                          key={child.id}
                          href={`/categories/${child.slug}`}
                          className="group"
                        >
                          <div className="bg-gray-50 rounded-xl p-3 hover:bg-orange-50 transition-colors duration-200">
                            {child.image && (
                              <div className="w-12 h-12 rounded-lg overflow-hidden mb-2 bg-gradient-to-br from-orange-100 to-red-100">
                                <img 
                                  src={child.image} 
                                  alt={child.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                            )}
                            <h4 className="font-medium text-gray-900 text-sm group-hover:text-orange-600 transition-colors truncate">
                              {child.name}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {child.products.length} products
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                    
                    {/* View All Link */}
                    {parentCategory.children.length > 4 && (
                      <Link
                        href={`/categories/${parentCategory.slug}`}
                        className="inline-flex items-center gap-2 mt-4 text-orange-600 hover:text-orange-700 font-medium text-sm transition-colors"
                      >
                        View all {parentCategory.children.length} subcategories
                        <ChevronRight size={14} />
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="text-3xl mb-3">🏗️</div>
                    <p className="text-gray-500 text-sm">
                      No subcategories yet
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      Coming soon!
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Empty State */}
        {formattedData.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-6">🏪</div>
            <h2 className="text-2xl font-bold text-gray-700 mb-3">
              No Categories Yet
            </h2>
            <p className="text-gray-500 max-w-md mx-auto">
              Categories will appear here once they are created in the admin panel.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 