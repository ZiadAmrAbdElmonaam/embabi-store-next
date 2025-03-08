import { prisma } from "@/lib/prisma";
import { ProductGrid } from "@/components/products/product-grid";
import { Percent, ArrowRight } from "lucide-react";

const ITEMS_PER_PAGE = 20;

export default async function DealsPage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const currentPage = Number(searchParams.page) || 1;
  const now = new Date();

  // Get total count for pagination
  const totalProducts = await prisma.product.count({
    where: {
      AND: [
        { sale: { not: null } },
        { salePrice: { not: null } },
        {
          OR: [
            { saleEndDate: null },
            { saleEndDate: { gt: now } },
          ]
        }
      ]
    },
  });

  // Fetch products with pagination
  const products = await prisma.product.findMany({
    where: {
      AND: [
        { sale: { not: null } },
        { salePrice: { not: null } },
        {
          OR: [
            { saleEndDate: null },
            { saleEndDate: { gt: now } },
          ]
        }
      ]
    },
    orderBy: {
      sale: 'desc'
    },
    skip: (currentPage - 1) * ITEMS_PER_PAGE,
    take: ITEMS_PER_PAGE,
    include: {
      category: {
        select: {
          name: true,
          slug: true,
        },
      },
      variants: true,
      reviews: {
        select: {
          rating: true,
        },
      },
    },
  });

  // Convert Decimal to number for prices
  const serializedProducts = products.map(product => ({
    ...product,
    price: Number(product.price),
    salePrice: product.salePrice ? Number(product.salePrice) : null,
    variants: product.variants || [],
    reviews: product.reviews || []
  }));

  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl p-8 mb-8 text-white">
          <div className="flex items-center gap-4 mb-4">
            <Percent className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Special Deals</h1>
          </div>
          <p className="text-white/90 max-w-2xl">
            Discover amazing discounts on our products. Don't miss out on these limited-time offers!
          </p>
          <div className="mt-4 flex items-center gap-2 text-white/80">
            <span className="font-semibold text-white">{totalProducts}</span>
            {totalProducts === 1 ? 'item' : 'items'} on sale
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
                    href={`/deals?page=${page}`}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      currentPage === page
                        ? 'bg-orange-600 text-white'
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
            <Percent className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Active Deals
            </h2>
            <p className="text-gray-500 mb-6">
              Check back later for new deals and discounts!
            </p>
            <a
              href="/products"
              className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium"
            >
              Browse All Products
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
} 