import { prisma } from "@/lib/prisma";
import { ProductGrid } from "@/components/products/product-grid";
import { TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cookies } from "next/headers";
import { translations } from "@/lib/translations";
import type { Language } from "@/lib/translations";
import { getProductDisplayPrice } from "@/lib/utils";

// Changed to fixed 5 products instead of paginated results
const TOP_PRODUCTS_COUNT = 5;

export default async function MostSellingPage() {
  // Get language from cookies for server component
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'en') as Language;
  
  // Type-safe translation function
  const t = (key: string): string => {
    const keys = key.split('.');
    let result = translations[lang];
    for (const k of keys) {
      if (result && result[k] !== undefined) {
        result = result[k];
      } else {
        return key;
      }
    }
    return String(result);
  };

  // Get most sold products with their total quantities - limited to top 5
  const mostSoldProducts = await prisma.orderItem.groupBy({
    by: ['productId'],
    _sum: {
      quantity: true
    },
    orderBy: {
      _sum: {
        quantity: 'desc'
      }
    },
    take: TOP_PRODUCTS_COUNT, // Only take the top 5 products
  });

  // Get the product details for the most sold products
  const productIds = mostSoldProducts.map(item => item.productId);
  const products = await prisma.product.findMany({
    where: {
      id: {
        in: productIds
      }
    },
    include: {
      category: {
        select: {
          name: true,
          slug: true,
        }
      },
      variants: true,
      reviews: {
        select: {
          rating: true
        }
      },
      storages: {
        include: {
          variants: true,
        },
      },
    }
  });

  // Create a map of total quantities
  const quantityMap = new Map(
    mostSoldProducts.map(item => [
      item.productId,
      item._sum.quantity || 0
    ])
  );

  // Serialize the products and add the total sold quantity
  const serializedProducts = products.map(product => {
    // Get display pricing (prioritizes storage with stock)
    const displayPrice = getProductDisplayPrice({
      price: Number(product.price),
      salePrice: product.salePrice ? Number(product.salePrice) : null,
      saleEndDate: product.saleEndDate?.toISOString() || null,
      storages: product.storages?.map(storage => ({
        id: storage.id,
        size: storage.size,
        price: Number(storage.price),
        stock: storage.stock,
        salePercentage: storage.salePercentage,
        saleEndDate: storage.saleEndDate?.toISOString() || null,
      })) || []
    });

    return {
      ...product,
      price: displayPrice.price,
      salePrice: displayPrice.salePrice,
      totalSold: quantityMap.get(product.id) || 0,
      variants: product.variants || [],
      storages: product.storages?.map(storage => ({
        ...storage,
        price: Number(storage.price),
        createdAt: storage.createdAt.toISOString(),
        updatedAt: storage.updatedAt.toISOString(),
        saleEndDate: storage.saleEndDate?.toISOString() || null,
      })) || [],
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      saleEndDate: product.saleEndDate?.toISOString() || null,
    };
  });

  // Sort products by total sold quantity (maintaining the same order as mostSoldProducts)
  serializedProducts.sort((a, b) => (b.totalSold || 0) - (a.totalSold || 0));

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 mb-8 text-white">
          <div className="flex items-center gap-4 mb-4">
            <TrendingUp className="w-8 h-8" />
            <h1 className="text-3xl font-bold">{t('mostSelling.title')}</h1>
          </div>
          <p className="text-white/90 max-w-2xl">
            {t('mostSelling.topProductsDescription')}
          </p>
          <div className="mt-4 flex items-center gap-2 text-white/80">
            <span className="font-semibold text-white">{serializedProducts.length}</span>
            {serializedProducts.length === 1 ? t('mostSelling.productWithTopSales') : t('mostSelling.productsWithTopSales')}
          </div>
        </div>

        {/* Products Grid */}
        {serializedProducts.length > 0 ? (
          <ProductGrid products={serializedProducts} showDescription={true} />
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {t('mostSelling.noSalesHistory')}
            </h2>
            <p className="text-gray-500 mb-6">
              {t('mostSelling.checkBackLater')}
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              {t('mostSelling.browseAllProducts')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 