import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/ui/product-card";
import { TranslatedContent } from "@/components/ui/translated-content";
import { formatBrandName, getBrandIcon } from "@/lib/brand-utils";
import { getProductDisplayPrice } from "@/lib/utils";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { notFound } from "next/navigation";

// Add revalidation - cache for 5 minutes
export const revalidate = 300;

interface BrandPageProps {
  params: {
    brand: string;
  };
}

export default async function BrandPage({ params }: BrandPageProps) {
  const brandName = decodeURIComponent(params.brand);
  
  // Find all categories with this brand
  const brandCategories = await prisma.category.findMany({
    where: {
      brand: {
        equals: brandName,
        mode: 'insensitive'
      },
      parentId: { not: null }, // Only subcategories
    },
    include: {
      parent: {
        select: { name: true, slug: true }
      },
      products: {
        where: {
          OR: [
            { stock: { gt: 0 } },
            { storages: { some: { units: { some: { stock: { gt: 0 } } } } } }
          ]
        },
        include: {
          category: {
            select: { name: true, slug: true }
          },
          variants: true,
          storages: {
            include: {
              units: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (brandCategories.length === 0) {
    notFound();
  }

  // Flatten all products from all brand categories
  const allProducts = brandCategories.flatMap(category => 
    category.products.map(product => {
      // Get display pricing
      const displayPrice = getProductDisplayPrice({
        price: Number(product.price),
        salePrice: product.salePrice ? Number(product.salePrice) : null,
        sale: product.sale ?? null,
        saleEndDate: product.saleEndDate ? product.saleEndDate.toISOString() : null,
        storages: product.storages.map(storage => ({
          id: storage.id,
          size: storage.size,
          price: Number(storage.price),
          salePercentage: storage.salePercentage,
          saleEndDate: storage.saleEndDate?.toISOString() || null,
          units: (storage as { units?: Array<{ id: string; color: string; stock: number; taxStatus: string; taxType: string; taxAmount?: unknown; taxPercentage?: unknown }> }).units?.map(u => ({
            id: u.id,
            color: u.color,
            stock: u.stock,
            taxStatus: u.taxStatus,
            taxType: u.taxType,
            taxAmount: u.taxAmount != null ? Number(u.taxAmount) : null,
            taxPercentage: u.taxPercentage != null ? Number(u.taxPercentage) : null,
          })) ?? [],
        }))
      });

      return {
        ...product,
        price: displayPrice.price,
        salePrice: displayPrice.salePrice,
        taxStatus: displayPrice.taxStatus ?? null,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
        storages: product.storages.map(storage => {
          const s = storage as { units?: Array<{ id: string; color: string; stock: number; taxStatus: string; taxType: string; taxAmount?: unknown; taxPercentage?: unknown }> };
          return {
            id: storage.id,
            size: storage.size,
            price: Number(storage.price),
            salePercentage: storage.salePercentage,
            saleEndDate: storage.saleEndDate?.toISOString() || null,
            units: s.units?.map(u => ({
              id: u.id,
              color: u.color,
              stock: u.stock,
              taxStatus: u.taxStatus,
              taxType: u.taxType,
              taxAmount: u.taxAmount != null ? Number(u.taxAmount) : null,
              taxPercentage: u.taxPercentage != null ? Number(u.taxPercentage) : null,
            })) ?? [],
          };
        }),
        categoryName: category.name,
        parentCategoryName: category.parent?.name
      };
    })
  );

  // Group products by parent category for better organization
  const productsByParent = brandCategories.reduce((acc, category) => {
    const parentName = category.parent?.name || 'Other';
    if (!acc[parentName]) {
      acc[parentName] = {
        parentName,
        parentSlug: category.parent?.slug,
        categories: []
      };
    }
    
    if (category.products.length > 0) {
      acc[parentName].categories.push({
        name: category.name,
        slug: category.slug,
        productCount: category.products.length
      });
    }
    
    return acc;
  }, {} as Record<string, any>);

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumbs */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li><Link href="/" className="hover:text-gray-700">Home</Link></li>
            <li className="flex items-center"><ChevronRight size={16} className="mx-2" /><span className="text-gray-900 font-medium">{formatBrandName(brandName)}</span></li>
          </ol>
        </nav>

        {/* Brand Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className="text-4xl sm:text-5xl">{getBrandIcon(brandName)}</span>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
              {formatBrandName(brandName)}
            </h1>
          </div>
          <p className="text-lg text-gray-600 mb-6">
            {allProducts.length} products across {Object.keys(productsByParent).length} categories
          </p>

          {/* Category Overview */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {Object.values(productsByParent).map((parentGroup: any) => (
              <div key={parentGroup.parentName} className="bg-white rounded-lg px-3 py-2 shadow-sm border">
                <span className="text-sm font-medium text-gray-700">
                  {parentGroup.parentName}: {parentGroup.categories.length} categories
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {allProducts.length > 0 ? (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">All Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {allProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 sm:py-16 bg-white rounded-2xl shadow-sm">
            <div className="text-5xl sm:text-6xl mb-4">{getBrandIcon(brandName)}</div>
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-2">
              No Products Available
            </h3>
            <p className="text-gray-500 text-base sm:text-lg max-w-md mx-auto px-4">
              There are no products available for {formatBrandName(brandName)} right now.
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Check back later or browse other brands.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Generate metadata
export async function generateMetadata({ params }: BrandPageProps) {
  const brandName = decodeURIComponent(params.brand);
  
  return {
    title: `${formatBrandName(brandName)} Products - Embabi Store`,
    description: `Shop all ${formatBrandName(brandName)} products at Embabi Store. Find the best deals on ${formatBrandName(brandName)} devices and accessories.`,
  };
}
