import { prisma } from "@/lib/prisma";
import { ProductGrid } from "@/components/products/product-grid";
import { TrendingUp, ArrowRight } from "lucide-react";
import { TranslatedContent } from "@/components/ui/translated-content";
import { cookies } from "next/headers";
import { translations } from "@/lib/translations";

const ITEMS_PER_PAGE = 20;

export default async function MostSellingPage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const currentPage = Number(searchParams.page) || 1;
  
  // Get language from cookies for server component
  const cookieStore = cookies();
  const lang = (cookieStore.get('lang')?.value || 'en') as 'en' | 'ar';
  const t = (key: string) => {
    const keys = key.split('.');
    let result = translations[lang];
    for (const k of keys) {
      if (result[k] === undefined) return key;
      result = result[k];
    }
    return result;
  };

  // Get total count for pagination
  const totalProducts = await prisma.orderItem.groupBy({
    by: ['productId'],
    _count: true,
    having: {
      productId: {
        _count: {
          gt: 0
        }
      }
    }
  }).then(results => results.length);

  // Get most sold products with their total quantities
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
    skip: (currentPage - 1) * ITEMS_PER_PAGE,
    take: ITEMS_PER_PAGE,
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
      }
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
  const serializedProducts = products.map(product => ({
    ...product,
    price: Number(product.price),
    salePrice: product.salePrice ? Number(product.salePrice) : null,
    totalSold: quantityMap.get(product.id) || 0,
    variants: product.variants || []
  }));

  // Sort products by total sold quantity (maintaining the same order as mostSoldProducts)
  serializedProducts.sort((a, b) => (b.totalSold || 0) - (a.totalSold || 0));

  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);

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
            {t('mostSelling.description')}
          </p>
          <div className="mt-4 flex items-center gap-2 text-white/80">
            <span className="font-semibold text-white">{totalProducts}</span>
            {totalProducts === 1 ? t('mostSelling.productWithSales') : t('mostSelling.productsWithSales')}
          </div>
        </div>

        {/* Products Grid */}
        {serializedProducts.length > 0 ? (
          <>
            <ProductGrid products={serializedProducts} showDescription={true} />
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <a
                    key={page}
                    href={`/most-selling?page=${page}`}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </a>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {t('mostSelling.noSalesHistory')}
            </h2>
            <p className="text-gray-500 mb-6">
              {t('mostSelling.checkBackLater')}
            </p>
            <a
              href="/products"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              {t('mostSelling.browseAllProducts')}
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
} 