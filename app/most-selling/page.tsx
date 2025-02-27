import { prisma } from "@/lib/prisma";
import { ProductGrid } from "@/components/products/product-grid";
import { Crown } from "lucide-react";

export default async function MostSellingPage() {
  // Fetch products and count their occurrences in order items
  const productsWithSales = await prisma.product.findMany({
    include: {
      category: true,
      reviews: {
        select: {
          rating: true,
        },
      },
      orderItems: true,
    },
  });

  // Sort products by number of sales
  const sortedProducts = productsWithSales
    .map(product => ({
      ...product,
      totalSales: product.orderItems.length,
      price: Number(product.price),
      discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString()
    }))
    .sort((a, b) => b.totalSales - a.totalSales);

  // Get top 3 products for special display
  const topProducts = sortedProducts.slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Most Popular Products</h1>
          <p className="text-lg text-gray-600">
            Our best-selling products loved by customers
          </p>
        </div>

        {/* Top 3 Products Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {topProducts.map((product, index) => (
            <div 
              key={product.id}
              className="bg-white rounded-xl shadow-sm overflow-hidden transform hover:scale-105 transition-transform duration-300"
            >
              <div className="relative aspect-square">
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="object-cover w-full h-full"
                />
                <div className="absolute top-2 left-2 bg-orange-600 text-white px-3 py-1 rounded-full flex items-center gap-2">
                  <Crown className="h-4 w-4" />
                  <span>#{index + 1} Best Seller</span>
                </div>
                {product.discountPrice && (
                  <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded-md">
                    Sale
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {product.name}
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-600 font-bold">
                      ${product.discountPrice || product.price}
                    </p>
                    {product.discountPrice && (
                      <p className="text-sm text-gray-500 line-through">
                        ${product.price}
                      </p>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    {product.totalSales} sold
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* All Products Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            All Popular Products
          </h2>
          <ProductGrid products={sortedProducts} />
        </div>

        {sortedProducts.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-500">No products found</p>
          </div>
        )}
      </div>
    </div>
  );
} 